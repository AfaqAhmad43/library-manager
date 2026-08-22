-- ============================================================
-- 1. Create the 'albums' table matching the spreadsheet headers
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
  cover_url text                          -- cached artwork URL
);

-- Enable Row Level Security (RLS) on albums
alter table public.albums enable row level security;

-- Policies to allow public read/write/update on albums
create policy "Allow public read access"   on public.albums for select using (true);
create policy "Allow public insert access" on public.albums for insert with check (true);
create policy "Allow public update access" on public.albums for update using (true) with check (true);

-- Explicitly grant permissions to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.albums to anon, authenticated;

-- Migration: add cover_url to an existing albums table (safe to run)
alter table public.albums add column if not exists cover_url text;


-- ============================================================
-- 2. Create the 'unsorted' table matching the spreadsheet headers
-- ============================================================
create table if not exists public.unsorted (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  artist text not null,
  album_title text not null,
  year text,
  scope text not null default 'Full',
  digital boolean not null default false,
  cd boolean not null default false,
  vinyl boolean not null default false,
  notes text,
  cover_url text
);

-- Enable Row Level Security (RLS) on unsorted
alter table public.unsorted enable row level security;

-- Policies to allow public read/write/update on unsorted
create policy "Allow public read access"   on public.unsorted for select using (true);
create policy "Allow public insert access" on public.unsorted for insert with check (true);
create policy "Allow public update access" on public.unsorted for update using (true) with check (true);
create policy "Allow public delete access" on public.unsorted for delete using (true); -- needed for moving records to albums

-- Explicitly grant permissions to anon and authenticated roles
grant select, insert, update, delete on table public.unsorted to anon, authenticated;
