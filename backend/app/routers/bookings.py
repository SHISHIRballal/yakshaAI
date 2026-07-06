"""
Bookings router — handles create, list, get, status-update.
Fires real-time WebSocket notifications to involved parties on every mutation.
"""
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.artist import ArtistProfile
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, BookingStatusUpdate
from app.utils.jwt_handler import get_current_user
from app.websocket_manager import manager

logger = logging.getLogger("yakshagai.bookings")

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def enrich_booking(b: Booking) -> dict:
    return {
        "id": b.id,
        "organizer_id": b.organizer_id,
        "artist_id": b.artist_id,
        "event_date": b.event_date,
        "event_type": b.event_type,
        "venue": b.venue,
        "venue_city": b.venue_city,
        "budget": b.budget,
        "duration_hours": b.duration_hours,
        "special_requirements": b.special_requirements,
        "status": b.status,
        "organizer_notes": b.organizer_notes,
        "artist_notes": b.artist_notes,
        "created_at": b.created_at,
        "organizer_name": b.organizer.name if b.organizer else None,
        "artist_name": b.artist.user.name if b.artist and b.artist.user else None,
        "artist_photo": b.artist.profile_photo_url if b.artist else None,
        "artist_id_user": b.artist.user_id if b.artist else None,
    }


def _fire_notification(user_id: int, payload: dict):
    """Schedule a WebSocket notification without blocking the HTTP response."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.send_to_user(user_id, payload))
        else:
            loop.run_until_complete(manager.send_to_user(user_id, payload))
    except Exception as exc:
        logger.warning(f"[WS] Notification to user {user_id} failed: {exc}")


# ── Create Booking ─────────────────────────────────────────────────────────────
@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot create bookings")

    artist = db.query(ArtistProfile).filter(ArtistProfile.id == booking_data.artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    if current_user.role == "artist" and artist.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book yourself")

    booking = Booking(
        organizer_id=current_user.id,
        artist_id=booking_data.artist_id,
        event_date=booking_data.event_date,
        event_type=booking_data.event_type,
        venue=booking_data.venue,
        venue_city=booking_data.venue_city,
        budget=booking_data.budget,
        duration_hours=booking_data.duration_hours,
        special_requirements=booking_data.special_requirements,
        organizer_notes=booking_data.organizer_notes,
    )
    db.add(booking)
    artist.total_bookings = (artist.total_bookings or 0) + 1
    db.commit()
    db.refresh(booking)

    enriched = enrich_booking(booking)

    # ── Notify artist in real-time ────────────────────────────────────────────
    artist_user_id = artist.user_id
    _fire_notification(artist_user_id, {
        "type": "new_booking",
        "title": "New Booking Request!",
        "message": f"{current_user.name} has requested to book you for {booking_data.event_type} on {booking_data.event_date}",
        "booking_id": booking.id,
        "organizer_name": current_user.name,
        "event_type": booking_data.event_type,
        "event_date": booking_data.event_date,
        "venue": booking_data.venue,
        "budget": booking_data.budget,
    })
    logger.info(f"[BOOKING] New booking #{booking.id} by user {current_user.id} for artist {artist.id}")

    return enriched


# ── List Bookings ──────────────────────────────────────────────────────────────
@router.get("", response_model=List[BookingOut])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    elif current_user.role == "artist":
        profile = db.query(ArtistProfile).filter(ArtistProfile.user_id == current_user.id).first()
        if not profile:
            return []
        bookings = db.query(Booking).filter(Booking.artist_id == profile.id).order_by(Booking.created_at.desc()).all()
    else:
        bookings = db.query(Booking).filter(Booking.organizer_id == current_user.id).order_by(Booking.created_at.desc()).all()

    return [enrich_booking(b) for b in bookings]


# ── Get Single Booking ─────────────────────────────────────────────────────────
@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return enrich_booking(booking)


# ── Update Booking Status ──────────────────────────────────────────────────────
@router.put("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    update: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Artists can confirm / reject / complete their own bookings
    if current_user.role == "artist":
        profile = db.query(ArtistProfile).filter(ArtistProfile.user_id == current_user.id).first()
        if not profile or booking.artist_id != profile.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Organizers can cancel or mark complete
    elif current_user.role == "organizer":
        if booking.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        allowed = {BookingStatus.cancelled, BookingStatus.completed}
        if update.status not in allowed:
            raise HTTPException(status_code=403, detail="Organizers can only cancel or complete bookings")

    # Admin can do anything

    old_status = booking.status
    booking.status = update.status
    if update.artist_notes:
        booking.artist_notes = update.artist_notes

    db.commit()
    db.refresh(booking)
    enriched = enrich_booking(booking)

    # ── Notify the OTHER party of the status change ───────────────────────────
    status_label = update.status.value if hasattr(update.status, "value") else str(update.status)
    artist_user_id = booking.artist.user_id if booking.artist else None

    if current_user.role == "artist":
        # Notify organizer that artist responded
        notif = {
            "type": "booking_status_changed",
            "title": f"Booking {status_label.capitalize()}",
            "message": f"{booking.artist.user.name} has {status_label} your booking for {booking.event_type} on {booking.event_date}",
            "booking_id": booking.id,
            "status": status_label,
            "artist_notes": booking.artist_notes,
        }
        _fire_notification(booking.organizer_id, notif)

    elif current_user.role == "organizer" and artist_user_id:
        # Notify artist that organizer cancelled
        notif = {
            "type": "booking_status_changed",
            "title": f"Booking {status_label.capitalize()}",
            "message": f"{current_user.name} has {status_label} the booking for {booking.event_type} on {booking.event_date}",
            "booking_id": booking.id,
            "status": status_label,
        }
        _fire_notification(artist_user_id, notif)

    logger.info(f"[BOOKING] #{booking_id} status: {old_status} → {update.status} by user {current_user.id}")
    return enriched
