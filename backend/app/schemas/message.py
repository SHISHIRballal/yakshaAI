from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    receiver_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Message content cannot be empty")
        if len(s) > 2000:
            raise ValueError("Message content cannot exceed 2000 characters")
        return s


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: Optional[datetime] = None
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    other_user_id: int
    other_user_name: str
    other_user_role: str
    other_user_photo: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
