"""
The platform's function entry: the FastAPI application, unchanged.

Locally the service runs under uvicorn (`uvicorn app.main:app`); deployed, the
platform's Python runtime serves the same ASGI app from this file.
"""

from app.main import app  # noqa: F401 — re-exported for the runtime
