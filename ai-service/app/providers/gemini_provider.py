"""
Google Gemini implementation of the provider contract.

Called over the Gemini API's REST endpoint with `httpx`, which the service
already depends on, rather than through Google's SDK: one POST per call does
not justify another dependency in a serverless bundle.

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
from pydantic import BaseModel, ValidationError

from app import prompts
from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
from app.providers.openai_provider import CRISIS_REPLY, REFUSAL_REPLY
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

API_ROOT = "https://generativelanguage.googleapis.com/v1beta"

# How long AI stays switched off after the free tier's quota is exhausted.
COOLDOWN_SECONDS = 120

# Generous because the Flash models may think before answering, and thinking
# is counted against the same budget; the schema keeps the answer itself short.
ANALYSIS_MAX_TOKENS = 8_192
CHAT_MAX_TOKENS = 2_048

# Block clearly harmful requests; leave room for what residents paste, which is
# by nature manipulative, threatening or explicit — that is what scams are.
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
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


class GeminiProvider:
    name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = (
            httpx.Client(
                base_url=API_ROOT,
                headers={"x-goog-api-key": settings.gemini_api_key or "", "Content-Type": "application/json"},
                timeout=settings.gemini_timeout_seconds,
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

    def _require(self) -> httpx.Client:
        if self._client is None:
            raise ProviderUnavailable("GEMINI_API_KEY is not set.")
        if time.monotonic() < self._open_until:
            raise ProviderUnavailable("AI is paused after the provider's quota was exhausted.")
        return self._client

    def _generate(self, model: str, body: dict[str, Any]) -> dict[str, Any]:
        """One generateContent call with the service's retry and breaker policy."""
        client = self._require()
        body = {"safetySettings": SAFETY_SETTINGS, **body}

        for attempt in (1, 2):
            try:
                response = client.post(f"/models/{model}:generateContent", json=body)
            except httpx.TimeoutException as error:
                raise ProviderUnavailable("The AI provider did not respond in time.") from error
            except httpx.TransportError as error:
                if attempt == 2:
                    raise ProviderUnavailable("The AI provider could not be reached.") from error
                continue

            if response.status_code == 200:
                return response.json()

            # Status and Google's error status only: the body can echo the request.
            try:
                reason = response.json().get("error", {}).get("status", "")
            except ValueError:
                reason = ""

            if response.status_code == 429:
                if attempt == 1:
                    time.sleep(1.5)
                    continue
                self._open_until = time.monotonic() + COOLDOWN_SECONDS
                raise ProviderUnavailable(f"The AI provider's quota is exhausted ({reason or 'HTTP 429'}); AI paused for {COOLDOWN_SECONDS} seconds.")

            if response.status_code in (500, 502, 503, 504) and attempt == 1:
                time.sleep(1.0)
                continue

            raise ProviderUnavailable(f"The AI provider returned HTTP {response.status_code} {reason}".strip() + ".")

        raise ProviderUnavailable("The AI provider did not answer.")

    @staticmethod
    def _text(payload: dict[str, Any]) -> str:
        if payload.get("promptFeedback", {}).get("blockReason"):
            raise ProviderRefused("The model's safety filters blocked the request.")

        candidates = payload.get("candidates") or []
        if not candidates:
            raise ProviderRefused("The model returned no answer.")

        candidate = candidates[0]
        finish = candidate.get("finishReason", "STOP")
        parts = candidate.get("content", {}).get("parts", [])
        # Thought summaries, when a model returns them, are marked and never shown.
        text = "".join(part.get("text", "") for part in parts if not part.get("thought"))

        if finish not in ("STOP", "MAX_TOKENS") or not text.strip():
            raise ProviderRefused(f"The model stopped without an answer ({finish}).")
        if finish == "MAX_TOKENS":
            raise ProviderRefused("The model's answer was cut off.")

        return text

    def _usage(self, payload: dict[str, Any], model: str, started: float) -> Usage:
        metadata = payload.get("usageMetadata", {})
        output = (metadata.get("candidatesTokenCount") or 0) + (metadata.get("thoughtsTokenCount") or 0)
        return Usage(
            model=payload.get("modelVersion") or model,
            prompt_version=prompts.PROMPT_VERSION,
            latency_ms=round((time.perf_counter() - started) * 1000),
            input_tokens=metadata.get("promptTokenCount"),
            output_tokens=output or None,
        )

    def _parse(self, *, instructions: str, parts: list[dict[str, Any]], schema: type[Parsed]) -> tuple[Parsed, Usage]:
        started = time.perf_counter()
        model = self.model
        payload = self._generate(
            model,
            {
                "systemInstruction": {"parts": [{"text": instructions}]},
                "contents": [{"role": "user", "parts": parts}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseJsonSchema": self._schemas[schema],
                    "maxOutputTokens": ANALYSIS_MAX_TOKENS,
                    "temperature": 0.2,
                },
            },
        )

        try:
            parsed = schema.model_validate_json(self._text(payload))
        except ValidationError as error:
            raise ProviderRefused("The model's answer did not match the expected shape.") from error

        return parsed, self._usage(payload, model, started)

    def analyse_text(self, text: str, channel: str, rules: RuleSummary | None) -> TextAnalysisResponse:
        result, usage = self._parse(
            instructions=prompts.TEXT_ANALYSIS,
            parts=[{"text": prompts.text_analysis_input(text, channel, rules.model_dump() if rules else None)}],
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
        # Validated here so a corrupt upload is a clear refusal, not a provider 400.
        base64.b64decode(data, validate=True)

        result, usage = self._parse(
            instructions=prompts.IMAGE_ANALYSIS,
            parts=[
                {"text": prompts.image_analysis_input(context)},
                {"inlineData": {"mimeType": mime, "data": data}},
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
            payload = self._generate(
                model,
                {
                    "systemInstruction": {"parts": [{"text": prompts.ASSISTANT}]},
                    "contents": [
                        {"role": "model" if turn.role == "assistant" else "user", "parts": [{"text": turn.content}]}
                        for turn in messages
                    ],
                    "generationConfig": {"maxOutputTokens": CHAT_MAX_TOKENS, "temperature": 0.4},
                },
            )
            reply = self._text(payload).strip()
        except ProviderRefused:
            return fixed(REFUSAL_REPLY)

        return AssistantReply(reply=reply, usage=self._usage(payload, model, started))

