from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.artist import ArtistProfile, PerformanceStyle
from app.models.user import User
from app.models.availability import Availability
from app.schemas.artist import ArtistOut, ArtistListOut, ArtistProfileUpdate
from app.utils.jwt_handler import get_current_user, get_current_artist

router = APIRouter(prefix="/artists", tags=["Artists"])


def enrich_artist(artist: ArtistProfile) -> dict:
    data = {
        "id": artist.id,
        "user_id": artist.user_id,
        "bio": artist.bio,
        "performance_style": artist.performance_style,
        "specialization": artist.specialization,
        "experience_years": artist.experience_years,
        "location": artist.location,
        "city": artist.city,
        "state": artist.state,
        "pricing_per_event": artist.pricing_per_event,
        "is_verified": artist.is_verified,
        "is_available": artist.is_available,
        "profile_photo_url": artist.profile_photo_url,
        "avg_rating": artist.avg_rating,
        "total_reviews": artist.total_reviews,
        "total_bookings": artist.total_bookings,
        "languages": artist.languages,
        "event_types": artist.event_types,
        "user_name": artist.user.name if artist.user else None,
        "user_email": artist.user.email if artist.user else None,
        "created_at": artist.created_at,
    }
    return data


@router.get("", response_model=List[ArtistListOut])
def list_artists(
    city: Optional[str] = Query(None),
    performance_style: Optional[PerformanceStyle] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_experience: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(ArtistProfile).join(User)
    
    if city:
        query = query.filter(ArtistProfile.city.ilike(f"%{city}%"))
    if performance_style:
        query = query.filter(ArtistProfile.performance_style == performance_style)
    if min_rating is not None:
        query = query.filter(ArtistProfile.avg_rating >= min_rating)
    if max_price is not None:
        query = query.filter(ArtistProfile.pricing_per_event <= max_price)
    if min_experience is not None:
        query = query.filter(ArtistProfile.experience_years >= min_experience)
    if is_verified is not None:
        query = query.filter(ArtistProfile.is_verified == is_verified)
    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") |
            ArtistProfile.specialization.ilike(f"%{search}%") |
            ArtistProfile.city.ilike(f"%{search}%")
        )
    
    artists = query.offset(skip).limit(limit).all()
    result = []
    for a in artists:
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "bio": a.bio,
            "performance_style": a.performance_style,
            "specialization": a.specialization,
            "experience_years": a.experience_years,
            "city": a.city,
            "state": a.state,
            "pricing_per_event": a.pricing_per_event,
            "is_verified": a.is_verified,
            "is_available": a.is_available,
            "profile_photo_url": a.profile_photo_url,
            "avg_rating": a.avg_rating,
            "total_reviews": a.total_reviews,
            "total_bookings": a.total_bookings,
            "user_name": a.user.name if a.user else None,
        })
    return result


@router.get("/{artist_id}", response_model=ArtistOut)
def get_artist(artist_id: int, db: Session = Depends(get_db)):
    artist = db.query(ArtistProfile).filter(ArtistProfile.id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return enrich_artist(artist)


@router.put("/{artist_id}", response_model=ArtistOut)
def update_artist(
    artist_id: int,
    update_data: ArtistProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    artist = db.query(ArtistProfile).filter(ArtistProfile.id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Only allow the artist themselves or admin
    if current_user.role != "admin" and artist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(artist, field, value)
    
    db.commit()
    db.refresh(artist)
    return enrich_artist(artist)


@router.get("/{artist_id}/availability")
def get_availability(artist_id: int, month: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get artist availability. month format: YYYY-MM"""
    query = db.query(Availability).filter(Availability.artist_id == artist_id)
    if month:
        query = query.filter(Availability.date.startswith(month))
    slots = query.all()
    return [{"date": s.date, "is_available": s.is_available, "note": s.note} for s in slots]


@router.put("/{artist_id}/availability")
def update_availability(
    artist_id: int,
    dates: List[dict],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update availability. dates: [{"date": "YYYY-MM-DD", "is_available": bool}]"""
    artist = db.query(ArtistProfile).filter(ArtistProfile.id == artist_id).first()
    if not artist or artist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for slot in dates:
        existing = db.query(Availability).filter(
            Availability.artist_id == artist_id,
            Availability.date == slot["date"]
        ).first()
        if existing:
            existing.is_available = slot.get("is_available", True)
        else:
            db.add(Availability(
                artist_id=artist_id,
                date=slot["date"],
                is_available=slot.get("is_available", True),
            ))
    db.commit()
    return {"message": "Availability updated"}
