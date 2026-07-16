from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    booking_id: int
    artist_id: Optional[int] = None  # ignored — derived from booking, kept for frontend compatibility
    rating: float  # 1.0 - 5.0
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    booking_id: int
    organizer_id: int
    artist_id: int
    rating: float
    comment: Optional[str] = None
    created_at: Optional[datetime] = None
    organizer_name: Optional[str] = None

    class Config:
        from_attributes = True
