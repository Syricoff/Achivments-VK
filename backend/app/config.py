import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "VK Mini App Лампа 2026"
    ENV: str = "development"
    DEBUG: bool = True
    
    # VK Mini App Settings
    VK_APP_ID: int = 0
    VK_APP_SECRET: str = "test_vk_secret_key"
    ADMIN_VK_IDS: List[int] = []
    
    # Database
    # Default to SQLite for easy zero-setup local running, PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lampa.db")
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    BASE_URL: str = "http://localhost:8000"
    
    # Timezone
    TIMEZONE: str = "Europe/Moscow"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
