-- ============================================================
-- IMQRScan Clone — PL/pgSQL Functions
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ─── activate_link() ────────────────────────────────────────
-- Atomically switches the active link for a QR code.
-- 1. Sets all links for this QR to is_active=false
-- 2. Sets the target link to is_active=true
-- The partial unique index (one_active_link_per_qr) guarantees
-- database-level consistency — this function runs in a transaction.
-- ────────────────────────────────────────────────────────────
create or replace function activate_link(p_qr_id uuid, p_link_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Step 1: Deactivate ALL links for this QR code
  update links
     set is_active = false
   where qr_id = p_qr_id;

  -- Step 2: Activate the chosen link
  update links
     set is_active = true
   where id = p_link_id
     and qr_id = p_qr_id;

  -- Guard: ensure the link exists
  if not found then
    raise exception 'Link % not found for QR %', p_link_id, p_qr_id;
  end if;
end;
$$;
