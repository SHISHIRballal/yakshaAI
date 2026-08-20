from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    artist_id: int
    event_date: str  # YYYY-MM-DD
    event_type: str
    venue: str
    venue_city: Optional[str] = None
    venue_map_link: Optional[str] = None
    budget: float
    duration_hours: int = 4
    special_requirements: Optional[str] = None
    organizer_notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    artist_notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    organizer_id: int
    artist_id: int
    event_date: str
    event_type: str
    venue: str
    venue_city: Optional[str] = None
    venue_map_link: Optional[str] = None
    budget: float
    duration_hours: int
    special_requirements: Optional[str] = None
    status: BookingStatus
    organizer_notes: Optional[str] = None
    artist_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    # Nested info
    organizer_name: Optional[str] = None
    artist_name: Optional[str] = None
    artist_photo: Optional[str] = None
    artist_id_user: Optional[int] = None

    class Config:
        from_attributes = True
