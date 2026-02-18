# Phase 17: Cleanup & Verification - Research

**Researched:** 2026-02-18
**Domain:** Supabase RLS, calendar UI verification, code cleanup, documentation
**Confidence:** HIGH

## Summary

Phase 17 is a cleanup and verification phase with four distinct tasks: (1) remove conflicting Supabase RLS "Allow all" policies that bypass Phase 11's guardrail policies, (2) visually re-verify calendar emoji and weather layout, (3) fix a dead prop in CountryPanel.tsx, and (4) update REQUIREMENTS.md checkboxes to reflect actual completion status.

All four tasks are well-understood, low-risk operations. The codebase is in good shape -- the build passes cleanly, TypeScript compiles without errors, and the calendar components already implement the correct layout. The main risk is the Supabase RLS cleanup, which requires running SQL against the live database.

**Primary recommendation:** Execute as a single plan with four sequential tasks -- RLS cleanup first (highest risk), then code fix, then docs, then visual verification (requires user).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-02 | Calendar events show correct person emoji | Code verified: config.ts has correct unicode codepoints (avocado, cookie, cherry blossom, mango, house). EventCard.tsx renders person badges before event summary. Re-verification is visual confirmation only. |
| CALL-01 | Weather info displays underneath day header | Code verified: DayRow.tsx renders WeatherBadge in its own `<div>` between day header and events list (lines 46-54). Re-verification is visual confirmation only. |
| CALL-02 | Person emoji badge precedes each event name | Code verified: EventCard.tsx renders person badges div (line 59) before summary div (line 75) in flex layout. Re-verification is visual confirmation only. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase operates on existing code and infrastructure.

### Tools Required
| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase SQL Editor | Drop conflicting RLS policies | Must run against live database |
| Browser | Visual calendar verification | User must confirm on wall display |
| Text editor | CountryPanel.tsx fix + REQUIREMENTS.md update | Simple code changes |

## Architecture Patterns

### Supabase RLS Policy Conflict

**The problem:** `schema.sql` (Phase 5) creates "Allow all" permissive policies on `groceries` and `timers` tables. `rls-policies.sql` (Phase 11) creates guardrail policies with row-count checks on the same tables. In Postgres, permissive policies are OR'd together -- if ANY permissive policy passes, the operation is allowed. This means the "Allow all" policy completely bypasses the row-count guardrails.

**Tables affected:** `groceries` and `timers` only. The `chores` and `chore_completions` tables were never given guardrail policies, so their "Allow all" policies are fine.

**Current state on groceries table (likely):**
- `"Allow all"` -- permissive, FOR ALL, USING (true) WITH CHECK (true)
- `"anon_select_groceries"` -- permissive, FOR SELECT, USING (true)
- `"anon_insert_groceries"` -- permissive, FOR INSERT, WITH CHECK (count < 100)
- `"anon_update_groceries"` -- permissive, FOR UPDATE, USING (true) WITH CHECK (true)
- `"anon_delete_groceries"` -- permissive, FOR DELETE, USING (true)

**Current state on timers table (likely):**
- `"Allow all"` -- permissive, FOR ALL, USING (true) WITH CHECK (true)
- `"anon_select_timers"` -- permissive, FOR SELECT, USING (true)
- `"anon_insert_timers"` -- permissive, FOR INSERT, WITH CHECK (count < 10)
- `"anon_update_timers"` -- permissive, FOR UPDATE, USING (true) WITH CHECK (true)
- `"anon_delete_timers"` -- permissive, FOR DELETE, USING (true)

**Fix:** Drop the "Allow all" policy from `groceries` and `timers` tables. Keep them on `chores` and `chore_completions`.

### CountryPanel.tsx Dead Prop

**The problem:** The `UnsplashAttribution` component (line 6-36 of CountryPanel.tsx) declares `unsplashUrl: string` in its props type but never uses the value in the function body. The prop IS passed from the caller (line 123), but the component ignores it.

**Note on warning type:** This does NOT produce a TypeScript error or a Vite build warning. TypeScript does not warn on unused interface/type properties. ESLint also passes clean. The audit flagged it as tech debt (unused code), not as a build error. The Phase 14 SUMMARY noted it as a "pre-existing build error" but current build shows no warnings. Regardless, the dead prop should be cleaned up.

**Fix:** Remove `unsplashUrl` from the props type and from the caller. The Unsplash attribution link uses a hardcoded `https://unsplash.com/...` URL, not the photo-specific URL, which is correct per Unsplash API guidelines.

### REQUIREMENTS.md Checkbox Update

**Current state:** REQUIREMENTS.md already has checkboxes updated (all v1.1 items checked except SIRI-02). The audit originally noted all were `[ ]` but they've since been updated. Phase 17 should do a final pass to ensure SIRI-02 is also checked (assuming Phase 16 completed successfully, which it has per git log).

**Also update:** The traceability table status for SIRI-02 (currently "Pending") should be changed to "Satisfied".

### schema.sql Update

After dropping the "Allow all" policies from live Supabase, `schema.sql` should also be updated to remove those policies from the file, so the documented schema matches production. Replace them with the guardrail policies from `rls-policies.sql` for `groceries` and `timers`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RLS policy inspection | Custom query | `SELECT * FROM pg_policies WHERE tablename IN ('groceries', 'timers')` | Standard Postgres catalog |
| Policy removal | Complex migration | `DROP POLICY "Allow all" ON tablename` | Single DDL statement |

## Common Pitfalls

### Pitfall 1: Dropping Policies Before Replacements Exist
**What goes wrong:** If you drop the "Allow all" policy before the guardrail policies exist, the table becomes inaccessible.
**How to avoid:** The guardrail policies from Phase 11 should already be active. Verify they exist BEFORE dropping "Allow all". Use `SELECT * FROM pg_policies WHERE tablename = 'groceries'` to confirm.

### Pitfall 2: Forgetting the Transaction Wrapper
**What goes wrong:** If dropping one policy succeeds but the second fails, you have inconsistent state.
**How to avoid:** Wrap both DROP statements in a BEGIN/COMMIT transaction.

### Pitfall 3: Case Sensitivity in Policy Names
**What goes wrong:** Postgres policy names are case-sensitive when quoted.
**How to avoid:** Use exact name from schema.sql: `"Allow all"` (capital A, lowercase a).

### Pitfall 4: Not Verifying After RLS Change
**What goes wrong:** Policy dropped but app breaks because guardrail policies weren't actually created.
**How to avoid:** After dropping, test: INSERT a grocery item, verify it works. INSERT when at limit, verify it fails.

### Pitfall 5: Visual Verification Requires Running App
**What goes wrong:** Code review alone cannot confirm visual layout.
**How to avoid:** Phase must include a step where user views the actual running dashboard with real calendar data. Mark as `human_needed`.

## Code Examples

### SQL: Verify Existing Policies
```sql
-- Run in Supabase SQL Editor to see all policies on affected tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('groceries', 'timers')
ORDER BY tablename, policyname;
```

### SQL: Drop Conflicting Policies
```sql
BEGIN;

-- Drop the overly-permissive "Allow all" policies that bypass guardrails
DROP POLICY IF EXISTS "Allow all" ON groceries;
DROP POLICY IF EXISTS "Allow all" ON timers;

COMMIT;
```

### SQL: Verify After Cleanup
```sql
-- Should show only anon_* policies for groceries and timers
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('groceries', 'timers')
ORDER BY tablename, policyname;

-- Expected result:
-- groceries | anon_delete_groceries | DELETE
-- groceries | anon_insert_groceries | INSERT
-- groceries | anon_select_groceries | SELECT
-- groceries | anon_update_groceries | UPDATE
-- timers    | anon_delete_timers    | DELETE
-- timers    | anon_insert_timers    | INSERT
-- timers    | anon_select_timers    | SELECT
-- timers    | anon_update_timers    | UPDATE
```

### TypeScript: CountryPanel Fix
```typescript
// BEFORE (line 12-13 of CountryPanel.tsx):
function UnsplashAttribution({
  photographer,
  photographerUrl,
}: {
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;       // <-- REMOVE this
}) {

// AFTER:
function UnsplashAttribution({
  photographer,
  photographerUrl,
}: {
  photographer: string;
  photographerUrl: string;
}) {

// Also update the caller (line 120-123):
// BEFORE:
<UnsplashAttribution
  photographer={countryImage.photographer}
  photographerUrl={countryImage.photographerUrl}
  unsplashUrl={countryImage.unsplashUrl}    // <-- REMOVE this
/>

// AFTER:
<UnsplashAttribution
  photographer={countryImage.photographer}
  photographerUrl={countryImage.photographerUrl}
/>
```

## State of the Art

Not applicable -- this is a cleanup phase with no new technology adoption.

## Open Questions

1. **Are the Phase 11 guardrail policies actually live in Supabase?**
   - What we know: `rls-policies.sql` documents them; Phase 11 SUMMARY claims they were applied
   - What's unclear: We cannot verify live database state from code alone
   - Recommendation: First task in plan MUST be to query `pg_policies` to verify before dropping anything

2. **Has SIRI-02 been fully resolved by Phase 16?**
   - What we know: Phase 16 SUMMARY exists, git log shows fix commits
   - What's unclear: Whether user has verified Siri timer works end-to-end in production
   - Recommendation: Check SIRI-02 checkbox but note it depends on Phase 16 completion

## Sources

### Primary (HIGH confidence)
- `supabase/schema.sql` -- contains the "Allow all" policies (lines 61-64)
- `supabase/rls-policies.sql` -- contains the guardrail policies (Phase 11)
- `src/components/sidebar/CountryPanel.tsx` -- unused `unsplashUrl` prop (line 13)
- `src/components/calendar/DayRow.tsx` -- weather placement verified (lines 46-54)
- `src/components/calendar/EventCard.tsx` -- person badge placement verified (lines 59-72)
- `src/lib/calendar/config.ts` -- emoji unicode codepoints verified (lines 3-35)
- `.planning/REQUIREMENTS.md` -- current checkbox state
- `.planning/v1.1-MILESTONE-AUDIT.md` -- audit findings driving this phase

### Secondary (MEDIUM confidence)
- PostgreSQL docs on permissive policy OR behavior -- well-established Postgres behavior
- Vite build output -- confirmed no CountryPanel warnings currently

## Metadata

**Confidence breakdown:**
- RLS cleanup approach: HIGH -- Postgres policy behavior is well-documented, schema files clearly show the conflict
- Calendar verification: HIGH -- code inspection confirms correct implementation, visual check is formality
- CountryPanel fix: HIGH -- dead prop clearly identified in source code
- Docs update: HIGH -- straightforward checkbox changes based on known completion status

**Research date:** 2026-02-18
**Valid until:** No expiry -- cleanup tasks are based on current codebase state, not external dependencies
