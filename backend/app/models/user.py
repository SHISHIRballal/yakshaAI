from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    organizer = "organizer"
    artist = "artist"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.organizer, nullable=False)
    phone = Column(String(20), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    artist_profile = relationship("ArtistProfile", back_populates="user", uselist=False)
    bookings_as_organizer = relationship("Booking", back_populates="organizer", foreign_keys="Booking.organizer_id")
    reviews_given = relationship("Review", back_populates="organizer", foreign_keys="Review.organizer_id")
