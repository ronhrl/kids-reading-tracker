-- ============================================================
-- game_state table
-- One row per user. Full game state is stored as JSON in `data`.
-- ============================================================

create table if not exists game_state (
  id         uuid primary key default gen_random_uuid(),
  "user"     text not null unique check ("user" in ('roei', 'yair')),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Index for fast user lookups
create index if not exists game_state_user_idx on game_state ("user");

-- Auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger game_state_updated_at
  before update on game_state
  for each row execute procedure set_updated_at();

-- ============================================================
-- Row Level Security (recommended for production)
-- ============================================================

-- Enable RLS
alter table game_state enable row level security;

-- Allow anyone with the anon key to read and write
-- (tighten this once you add auth)
create policy "anon full access"
  on game_state
  for all
  using (true)
  with check (true);
