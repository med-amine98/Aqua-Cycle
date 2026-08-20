from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Base de données
    DATABASE_URL: str = "sqlite:///./aquacycle.db"
    
    # Sécurité
    SECRET_KEY: str = "AQ.Ab8RN6LK11gQQyxeWBQT87vZTn43yUQDrnZemlMzoOcyoSo1rg"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Services externes
    REDIS_URL: str = "redis://localhost:6379"
    OPENWEATHER_API_KEY: str = ""
    SATELLITE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    NVIDIA_API_KEY: Optional[str] = None  # NVIDIA Earth-2 (free at build.nvidia.com)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # ← Ignorer les champs supplémentaires

settings = Settings()