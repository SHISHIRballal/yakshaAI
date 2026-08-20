import asyncio
import logging
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus
from app.models.artist import ArtistProfile
from app.models.user import User
from app.models.availability import Availability
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from app.websocket_manager import manager
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException

logger = logging.getLogger("yakshagai.bookings")

def enrich_booking(b: Booking) -> dict:
    return {
        "id": b.id,
        "organizer_id": b.organizer_id,
        "artist_id": b.artist_id,
        "event_date": b.event_date,
        "event_type": b.event_type,
        "venue": b.venue,
        "venue_city": b.venue_city,
        "venue_map_link": b.venue_map_link,
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

def fire_notification(user_id: int, payload: dict):
    try:
        asyncio.run(manager.send_to_user(user_id, payload))
    except Exception as exc:
        logger.warning(f"[WS] Notification to user {user_id} failed: {exc}")

def create_booking(db: Session, current_user: User, booking_data: BookingCreate) -> dict:
    if current_user.role == "admin":
        raise ForbiddenException(detail="Admins cannot create bookings")

    artist = db.query(ArtistProfile).filter(ArtistProfile.id == booking_data.artist_id).first()
    if not artist:
        raise NotFoundException(detail="Artist not found")

    if current_user.role == "artist" and artist.user_id == current_user.id:
        raise BadRequestException(detail="Cannot book yourself")

    blocked = db.query(Availability).filter(
        Availability.artist_id == booking_data.artist_id,
        Availability.date == booking_data.event_date,
        Availability.is_available == False,
    ).first()
    if blocked:
        note = f" Note: {blocked.note}" if blocked.note else ""
        raise BadRequestException(
            detail=f"Artist is not available on {booking_data.event_date}.{note} Please choose a different date."
        )

    booking = Booking(
        organizer_id=current_user.id,
        artist_id=booking_data.artist_id,
        event_date=booking_data.event_date,
        event_type=booking_data.event_type,
        venue=booking_data.venue,
        venue_city=booking_data.venue_city,
        venue_map_link=booking_data.venue_map_link,
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

    artist_user_id = artist.user_id
    fire_notification(artist_user_id, {
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

def list_bookings(db: Session, current_user: User) -> list:
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

def get_booking(db: Session, booking_id: int, current_user: User) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise NotFoundException(detail="Booking not found")
    return enrich_booking(booking)

def update_booking_status(
    db: Session,
    booking_id: int,
    update: BookingStatusUpdate,
    current_user: User
) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise NotFoundException(detail="Booking not found")

    if current_user.role == "artist":
        profile = db.query(ArtistProfile).filter(ArtistProfile.user_id == current_user.id).first()
        if not profile or booking.artist_id != profile.id:
            raise ForbiddenException(detail="Not authorized")

    elif current_user.role == "organizer":
        if booking.organizer_id != current_user.id:
            raise ForbiddenException(detail="Not authorized")
        allowed = {BookingStatus.cancelled, BookingStatus.completed}
        if update.status not in allowed:
            raise ForbiddenException(detail="Organizers can only cancel or complete bookings")

    old_status = booking.status
    booking.status = update.status
    if update.artist_notes:
        booking.artist_notes = update.artist_notes

    db.commit()
    db.refresh(booking)
    enriched = enrich_booking(booking)

    status_label = update.status.value if hasattr(update.status, "value") else str(update.status)
    artist_user_id = booking.artist.user_id if booking.artist else None

    if current_user.role == "artist":
        notif = {
            "type": "booking_status_changed",
            "title": f"Booking {status_label.capitalize()}",
            "message": f"{booking.artist.user.name} has {status_label} your booking for {booking.event_type} on {booking.event_date}",
            "booking_id": booking.id,
            "status": status_label,
            "artist_notes": booking.artist_notes,
        }
        fire_notification(booking.organizer_id, notif)

    elif current_user.role == "organizer" and artist_user_id:
        notif = {
            "type": "booking_status_changed",
            "title": f"Booking {status_label.capitalize()}",
            "message": f"{current_user.name} has {status_label} the booking for {booking.event_type} on {booking.event_date}",
            "booking_id": booking.id,
            "status": status_label,
        }
        fire_notification(artist_user_id, notif)

    logger.info(f"[BOOKING] #{booking_id} status: {old_status} → {update.status} by user {current_user.id}")
    return enriched
