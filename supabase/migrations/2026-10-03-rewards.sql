-- Family Dashboard — Rewards on top of chores
-- Run in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to run more than once: every statement is idempotent.
--
-- Adds:
--   chores.points               points a chore earns per completion (default 1)
--   rewards                     things kids can spend points on
--   reward_redemptions          one row per "spent points on a reward"
--   points_balances (view)      per-person earned / spent / balance
--
-- Balance = sum(points of their completions) - sum(cost of their redemptions).
-- It is a view (not computed in the browser) because PostgREST caps responses
-- at 1000 rows, and completion history passes that within a few months.

begin;

-- ------------------------------------------------------------
-- chores.points
-- ------------------------------------------------------------
alter table chores add column if not exists points int not null default 1;

-- ------------------------------------------------------------
-- rewards
-- ------------------------------------------------------------
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cost int not null check (cost >= 0),
  emoji text not null default '🎁',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- reward_redemptions
-- ------------------------------------------------------------
-- No ON DELETE CASCADE: deleting a reward must not silently refund points.
-- Retire a reward with is_active = false instead.
create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references rewards(id),
  redeemed_by text not null,             -- 'wren', 'ellis', 'papa', 'daddy'
  created_at timestamptz not null default now()
);

create index if not exists reward_redemptions_redeemed_by_idx on reward_redemptions (redeemed_by);
create index if not exists chore_completions_completed_by_idx on chore_completions (completed_by);

-- ------------------------------------------------------------
-- points_balances view
-- ------------------------------------------------------------
create or replace view points_balances
with (security_invoker = true) as
select
  person,
  sum(earned)::int as earned,
  sum(spent)::int as spent,
  (sum(earned) - sum(spent))::int as balance
from (
  select cc.completed_by as person, c.points as earned, 0 as spent
  from chore_completions cc
  join chores c on c.id = cc.chore_id
  union all
  select rr.redeemed_by, 0, r.cost
  from reward_redemptions rr
  join rewards r on r.id = rr.reward_id
) t
group by person;

grant select on points_balances to anon, authenticated;

-- ------------------------------------------------------------
-- RLS — same permissive pattern as chores / chore_completions
-- ------------------------------------------------------------
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;

drop policy if exists "Allow all" on rewards;
create policy "Allow all" on rewards for all using (true) with check (true);

drop policy if exists "Allow all" on reward_redemptions;
create policy "Allow all" on reward_redemptions for all using (true) with check (true);

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'rewards') then
    alter publication supabase_realtime add table rewards;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'reward_redemptions') then
    alter publication supabase_realtime add table reward_redemptions;
  end if;
end $$;

-- ------------------------------------------------------------
-- Seed rewards (idempotent: skips titles that already exist)
-- ------------------------------------------------------------
insert into rewards (title, cost, emoji)
select v.title, v.cost, v.emoji
from (values
  ('Pick the Friday game',      10, '🎮'),
  ('Ice cream',                 15, '🍦'),
  ('30 min extra screen time',  20, '📱'),
  ('Cinema night',              50, '🎬')
) as v(title, cost, emoji)
where not exists (select 1 from rewards r where r.title = v.title);

commit;

-- Check:
--   select * from rewards order by cost;
--   select * from points_balances;
