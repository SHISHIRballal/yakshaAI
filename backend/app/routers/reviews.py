from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut
from app.utils.jwt_handler import get_current_user
from app.services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.create_review(db, current_user, review_data)


@router.get("/artist/{artist_id}", response_model=List[ReviewOut])
def get_artist_reviews(artist_id: int, db: Session = Depends(get_db)):
    return review_service.get_artist_reviews(db, artist_id)


@router.get("/booking/{booking_id}")
def get_review_by_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if a review exists for a specific booking."""
    return review_service.get_review_by_booking(db, booking_id, current_user)
