"""
Production-ready FastAPI main application.
WebSocket support, structured logging, CORS, health checks.
"""
import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database import Base, engine, SessionLocal
from app.models import user, artist, booking, review, availability, message  # noqa: F401 — registers ORM models
from app.routers import auth, artists, bookings, reviews, recommendations, admin, chat, messages, uploads
from app.config import settings
from app.utils.security import hash_password
from app.utils.jwt_handler import decode_token
from app.models.user import User, UserRole
from app.websocket_manager import manager
from app.core.error_handlers import register_error_handlers
from app.core.security_headers import SecurityHeadersMiddleware
import socketio
from app.socket_app import sio

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("yakshagai")


# ── Lifespan (replaces deprecated on_event) ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    _migrate_db()
    _create_default_admin()
    _auto_seed_if_empty()
    logger.info("YakshaAI API started successfully")
    yield
    # Shutdown
    logger.info("YakshaAI API shutting down")


def _migrate_db():
    from sqlalchemy import text
    db = SessionLocal()
    try:
        cols = [c[1] for c in db.execute(text("PRAGMA table_info(users)")).fetchall()]
        if "profile_photo_url" not in cols:
            db.execute(text("ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(500)"))
            db.commit()
            logger.info("Added profile_photo_url column to users table")
    except Exception as e:
        logger.warning(f"DB migration check note: {e}")
    finally:
        db.close()


def _create_default_admin():
    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not exists:
            db.add(User(
                name="YakshaAI Admin",
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
            ))
            db.commit()
            logger.info(f"Admin user created: {settings.ADMIN_EMAIL}")
        else:
            logger.info(f"Admin user already exists: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


def _auto_seed_if_empty():
    """Auto-seed DB with artists on first production deployment when empty."""
    from app.models.artist import ArtistProfile
    db = SessionLocal()
    try:
        count = db.query(ArtistProfile).count()
        if count == 0:
            logger.info("Empty DB detected — running seed_data...")
            try:
                import subprocess, sys, os
                seed_path = os.path.join(os.path.dirname(__file__), "..", "seed_data.py")
                if os.path.exists(seed_path):
                    subprocess.run([sys.executable, seed_path], check=True, timeout=60)
                    logger.info("Seed completed successfully.")
                else:
                    logger.warning("seed_data.py not found — skipping auto-seed.")
            except Exception as e:
                logger.warning(f"Auto-seed failed (non-fatal): {e}")
        else:
            logger.info(f"DB already has {count} artists — skipping seed.")
    finally:
        db.close()


from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

# ── App ───────────────────────────────────────────────────────────────────────
fastapi_app = FastAPI(
    title="YakshaAI API",
    description="AI-powered Yakshagana Artist Booking Platform — Production",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

fastapi_app.state.limiter = limiter
fastapi_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Error Handlers ────────────────────────────────────────────────────────────
register_error_handlers(fastapi_app)

# ── Middleware ────────────────────────────────────────────────────────────────
fastapi_app.add_middleware(SecurityHeadersMiddleware)
fastapi_app.add_middleware(GZipMiddleware, minimum_size=1000)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static File Mount (Uploads) ──────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
import os

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
fastapi_app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Routers ───────────────────────────────────────────────────────────────────
fastapi_app.include_router(auth.router)
fastapi_app.include_router(artists.router)
fastapi_app.include_router(bookings.router)
fastapi_app.include_router(reviews.router)
fastapi_app.include_router(recommendations.router)
fastapi_app.include_router(admin.router)
fastapi_app.include_router(chat.router)
fastapi_app.include_router(messages.router)
fastapi_app.include_router(uploads.router)

app = socketio.ASGIApp(sio, fastapi_app)


# ── WebSocket — Real-Time Notifications ──────────────────────────────────────
@fastapi_app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...),
):
    """
    Per-user WebSocket endpoint.
    Client connects with: ws://host/ws/notifications/{user_id}?token=<jwt>
    Receives JSON notification payloads whenever relevant events occur.
    """
    # Validate token
    try:
        payload = decode_token(token)
        token_user_id = int(payload.get("sub", -1))
        if token_user_id != user_id:
            await websocket.close(code=4001, reason="Unauthorized")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id)
    logger.info(f"[WS] User {user_id} connected. Active: {manager.connected_count()}")
    try:
        # Send initial connected confirmation
        await websocket.send_json({"type": "connected", "user_id": user_id})
        # Keep alive — wait for client close or network drop
        while True:
            try:
                data = await websocket.receive_text()
                # Handle client ping
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
    finally:
        manager.disconnect(websocket, user_id)
        logger.info(f"[WS] User {user_id} disconnected. Active: {manager.connected_count()}")


# ── Health & Root ─────────────────────────────────────────────────────────────
@fastapi_app.get("/")
def root():
    return {"service": "YakshaAI API", "version": "1.0.0", "status": "running"}


@fastapi_app.get("/health")
def health():
    return {"status": "healthy", "service": "YakshaAI", "version": "1.0.0"}


@fastapi_app.get("/ws/status")
def ws_status():
    return {
        "active_connections": manager.connected_count(),
        "connected_users": len(manager.connections),
    }
