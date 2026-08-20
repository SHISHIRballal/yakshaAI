from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.jwt_handler import get_current_admin
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.list_users(db)


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.toggle_user_active(db, user_id)


@router.put("/artists/{artist_id}/verify")
def verify_artist(artist_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.verify_artist(db, artist_id)


@router.get("/analytics")
def get_analytics(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return admin_service.get_analytics(db)
