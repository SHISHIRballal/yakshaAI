import socketio
import logging
from urllib.parse import parse_qs
from app.utils.jwt_handler import decode_token
from app.database import SessionLocal
from app.models.user import User
from app.services import message_service

logger = logging.getLogger("yakshagai.socket")

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# Presence & SID tracking maps
sid_to_user: dict[str, int] = {}
user_to_sids: dict[int, set[str]] = {}


def is_user_online(user_id: int) -> bool:
    return len(user_to_sids.get(user_id, set())) > 0


@sio.event
async def connect(sid, environ, auth=None):
    token = None
    # 1. Check auth dictionary from client connection payload
    if isinstance(auth, dict) and auth.get("token"):
        token = auth.get("token")
    
    # 2. Fallback to query string parameter
    if not token:
        query_string = environ.get("QUERY_STRING", "")
        parsed = parse_qs(query_string)
        if "token" in parsed:
            token = parsed["token"][0]

    if not token:
        logger.warning(f"[Socket.IO] Connection rejected (missing token): sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError("Missing authentication token")

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", -1))
        if user_id <= 0:
            raise ValueError("Invalid user_id in token")
    except Exception as e:
        logger.warning(f"[Socket.IO] Connection rejected (invalid token): sid={sid}, error={e}")
        raise socketio.exceptions.ConnectionRefusedError("Invalid authentication token")

    # Verify user exists and is active
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise socketio.exceptions.ConnectionRefusedError("User account inactive or missing")
    finally:
        db.close()

    # Track user session
    sid_to_user[sid] = user_id
    if user_id not in user_to_sids:
        user_to_sids[user_id] = set()
    user_to_sids[user_id].add(sid)

    logger.info(f"[Socket.IO] User {user_id} connected (sid={sid}). Online count: {len(user_to_sids)}")

    # Broadcast online status
    await sio.emit("user_status", {"user_id": user_id, "status": "online"})


@sio.event
async def disconnect(sid):
    user_id = sid_to_user.pop(sid, None)
    if user_id and user_id in user_to_sids:
        user_to_sids[user_id].discard(sid)
        if not user_to_sids[user_id]:
            del user_to_sids[user_id]
            logger.info(f"[Socket.IO] User {user_id} disconnected (offline).")
            await sio.emit("user_status", {"user_id": user_id, "status": "offline"})
        else:
            logger.info(f"[Socket.IO] User {user_id} disconnected sid={sid} (still has active sessions).")


@sio.event
async def send_message(sid, data):
    sender_id = sid_to_user.get(sid)
    if not sender_id:
        return {"status": "error", "message": "Unauthorized socket"}

    receiver_id = data.get("receiver_id")
    content = data.get("content")

    if not receiver_id or not content:
        return {"status": "error", "message": "Missing receiver_id or content"}

    db = SessionLocal()
    try:
        msg_dict = message_service.save_message(db, sender_id=sender_id, receiver_id=receiver_id, content=content)
    except Exception as exc:
        logger.error(f"[Socket.IO] Error saving message: {exc}")
        return {"status": "error", "message": str(exc)}
    finally:
        db.close()

    # Emit to receiver sids
    rec_sids = user_to_sids.get(int(receiver_id), set())
    for r_sid in rec_sids:
        await sio.emit("new_message", msg_dict, room=r_sid)

    # Emit back to sender sids for multi-tab sync
    snd_sids = user_to_sids.get(sender_id, set())
    for s_sid in snd_sids:
        await sio.emit("new_message", msg_dict, room=s_sid)

    return {"status": "ok", "message": msg_dict}


@sio.event
async def typing_start(sid, data):
    sender_id = sid_to_user.get(sid)
    if not sender_id:
        return
    receiver_id = data.get("receiver_id")
    if receiver_id:
        rec_sids = user_to_sids.get(int(receiver_id), set())
        for r_sid in rec_sids:
            await sio.emit("user_typing", {"user_id": sender_id, "is_typing": True}, room=r_sid)


@sio.event
async def typing_stop(sid, data):
    sender_id = sid_to_user.get(sid)
    if not sender_id:
        return
    receiver_id = data.get("receiver_id")
    if receiver_id:
        rec_sids = user_to_sids.get(int(receiver_id), set())
        for r_sid in rec_sids:
            await sio.emit("user_typing", {"user_id": sender_id, "is_typing": False}, room=r_sid)


@sio.event
async def mark_read(sid, data):
    current_user_id = sid_to_user.get(sid)
    if not current_user_id:
        return
    sender_id = data.get("sender_id")
    if not sender_id:
        return

    db = SessionLocal()
    try:
        updated_count = message_service.mark_as_read(db, current_user_id=current_user_id, sender_id=int(sender_id))
    finally:
        db.close()

    if updated_count > 0:
        # Notify original sender that their messages were read
        snd_sids = user_to_sids.get(int(sender_id), set())
        for s_sid in snd_sids:
            await sio.emit("messages_read", {"reader_id": current_user_id}, room=s_sid)
