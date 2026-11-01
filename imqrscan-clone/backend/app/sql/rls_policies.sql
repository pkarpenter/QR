-- ============================================================
-- IMQRScan Clone — Row Level Security Policies
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
alter table qr_codes enable row level security;
alter table links     enable row level security;
alter table scans     enable row level security;

-- ─── qr_codes ────────────────────────────────────────────────
-- Only authenticated (admin) users can read/write qr_codes
create policy "Admin full access to qr_codes"
  on qr_codes for all
  to authenticated
  using (true)
  with check (true);

-- ─── links ───────────────────────────────────────────────────
create policy "Admin full access to links"
  on links for all
  to authenticated
  using (true)
  with check (true);

-- ─── scans ───────────────────────────────────────────────────
-- Authenticated admin can read scans
create policy "Admin can read scans"
  on scans for select
  to authenticated
  using (true);

-- Service role (backend) can insert scans (anon scan logging)
-- Note: The backend uses service_role key which bypasses RLS.
-- If using anon key for scan logging, add:
-- create policy "Anon can insert scans"
--   on scans for insert
--   to anon
--   with check (true);
