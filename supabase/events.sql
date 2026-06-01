-- Family Dashboard — Events (countdown) table
-- Run this ONCE in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Adds a user-managed countdown-events table with anon add/delete + realtime,
-- mirroring the groceries/timers guardrail pattern.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  emoji text not null default '📅',
  event_date date not null,
  added_by text,                          -- 'papa', 'daddy', etc. (no auth, just a label)
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — anon add/delete with a 100-row insert guardrail
-- ============================================================
alter table events enable row level security;

create policy "anon_select_events" on events
  for select to anon using (true);

create policy "anon_insert_events" on events
  for insert to anon with check ((select count(*) from events) < 100);

create policy "anon_delete_events" on events
  for delete to anon using (true);

-- ============================================================
-- REALTIME — required for postgres_changes subscriptions
-- ============================================================
alter publication supabase_realtime add table events;
