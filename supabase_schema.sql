-- Create the albums table
create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  artist text not null,
  album_title text not null,
  year text, -- Stored as text to allow flexible entries (e.g., "1994", "2001/2002")
  scope text not null default 'Full', -- e.g., Full, Partial, Few, Single
  mastering_status text not null default 'Needs Research' -- e.g., CD/Digital Match, Other Master Superior, Needs Research
);

-- Enable Row Level Security (RLS)
alter table public.albums enable row level security;

-- Create policies to allow public read/write since this is a local app
create policy "Allow public read access" on public.albums
  for select using (true);

create policy "Allow public insert access" on public.albums
  for insert with check (true);
