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


from app.config import settings

@router.post("")
async def chat(request: ChatRequest):
    """Proxy chat completion request to Groq API."""
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    model_name = request.model or settings.GROQ_MODEL
    result = await proxy_chat(
        messages=messages,
        model=model_name,
        temperature=request.temperature or 0.75,
        max_tokens=request.max_tokens or 800,
    )
    return result
