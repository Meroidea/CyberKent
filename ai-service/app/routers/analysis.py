"""
NLP and computer-vision analysis endpoints.

Routes validate and delegate; the provider does the work (Rule 2.3). Size limits
are enforced here as well as at the gateway, because this service must be safe
on its own terms rather than only behind something else.
"""

import base64
import re

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.dependencies import get_provider, require_internal_token
from app.providers.base import AiProvider
from app.schemas import (
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    TextAnalysisRequest,
    TextAnalysisResponse,
)

router = APIRouter(prefix="/v1/analyse", tags=["analysis"], dependencies=[Depends(require_internal_token)])

# PNG and JPEG only: the browser re-encodes every image into one of these,
# which is what strips its metadata.
DATA_URL = re.compile(r"^data:image/(png|jpeg);base64,([A-Za-z0-9+/=]+)$")


@router.post("/text", response_model=TextAnalysisResponse)
def analyse_text(body: TextAnalysisRequest, provider: AiProvider = Depends(get_provider)) -> TextAnalysisResponse:
    if len(body.text) > get_settings().max_text_chars:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "The message is too long to analyse.")

    return provider.analyse_text(body.text, body.channel, body.rules)


@router.post("/image", response_model=ImageAnalysisResponse)
def analyse_image(body: ImageAnalysisRequest, provider: AiProvider = Depends(get_provider)) -> ImageAnalysisResponse:
    match = DATA_URL.match(body.image)

    if not match:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "The image must be a PNG or JPEG data URL.")

    try:
        size = len(base64.b64decode(match.group(2), validate=True))
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "The image data is not valid.") from error

    if size > get_settings().max_image_bytes:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "The image is too large to analyse.")

    return provider.analyse_image(body.image, body.context)
