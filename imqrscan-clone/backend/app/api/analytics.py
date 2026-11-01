import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_admin, get_supabase
from app.services.analytics_service import compute_qr_analytics

router = APIRouter(tags=["Analytics"])


@router.get("/qr/{qr_id}/analytics")
async def get_analytics(
    qr_id: str,
    days: int = Query(30, ge=1, le=365),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    link_id: Optional[str] = Query(None),
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """
    Return comprehensive scan analytics for a QR code:
    - KPIs: total_scans, today, unique_visitors, avg_per_day
    - Daily stacked chart data
    - Devices, cities, hours breakdowns
    - Peak metrics: top_device, top_city, peak_hour, best_day
    """
    if from_date:
        since = from_date
    else:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    query = (
        db.table("scans")
        .select("*")
        .eq("qr_id", qr_id)
        .gte("scanned_at", since)
        .order("scanned_at", desc=True)
    )
    if to_date:
        query = query.lte("scanned_at", to_date)
    if link_id:
        query = query.eq("link_id", link_id)

    res = query.execute()
    scans = res.data or []

    # Fetch links for this QR to resolve link names in stacked charts
    links_res = db.table("links").select("id, title").eq("qr_id", qr_id).execute()
    links = links_res.data or []

    return compute_qr_analytics(scans, links, days=days)


@router.get("/qr/{qr_id}/scans")
async def get_qr_scans(
    qr_id: str,
    limit: int = Query(50, ge=1, le=200),
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Get latest live scans for a specific QR code."""
    res = (
        db.table("scans")
        .select("id, scanned_at, device, os, browser, country, city, ip_hash, referrer, link_id")
        .eq("qr_id", qr_id)
        .order("scanned_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def _generate_csv_response(scans: list, qr_id: str):
    output = io.StringIO()
    fields = ["scanned_at", "device", "os", "browser", "country", "city", "ip_hash", "referrer", "link_id"]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for row in scans:
        writer.writerow({f: row.get(f, "") for f in fields})

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=scans_{qr_id}.csv"},
    )


@router.get("/qr/{qr_id}/scans/export")
async def export_qr_scans(
    qr_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Export scan logs as CSV for a specific QR code."""
    res = (
        db.table("scans")
        .select("scanned_at, device, os, browser, country, city, ip_hash, referrer, link_id")
        .eq("qr_id", qr_id)
        .order("scanned_at", desc=True)
        .execute()
    )
    return _generate_csv_response(res.data or [], qr_id)


@router.get("/scans/export")
async def export_scans_legacy(
    qr_id: str = Query(...),
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Legacy export endpoint for backward compatibility."""
    return await export_qr_scans(qr_id, admin=admin, db=db)


@router.get("/dashboard/stats")
async def dashboard_stats(
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Overall dashboard KPIs across all QR codes."""
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()

    total_qr = db.table("qr_codes").select("id", count="exact").execute().count or 0
    total_scans = db.table("scans").select("id", count="exact").execute().count or 0
    today_scans = (
        db.table("scans")
        .select("id", count="exact")
        .gte("scanned_at", today)
        .execute()
        .count or 0
    )
    yesterday_scans = (
        db.table("scans")
        .select("id", count="exact")
        .gte("scanned_at", yesterday)
        .lt("scanned_at", today)
        .execute()
        .count or 0
    )
    active_links = (
        db.table("links")
        .select("id", count="exact")
        .eq("is_active", True)
        .execute()
        .count or 0
    )

    recent = (
        db.table("scans")
        .select("scanned_at, device, os, browser, country, city, qr_id, ip_hash")
        .order("scanned_at", desc=True)
        .limit(20)
        .execute()
        .data or []
    )

    # Calculate unique visitors
    unique_visitors = (
        db.table("scans")
        .select("ip_hash")
        .execute()
        .data or []
    )
    unique_count = len({s["ip_hash"] for s in unique_visitors if s.get("ip_hash")})

    # Find the most recently active link details
    active_link_row = (
        db.table("links")
        .select("id, title, url, created_at, qr_id")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    active_link_info = active_link_row[0] if active_link_row else None

    return {
        "total_qr_codes": total_qr,
        "total_scans": total_scans,
        "today_scans": today_scans,
        "yesterday_scans": yesterday_scans,
        "unique_visitors": unique_count,
        "unique_percentage": round((unique_count / total_scans * 100), 1) if total_scans > 0 else 0,
        "avg_scans_per_day": round(total_scans / 30, 1),
        "active_links": active_links,
        "active_link": active_link_info,
        "recent_scans": recent,
    }
