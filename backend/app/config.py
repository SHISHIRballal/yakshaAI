from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Security
    SECRET_KEY: str = "yakshagana-ai-secret-key-2024-ultra-secure-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database — SQLite locally, PostgreSQL (Neon) in production
    DATABASE_URL: str = "sqlite:///./yakshaai.db"

    # Admin
    ADMIN_EMAIL: str = "admin@yakshagai.com"
    ADMIN_PASSWORD: str = "Admin@1234"

    # AI — Groq API (server-side proxy for chatbot)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # App
    DEBUG: bool = False
    APP_NAME: str = "YakshaAI"
    APP_VERSION: str = "1.0.0"

    # CORS — In production set CORS_ORIGINS env var to your Vercel URL
    # Accepts comma-delimited string: CORS_ORIGINS=https://yaksha-ai.vercel.app,https://yakshagana.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Accept comma-delimited string or list for CORS_ORIGINS."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
