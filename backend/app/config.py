from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "yakshagana-ai-secret-key-2024-ultra-secure-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./yakshaai.db"

    # Admin
    ADMIN_EMAIL: str = "admin@yakshagai.com"
    ADMIN_PASSWORD: str = "Admin@1234"

    # App
    DEBUG: bool = True
    APP_NAME: str = "YakshaAI"
    APP_VERSION: str = "1.0.0"

    # CORS — comma-separated origins in .env, e.g. CORS_ORIGINS=http://localhost:5173,https://yakshagai.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
