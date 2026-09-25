"""
Environment contract for the AI service, validated once at start-up.

Mirrors `backend/src/config/env.ts`: a missing or malformed variable is a named
failure at boot rather than an `AttributeError` inside a request. Secrets are
read from the environment only (Rule 6.6) and are never logged (Rule 6.7).
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # The service reads its own .env, and falls back to the API's so a
        # developer who has set OPENAI_API_KEY once does not set it twice.
        env_file=(".env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", alias="NODE_ENV")

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

    # Google Gemini. When a key is present Gemini serves requests unless
    # AI_PROVIDER says otherwise; the free tier needs no billing account.
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")
    gemini_assistant_model: str | None = Field(default=None, alias="GEMINI_ASSISTANT_MODEL")
    gemini_timeout_seconds: float = Field(default=40.0, alias="GEMINI_TIMEOUT_SECONDS")

    # "gemini" or "openai". Unset: Gemini if its key is set, otherwise OpenAI.
    ai_provider: str | None = Field(default=None, alias="AI_PROVIDER")

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
    def configured(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def provider_name(self) -> str:
        chosen = (self.ai_provider or "").strip().lower()
        if chosen in ("gemini", "openai"):
            return chosen
        return "gemini" if self.gemini_api_key else "openai"

    @property
    def assistant_model(self) -> str:
        return self.openai_assistant_model or self.openai_model


@lru_cache
def get_settings() -> Settings:
    return Settings()
