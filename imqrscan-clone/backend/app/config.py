from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

_config_dir = Path(__file__).resolve().parent
# Prefer the repository-root .env (as documented in the README) over any
# backend-local .env. This matters because the backend is started from the
# `backend/` directory, which would otherwise shadow the real root .env.
_candidates = [
    _config_dir.parent.parent.parent / ".env",  # repo root .env
    _config_dir.parent / ".env",                # backend/.env fallback
    _config_dir.parent.parent / ".env",         # imqrscan-clone/.env
    Path.cwd() / ".env",                        # current working directory
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
