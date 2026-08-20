"""Bookings router — thin HTTP adapter delegating to booking_service."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, BookingStatusUpdate
from app.utils.jwt_handler import get_current_user
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return booking_service.create_booking(db, current_user, booking_data)


@router.get("", response_model=List[BookingOut])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return booking_service.list_bookings(db, current_user)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return booking_service.get_booking(db, booking_id, current_user)


@router.put("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    update: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return booking_service.update_booking_status(db, booking_id, update, current_user)
