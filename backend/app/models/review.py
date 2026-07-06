from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("artist_profiles.id"), nullable=False)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    booking = relationship("Booking", back_populates="review")
    organizer = relationship("User", back_populates="reviews_given", foreign_keys=[organizer_id])
    artist = relationship("ArtistProfile", back_populates="reviews", foreign_keys=[artist_id])
