import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"

    # Database
    database_url: str = "postgresql+asyncpg://neondb_owner:password@localhost:5432/neondb"

    # Cache
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 259200  # 72 hours

    # YouTube
    youtube_api_key: str = ""
    youtube_fetch_limit: int = 200

    # Amazon
    amazon_provider: str = "rainforest"
    rainforest_api_key: str = ""
    oxylabs_username: str = ""
    oxylabs_password: str = ""

    # AI
    groq_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    summary_model: str = "claude"

    # Email
    resend_api_key: str = ""

    # Monitoring
    sentry_dsn: str = ""

    # Feature flags
    refresh_pause: bool = False

    class Config:
        env_file = "/Users/tusway/TrustLens/backend/.env"
        case_sensitive = False

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_dev(self) -> bool:
        return self.environment == "development"

    @property
    def is_prod(self) -> bool:
        return self.environment == "production"


settings = Settings()
