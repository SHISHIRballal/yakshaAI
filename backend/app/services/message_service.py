import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.message import Conversation, Message
from app.models.user import User, UserRole
from app.models.artist import ArtistProfile
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

logger = logging.getLogger("yakshagai.messages")


def get_or_create_conversation(db: Session, user1_id: int, user2_id: int) -> Conversation:
    if user1_id == user2_id:
        raise BadRequestException(detail="Cannot start a conversation with yourself")
    
    u1, u2 = (user1_id, user2_id) if user1_id < user2_id else (user2_id, user1_id)
    
    conv = db.query(Conversation).filter(
        Conversation.user1_id == u1,
        Conversation.user2_id == u2
    ).first()
    
    if not conv:
        conv = Conversation(user1_id=u1, user2_id=u2)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    
    return conv


def save_message(db: Session, sender_id: int, receiver_id: int, content: str) -> dict:
    clean_content = (content or "").strip()
    if not clean_content:
        raise BadRequestException(detail="Message content cannot be empty")
    if len(clean_content) > 2000:
        raise BadRequestException(detail="Message content cannot exceed 2000 characters")

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver or not receiver.is_active:
        raise NotFoundException(detail="Recipient user not found")

    sender = db.query(User).filter(User.id == sender_id).first()

    conv = get_or_create_conversation(db, sender_id, receiver_id)

    msg = Message(
        conversation_id=conv.id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=clean_content,
        is_read=False,
    )
    db.add(msg)
    conv.updated_at = func.now()
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
        "sender_name": sender.name if sender else None,
        "receiver_name": receiver.name if receiver else None,
    }


def list_conversations(db: Session, user_id: int) -> list:
    convs = db.query(Conversation).filter(
        or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id)
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for c in convs:
        other_id = c.user2_id if c.user1_id == user_id else c.user1_id
        other_user = db.query(User).filter(User.id == other_id).first()
        if not other_user:
            continue

        # Get latest message
        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.desc()).first()

        # Count unread messages for user_id
        unread = db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.receiver_id == user_id,
            Message.is_read == False
        ).count()

        photo = None
        if other_user.role == UserRole.artist and other_user.artist_profile:
            photo = other_user.artist_profile.profile_photo_url

        result.append({
            "id": c.id,
            "other_user_id": other_user.id,
            "other_user_name": other_user.name,
            "other_user_role": other_user.role.value if hasattr(other_user.role, 'value') else str(other_user.role),
            "other_user_photo": photo,
            "last_message": last_msg.content if last_msg else None,
            "last_message_at": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None,
            "unread_count": unread,
        })

    return result


def get_messages_history(db: Session, current_user_id: int, other_user_id: int) -> list:
    if current_user_id == other_user_id:
        return []

    u1, u2 = (current_user_id, other_user_id) if current_user_id < other_user_id else (other_user_id, current_user_id)
    conv = db.query(Conversation).filter(
        Conversation.user1_id == u1,
        Conversation.user2_id == u2
    ).first()

    if not conv:
        return []

    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    
    sender_cache = {}
    result = []
    for m in messages:
        if m.sender_id not in sender_cache:
            u = db.query(User).filter(User.id == m.sender_id).first()
            sender_cache[m.sender_id] = u.name if u else "Unknown"

        result.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "sender_name": sender_cache[m.sender_id],
        })

    return result


def mark_as_read(db: Session, current_user_id: int, sender_id: int) -> int:
    u1, u2 = (current_user_id, sender_id) if current_user_id < sender_id else (sender_id, current_user_id)
    conv = db.query(Conversation).filter(
        Conversation.user1_id == u1,
        Conversation.user2_id == u2
    ).first()

    if not conv:
        return 0

    updated = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.receiver_id == current_user_id,
        Message.is_read == False
    ).update({"is_read": True})

    db.commit()
    return updated
