from pydantic import BaseModel
from typing import Optional, List
from app.models.artist import PerformanceStyle


class RecommendationRequest(BaseModel):
    budget: float
    city: Optional[str] = None
    event_type: Optional[str] = None
    performance_style: Optional[PerformanceStyle] = None
    min_experience: int = 0
    min_rating: float = 0.0
    limit: int = 6


class RecommendedArtist(BaseModel):
    id: int
    user_name: str
    city: Optional[str]
    state: str
    performance_style: PerformanceStyle
    specialization: Optional[str]
    experience_years: int
    pricing_per_event: float
    avg_rating: float
    total_reviews: int
    is_verified: bool
    profile_photo_url: Optional[str]
    match_score: float
    match_reasons: List[str]
    bio: Optional[str]

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    artists: List[RecommendedArtist]
    total: int
