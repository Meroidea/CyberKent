"""
The contract every AI provider implements.

Rule 8.2 and Avoid.md §8 — the service must never assume a provider. Routes
depend on this protocol, not on OpenAI; replacing OpenAI with Gemini, Claude or
a local model is a new class here and a one-line change in `dependencies.py`,
with no route, schema or gateway touched.
"""

from typing import Protocol

from app.schemas import (
    AssistantReply,
    ChatTurn,
    ImageAnalysisResponse,
    RuleSummary,
    TextAnalysisResponse,
)


class ProviderUnavailable(Exception):
    """The provider is not configured, timed out, or refused. Never carries secrets."""


class ProviderRefused(Exception):
    """The provider declined to answer, e.g. a safety refusal."""


class AiProvider(Protocol):
    name: str

    @property
    def model(self) -> str: ...

    @property
    def configured(self) -> bool: ...

    def analyse_text(self, text: str, channel: str, rules: RuleSummary | None) -> TextAnalysisResponse: ...

    def analyse_image(self, image_data_url: str, context: str | None) -> ImageAnalysisResponse: ...

    def chat(self, messages: list[ChatTurn]) -> AssistantReply: ...
