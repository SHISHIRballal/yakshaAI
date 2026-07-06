from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    artist_id = Column(Integer, ForeignKey("artist_profiles.id"), nullable=False)
    date = Column(String(20), nullable=False)  # YYYY-MM-DD
    is_available = Column(Boolean, default=True)
    note = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    artist = relationship("ArtistProfile", back_populates="availability")
