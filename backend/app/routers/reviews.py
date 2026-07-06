from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.artist import ArtistProfile
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not 1.0 <= review_data.rating <= 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only review your own bookings")
    if booking.status != BookingStatus.completed:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    existing = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted for this booking")
    
    review = Review(
        booking_id=review_data.booking_id,
        organizer_id=current_user.id,
        artist_id=booking.artist_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    
    # Update artist avg rating
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


@router.get("/artist/{artist_id}", response_model=List[ReviewOut])
def get_artist_reviews(artist_id: int, db: Session = Depends(get_db)):
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


@router.get("/booking/{booking_id}")
def get_review_by_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if a review exists for a specific booking (used by frontend to show/hide review button)."""
    review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review found for this booking")
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
