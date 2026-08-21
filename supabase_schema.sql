-- ============================================================
-- Full schema for the albums table
-- Run this in the Supabase SQL Editor to set up or reset the table.
-- ============================================================

create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  artist text not null,
  album_title text not null,
  year text,                              -- e.g. "1994", "2001/2002"
  scope text not null default 'Full',     -- Full | Partial | Few | Single
  digital boolean not null default false,
  cd boolean not null default false,
  vinyl boolean not null default false,
  notes text,
  cover_url text                          -- cached artwork URL; written automatically on first fetch
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.albums enable row level security;

create policy "Allow public read access"   on public.albums for select using (true);
create policy "Allow public insert access" on public.albums for insert with check (true);
create policy "Allow public update access" on public.albums for update using (true) with check (true);

-- ── Grants ───────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.albums to anon, authenticated;

-- ── Migration: add cover_url to an existing table ────────────────────────
-- (safe to run even if the column already exists)
alter table public.albums add column if not exists cover_url text;
