from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.artist import ArtistProfile
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendedArtist
from app.ml.recommender import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse)
def recommend_artists(request: RecommendationRequest, db: Session = Depends(get_db)):
    """AI-powered artist recommendations based on preferences."""
    artists = db.query(ArtistProfile).join(User).filter(ArtistProfile.is_available == True).all()
    
    results = get_recommendations(
        artists=artists,
        budget=request.budget,
        city=request.city,
        event_type=request.event_type,
        performance_style=request.performance_style,
        min_experience=request.min_experience,
        min_rating=request.min_rating,
        limit=request.limit,
    )
    
    recommended = []
    for r in results:
        a = r["artist"]
        recommended.append(RecommendedArtist(
            id=a.id,
            user_name=a.user.name if a.user else "Unknown",
            city=a.city,
            state=a.state,
            performance_style=a.performance_style,
            specialization=a.specialization,
            experience_years=a.experience_years,
            pricing_per_event=a.pricing_per_event,
            avg_rating=a.avg_rating,
            total_reviews=a.total_reviews,
            is_verified=a.is_verified,
            profile_photo_url=a.profile_photo_url,
            match_score=r["match_score"],
            match_reasons=r["match_reasons"],
            bio=a.bio,
        ))
    
    return RecommendationResponse(artists=recommended, total=len(recommended))
