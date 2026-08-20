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
from app.models import user, artist, booking, review, availability  # noqa: F401 — registers ORM models
from app.routers import auth, artists, bookings, reviews, recommendations, admin, chat
from app.config import settings
from app.utils.security import hash_password
from app.utils.jwt_handler import decode_token
from app.models.user import User, UserRole
from app.websocket_manager import manager
from app.core.error_handlers import register_error_handlers
from app.core.security_headers import SecurityHeadersMiddleware

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
    _create_default_admin()
    _auto_seed_if_empty()
    logger.info("YakshaAI API started successfully")
    yield
    # Shutdown
    logger.info("YakshaAI API shutting down")


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


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="YakshaAI API",
    description="AI-powered Yakshagana Artist Booking Platform — Production",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Error Handlers ────────────────────────────────────────────────────────────
register_error_handlers(app)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(artists.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(recommendations.router)
app.include_router(admin.router)
app.include_router(chat.router)


# ── WebSocket — Real-Time Notifications ──────────────────────────────────────
@app.websocket("/ws/notifications/{user_id}")
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
@app.get("/")
def root():
    return {"service": "YakshaAI API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "YakshaAI", "version": "1.0.0"}


@app.get("/ws/status")
def ws_status():
    return {
        "active_connections": manager.connected_count(),
        "connected_users": len(manager.connections),
    }
