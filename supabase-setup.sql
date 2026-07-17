-- Run this once in Supabase: SQL Editor -> New query -> paste this -> Run

create table if not exists entries (
  id text primary key,
  journal_key text not null,
  symbol text,
  date text,
  time text,
  direction text,
  session text,
  entry_price text,
  exit_price text,
  pnl numeric,
  rr text,
  notes text,
  tags jsonb default '[]'::jsonb,
  image text,
  created_at timestamptz default now()
);

create index if not exists entries_journal_key_idx on entries (journal_key);

-- Row Level Security: since this app has no login system, access is controlled
-- entirely by knowing the random "sync code" (kept secret, like a password).
alter table entries enable row level security;

drop policy if exists "allow all with anon key" on entries;
create policy "allow all with anon key"
  on entries
  for all
  using (true)
  with check (true);

-- Enable realtime so both devices get instant updates
alter publication supabase_realtime add table entries;
