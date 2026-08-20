import base64
import json
from typing import Optional, Dict, Any
from app.core.exceptions import BadRequestException


def encode_cursor(payload: Dict[str, Any]) -> str:
    """Encode a dictionary payload into a URL-safe Base64 cursor string."""
    json_bytes = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(json_bytes).decode("utf-8")


def decode_cursor(cursor_str: str) -> Dict[str, Any]:
    """Decode a URL-safe Base64 cursor string back into a dictionary payload."""
    if not cursor_str:
        return {}
    try:
        json_bytes = base64.urlsafe_b64decode(cursor_str.encode("utf-8"))
        return json.loads(json_bytes.decode("utf-8"))
    except Exception:
        raise BadRequestException(detail="Invalid pagination cursor format")
