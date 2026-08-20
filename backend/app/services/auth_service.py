from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.user import User, UserRole
from app.models.artist import ArtistProfile
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.config import settings
from app.core.exceptions import ConflictException, UnauthorizedException, ForbiddenException

def register_user(db: Session, user_data: UserCreate) -> Token:
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise ConflictException(detail="Email already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    if user_data.role == UserRole.artist:
        profile = ArtistProfile(user_id=user.id)
        db.add(profile)
        db.commit()
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, user=UserOut.model_validate(user))

def login_user(db: Session, credentials: UserLogin) -> Token:
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise UnauthorizedException(detail="Invalid email or password")
    if not user.is_active:
        raise ForbiddenException(detail="Account is deactivated")
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, user=UserOut.model_validate(user))
