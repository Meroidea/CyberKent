"""
Google Gemini implementation of the provider contract.

Called through Google's `google-genai` SDK (`genai.Client` and
`client.models.generate_content`). The legacy `google-generativeai` package is
retired and must not be reintroduced. The SDK's own retries are left off, so
the retry and breaker policy below stays the only one.

Structured output is the same guarantee the OpenAI provider relies on. The
output models in `app/schemas.py` are sent as the response JSON Schema, and the
reply is validated against the same Pydantic class before it leaves this
module, so a malformed answer is a refusal here and never a broken screen.

Failure policy matches the OpenAI provider: one retry for a busy moment, none
for a timeout, and a short circuit breaker when the free tier's quota is spent,
so the interface stops offering AI instead of making residents wait on it.

Moderation: Gemini has no separate moderation endpoint. A request the model's
safety filters block is answered with the refusal reply, and messages that
signal a risk to someone's life get the crisis reply before any model is
called — a fixed, human-written answer is the right response there, not a
generated one.
"""

import base64
import copy
import re
import time
from typing import Any, TypeVar

import httpx
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app import prompts
from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
from app.providers.replies import CRISIS_REPLY, REFUSAL_REPLY
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

# How long AI stays switched off after the free tier's quota is exhausted.
COOLDOWN_SECONDS = 120

# Generous because the Flash models may think before answering, and thinking
# is counted against the same budget; the schema keeps the answer itself short.
ANALYSIS_MAX_TOKENS = 8_192
CHAT_MAX_TOKENS = 2_048

# Block clearly harmful requests; leave room for what residents paste, which is
# by nature manipulative, threatening or explicit — that is what scams are.
SAFETY_SETTINGS = [
    types.SafetySetting(category=category, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH)
    for category in (
        types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    )
]

# Words that signal a risk to the person's own life. Deliberately broad: a
# false positive shows Lifeline's number to someone who did not need it, which
# costs nothing; a miss could cost a great deal.
CRISIS_PATTERN = re.compile(
    r"\b(kill(ing)? my ?self|suicid\w*|end (it all|my life)|want to die|don'?t want to (live|be alive)"
    r"|self[- ]?harm\w*|hurt(ing)? my ?self|no reason to live|better off dead|take my (own )?life)\b",
    re.IGNORECASE,
)

# JSON Schema keywords Gemini's structured output does not use. Removed rather
# than sent, so a schema change in `app/schemas.py` cannot be rejected for a
# decorative keyword.
DROPPED_KEYWORDS = {"title", "default", "examples", "$schema", "additionalProperties"}

DATA_URL = re.compile(r"^data:(image/(?:png|jpeg));base64,(.+)$", re.DOTALL)


def _response_schema(model: type[BaseModel]) -> dict[str, Any]:
    """The Pydantic model as a self-contained JSON Schema: references inlined, extras dropped."""
    schema = model.model_json_schema()
    definitions = schema.pop("$defs", {})

    def resolve(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                target = node["$ref"].rsplit("/", 1)[-1]
                return resolve(copy.deepcopy(definitions[target]))
            return {key: resolve(value) for key, value in node.items() if key not in DROPPED_KEYWORDS}
        if isinstance(node, list):
            return [resolve(item) for item in node]
        return node

    return resolve(schema)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _is_transient_rate_limit(body: dict[str, Any]) -> bool:
    """True only when every quota violation Google reports is a per-minute
    rate limit, not a real quota/billing exhaustion. A burst of ordinary
    traffic should fail just that request, not open the breaker for
    everyone; an unrecognised or absent reason still opens it, as before."""
    violations = [
        violation
        for detail in body.get("error", {}).get("details", [])
        for violation in detail.get("violations", [])
    ]
    if not violations:
        return False
    return all("PerMinute" in (violation.get("quotaId") or "") for violation in violations)


class GeminiProvider:
    name = "gemini"

    def __init__(self, settings: Settings, http_client: httpx.Client | None = None) -> None:
        self._settings = settings
        # The key is passed explicitly rather than left to the SDK's own
        # GEMINI_API_KEY lookup, because Settings also reads it from .env files
        # that never reach os.environ. `http_client` is for tests only.
        self._client = (
            genai.Client(
                api_key=settings.gemini_api_key,
                http_options=types.HttpOptions(
                    timeout=round(settings.gemini_timeout_seconds * 1000),
                    httpx_client=http_client,
                ),
            )
            if settings.gemini_api_key
            else None
        )
        self._open_until = 0.0
        self._schemas = {model: _response_schema(model) for model in (TextAnalysis, ImageAnalysis)}

    @property
    def model(self) -> str:
        return self._settings.gemini_model

    @property
    def configured(self) -> bool:
        return self._client is not None and time.monotonic() >= self._open_until

    def _require(self) -> genai.Client:
        if self._client is None:
            raise ProviderUnavailable("GEMINI_API_KEY is not set.")
        if time.monotonic() < self._open_until:
            raise ProviderUnavailable("AI is paused after the provider's quota was exhausted.")
        return self._client

    def _generate(self, model: str, contents: types.ContentListUnion, config: types.GenerateContentConfig) -> types.GenerateContentResponse:
        """One generate_content call with the service's retry and breaker policy."""
        client = self._require()
        config = config.model_copy(
            update={
                "safety_settings": SAFETY_SETTINGS,
                "automatic_function_calling": types.AutomaticFunctionCallingConfig(disable=True),
            }
        )

        for attempt in (1, 2):
            try:
                return client.models.generate_content(model=model, contents=contents, config=config)
            except httpx.TimeoutException as error:
                raise ProviderUnavailable("The AI provider did not respond in time.") from error
            except httpx.TransportError as error:
                if attempt == 2:
                    raise ProviderUnavailable("The AI provider could not be reached.") from error
                continue
            except errors.UnknownApiResponseError as error:
                raise ProviderUnavailable("The AI provider returned a malformed response.") from error
            except errors.APIError as error:
                # Status and Google's error status only: the message can echo the request.
                body = error.details if isinstance(error.details, dict) else {}
                reason = error.status or ""

                if error.code == 429:
                    if attempt == 1:
                        time.sleep(1.5)
                        continue
                    if _is_transient_rate_limit(body):
                        raise ProviderUnavailable(f"The AI provider is rate-limited ({reason or 'HTTP 429'}); try again shortly.") from error
                    self._open_until = time.monotonic() + COOLDOWN_SECONDS
                    raise ProviderUnavailable(f"The AI provider's quota is exhausted ({reason or 'HTTP 429'}); AI paused for {COOLDOWN_SECONDS} seconds.") from error

                if error.code in (500, 502, 503, 504) and attempt == 1:
                    time.sleep(1.0)
                    continue

                raise ProviderUnavailable(f"The AI provider returned HTTP {error.code} {reason}".strip() + ".") from error

        raise ProviderUnavailable("The AI provider did not answer.")

    @staticmethod
    def _text(response: types.GenerateContentResponse) -> str:
        if response.prompt_feedback and response.prompt_feedback.block_reason:
            raise ProviderRefused("The model's safety filters blocked the request.")

        if not response.candidates:
            raise ProviderRefused("The model returned no answer.")

        candidate = response.candidates[0]
        finish = candidate.finish_reason.value if candidate.finish_reason else "STOP"
        parts = (candidate.content.parts if candidate.content else None) or []
        # Thought summaries, when a model returns them, are marked and never shown.
        text = "".join(part.text or "" for part in parts if not part.thought)

        if finish not in ("STOP", "MAX_TOKENS") or not text.strip():
            raise ProviderRefused(f"The model stopped without an answer ({finish}).")
        if finish == "MAX_TOKENS":
            raise ProviderRefused("The model's answer was cut off.")

        return text

    def _usage(self, response: types.GenerateContentResponse, model: str, started: float) -> Usage:
        metadata = response.usage_metadata or types.GenerateContentResponseUsageMetadata()
        output = (metadata.candidates_token_count or 0) + (metadata.thoughts_token_count or 0)
        return Usage(
            model=response.model_version or model,
            prompt_version=prompts.PROMPT_VERSION,
            latency_ms=round((time.perf_counter() - started) * 1000),
            input_tokens=metadata.prompt_token_count,
            output_tokens=output or None,
        )

    def _parse(self, *, instructions: str, parts: list[types.Part], schema: type[Parsed]) -> tuple[Parsed, Usage]:
        started = time.perf_counter()
        model = self.model
        response = self._generate(
            model,
            [types.Content(role="user", parts=parts)],
            types.GenerateContentConfig(
                system_instruction=instructions,
                response_mime_type="application/json",
                response_json_schema=self._schemas[schema],
                max_output_tokens=ANALYSIS_MAX_TOKENS,
                temperature=0.2,
            ),
        )

        try:
            parsed = schema.model_validate_json(self._text(response))
        except ValidationError as error:
            raise ProviderRefused("The model's answer did not match the expected shape.") from error

        return parsed, self._usage(response, model, started)

    def analyse_text(self, text: str, channel: str, rules: RuleSummary | None) -> TextAnalysisResponse:
        result, usage = self._parse(
            instructions=prompts.TEXT_ANALYSIS,
            parts=[types.Part.from_text(text=prompts.text_analysis_input(text, channel, rules.model_dump() if rules else None))],
            schema=TextAnalysis,
        )

        # The schema fixes the shape, not the range.
        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)
        for emotion in result.sentiment.emotions:
            emotion.intensity = round(_clamp(emotion.intensity, 0.0, 1.0), 2)

        return TextAnalysisResponse(result=result, usage=usage)

    def analyse_image(self, image_data_url: str, context: str | None) -> ImageAnalysisResponse:
        match = DATA_URL.match(image_data_url)
        if not match:
            raise ProviderRefused("The image must be a PNG or JPEG data URL.")
        mime, data = match.groups()
        # Decoded here so a corrupt upload is a clear refusal, not a provider 400.
        try:
            image = base64.b64decode(data, validate=True)
        except ValueError as error:
            raise ProviderRefused("The image data is not valid.") from error

        result, usage = self._parse(
            instructions=prompts.IMAGE_ANALYSIS,
            parts=[
                types.Part.from_text(text=prompts.image_analysis_input(context)),
                types.Part.from_bytes(data=image, mime_type=mime),
            ],
            schema=ImageAnalysis,
        )

        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)

        return ImageAnalysisResponse(result=result, usage=usage)

    def chat(self, messages: list[ChatTurn]) -> AssistantReply:
        self._require()
        started = time.perf_counter()
        latest = messages[-1].content
        model = self._settings.gemini_assistant_model or self.model

        def fixed(reply: str) -> AssistantReply:
            return AssistantReply(
                reply=reply,
                blocked=True,
                usage=Usage(model="none", prompt_version=prompts.PROMPT_VERSION, latency_ms=round((time.perf_counter() - started) * 1000)),
            )

        if CRISIS_PATTERN.search(latest):
            return fixed(CRISIS_REPLY)

        try:
            response = self._generate(
                model,
                [
                    types.Content(role="model" if turn.role == "assistant" else "user", parts=[types.Part.from_text(text=turn.content)])
                    for turn in messages
                ],
                types.GenerateContentConfig(
                    system_instruction=prompts.ASSISTANT,
                    max_output_tokens=CHAT_MAX_TOKENS,
                    temperature=0.4,
                ),
            )
            reply = self._text(response).strip()
        except ProviderRefused:
            return fixed(REFUSAL_REPLY)

        return AssistantReply(reply=reply, usage=self._usage(response, model, started))

