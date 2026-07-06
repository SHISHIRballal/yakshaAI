from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.artist import PerformanceStyle


class ArtistProfileCreate(BaseModel):
    bio: Optional[str] = None
    performance_style: PerformanceStyle = PerformanceStyle.badagu_tittu
    specialization: Optional[str] = None
    experience_years: int = 0
    location: Optional[str] = None
    city: Optional[str] = None
    state: str = "Karnataka"
    pricing_per_event: float = 10000.0
    profile_photo_url: Optional[str] = None
    languages: str = "Kannada"
    event_types: Optional[str] = None


class ArtistProfileUpdate(BaseModel):
    bio: Optional[str] = None
    performance_style: Optional[PerformanceStyle] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    city: Optional[str] = None
    pricing_per_event: Optional[float] = None
    profile_photo_url: Optional[str] = None
    languages: Optional[str] = None
    event_types: Optional[str] = None
    is_available: Optional[bool] = None


class ArtistOut(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    performance_style: PerformanceStyle
    specialization: Optional[str] = None
    experience_years: int
    location: Optional[str] = None
    city: Optional[str] = None
    state: str
    pricing_per_event: float
    is_verified: bool
    is_available: bool
    profile_photo_url: Optional[str] = None
    avg_rating: float
    total_reviews: int
    total_bookings: int
    languages: str
    event_types: Optional[str] = None
    # Nested user info
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ArtistListOut(BaseModel):
    id: int
    user_id: int
    performance_style: PerformanceStyle
    specialization: Optional[str] = None
    experience_years: int
    city: Optional[str] = None
    state: str
    pricing_per_event: float
    is_verified: bool
    is_available: bool
    profile_photo_url: Optional[str] = None
    avg_rating: float
    total_reviews: int
    total_bookings: int
    user_name: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True
