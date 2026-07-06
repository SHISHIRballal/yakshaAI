from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PerformanceStyle(str, enum.Enum):
    badagu_tittu = "Badagu Tittu"
    tenkutittu = "Tenkutittu"
    both = "Both"


class ArtistProfile(Base):
    __tablename__ = "artist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    performance_style = Column(Enum(PerformanceStyle), default=PerformanceStyle.badagu_tittu)
    specialization = Column(String(200), nullable=True)  # e.g., Bhagavata, Veshadhara
    experience_years = Column(Integer, default=0)
    location = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), default="Karnataka")
    pricing_per_event = Column(Float, default=10000.0)
    is_verified = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    profile_photo_url = Column(String(500), nullable=True)
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    total_bookings = Column(Integer, default=0)
    languages = Column(String(200), default="Kannada")
    event_types = Column(String(500), nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="artist_profile")
    bookings = relationship("Booking", back_populates="artist", foreign_keys="Booking.artist_id")
    reviews = relationship("Review", back_populates="artist", foreign_keys="Review.artist_id")
    availability = relationship("Availability", back_populates="artist")
