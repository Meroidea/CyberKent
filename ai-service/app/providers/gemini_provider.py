"""
Google Gemini implementation of the provider contract.

Uses the `google-genai` SDK against the Gemini Developer API, with
`response_schema` set to the same Pydantic models the OpenAI provider
constrains its output to (`app/schemas.py`), so both providers return results
already validated against one shape and the gateway cannot tell them apart.

Four decisions are deliberate and apply to every call:

- **Thinking is held to `minimal` by default.** On Gemini, `max_output_tokens`
  bounds the model's silent reasoning *and* its answer together. A
  thinking-by-default model given OpenAI's tighter ceiling can spend the whole
  budget reasoning and return nothing, which arrives as an empty response and
  is indistinguishable from a refusal. See `GEMINI_THINKING_LEVEL`.
- **Safety filters are relaxed on the analysis paths only.** This service is
  asked to read attacker-authored content on a victim's behalf — sextortion,
  threats, blackmail are exactly what residents most need assessed. Under
  Gemini's default thresholds the model refuses some of them, which would mean
  the resident who most needs an answer is the one who cannot get one. The
  assistant path, which is a conversation rather than evidence, keeps Gemini's
  defaults.
- **Retries and the breaker are ours, not the SDK's** (`app/providers/policy`),
  so a refusal no retry can fix fails in one round trip instead of five.
- **Errors are reported by status, never by body.** `str()` of a Gemini
  `APIError` embeds the whole response payload, which can echo a resident's
  message back; nothing here interpolates an exception into a message or a log
  (Rule 6.7).

Two differences from the OpenAI provider are real, and are not papered over:

- **No per-request retention flag.** OpenAI is sent `store=False`. The Gemini
  Developer API has no equivalent, and its retention depends on the billing
  tier: prompts sent on a **free** API key may be used by Google to improve
  their products, and on a paid key they are not. A Council deployment
  handling residents' messages must use a paid key. `ai-service/README.md`
  says so where someone configuring it will read it.
- **No per-request safety identifier.** OpenAI is sent an opaque per-request
  hash so abuse can be traced without Council naming anyone. Gemini has no
  such field, so nothing is sent in its place — an absent field is better than
  an identifier invented to fill it.
"""

import base64
import binascii
import re
import time
from typing import TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app import prompts
from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
from app.providers.policy import Action, Breaker, Verdict
from app.providers.safety import CRISIS_REPLY, REFUSAL_REPLY, looks_like_crisis
from app.schemas import (
    AssistantReply,
    ChatTurn,
    ImageAnalysis,
    ImageAnalysisResponse,
    RuleSummary,
    TextAnalysis,
    TextAnalysisResponse,
    Usage,
)

Parsed = TypeVar("Parsed", bound=BaseModel)

DATA_URL = re.compile(r"^data:(image/(?:png|jpeg));base64,(.+)$", re.DOTALL)

# Generous, because the ceiling covers thinking as well as the answer. A
# structured analysis is ~700 tokens of JSON; the rest is headroom so that
# raising GEMINI_THINKING_LEVEL does not silently start truncating results.
ANALYSIS_OUTPUT_TOKENS = 4_096
CHAT_OUTPUT_TOKENS = 1_500

# Gemini answers 429 RESOURCE_EXHAUSTED for a burst limit that clears in a
# second and for a quota that will not clear today. The quota identifier tells
# them apart: per-minute limits are worth one retry, daily and free-tier caps
# are the case the breaker exists for.
_STANDING_QUOTA = re.compile(r"per\s*day|daily|free[_\s-]?tier|lifetime", re.IGNORECASE)

# A credential that will never work. Google reports this as HTTP 400
# INVALID_ARGUMENT — the same status as a merely malformed request — so the
# machine-readable `reason` is what tells them apart. Checked by reason rather
# than by status or message text, because those two are not stable and this is.
_DEAD_CREDENTIAL = {"API_KEY_INVALID", "API_KEY_SERVICE_BLOCKED", "ACCESS_TOKEN_EXPIRED"}

# Why a candidate stopped, when it stopped because of the content rather than
# because it had finished.
_BLOCKED_FINISHES = {
    types.FinishReason.SAFETY,
    types.FinishReason.PROHIBITED_CONTENT,
    types.FinishReason.BLOCKLIST,
    types.FinishReason.SPII,
    types.FinishReason.IMAGE_SAFETY,
}

# Applied to the analysis paths only — see the module docstring.
_ANALYSIS_SAFETY = [
    types.SafetySetting(category=category, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH)
    for category in (
        types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    )
]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _detail_text(error: errors.APIError) -> str:
    """
    The error's own details, for deciding what to do about it.

    Read to decide only. Never logged and never returned: the body can carry
    the request that caused it, which is a resident's message (Rule 6.7).
    """
    try:
        return repr(error.details)
    except Exception:  # noqa: BLE001 — a malformed error body must not mask the error
        return ""


def _quota_is_standing(error: errors.APIError) -> bool:
    """Whether a 429 names a quota that will not clear on its own shortly."""
    return bool(_STANDING_QUOTA.search(_detail_text(error)))


def _credential_is_dead(error: errors.APIError) -> bool:
    """Whether the key itself is the problem, rather than this one request."""
    details = _detail_text(error)
    return any(reason in details for reason in _DEAD_CREDENTIAL)


def _classify(error: Exception) -> Verdict | None:
    """Maps a Gemini SDK exception onto the shared retry and breaker policy."""
    if isinstance(error, errors.ServerError):
        return Verdict(Action.RETRY, "The AI provider is unavailable.")

    if isinstance(error, errors.ClientError):
        status = error.code

        if status == 429:
            if _quota_is_standing(error):
                return Verdict(Action.TRIP, "The AI provider refused: its quota is exhausted")
            return Verdict(Action.RETRY, "The AI provider is rate limiting requests.")

        # A key that is wrong, revoked or not entitled to the model. No retry
        # can fix it and every request will meet it, so AI is stood down rather
        # than failing one resident at a time.
        if status in (401, 403) or _credential_is_dead(error):
            return Verdict(Action.TRIP, "The AI provider refused the credential")

        # Every other 4xx is about this one request — an image it would not
        # take, a schema it would not fill. Reported, but AI stays up: one odd
        # request must not switch the service off for everybody else.
        return Verdict(Action.FAIL, f"The AI provider returned HTTP {status}.")

    if isinstance(error, errors.APIError):
        return Verdict(Action.FAIL, f"The AI provider returned HTTP {error.code}.")

    # Connection and timeout failures surface as httpx errors through the SDK.
    name = type(error).__name__

    if "Timeout" in name:
        # Already spent the whole budget the caller allowed.
        return Verdict(Action.FAIL, "The AI provider did not respond in time.")

    if "Connect" in name or "Network" in name or "Protocol" in name:
        return Verdict(Action.RETRY, "The AI provider could not be reached.")

    # Not ours to explain — a bug here, not an outage there. Let it propagate.
    return None


class GeminiProvider:
    name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._breaker = Breaker()
        key = settings.gemini_key
        self._client = (
            genai.Client(
                api_key=key,
                http_options=types.HttpOptions(
                    # Milliseconds, unlike every other timeout in this codebase.
                    timeout=int(settings.gemini_timeout_seconds * 1000),
                    # The SDK retries five times by default, which is the
                    # behaviour `policy` exists to replace.
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            )
            if key
            else None
        )

    @property
    def model(self) -> str:
        return self._settings.gemini_model

    @property
    def configured(self) -> bool:
        return self._client is not None and self._breaker.closed

    def _require(self) -> genai.Client:
        if self._client is None:
            raise ProviderUnavailable("GEMINI_API_KEY is not set.")
        self._breaker.check()
        return self._client

    def _thinking(self) -> types.ThinkingConfig | None:
        level = self._settings.gemini_thinking_level
        return types.ThinkingConfig(thinking_level=level.upper()) if level else None

    def _generate(self, *, model: str, contents: list[types.Content], config: types.GenerateContentConfig):
        client = self._require()
        return self._breaker.run(
            lambda: client.models.generate_content(model=model, contents=contents, config=config),
            _classify,
        )

    @staticmethod
    def _refusal_reason(response) -> str | None:
        """Why the provider declined to answer, or None if it did answer."""
        feedback = getattr(response, "prompt_feedback", None)
        block = getattr(feedback, "block_reason", None)

        if block:
            return f"the prompt was blocked ({getattr(block, 'name', block)})"

        candidates = getattr(response, "candidates", None) or []

        if not candidates:
            return "the provider returned no candidate"

        finish = getattr(candidates[0], "finish_reason", None)

        if finish in _BLOCKED_FINISHES:
            return f"the answer was blocked ({getattr(finish, 'name', finish)})"

        if finish == types.FinishReason.MAX_TOKENS:
            # Nearly always thinking having eaten the budget. Named precisely,
            # because the fix is a setting rather than a retry.
            return "the answer was cut off by the output limit (lower GEMINI_THINKING_LEVEL or raise the limit)"

        return None

    def _usage(self, response, model: str, started: float) -> Usage:
        meta = getattr(response, "usage_metadata", None)
        return Usage(
            provider=self.name,
            model=getattr(response, "model_version", None) or model,
            prompt_version=prompts.PROMPT_VERSION,
            latency_ms=round((time.perf_counter() - started) * 1000),
            input_tokens=getattr(meta, "prompt_token_count", None),
            output_tokens=getattr(meta, "candidates_token_count", None),
        )

    def _parse(self, *, instructions: str, parts: list[types.Part], schema: type[Parsed], model: str) -> tuple[Parsed, Usage]:
        started = time.perf_counter()

        response = self._generate(
            model=model,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                system_instruction=instructions,
                response_mime_type="application/json",
                response_schema=schema,
                max_output_tokens=ANALYSIS_OUTPUT_TOKENS,
                # Never used, and left on the SDK warns about it on every call.
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                safety_settings=_ANALYSIS_SAFETY,
                thinking_config=self._thinking(),
            ),
        )

        reason = self._refusal_reason(response)

        if reason:
            raise ProviderRefused(f"The model declined to produce an assessment: {reason}.")

        parsed = getattr(response, "parsed", None)

        # The SDK parses `response.parsed` for us, but returns None when the
        # model produced JSON that does not fit the schema. Parsing the raw
        # text ourselves turns that into the same validated object rather than
        # a blank refusal — and when it genuinely will not fit, the error says
        # so instead of saying nothing.
        if parsed is None:
            text = (getattr(response, "text", None) or "").strip()

            if not text:
                raise ProviderRefused("The model returned no assessment.")

            try:
                parsed = schema.model_validate_json(text)
            except ValidationError as error:
                raise ProviderRefused("The model's assessment did not match the required shape.") from error

        if not isinstance(parsed, schema):
            parsed = schema.model_validate(parsed)

        return parsed, self._usage(response, model, started)

    def analyse_text(self, text: str, channel: str, rules: RuleSummary | None) -> TextAnalysisResponse:
        result, usage = self._parse(
            instructions=prompts.TEXT_ANALYSIS,
            parts=[
                types.Part.from_text(
                    text=prompts.text_analysis_input(text, channel, rules.model_dump() if rules else None)
                )
            ],
            schema=TextAnalysis,
            model=self.model,
        )

        # The schema guarantees the shape, not the range.
        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)

        for emotion in result.sentiment.emotions:
            emotion.intensity = round(_clamp(emotion.intensity, 0.0, 1.0), 2)

        return TextAnalysisResponse(result=result, usage=usage)

    def analyse_image(self, image_data_url: str, context: str | None) -> ImageAnalysisResponse:
        match = DATA_URL.match(image_data_url)

        if not match:
            raise ProviderRefused("The image must be a PNG or JPEG data URL.")

        try:
            payload = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError) as error:
            raise ProviderRefused("The image data is not valid.") from error

        result, usage = self._parse(
            instructions=prompts.IMAGE_ANALYSIS,
            parts=[
                types.Part.from_text(text=prompts.image_analysis_input(context)),
                types.Part.from_bytes(data=payload, mime_type=match.group(1)),
            ],
            schema=ImageAnalysis,
            model=self.model,
        )

        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)

        return ImageAnalysisResponse(result=result, usage=usage)

    def chat(self, messages: list[ChatTurn]) -> AssistantReply:
        self._require()
        started = time.perf_counter()
        latest = messages[-1].content
        model = self._settings.gemini_chat_model

        # Before the network, so the Lifeline number reaches someone even if
        # the provider is slow, refusing or switched off.
        if looks_like_crisis(latest):
            return AssistantReply(
                reply=CRISIS_REPLY,
                blocked=True,
                usage=Usage(
                    provider=self.name,
                    model=model,
                    prompt_version=prompts.PROMPT_VERSION,
                    latency_ms=round((time.perf_counter() - started) * 1000),
                ),
            )

        response = self._generate(
            model=model,
            contents=[
                # Gemini names the other side of the conversation "model";
                # the rest of this codebase, and the OpenAI API, call it
                # "assistant". Translated here and nowhere else.
                types.Content(
                    role="model" if turn.role == "assistant" else "user",
                    parts=[types.Part.from_text(text=turn.content)],
                )
                for turn in messages
            ],
            config=types.GenerateContentConfig(
                system_instruction=prompts.ASSISTANT,
                max_output_tokens=CHAT_OUTPUT_TOKENS,
                # Never used, and left on the SDK warns about it on every call.
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                thinking_config=self._thinking(),
            ),
        )

        # On this path a block is an answer, not an error: the assistant says
        # what it can help with instead of the gateway reporting an outage.
        if self._refusal_reason(response):
            return AssistantReply(
                reply=REFUSAL_REPLY,
                blocked=True,
                usage=self._usage(response, model, started),
            )

        reply = (getattr(response, "text", None) or "").strip()

        if not reply:
            raise ProviderRefused("The model returned no reply.")

        return AssistantReply(reply=reply, usage=self._usage(response, model, started))
