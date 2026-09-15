"""
Environment contract for the AI service, validated once at start-up.

Mirrors `backend/src/config/env.ts`: a missing or malformed variable is a named
failure at boot rather than an `AttributeError` inside a request. Secrets are
read from the environment only (Rule 6.6) and are never logged (Rule 6.7).
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ProviderName = Literal["openai", "gemini"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # The service reads its own .env, and falls back to the API's so a
        # developer who has set OPENAI_API_KEY once does not set it twice.
        env_file=(".env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", alias="NODE_ENV")

    # ── which provider answers ───────────────────────────────────────────────
    #
    # Rule 8.2 — the provider is configuration, not a code path. "auto" picks
    # whichever key is present so a deployment that holds one key needs no
    # second variable; naming one explicitly is what a deployment holding both
    # keys does to say which it means. Auto prefers OpenAI so that an existing
    # deployment keeps the provider it already had when a Gemini key is added
    # beside it — changing which model assesses residents' messages is a
    # decision to be made deliberately, never a side effect of setting a key.
    ai_provider: Literal["auto", "openai", "gemini"] = Field(default="auto", alias="AI_PROVIDER")

    # ── OpenAI ───────────────────────────────────────────────────────────────
    #
    # Optional so the service can start and report itself unconfigured. The
    # gateway then degrades to "AI unavailable" instead of the process refusing
    # to boot — constraint C3: the core system works when AI does not.
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")

    # Centralised, never hard-coded at a call site (Avoid.md §8). One model for
    # structured analysis and vision; the assistant may use a different one.
    openai_model: str = Field(default="gpt-4.1-mini", alias="OPENAI_MODEL")
    openai_assistant_model: str | None = Field(default=None, alias="OPENAI_ASSISTANT_MODEL")
    openai_moderation_model: str = Field(default="omni-moderation-latest", alias="OPENAI_MODERATION_MODEL")
    openai_timeout_seconds: float = Field(default=40.0, alias="OPENAI_TIMEOUT_SECONDS")

    # ── Gemini ───────────────────────────────────────────────────────────────
    #
    # GOOGLE_API_KEY is accepted as well because the Google SDK reads it by that
    # name, and a developer who has already exported it should not have to set
    # the same secret twice under another name.
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    google_api_key: str | None = Field(default=None, alias="GOOGLE_API_KEY")

    gemini_model: str = Field(default="gemini-3.5-flash", alias="GEMINI_MODEL")
    gemini_assistant_model: str | None = Field(default=None, alias="GEMINI_ASSISTANT_MODEL")
    gemini_timeout_seconds: float = Field(default=40.0, alias="GEMINI_TIMEOUT_SECONDS")

    # How much silent reasoning the model may do before it answers.
    #
    # This is not a cost dial, it is a correctness one. On Gemini,
    # `max_output_tokens` bounds thinking *and* the answer together, so a
    # thinking-by-default model given a tight ceiling can spend the whole budget
    # reasoning and return nothing — which arrives here as an empty response,
    # indistinguishable from a refusal. "minimal" keeps the budget for the
    # answer. Blank leaves the model's own default, for a deployment that has
    # measured its model and wants more.
    gemini_thinking_level: Literal["", "minimal", "low", "medium", "high"] = Field(
        default="minimal", alias="GEMINI_THINKING_LEVEL"
    )

    # Shared secret with the Express gateway. When set, every request without
    # it is refused: this service is never meant to be reachable from a browser.
    internal_token: str | None = Field(default=None, alias="AI_SERVICE_TOKEN")

    # Input ceilings. Well above any genuine message, well below anything that
    # would make a single request expensive.
    max_text_chars: int = 8_000
    max_image_bytes: int = 5 * 1024 * 1024
    max_chat_turns: int = 16
    max_chat_chars: int = 2_000

    @property
    def gemini_key(self) -> str | None:
        """The Gemini credential under either of the two names it may arrive as."""
        return self.gemini_api_key or self.google_api_key

    @property
    def provider(self) -> ProviderName:
        """Which provider this deployment has asked for."""
        if self.ai_provider != "auto":
            return self.ai_provider

        if self.openai_api_key:
            return "openai"

        return "gemini" if self.gemini_key else "openai"

    @property
    def configured(self) -> bool:
        """Whether the chosen provider holds a credential."""
        return bool(self.gemini_key) if self.provider == "gemini" else bool(self.openai_api_key)

    @property
    def assistant_model(self) -> str:
        return self.openai_assistant_model or self.openai_model

    @property
    def gemini_chat_model(self) -> str:
        return self.gemini_assistant_model or self.gemini_model


@lru_cache
def get_settings() -> Settings:
    return Settings()
