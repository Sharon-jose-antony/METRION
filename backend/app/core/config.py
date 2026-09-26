import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "METRION"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "metrion-super-secure-sih-2026-secret-key-32chars")
    REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET", "metrion-super-refresh-sih-2026-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database (defaults to local SQLite for instant zero-configuration demo, postgres in docker)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./metrion.db")
    
    # Storage
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")
    STORAGE_DIR: str = os.getenv(
        "STORAGE_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    )
    
    # URLs
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Compliance disclaimer
    DEMO_DISCLAIMER: str = (
        "DEMO CONFIGURATION — NOT A STATUTORY DETERMINATION. "
        "METRION digitizes the verification lifecycle around statutory verification by authorized LMOs/GATCs."
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
