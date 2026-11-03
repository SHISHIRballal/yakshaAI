import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl

from app.database import get_db
from app.models.user import User
from app.models.artist import ArtistProfile
from app.utils.jwt_handler import get_current_user

logger = logging.getLogger("yakshagai.uploads")

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class PhotoUrlUpdate(BaseModel):
    photo_url: str


@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a profile picture for the authenticated user / artist.
    Saves image to static/uploads and updates artist_profile & user records.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to write uploaded image: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save image")

    photo_url = f"/static/uploads/{filename}"

    # Update User model
    current_user.profile_photo_url = photo_url

    # If user is an artist or has an artist profile, update it too
    artist = db.query(ArtistProfile).filter(ArtistProfile.user_id == current_user.id).first()
    if artist:
        artist.profile_photo_url = photo_url

    db.commit()
    db.refresh(current_user)

    logger.info(f"User {current_user.id} updated profile photo to {photo_url}")

    return {
        "url": photo_url,
        "filename": filename,
        "status": "success",
        "message": "Profile picture uploaded and updated successfully",
    }


@router.post("/profile-photo-url")
def update_profile_photo_url(
    payload: PhotoUrlUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set profile picture directly from an external image URL.
    """
    url = payload.photo_url.strip()
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL cannot be empty")

    current_user.profile_photo_url = url
    artist = db.query(ArtistProfile).filter(ArtistProfile.user_id == current_user.id).first()
    if artist:
        artist.profile_photo_url = url

    db.commit()
    return {
        "url": url,
        "status": "success",
        "message": "Profile picture URL updated successfully",
    }
