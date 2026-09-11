"""
OpenAI implementation of the provider contract.

Uses the Responses API with Structured Outputs (`responses.parse` with a
Pydantic `text_format`), so every analysis comes back already validated against
`app/schemas.py`. Three settings are deliberate and apply to every call:

- `store=False` — the request is not retained by OpenAI for later retrieval.
  Council has no reason to leave residents' messages on a third party's servers.
- `safety_identifier` — a per-request hash, never a user id, so abuse can be
  traced by OpenAI without Council disclosing who anyone is.
- bounded `max_output_tokens` and a client timeout with limited retries, so one
  slow request cannot hold a gateway worker indefinitely (Avoid.md §10).
"""

import hashlib
import time
from typing import Callable, TypeVar

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI
from pydantic import BaseModel

from app import prompts
from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
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
Result = TypeVar("Result")

# Refusals that no retry can fix: the account has no credit or has hit its cap.
BILLING_CODES = {"insufficient_quota", "credit_balance_exhausted", "billing_hard_limit_reached"}

# How long AI stays switched off after a billing refusal before it is tried again.
COOLDOWN_SECONDS = 600

CRISIS_REPLY = (
    "I'm sorry you're going through this. If you are in danger, call 000 now. "
    "If you are feeling overwhelmed or thinking about harming yourself, please call "
    "Lifeline on 13 11 14 (24 hours) or text 0477 13 11 14.\n\n"
    "Being scammed is a crime committed against you — it is not your fault. When you are "
    "ready, contact your bank first, then IDCARE on 1800 595 160 for free, confidential support."
)

REFUSAL_REPLY = (
    "I can't help with that message. I can help with recognising scams, what to do after "
    "being targeted, reporting a scam, and keeping your accounts safe."
)


def _safety_id(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _error_code(error: APIStatusError) -> str | None:
    body = error.body if isinstance(error.body, dict) else {}
    detail = body.get("error", body) if isinstance(body, dict) else {}
    return detail.get("code") if isinstance(detail, dict) else None


class OpenAIProvider:
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        # Retries are handled in `_call`, where a refusal that cannot succeed
        # (no credit) can be told apart from one that might (a busy moment).
        # The SDK's own retries treat both alike, which cost ~22 seconds per
        # request against an exhausted account before failing anyway.
        self._client = (
            OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds, max_retries=0)
            if settings.configured
            else None
        )
        # Circuit breaker: after a billing refusal, AI reports itself unavailable
        # until this monotonic time, so the interface stops offering it and no
        # resident waits on a request that is certain to fail.
        self._open_until = 0.0

    @property
    def model(self) -> str:
        return self._settings.openai_model

    @property
    def configured(self) -> bool:
        return self._client is not None and time.monotonic() >= self._open_until

    def _require(self) -> OpenAI:
        if self._client is None:
            raise ProviderUnavailable("OPENAI_API_KEY is not set.")
        if time.monotonic() < self._open_until:
            raise ProviderUnavailable("AI is paused after a billing refusal from the provider.")
        return self._client

    def _call(self, operation: Callable[[OpenAI], Result]) -> Result:
        """Runs one provider call with the service's own retry and breaker policy."""
        client = self._require()

        for attempt in (1, 2):
            try:
                return operation(client)
            except APITimeoutError as error:
                # Not retried: a timeout has already spent the whole budget.
                raise ProviderUnavailable("The AI provider did not respond in time.") from error
            except APIConnectionError as error:
                if attempt == 2:
                    raise ProviderUnavailable("The AI provider could not be reached.") from error
            except APIStatusError as error:
                code = _error_code(error)

                if error.status_code == 429 and code in BILLING_CODES:
                    self._open_until = time.monotonic() + COOLDOWN_SECONDS
                    raise ProviderUnavailable(f"The AI provider refused on billing grounds ({code}); AI paused for {COOLDOWN_SECONDS // 60} minutes.") from error

                if error.status_code in (429, 500, 502, 503) and attempt == 1:
                    time.sleep(1.0)
                    continue

                # Status and code only: the body can echo the request, which is user content.
                raise ProviderUnavailable(f"The AI provider returned HTTP {error.status_code}.") from error

        raise ProviderUnavailable("The AI provider did not answer.")

    def _parse(self, *, instructions: str, content: list[dict], schema: type[Parsed], model: str) -> tuple[Parsed, Usage]:
        started = time.perf_counter()

        response = self._call(
            lambda client: client.responses.parse(
                model=model,
                instructions=instructions,
                input=[{"role": "user", "content": content}],
                text_format=schema,
                max_output_tokens=1_600,
                store=False,
                safety_identifier=_safety_id(repr(content)[:4_000]),
            )
        )

        parsed = response.output_parsed

        if parsed is None:
            raise ProviderRefused("The model declined to produce an assessment.")

        usage = Usage(
            model=response.model or model,
            prompt_version=prompts.PROMPT_VERSION,
            latency_ms=round((time.perf_counter() - started) * 1000),
            input_tokens=getattr(response.usage, "input_tokens", None),
            output_tokens=getattr(response.usage, "output_tokens", None),
        )

        return parsed, usage

    def analyse_text(self, text: str, channel: str, rules: RuleSummary | None) -> TextAnalysisResponse:
        result, usage = self._parse(
            instructions=prompts.TEXT_ANALYSIS,
            content=[
                {
                    "type": "input_text",
                    "text": prompts.text_analysis_input(text, channel, rules.model_dump() if rules else None),
                }
            ],
            schema=TextAnalysis,
            model=self.model,
        )

        # Structured Outputs guarantees the shape, not the range.
        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)

        for emotion in result.sentiment.emotions:
            emotion.intensity = round(_clamp(emotion.intensity, 0.0, 1.0), 2)

        return TextAnalysisResponse(result=result, usage=usage)

    def analyse_image(self, image_data_url: str, context: str | None) -> ImageAnalysisResponse:
        result, usage = self._parse(
            instructions=prompts.IMAGE_ANALYSIS,
            content=[
                {"type": "input_text", "text": prompts.image_analysis_input(context)},
                {"type": "input_image", "image_url": image_data_url, "detail": "high"},
            ],
            schema=ImageAnalysis,
            model=self.model,
        )

        result.risk_score = int(_clamp(result.risk_score, 0, 100))
        result.confidence = round(_clamp(result.confidence, 0.0, 1.0), 2)

        return ImageAnalysisResponse(result=result, usage=usage)

    def _moderation_category(self, text: str) -> str | None:
        """The first moderation category raised, if any. Fails open to the model's own rules."""
        try:
            outcome = self._call(
                lambda client: client.moderations.create(model=self._settings.openai_moderation_model, input=text)
            )
        except ProviderUnavailable:
            if not self.configured:
                raise
            return None

        verdict = outcome.results[0] if outcome.results else None

        if not verdict or not verdict.flagged:
            return None

        categories = verdict.categories.model_dump(by_alias=True)
        return next((name for name, raised in categories.items() if raised), "flagged")

    def chat(self, messages: list[ChatTurn]) -> AssistantReply:
        self._require()
        started = time.perf_counter()
        latest = messages[-1].content
        model = self._settings.assistant_model

        category = self._moderation_category(latest)

        if category:
            reply = CRISIS_REPLY if category.startswith("self-harm") or category.startswith("self_harm") else REFUSAL_REPLY
            return AssistantReply(
                reply=reply,
                blocked=True,
                usage=Usage(
                    model=self._settings.openai_moderation_model,
                    prompt_version=prompts.PROMPT_VERSION,
                    latency_ms=round((time.perf_counter() - started) * 1000),
                ),
            )

        response = self._call(
            lambda client: client.responses.create(
                model=model,
                instructions=prompts.ASSISTANT,
                input=[{"role": turn.role, "content": turn.content} for turn in messages],
                max_output_tokens=600,
                store=False,
                safety_identifier=_safety_id(latest),
            )
        )

        reply = (response.output_text or "").strip()

        if not reply:
            raise ProviderRefused("The model returned no reply.")

        return AssistantReply(
            reply=reply,
            usage=Usage(
                model=response.model or model,
                prompt_version=prompts.PROMPT_VERSION,
                latency_ms=round((time.perf_counter() - started) * 1000),
                input_tokens=getattr(response.usage, "input_tokens", None),
                output_tokens=getattr(response.usage, "output_tokens", None),
            ),
        )
