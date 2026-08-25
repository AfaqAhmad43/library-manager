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

-- Remove public access policies if they exist
drop policy if exists "Allow public read access"   on public.albums;
drop policy if exists "Allow public insert access" on public.albums;
drop policy if exists "Allow public update access" on public.albums;
drop policy if exists "Enforce authorized user check" on public.albums;

-- Policies to allow access ONLY to the authorized single user (superpsycho4347@gmail.com)
create policy "Enforce authorized user check" on public.albums
  for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'superpsycho4347@gmail.com')
  with check (auth.jwt() ->> 'email' = 'superpsycho4347@gmail.com');

-- Explicitly grant permissions to authenticated role (block anonymous users)
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.albums to authenticated;

-- Revoke permissions from anonymous users to ensure complete lockdown
revoke select, insert, update, delete on table public.albums from anon;


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

-- Remove public access policies if they exist
drop policy if exists "Allow public read access"   on public.unsorted;
drop policy if exists "Allow public insert access" on public.unsorted;
drop policy if exists "Allow public update access" on public.unsorted;
drop policy if exists "Allow public delete access" on public.unsorted;
drop policy if exists "Enforce authorized user check" on public.unsorted;

-- Policies to allow access ONLY to the authorized single user (superpsycho4347@gmail.com)
create policy "Enforce authorized user check" on public.unsorted
  for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'superpsycho4347@gmail.com')
  with check (auth.jwt() ->> 'email' = 'superpsycho4347@gmail.com');

-- Explicitly grant permissions to authenticated role (block anonymous users)
grant select, insert, update, delete on table public.unsorted to authenticated;

-- Revoke permissions from anonymous users to ensure complete lockdown
revoke select, insert, update, delete on table public.unsorted from anon;
