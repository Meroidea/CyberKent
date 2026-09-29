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
        # developer who has set GEMINI_API_KEY once does not set it twice.
        env_file=(".env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", alias="NODE_ENV")

    # Google Gemini, the one model behind every AI feature; the free tier needs
    # no billing account. Optional so the service can start and report itself
    # unconfigured: the gateway then degrades to "AI unavailable" instead of the
    # process refusing to boot — constraint C3: the core system works when AI
    # does not. Models are centralised here, never hard-coded at a call site
    # (Avoid.md §8); the assistant may use a different one.
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.8-flash", alias="GEMINI_MODEL")
    gemini_assistant_model: str | None = Field(default=None, alias="GEMINI_ASSISTANT_MODEL")
    # Tried once when the model above is overloaded or out of quota; the Flash
    # models' free tier is often at capacity, the Flash-Lite ones rarely.
    # Set it empty to switch the fallback off.
    gemini_fallback_model: str | None = Field(default="gemini-3.1-flash-lite", alias="GEMINI_FALLBACK_MODEL")
    gemini_timeout_seconds: float = Field(default=40.0, alias="GEMINI_TIMEOUT_SECONDS")

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
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
