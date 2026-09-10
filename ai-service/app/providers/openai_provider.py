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
from typing import TypeVar

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


class OpenAIProvider:
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = (
            OpenAI(
                api_key=settings.openai_api_key,
                timeout=settings.openai_timeout_seconds,
                max_retries=2,
            )
            if settings.configured
            else None
        )

    @property
    def model(self) -> str:
        return self._settings.openai_model

    @property
    def configured(self) -> bool:
        return self._client is not None

    def _require(self) -> OpenAI:
        if self._client is None:
            raise ProviderUnavailable("OPENAI_API_KEY is not set.")
        return self._client

    def _parse(self, *, instructions: str, content: list[dict], schema: type[Parsed], model: str) -> tuple[Parsed, Usage]:
        client = self._require()
        started = time.perf_counter()

        try:
            response = client.responses.parse(
                model=model,
                instructions=instructions,
                input=[{"role": "user", "content": content}],
                text_format=schema,
                max_output_tokens=1_600,
                store=False,
                safety_identifier=_safety_id(repr(content)[:4_000]),
            )
        except (APITimeoutError, APIConnectionError) as error:
            raise ProviderUnavailable("The AI provider did not respond in time.") from error
        except APIStatusError as error:
            # Status only: the body can echo the request, which is user content.
            raise ProviderUnavailable(f"The AI provider returned HTTP {error.status_code}.") from error

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
        client = self._require()

        try:
            outcome = client.moderations.create(model=self._settings.openai_moderation_model, input=text)
        except Exception:  # noqa: BLE001 — moderation is a layer, not the only one
            return None

        verdict = outcome.results[0] if outcome.results else None

        if not verdict or not verdict.flagged:
            return None

        categories = verdict.categories.model_dump(by_alias=True)
        return next((name for name, raised in categories.items() if raised), "flagged")

    def chat(self, messages: list[ChatTurn]) -> AssistantReply:
        client = self._require()
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

        try:
            response = client.responses.create(
                model=model,
                instructions=prompts.ASSISTANT,
                input=[{"role": turn.role, "content": turn.content} for turn in messages],
                max_output_tokens=600,
                store=False,
                safety_identifier=_safety_id(latest),
            )
        except (APITimeoutError, APIConnectionError) as error:
            raise ProviderUnavailable("The AI provider did not respond in time.") from error
        except APIStatusError as error:
            raise ProviderUnavailable(f"The AI provider returned HTTP {error.status_code}.") from error

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
