import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request

from app.config import settings
from app.database import supabase

logger = logging.getLogger(__name__)

try:
    import user_agents as ua_module
    UA_AVAILABLE = True
except ImportError:
    UA_AVAILABLE = False

try:
    import geoip2.database
    import geoip2.errors
    _geo_reader = None
    try:
        _geo_reader = geoip2.database.Reader(settings.GEOIP_DB_PATH)
    except Exception:
        pass
    GEO_AVAILABLE = _geo_reader is not None
except ImportError:
    GEO_AVAILABLE = False
    _geo_reader = None


def _hash_ip(ip: str) -> str:
    """Hash IP with a secret salt using SHA-256 for privacy."""
    return hashlib.sha256(f"{ip}{settings.IP_HASH_SALT}".encode()).hexdigest()


def _parse_user_agent(ua_string: str) -> tuple[str, str, str]:
    """Return (device_type, os_family, browser_family)."""
    if not UA_AVAILABLE or not ua_string:
        return "Unknown", "Unknown", "Unknown"
    ua = ua_module.parse(ua_string)
    device = "Mobile" if ua.is_mobile else ("Tablet" if ua.is_tablet else "Desktop")
    return device, ua.os.family or "Unknown", ua.browser.family or "Unknown"


def _get_geo(ip: str) -> tuple[Optional[str], Optional[str]]:
    """Return (country_name, city_name) from GeoLite2 DB."""
    if not GEO_AVAILABLE or not _geo_reader or ip in ("127.0.0.1", "::1", "testclient"):
        return None, None
    try:
        resp = _geo_reader.city(ip)
        return resp.country.name, resp.city.name
    except Exception:
        return None, None


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, handling reverse proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def log_scan(link: dict, request: Request) -> None:
    """
    Fire-and-forget scan logger.
    Parses UA + GeoIP, hashes IP, then inserts into scans table.
    """
    try:
        ip = _get_client_ip(request)
        ua_string = request.headers.get("user-agent", "")
        referrer = request.headers.get("referer") or request.headers.get("referrer")

        device, os_name, browser = _parse_user_agent(ua_string)
        country, city = _get_geo(ip)
        ip_hash = _hash_ip(ip)

        row = {
            "qr_id": link["qr_id"],
            "link_id": link["id"],
            "scanned_at": datetime.now(timezone.utc).isoformat(),
            "device": device,
            "os": os_name,
            "browser": browser,
            "country": country,
            "city": city,
            "ip_hash": ip_hash,
            "referrer": referrer,
        }
        supabase.table("scans").insert(row).execute()
    except Exception as e:
        logger.warning(f"log_scan failed: {e}")
