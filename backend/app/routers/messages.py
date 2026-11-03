from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.artist import ArtistProfile
from app.schemas.message import MessageCreate, MessageOut, ConversationOut
from app.utils.jwt_handler import get_current_user
from app.services import message_service
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List active conversations for current user with last message & unread count."""
    return message_service.list_conversations(db, current_user.id)


@router.get("/recipient/{recipient_id}")
def get_recipient_info(
    recipient_id: int,
    type: Optional[str] = None,  # "artist" or "user"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get recipient details by either user_id or artist_id for initializing direct messaging.
    """
    target_user = None
    target_artist = None

    if type == "artist":
        target_artist = db.query(ArtistProfile).filter(ArtistProfile.id == recipient_id).first()
        if target_artist and target_artist.user:
            target_user = target_artist.user
    elif type == "user":
        target_user = db.query(User).filter(User.id == recipient_id).first()
        if target_user:
            target_artist = target_user.artist_profile
    else:
        target_user = db.query(User).filter(User.id == recipient_id).first()
        if target_user:
            target_artist = target_user.artist_profile
        else:
            target_artist = db.query(ArtistProfile).filter(ArtistProfile.id == recipient_id).first()
            if target_artist and target_artist.user:
                target_user = target_artist.user

    if not target_user:
        raise NotFoundException(detail="Recipient user not found")

    photo = None
    specialization = None
    city = None
    if target_artist:
        photo = target_artist.profile_photo_url
        specialization = target_artist.specialization
        city = target_artist.city
    elif hasattr(target_user, "profile_photo_url") and target_user.profile_photo_url:
        photo = target_user.profile_photo_url

    return {
        "id": target_user.id,
        "name": target_user.name,
        "email": target_user.email,
        "role": str(target_user.role.value if hasattr(target_user.role, "value") else target_user.role),
        "photo": photo,
        "specialization": specialization,
        "city": city,
        "artist_id": target_artist.id if target_artist else None,
    }



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
