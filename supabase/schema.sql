-- Family Dashboard - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Creates all tables for Phases 6-9: groceries, timers, chores, chore_completions

-- ============================================================
-- TABLES
-- ============================================================

-- Grocery items (Phase 6: Shared Grocery List)
create table groceries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  checked boolean default false,
  added_by text,                          -- 'papa', 'daddy', etc. (no auth, just a label)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Timers (Phase 7: Kitchen Timers)
create table timers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  duration_seconds integer not null,
  started_at timestamptz not null default now(),
  cancelled boolean default false,
  created_by text,
  created_at timestamptz default now()
);

-- Chore definitions (Phase 9: Chore Tracker)
create table chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to text,                       -- 'wren', 'ellis', 'papa', 'daddy'
  schedule text not null default 'daily', -- 'daily', 'weekly', 'once'
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Chore completions (Phase 9: Chore Tracker)
create table chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid references chores(id) on delete cascade,
  completed_by text not null,
  completed_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- RLS must be enabled even with permissive policies.
-- Tables with RLS disabled are only accessible via service_role key,
-- not the anon key used by the browser client.

alter table groceries enable row level security;
alter table timers enable row level security;
alter table chores enable row level security;
alter table chore_completions enable row level security;

-- Allow all operations via anon key (no auth -- family-only home network)
create policy "Allow all" on groceries for all using (true) with check (true);
create policy "Allow all" on timers for all using (true) with check (true);
create policy "Allow all" on chores for all using (true) with check (true);
create policy "Allow all" on chore_completions for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- ============================================================
-- Tables must be explicitly added to supabase_realtime publication
-- for postgres_changes subscriptions to receive events.

alter publication supabase_realtime add table groceries;
alter publication supabase_realtime add table timers;
alter publication supabase_realtime add table chores;
alter publication supabase_realtime add table chore_completions;
