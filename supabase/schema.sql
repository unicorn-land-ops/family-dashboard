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

-- Normalize grocery aliases to household defaults (e.g., "milk" -> "full fat bio milk")
create or replace function normalize_grocery_name(input_name text)
returns text
language plpgsql
as $$
declare
  trimmed_name text := btrim(coalesce(input_name, ''));
  quantity_prefix text;
  base_name text;
  normalized_base text;
begin
  if trimmed_name = '' then
    return trimmed_name;
  end if;

  if trimmed_name ~ '^[0-9]+([.,][0-9]+)?\s+' then
    quantity_prefix := regexp_replace(
      trimmed_name,
      '^([0-9]+([.,][0-9]+)?)\s+.*$',
      '\1'
    );
    base_name := regexp_replace(trimmed_name, '^[0-9]+([.,][0-9]+)?\s+', '');
  else
    quantity_prefix := null;
    base_name := trimmed_name;
  end if;

  normalized_base := lower(regexp_replace(base_name, '\s+', ' ', 'g'));

  if normalized_base = any (array[
    'milk',
    'whole milk',
    'full fat milk',
    'full-fat milk',
    'bio milk',
    'organic whole milk',
    'vollmilch',
    'bio vollmilch',
    'full fat bio milk'
  ]) then
    base_name := 'full fat bio milk';
  end if;

  if quantity_prefix is not null then
    return quantity_prefix || ' ' || base_name;
  end if;

  return base_name;
end;
$$;

create or replace function groceries_apply_name_preferences()
returns trigger
language plpgsql
as $$
begin
  new.name := normalize_grocery_name(new.name);
  return new;
end;
$$;

drop trigger if exists groceries_normalize_name on groceries;
create trigger groceries_normalize_name
before insert or update of name
on groceries
for each row
execute function groceries_apply_name_preferences();

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
-- RLS must be enabled for anon key access. Groceries and timers use
-- guardrail policies with INSERT row-count limits to prevent spam.
-- Chores/completions use permissive "Allow all" (no guardrails needed).

alter table groceries enable row level security;
alter table timers enable row level security;
alter table chores enable row level security;
alter table chore_completions enable row level security;

-- Groceries: guardrail policies (max 100 rows on INSERT)
create policy "anon_select_groceries" on groceries for select to anon using (true);
create policy "anon_insert_groceries" on groceries for insert to anon with check ((select count(*) from groceries) < 100);
create policy "anon_update_groceries" on groceries for update to anon using (true) with check (true);
create policy "anon_delete_groceries" on groceries for delete to anon using (true);

-- Timers: guardrail policies (max 10 active timers on INSERT)
create policy "anon_select_timers" on timers for select to anon using (true);
create policy "anon_insert_timers" on timers for insert to anon with check ((select count(*) from timers where cancelled = false) < 10);
create policy "anon_update_timers" on timers for update to anon using (true) with check (true);
create policy "anon_delete_timers" on timers for delete to anon using (true);

-- Chores and completions: full access (no guardrails needed)
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
