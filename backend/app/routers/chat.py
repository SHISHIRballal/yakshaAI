"""
Chat router — proxies chatbot requests to the Groq API server-side.
Keeps the API key hidden from the frontend.
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.chat_service import proxy_chat

logger = logging.getLogger("yakshagai.chat")

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    temperature: Optional[float] = 0.75
    max_tokens: Optional[int] = 800


from fastapi import APIRouter, Request
from app.config import settings
from app.core.limiter import limiter

@router.post("")
@limiter.limit("20/minute")
async def chat(request: Request, chat_req: ChatRequest):
    """Proxy chat completion request to Groq API."""
    messages = [{"role": m.role, "content": m.content} for m in chat_req.messages]
    model_name = chat_req.model or settings.GROQ_MODEL
    result = await proxy_chat(
        messages=messages,
        model=model_name,
        temperature=chat_req.temperature or 0.75,
        max_tokens=chat_req.max_tokens or 800,
    )
    return result
