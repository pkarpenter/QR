from app.database import supabase


async def get_active_link(slug: str) -> dict | None:
    """
    Resolve a slug to its currently active link URL.
    Returns the link dict (id, url) or None if not found / QR disabled.
    Uses inner join: qr_codes ↔ links (is_active=true, is_enabled=true).
    """
    try:
        res = (
            supabase.table("qr_codes")
            .select("id, slug, links!inner(id, url, is_active)")
            .eq("slug", slug)
            .eq("is_enabled", True)
            .eq("links.is_active", True)
            .execute()
        )
        if res.data and res.data[0].get("links"):
            row = res.data[0]
            link = res.data[0]["links"][0]
            return {
                "id": link["id"],
                "url": link["url"],
                "qr_id": row["id"],
            }
    except Exception:
        pass
    return None


async def activate_link(qr_id: str, link_id: str) -> bool:
    """
    Atomically activate a link via Supabase RPC function.
    The DB function deactivates all other links for the QR first.
    """
    try:
        supabase.rpc("activate_link", {"p_qr_id": qr_id, "p_link_id": link_id}).execute()
        return True
    except Exception:
        return False
