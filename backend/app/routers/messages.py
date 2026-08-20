from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.message import MessageCreate, MessageOut, ConversationOut
from app.utils.jwt_handler import get_current_user
from app.services import message_service

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List active conversations for current user with last message & unread count."""
    return message_service.list_conversations(db, current_user.id)


@router.get("/{user_id}", response_model=List[MessageOut])
def get_messages_history(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get message history with a specific user."""
    return message_service.get_messages_history(db, current_user.id, user_id)


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message via REST (fallback)."""
    return message_service.save_message(
        db,
        sender_id=current_user.id,
        receiver_id=msg_data.receiver_id,
        content=msg_data.content,
    )


@router.put("/{user_id}/read")
def mark_messages_read(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all unread messages from user_id as read."""
    updated = message_service.mark_as_read(db, current_user_id=current_user.id, sender_id=user_id)
    return {"status": "ok", "updated_count": updated}
