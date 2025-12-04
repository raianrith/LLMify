"""Application configuration."""
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pydantic_settings import BaseSettings
from functools import lru_cache


# Appleton, Wisconsin timezone (Central Time)
APP_TIMEZONE = ZoneInfo("America/Chicago")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite:///./llm_visibility.db"
    
    # JWT
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # LLM API Keys
    openai_api_key: str = ""
    gemini_api_key: str = ""
    perplexity_api_key: str = ""
    
    # OAuth Settings (Google)
    google_client_id: str = ""
    google_client_secret: str = ""
    backend_url: str = "http://localhost:8000"  # Backend URL for OAuth callback
    frontend_url: str = "http://localhost:3000"  # Frontend URL for redirects
    
    # Application
    app_name: str = "LLM Search Visibility Tool"
    debug: bool = True
    timezone: str = "America/Chicago"  # Appleton, Wisconsin
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def get_current_time() -> datetime:
    """Get current time in app timezone (Central Time)."""
    return datetime.now(APP_TIMEZONE)


def to_local_time(dt: datetime) -> datetime:
    """Convert a datetime to app timezone (Central Time)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume UTC if no timezone
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(APP_TIMEZONE)

