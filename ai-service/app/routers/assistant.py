"""
The CyberSafe Assistant — a conversational helper for scam questions.

The conversation is held by the browser and sent whole on each turn; this
service keeps nothing between requests. Only the most recent turns are
forwarded, which bounds cost and means an old message cannot be replayed into a
new context indefinitely.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.dependencies import get_provider, require_internal_token
from app.providers.base import AiProvider
from app.schemas import AssistantReply, AssistantRequest

router = APIRouter(prefix="/v1/assistant", tags=["assistant"], dependencies=[Depends(require_internal_token)])


@router.post("/chat", response_model=AssistantReply)
def chat(body: AssistantRequest, provider: AiProvider = Depends(get_provider)) -> AssistantReply:
    settings = get_settings()

    if body.messages[-1].role != "user":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "The last message must be from the user.")

    if any(len(turn.content) > settings.max_chat_chars for turn in body.messages):
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "A message is too long.")

    reply = provider.chat(body.messages[-settings.max_chat_turns :])
    reply.usage.provider = provider.name
    return reply
