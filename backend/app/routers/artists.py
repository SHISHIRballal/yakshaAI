from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.artist import PerformanceStyle
from app.models.user import User
from app.schemas.artist import ArtistOut, ArtistListOut, ArtistProfileUpdate
from app.utils.jwt_handler import get_current_user
from app.services import artist_service

router = APIRouter(prefix="/artists", tags=["Artists"])


@router.get("")
def list_artists(
    city: Optional[str] = Query(None),
    performance_style: Optional[PerformanceStyle] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_experience: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    return artist_service.list_artists(
        db, city=city, performance_style=performance_style, min_rating=min_rating,
        max_price=max_price, min_experience=min_experience, is_verified=is_verified,
        search=search, cursor=cursor, skip=skip, limit=limit
    )


@router.get("/{artist_id}", response_model=ArtistOut)
def get_artist(artist_id: int, db: Session = Depends(get_db)):
    return artist_service.get_artist(db, artist_id)


@router.put("/{artist_id}", response_model=ArtistOut)
def update_artist(
    artist_id: int,
    update_data: ArtistProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return artist_service.update_artist(db, artist_id, update_data, current_user)


@router.get("/{artist_id}/availability")
def get_availability(artist_id: int, month: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get artist availability. month format: YYYY-MM"""
    return artist_service.get_availability(db, artist_id, month)


@router.put("/{artist_id}/availability")
def update_availability(
    artist_id: int,
    dates: List[dict],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update availability. dates: [{"date": "YYYY-MM-DD", "is_available": bool}]"""
    return artist_service.update_availability(db, artist_id, dates, current_user)
