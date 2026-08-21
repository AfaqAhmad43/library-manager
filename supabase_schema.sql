-- Create the albums table matching the spreadsheet headers
create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  artist text not null,
  album_title text not null,
  year text, -- e.g., "1994", "2001/2002"
  scope text not null default 'Full', -- e.g., Full, Partial, Few, Single
  digital boolean not null default false,
  cd boolean not null default false,
  vinyl boolean not null default false,
  notes text
);

-- Enable Row Level Security (RLS)
alter table public.albums enable row level security;

-- Create policies to allow public read/write since this is a local app
create policy "Allow public read access" on public.albums
  for select using (true);

create policy "Allow public insert access" on public.albums
  for insert with check (true);

-- Explicitly grant SELECT and INSERT permissions to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant select, insert on table public.albums to anon, authenticated;

