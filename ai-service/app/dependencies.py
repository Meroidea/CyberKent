"""
Dependency wiring: which provider serves requests, and who may call.

The one place a provider is chosen. Tests override `get_provider` with a fake,
which is also exactly how a different provider would be swapped in.
"""

import hmac
from functools import lru_cache

from fastapi import Header, HTTPException, status

from app.config import get_settings
from app.providers.base import AiProvider
from app.providers.gemini_provider import GeminiProvider


@lru_cache
def get_provider() -> AiProvider:
    return GeminiProvider(get_settings())


def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    """Only the Express gateway may call this service. Compared in constant time."""
    expected = get_settings().internal_token

    if expected and not (x_internal_token and hmac.compare_digest(x_internal_token, expected)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorised.")
