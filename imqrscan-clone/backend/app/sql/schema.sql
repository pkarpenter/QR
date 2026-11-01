-- ============================================================
-- IMQRScan Clone — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── QR Codes ───────────────────────────────────────────────
create table if not exists qr_codes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  redirect_url text not null,  -- e.g. https://qr.yourbrand.com/go/{slug}
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ─── Links ──────────────────────────────────────────────────
create table if not exists links (
  id         uuid primary key default gen_random_uuid(),
  qr_id      uuid not null references qr_codes(id) on delete cascade,
  title      text not null,
  url        text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Partial unique index: only ONE active link per QR code allowed
-- This enforces the invariant at DB level — the critical constraint!
create unique index if not exists one_active_link_per_qr
  on links (qr_id)
  where is_active = true;

-- ─── Scans ──────────────────────────────────────────────────
create table if not exists scans (
  id         uuid primary key default gen_random_uuid(),
  qr_id      uuid not null references qr_codes(id) on delete cascade,
  link_id    uuid references links(id) on delete set null,
  scanned_at timestamptz not null default now(),
  device     text,   -- 'Mobile' | 'Tablet' | 'Desktop'
  os         text,   -- 'iOS' | 'Android' | 'Windows' | ...
  browser    text,   -- 'Chrome' | 'Safari' | ...
  country    text,
  city       text,
  ip_hash    text,   -- SHA-256(ip + salt) — never store raw IP
  referrer   text
);

-- ─── Indexes for analytics queries ───────────────────────────
create index if not exists scans_qr_id_idx       on scans(qr_id);
create index if not exists scans_scanned_at_idx  on scans(scanned_at desc);
create index if not exists scans_ip_hash_idx     on scans(ip_hash);
