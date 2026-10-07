from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  # the backend/ folder


class Settings(BaseSettings):
    """App configuration. Every field can be overridden by an env var or backend/.env."""

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    app_name: str = "Fireflies Clone API"
    database_url: str = f"sqlite:///{BASE_DIR / 'fireflies.db'}"
    # Comma-separated list of origins allowed to call the API from a browser.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    media_dir: Path = BASE_DIR / "media"
    seed_on_startup: bool = True

    # No real auth: every request is treated as coming from this user.
    default_user_name: str = "Alex Morgan"
    default_user_email: str = "alex.morgan@example.com"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
