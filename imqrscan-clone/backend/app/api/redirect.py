import time
from collections import defaultdict
from fastapi import APIRouter, BackgroundTasks, Request, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from app.services.link_service import get_active_link
from app.services.scan_service import log_scan
from app.services.multi_link_service import get_multi_link_config
from app.database import supabase
from app.utils.hashing import hash_ip

router = APIRouter(tags=["Redirect"])

# Simple in-memory sliding window rate limiter: 60 requests per minute per IP hash
_RATE_LIMIT_WINDOW = 60  # seconds
_RATE_LIMIT_MAX = 60     # max requests per window
_ip_requests = defaultdict(list)


def is_rate_limited(ip_hash: str) -> bool:
    now = time.time()
    timestamps = _ip_requests[ip_hash]
    _ip_requests[ip_hash] = [t for t in timestamps if now - t < _RATE_LIMIT_WINDOW]
    if len(_ip_requests[ip_hash]) >= _RATE_LIMIT_MAX:
        return True
    _ip_requests[ip_hash].append(now)
    return False


UNAVAILABLE_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Link Unavailable — IMPRscan</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
      background: #0f1016; color: #f1f2f7; text-align: center; padding: 1.5rem;
    }
    .card {
      background: #161822; border: 1px solid #262938; border-radius: 1rem;
      padding: 3rem 2rem; max-width: 440px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .icon {
      width: 56px; height: 56px; border-radius: 50%; background: rgba(99, 102, 241, 0.15);
      color: #6366f1; display: inline-flex; align-items: center; justify-content: center;
      font-size: 1.75rem; margin-bottom: 1.5rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { color: #9095a8; font-size: 0.95rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔗</div>
    <h1>Link Unavailable</h1>
    <p>This QR code is currently inactive or has no destination assigned.<br/>
       Please contact the organizer or owner for an updated link.</p>
  </div>
</body>
</html>
"""

RATE_LIMITED_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Too Many Requests</title>
  <style>
    body { font-family: sans-serif; background: #0f1016; color: #f1f2f7; text-align: center; padding-top: 15vh; }
  </style>
</head>
<body>
  <h1>429 — Too Many Requests</h1>
  <p>Please wait a moment before scanning again.</p>
</body>
</html>
"""


def render_multi_link_landing_page(qr_name: str, slug: str, links: list[dict]) -> str:
    links_html = ""
    for l in links:
        lid = l.get("id", "")
        title = l.get("title", "Link")
        url = l.get("url", "#")
        # Clean domain display
        domain = url.replace("https://", "").replace("http://", "").split("/")[0]

        links_html += f"""
        <a href="/go/{slug}?dest={lid}" class="bio-link-btn">
          <div class="bio-link-content">
            <span class="bio-link-name">{title}</span>
            <span class="bio-link-url">{domain}</span>
          </div>
          <div class="bio-link-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
        </a>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>{qr_name} — Choose Link</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 10%, #0d1e33 0%, #080c14 75%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }}
    .bio-wrapper {{
      max-width: 440px;
      width: 100%;
      background: rgba(18, 27, 45, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 28px;
      padding: 2.5rem 1.75rem;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(6, 182, 212, 0.12);
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeIn 0.3s ease-out;
    }}
    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(12px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}
    .bio-avatar-box {{
      width: 72px;
      height: 72px;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(245, 158, 11, 0.15));
      border: 1px solid rgba(6, 182, 212, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #06b6d4;
      font-size: 2rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 0 24px rgba(6, 182, 212, 0.25);
    }}
    .bio-title {{
      font-size: 1.45rem;
      font-weight: 800;
      color: #f8fafc;
      text-align: center;
      letter-spacing: -0.02em;
      margin-bottom: 0.35rem;
    }}
    .bio-subtitle {{
      font-size: 0.85rem;
      color: #94a3b8;
      text-align: center;
      margin-bottom: 1.75rem;
    }}
    .bio-links-grid {{
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      width: 100%;
    }}
    .bio-link-btn {{
      background: #0d1422;
      border: 1px solid #1f2d47;
      border-radius: 16px;
      padding: 1.1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-decoration: none;
      color: #f8fafc;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .bio-link-btn:hover, .bio-link-btn:active {{
      background: #121b2d;
      border-color: #06b6d4;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(6, 182, 212, 0.28);
    }}
    .bio-link-content {{
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }}
    .bio-link-name {{
      font-size: 1.05rem;
      font-weight: 700;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .bio-link-url {{
      font-size: 0.8rem;
      color: #06b6d4;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .bio-link-arrow {{
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      flex-shrink: 0;
      margin-left: 0.75rem;
      transition: all 0.2s;
    }}
    .bio-link-btn:hover .bio-link-arrow {{
      background: #06b6d4;
      color: #ffffff;
      transform: translateX(3px);
    }}
    .bio-footer {{
      margin-top: 2rem;
      font-size: 0.78rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }}
    .bio-footer span {{
      color: #06b6d4;
      font-weight: 600;
    }}
  </style>
</head>
<body>
  <div class="bio-wrapper">
    <div class="bio-avatar-box">🔗</div>
    <h1 class="bio-title">{qr_name}</h1>
    <p class="bio-subtitle">Choose a destination link to continue</p>

    <div class="bio-links-grid">
      {links_html}
    </div>

    <div class="bio-footer">
      Powered by <span>IMPRscan</span>
    </div>
  </div>
</body>
</html>
"""


@router.get("/go/{slug}", summary="Public dynamic QR redirect endpoint")
async def go(
    slug: str,
    request: Request,
    bg: BackgroundTasks,
    dest: str = Query(None, description="Specific destination link ID if chosen from multi-link page"),
    preview: bool = Query(False, description="Preview multi-link page in browser")
):
    """
    Public dynamic redirect endpoint:
    - If rate limited -> 429
    - Checks if QR is active
    - If multi-link mode is enabled and multiple links active -> serves the multi-link landing page
    - If specific destination is chosen or single-link mode -> performs instant 302 redirect & logs analytics
    """
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    ip_h = hash_ip(client_ip)
    if is_rate_limited(ip_h):
        return HTMLResponse(RATE_LIMITED_PAGE, status_code=429)

    # Resolve QR code
    try:
        qr_res = supabase.table("qr_codes").select("id, name, slug, is_enabled").eq("slug", slug).execute()
        if not qr_res.data:
            return HTMLResponse(UNAVAILABLE_PAGE, status_code=404)
        qr = qr_res.data[0]
        if not qr.get("is_enabled", True):
            return HTMLResponse(UNAVAILABLE_PAGE, status_code=404)
    except Exception:
        return HTMLResponse(UNAVAILABLE_PAGE, status_code=404)

    # 1. Handle destination selection from landing page
    if dest:
        try:
            link_res = supabase.table("links").select("id, url, title, qr_id").eq("id", dest).eq("qr_id", qr["id"]).execute()
            if link_res.data:
                target_link = link_res.data[0]
                bg.add_task(log_scan, target_link, request)
                return RedirectResponse(
                    url=target_link["url"],
                    status_code=302,
                    headers={
                        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                        "Pragma": "no-cache",
                    },
                )
        except Exception:
            pass

    # 2. Check multi-link settings
    multi_cfg = get_multi_link_config(qr["id"])
    active_ids = set(multi_cfg.get("active_link_ids") or [])
    is_multi = bool(multi_cfg.get("is_multi_link")) or len(active_ids) > 1

    if is_multi or preview:
        try:
            links_res = supabase.table("links").select("id, title, url, is_active").eq("qr_id", qr["id"]).execute()
            all_links = links_res.data or []
            
            # Filter active links under multi-link mode:
            # If active_ids is configured, ONLY use those active links!
            if active_ids:
                active_links = [l for l in all_links if l["id"] in active_ids]
            else:
                active_links = [l for l in all_links if l.get("is_active")]

            # Always display ONLY active links if any are selected
            display_links = active_links if active_links else all_links

            # When multi-link is enabled (or preview mode is requested),
            # scanning the QR code opens the landing page with the active links!
            if (is_multi and len(display_links) >= 1) or preview:
                html_content = render_multi_link_landing_page(qr["name"], qr["slug"], display_links)
                return HTMLResponse(content=html_content, status_code=200)

            # If multi-link mode is on with 1 active link
            if len(active_links) == 1:
                single_link = active_links[0]
                bg.add_task(log_scan, single_link, request)
                return RedirectResponse(
                    url=single_link["url"],
                    status_code=302,
                    headers={
                        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                        "Pragma": "no-cache",
                    },
                )
        except Exception as e:
            print("Error loading multi-links:", e)

    # 3. Default single-link mode (the current behavior)
    link = await get_active_link(slug)
    if not link:
        return HTMLResponse(UNAVAILABLE_PAGE, status_code=404)

    bg.add_task(log_scan, link, request)
    return RedirectResponse(
        url=link["url"],
        status_code=302,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )
