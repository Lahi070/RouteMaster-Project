"""Configuration settings for the Sri Lanka Travel Recommendation API."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application Settings
    APP_NAME: str = "Sri Lanka Travel Recommendation API"
    DEBUG: bool = False
    DATA_FILE_PATH: str = "data.json"

    # Database Configuration
    DATABASE_URL: str

    # Security & JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # n8n Webhook
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/fcaa4f16-b17f-4fc0-af5a-133cb368428b"

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
