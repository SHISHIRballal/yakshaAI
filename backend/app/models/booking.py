from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    completed = "completed"
    cancelled = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("artist_profiles.id"), nullable=False)
    event_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    event_type = Column(String(100), nullable=False)
    venue = Column(String(300), nullable=False)
    venue_city = Column(String(100), nullable=True)
    budget = Column(Float, nullable=False)
    duration_hours = Column(Integer, default=4)
    special_requirements = Column(Text, nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.pending)
    organizer_notes = Column(Text, nullable=True)
    artist_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organizer = relationship("User", back_populates="bookings_as_organizer", foreign_keys=[organizer_id])
    artist = relationship("ArtistProfile", back_populates="bookings", foreign_keys=[artist_id])
    review = relationship("Review", back_populates="booking", uselist=False)
