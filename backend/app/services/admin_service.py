from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.artist import ArtistProfile
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.core.exceptions import NotFoundException, BadRequestException

def list_users(db: Session) -> list:
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "phone": u.phone,
        }
        for u in users
    ]

def toggle_user_active(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException(detail="User not found")
    if user.role == UserRole.admin:
        raise BadRequestException(detail="Cannot deactivate admin")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

def verify_artist(db: Session, artist_id: int) -> dict:
    artist = db.query(ArtistProfile).filter(ArtistProfile.id == artist_id).first()
    if not artist:
        raise NotFoundException(detail="Artist not found")
    artist.is_verified = not artist.is_verified
    db.commit()
    return {"message": f"Artist {'verified' if artist.is_verified else 'unverified'}", "is_verified": artist.is_verified}

def get_analytics(db: Session) -> dict:
    total_users = db.query(User).count()
    total_artists = db.query(ArtistProfile).count()
    verified_artists = db.query(ArtistProfile).filter(ArtistProfile.is_verified == True).count()
    total_organizers = db.query(User).filter(User.role == UserRole.organizer).count()
    total_bookings = db.query(Booking).count()
    total_reviews = db.query(Review).count()
    
    pending = db.query(Booking).filter(Booking.status == BookingStatus.pending).count()
    confirmed = db.query(Booking).filter(Booking.status == BookingStatus.confirmed).count()
    completed = db.query(Booking).filter(Booking.status == BookingStatus.completed).count()
    rejected = db.query(Booking).filter(Booking.status == BookingStatus.rejected).count()
    
    city_dist = db.query(ArtistProfile.city, func.count(ArtistProfile.id)).group_by(ArtistProfile.city).all()
    style_dist = db.query(ArtistProfile.performance_style, func.count(ArtistProfile.id)).group_by(ArtistProfile.performance_style).all()
    
    return {
        "total_users": total_users,
        "total_artists": total_artists,
        "verified_artists": verified_artists,
        "total_organizers": total_organizers,
        "total_bookings": total_bookings,
        "total_reviews": total_reviews,
        "booking_status": {
            "pending": pending,
            "confirmed": confirmed,
            "completed": completed,
            "rejected": rejected,
        },
        "city_distribution": [{"city": c or "Unknown", "count": cnt} for c, cnt in city_dist],
        "style_distribution": [{"style": s.value if s else "Unknown", "count": cnt} for s, cnt in style_dist],
    }
