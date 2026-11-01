import hashlib
from app.config import settings


def hash_ip(ip: str) -> str:
    """
    Hash an IP address with a secret salt (SHA-256).
    This allows counting unique visitors without storing raw IPs (GDPR-friendly).
    """
    raw = f"{ip}{settings.IP_HASH_SALT}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
