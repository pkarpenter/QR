import logging
from typing import Optional
import httpx
from jose import JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

_JWKS_CACHE = None


def get_jwks():
    global _JWKS_CACHE
    if _JWKS_CACHE is None:
        try:
            url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            resp = httpx.get(url, timeout=5.0)
            if resp.status_code == 200:
                _JWKS_CACHE = resp.json()
        except Exception as e:
            logger.warning(f"Failed to fetch JWKS: {e}")
    return _JWKS_CACHE


def verify_supabase_jwt(token: str) -> Optional[dict]:
    """
    Verify a Supabase-issued JWT using the project's JWT secret (HS256)
    or Supabase's JWKS (ES256 asymmetric keys).
    Returns the decoded payload dict or None if invalid/expired.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            jwks = get_jwks()
            if jwks:
                return jwt.decode(
                    token,
                    jwks,
                    algorithms=["ES256"],
                    options={"verify_aud": False},
                )

        # Fallback / HS256 verification
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as e:
        logger.debug(f"JWT verification failed: {e}")
        return None

