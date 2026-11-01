import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_admin, get_supabase
from app.models.qr import QrCodeCreate, QrCodeResponse
from app.services.qr_service import generate_slug, generate_qr_bytes
from app.config import settings

router = APIRouter(tags=["QR Codes"])


@router.get("/qr")
async def list_qr_codes(
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """
    List all QR codes for the admin, augmented with:
    - active_link_title: title of currently active link
    - active_link_url: url of currently active link
    - total_scans: count of all scans logged for this QR
    """
    qr_res = db.table("qr_codes").select("*").order("created_at", desc=True).execute()
    qrs = qr_res.data or []

    # Get active links
    active_links_res = (
        db.table("links")
        .select("id, qr_id, title, url")
        .eq("is_active", True)
        .execute()
    )
    active_map = {l["qr_id"]: l for l in (active_links_res.data or [])}

    # Get scan counts per QR
    scans_res = db.table("scans").select("qr_id").execute()
    scan_counts = {}
    for s in (scans_res.data or []):
        qid = s["qr_id"]
        scan_counts[qid] = scan_counts.get(qid, 0) + 1

    from app.services.multi_link_service import get_qr_description, save_qr_description

    result = []
    for q in qrs:
        qid = q["id"]
        active = active_map.get(qid)
        desc = q.get("description") or get_qr_description(qid)
        result.append({
            **q,
            "description": desc or None,
            "active_link_title": active["title"] if active else None,
            "active_link_url": active["url"] if active else None,
            "total_scans": scan_counts.get(qid, 0),
        })

    return result


@router.get("/qr/{qr_id}")
async def get_qr_detail(
    qr_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Get single QR code detail with its active link and total scans."""
    from app.services.multi_link_service import get_qr_description
    res = db.table("qr_codes").select("*").eq("id", qr_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="QR code not found")
    qr = res.data[0]

    # Active link
    act = (
        db.table("links")
        .select("*")
        .eq("qr_id", qr_id)
        .eq("is_active", True)
        .execute()
    )
    active_link = act.data[0] if act.data else None

    # Total scans
    scans_count = (
        db.table("scans")
        .select("id", count="exact")
        .eq("qr_id", qr_id)
        .execute()
        .count or 0
    )

    desc = qr.get("description") or get_qr_description(qr_id)

    return {
        **qr,
        "description": desc or None,
        "active_link": active_link,
        "total_scans": scans_count,
    }


@router.post("/qr", response_model=QrCodeResponse, status_code=201)
async def create_qr_code(
    payload: QrCodeCreate,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Create a new QR code with an auto-generated permanent slug and description."""
    from app.services.multi_link_service import save_qr_description
    slug = generate_slug()
    redirect_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/go/{slug}"
    safe_desc = (payload.description or "")[:2500]

    data = {
        "name": payload.name,
        "slug": slug,
        "redirect_url": redirect_url,
        "is_enabled": True,
    }

    try:
        data_with_desc = {**data, "description": safe_desc}
        res = db.table("qr_codes").insert(data_with_desc).execute()
        created = res.data[0]
    except Exception:
        # Fallback if Supabase table does not yet have 'description' column
        res = db.table("qr_codes").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create QR code")
        created = res.data[0]

    if safe_desc:
        save_qr_description(created["id"], safe_desc)

    created["description"] = safe_desc or None
    return created


@router.patch("/qr/{qr_id}", response_model=QrCodeResponse)
async def update_qr_code(
    qr_id: str,
    payload: QrCodeCreate,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Update QR code name."""
    res = (
        db.table("qr_codes")
        .update({"name": payload.name})
        .eq("id", qr_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="QR code not found")
    return res.data[0]


@router.delete("/qr/{qr_id}", status_code=204)
async def delete_qr_code(
    qr_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Delete a QR code and all its links (cascade)."""
    db.table("qr_codes").delete().eq("id", qr_id).execute()


@router.patch("/qr/{qr_id}/toggle", response_model=QrCodeResponse)
async def toggle_qr_enabled(
    qr_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Toggle the is_enabled flag on a QR code."""
    from app.services.multi_link_service import get_qr_description
    cur = db.table("qr_codes").select("is_enabled").eq("id", qr_id).execute()
    if not cur.data:
        raise HTTPException(status_code=404, detail="QR code not found")
    cur_enabled = cur.data[0].get("is_enabled")
    new_state = False if cur_enabled is not False else True
    res = db.table("qr_codes").update({"is_enabled": new_state}).eq("id", qr_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to toggle QR code")
    updated = res.data[0]
    desc = updated.get("description") or get_qr_description(qr_id)
    return {**updated, "description": desc or None}


def _build_qr_stream(url: str, slug: str, fmt: str):
    fmt_clean = "svg" if fmt.lower() == "svg" else "png"
    buf = generate_qr_bytes(url, fmt=fmt_clean)
    media_type = "image/svg+xml" if fmt_clean == "svg" else "image/png"
    filename = f"qr_{slug}.{fmt_clean}"

    return StreamingResponse(
        io.BytesIO(buf),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/qr/{qr_id}/image")
async def get_qr_image(
    qr_id: str,
    format: str = Query("png", pattern="^(png|svg)$"),
    db=Depends(get_supabase),
):

    """Serve/download QR image with error correction H and border 4."""
    res = db.table("qr_codes").select("slug, redirect_url").eq("id", qr_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="QR code not found")
    qr = res.data[0]
    return _build_qr_stream(qr["redirect_url"], qr["slug"], format)


@router.get("/qr/{qr_id}/download")
async def download_qr(
    qr_id: str,
    fmt: str = Query("png"),
    db=Depends(get_supabase),
):
    """Download QR code (alias for backward compatibility)."""
    res = db.table("qr_codes").select("slug, redirect_url").eq("id", qr_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="QR code not found")
    qr = res.data[0]
    return _build_qr_stream(qr["redirect_url"], qr["slug"], fmt)
