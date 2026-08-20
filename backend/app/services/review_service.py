from sqlalchemy.orm import Session
from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.artist import ArtistProfile
from app.models.user import User
from app.schemas.review import ReviewCreate
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException

def create_review(db: Session, current_user: User, review_data: ReviewCreate) -> dict:
    if not 1.0 <= review_data.rating <= 5.0:
        raise BadRequestException(detail="Rating must be between 1 and 5")
    
    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise NotFoundException(detail="Booking not found")
    if booking.organizer_id != current_user.id:
        raise ForbiddenException(detail="Can only review your own bookings")
    if booking.status != BookingStatus.completed:
        raise BadRequestException(detail="Can only review completed bookings")
    
    existing = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing:
        raise BadRequestException(detail="Review already submitted for this booking")
    
    review = Review(
        booking_id=review_data.booking_id,
        organizer_id=current_user.id,
        artist_id=booking.artist_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    
    artist = db.query(ArtistProfile).filter(ArtistProfile.id == booking.artist_id).first()
    if artist:
        all_reviews = db.query(Review).filter(Review.artist_id == artist.id).all()
        total = sum(r.rating for r in all_reviews) + review_data.rating
        count = len(all_reviews) + 1
        artist.avg_rating = round(total / count, 1)
        artist.total_reviews = count
    
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "organizer_id": review.organizer_id,
        "artist_id": review.artist_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "organizer_name": current_user.name,
    }

def get_artist_reviews(db: Session, artist_id: int) -> list:
    reviews = db.query(Review).filter(Review.artist_id == artist_id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "booking_id": r.booking_id,
            "organizer_id": r.organizer_id,
            "artist_id": r.artist_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "organizer_name": r.organizer.name if r.organizer else "Anonymous",
        })
    return result

def get_review_by_booking(db: Session, booking_id: int, current_user: User) -> dict:
    review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if not review:
        raise NotFoundException(detail="No review found for this booking")
    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "artist_id": review.artist_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "organizer_name": review.organizer.name if review.organizer else "Anonymous",
        "organizer_id": review.organizer_id,
    }
