-- =============================================================================
-- Family Dashboard — RLS Policies for Groceries and Timers Tables
-- =============================================================================
--
-- Purpose: Enable Row-Level Security on groceries and timers tables with
-- full CRUD access for the anon role. Row count guardrails prevent spam:
--   - Groceries: max 100 rows
--   - Timers: max 10 active (non-cancelled) timers
--
-- Usage: Copy this entire script into Supabase Dashboard > SQL Editor and run.
--
-- IMPORTANT: Policies are created FIRST, then RLS is enabled. This prevents
-- a window where RLS is on but no policies exist (which blocks all access).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Groceries table policies
-- ---------------------------------------------------------------------------

CREATE POLICY "anon_select_groceries" ON groceries
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_groceries" ON groceries
  FOR INSERT TO anon
  WITH CHECK (
    (SELECT count(*) FROM groceries) < 100
  );

CREATE POLICY "anon_update_groceries" ON groceries
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_groceries" ON groceries
  FOR DELETE TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- Timers table policies
-- ---------------------------------------------------------------------------

CREATE POLICY "anon_select_timers" ON timers
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_timers" ON timers
  FOR INSERT TO anon
  WITH CHECK (
    (SELECT count(*) FROM timers WHERE cancelled = false) < 10
  );

CREATE POLICY "anon_update_timers" ON timers
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_timers" ON timers
  FOR DELETE TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- Enable RLS (AFTER policies are created)
-- ---------------------------------------------------------------------------

ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =============================================================================
-- Verification queries (run these manually after applying the above)
-- =============================================================================

-- Test groceries as anon
-- SET ROLE anon;
-- SELECT * FROM groceries LIMIT 5;
-- INSERT INTO groceries (name, checked) VALUES ('test-rls', false);
-- UPDATE groceries SET checked = true WHERE name = 'test-rls';
-- DELETE FROM groceries WHERE name = 'test-rls';
-- RESET ROLE;

-- Test timers as anon
-- SET ROLE anon;
-- SELECT * FROM timers LIMIT 5;
-- INSERT INTO timers (label, duration_seconds, started_at) VALUES ('test-rls', 60, now());
-- UPDATE timers SET cancelled = true WHERE label = 'test-rls';
-- DELETE FROM timers WHERE label = 'test-rls';
-- RESET ROLE;
