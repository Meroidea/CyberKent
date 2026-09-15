"""
CyberKent AI service — the FastAPI intelligence layer.

Sits behind the Express AI Gateway (backend/src/modules/ai) and is never
called by a browser directly. It exists as its own process because the
architecture requires AI to be isolated and replaceable (Rule 8.1, constraint
C3): if this service is stopped, misconfigured or the provider is down, the
gateway answers "AI unavailable" and every core feature of CyberKent keeps
working, because none of them depend on it.

    uvicorn app.main:app --host 127.0.0.1 --port 8000
"""

import logging

from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.dependencies import get_provider
from app.providers.base import AiProvider, ProviderRefused, ProviderUnavailable
from app.routers import analysis, assistant
from app.schemas import Health

logger = logging.getLogger("cyberkent.ai")

settings = get_settings()

app = FastAPI(
    title="CyberKent AI service",
    version="1.0.0",
    description="Text, image and conversational analysis for CyberKent. Provider-agnostic (Rule 8.2).",
    # The interactive docs are a development aid; production exposes nothing
    # it does not need to.
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None,
)

app.include_router(analysis.router)
app.include_router(assistant.router)


@app.get("/health", response_model=Health, tags=["health"])
def health(provider: AiProvider = Depends(get_provider)) -> Health:
    return Health(status="ok", configured=provider.configured, provider=provider.name, model=provider.model)


@app.exception_handler(ProviderUnavailable)
def provider_unavailable(_: Request, error: ProviderUnavailable) -> JSONResponse:
    logger.warning("provider unavailable: %s", error)
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": "AI analysis is unavailable."})


@app.exception_handler(ProviderRefused)
def provider_refused(_: Request, error: ProviderRefused) -> JSONResponse:
    logger.info("provider refused: %s", error)
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={"detail": "The AI could not assess this content."})


@app.exception_handler(RequestValidationError)
def invalid_request(_: Request, error: RequestValidationError) -> JSONResponse:
    # Field locations only. FastAPI's default echoes the submitted value back,
    # which would put a resident's message into a log line or an error body.
    fields = [".".join(str(part) for part in issue["loc"]) for issue in error.errors()]
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={"detail": "Invalid request.", "fields": fields})
