import httpx
import logging
from app.config import settings
from app.core.exceptions import BadRequestException

logger = logging.getLogger("yakshagai.chat")

async def proxy_chat(
    messages: list[dict],
    model: str = 'llama-3.3-70b-versatile',
    temperature: float = 0.75,
    max_tokens: int = 800
) -> dict:
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise BadRequestException(detail="GROQ_API_KEY is not configured")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    model_to_use = model or settings.GROQ_MODEL
    payload = {
        "model": model_to_use,
        "messages": messages,
        "temperature": temperature if temperature is not None else 0.75,
        "max_tokens": max_tokens if max_tokens is not None else 800
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API error: {e.response.text}")
        raise BadRequestException(detail=f"Groq API error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error communicating with Groq API: {str(e)}")
        raise BadRequestException(detail=f"Error communicating with AI service: {str(e)}")
