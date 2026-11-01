from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

_config_dir = Path(__file__).resolve().parent
_candidates = [
    Path.cwd() / ".env",
    _config_dir.parent / ".env",
    _config_dir.parent.parent / ".env",
    _config_dir.parent.parent.parent / ".env",
]
_env_file = next((str(p) for p in _candidates if p.exists()), ".env")


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Security
    IP_HASH_SALT: str = "change-me-random-long-string"

    # App URLs
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    ADMIN_ORIGIN: str = "http://localhost:5173"

    # GeoIP
    GEOIP_DB_PATH: str = "GeoLite2-City.mmdb"

    class Config:
        env_file = _env_file
        case_sensitive = True
        extra = "ignore"



@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
