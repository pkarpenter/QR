from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_admin, get_supabase
from app.models.link import LinkCreate, LinkUpdate, LinkResponse

router = APIRouter(tags=["Links"])


@router.get("/qr/{qr_id}/links", response_model=list[LinkResponse])
async def list_links(
    qr_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """
    Get all links for a given QR code, augmented with scans(30d) count
    and is_active flag.
    """
    res = (
        db.table("links")
        .select("*")
        .eq("qr_id", qr_id)
        .order("created_at", desc=True)
        .execute()
    )
    links = res.data or []

    # Calculate 30-day scans per link
    since_30d = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    scans_res = (
        db.table("scans")
        .select("link_id")
        .eq("qr_id", qr_id)
        .gte("scanned_at", since_30d)
        .execute()
    )
    link_scans = {}
    for s in (scans_res.data or []):
        lid = s.get("link_id")
        if lid:
            link_scans[lid] = link_scans.get(lid, 0) + 1

    return [
        {
            **l,
            "scans_30d": link_scans.get(l["id"], 0),
        }
        for l in links
    ]


@router.post("/qr/{qr_id}/links", response_model=LinkResponse, status_code=201)
async def add_link(
    qr_id: str,
    payload: LinkCreate,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Add a new destination link to a QR code."""
    data = {
        "qr_id": qr_id,
        "title": payload.title,
        "url": payload.url,
        "is_active": False,
    }
    res = db.table("links").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create link")
    return res.data[0]


@router.put("/links/{link_id}", response_model=LinkResponse)
@router.patch("/qr/{qr_id}/links/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: str,
    payload: LinkUpdate,
    qr_id: str = None,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Edit link title or URL."""
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    query = db.table("links").update(update_data).eq("id", link_id)
    if qr_id:
        query = query.eq("qr_id", qr_id)

    res = query.execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Link not found")
    return res.data[0]


@router.delete("/links/{link_id}", status_code=204)
@router.delete("/qr/{qr_id}/links/{link_id}", status_code=204)
async def delete_link(
    link_id: str,
    qr_id: str = None,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """Delete a link."""
    query = db.table("links").delete().eq("id", link_id)
    if qr_id:
        query = query.eq("qr_id", qr_id)
    query.execute()


@router.post("/qr/{qr_id}/links/{link_id}/activate", response_model=LinkResponse)
async def activate_link(
    qr_id: str,
    link_id: str,
    admin=Depends(get_current_admin),
    db=Depends(get_supabase),
):
    """
    Atomically activate a link for a QR code in a single transaction via activate_link() RPC.
    Returns the newly active link row.
    """
    db.rpc("activate_link", {"p_qr_id": qr_id, "p_link_id": link_id}).execute()
    updated = (
        db.table("links").select("*").eq("id", link_id).eq("qr_id", qr_id).execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Link not found")
    return updated.data[0]


class MultiLinkConfigPayload(BaseModel):
    is_multi_link: bool
    active_link_ids: list[str] = []


@router.get("/qr/{qr_id}/multi-link-config")
async def get_multi_config(
    qr_id: str,
    admin=Depends(get_current_admin),
):
    """Retrieve multi-link landing page configuration for a QR code."""
    from app.services.multi_link_service import get_multi_link_config
    return get_multi_link_config(qr_id)


@router.post("/qr/{qr_id}/multi-link-config")
async def save_multi_config(
    qr_id: str,
    payload: MultiLinkConfigPayload,
    admin=Depends(get_current_admin),
):
    """Update multi-link landing page mode and active link IDs."""
    from app.services.multi_link_service import set_multi_link_config
    return set_multi_link_config(qr_id, payload.is_multi_link, payload.active_link_ids)

