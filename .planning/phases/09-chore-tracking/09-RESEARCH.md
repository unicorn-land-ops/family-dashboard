# Phase 9: Chore Tracking - Research

**Researched:** 2026-02-17
**Domain:** Chore CRUD, schedule-based reset logic, completion tracking, wall display
**Confidence:** HIGH

## Summary

Phase 9 adds chore tracking to the family dashboard. The database schema already exists (`chores` and `chore_completions` tables in `supabase/schema.sql` and `src/types/database.ts`), realtime subscriptions are proven infrastructure, and the hook/API/panel pattern is thoroughly established by Phases 6 (groceries) and 7 (timers). The primary new complexity is **schedule-aware completion logic** -- determining whether a chore "needs doing" based on its schedule type (`daily`, `weekly`, `once`) and the most recent entry in `chore_completions`.

The family consists of four members: Papa, Daddy, Wren (13), and Ellis (9). Chores split into two conceptual categories: **daily routines** (recurring kid tasks like "brush teeth", "pack bag") and **household jobs** (assigned to any family member, daily or weekly). Both use the same `chores` table -- the distinction is purely presentational.

**Primary recommendation:** Follow the groceries/timers pattern exactly (API module, hook with React Query + realtime, Panel with full/compact variants). The only novel logic is a pure `isChoreNeeded(chore, completions)` function that compares the latest completion timestamp against the current period boundary (start of today for daily, start of week for weekly).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHOR-01 | Define daily routines for kids (recurring tasks) | Chore CRUD with `schedule: 'daily'` and `assigned_to: 'wren'/'ellis'`. Same `chores` table, filtered by assigned_to for kid routines. |
| CHOR-02 | Define household jobs assignable to family members | Chore CRUD with `assigned_to` set to any family member ID. ChoreInput component on mobile. |
| CHOR-03 | Mark chores complete from mobile phone | Insert row into `chore_completions` with `chore_id` and `completed_by`. Optimistic update in hook. |
| CHOR-04 | Wall display shows chore progress/status | ChorePanel compact variant in sidebar. Progress bar showing completed/total for current period. |
| CHOR-05 | Chores reset on schedule (daily/weekly) | Pure function `isChoreNeeded()` checks latest completion against period boundary. No DB writes needed -- "reset" is derived from time. |
</phase_requirements>

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.95+ | Database CRUD + realtime | Already configured, typed, proven in groceries/timers |
| @tanstack/react-query | 5.x | Data fetching, caching, mutations | Already configured with QueryClientProvider in main.tsx |
| date-fns / date-fns-tz | 4.x | Period boundary calculation (startOfDay, startOfWeek) | Already in project for clock/calendar |
| react-icons/io5 | 5.x | Icons for nav and UI | Already used in MobileNav, panels |
| Tailwind CSS v4 | 4.x | Styling | Already configured |

### No new dependencies needed

This phase requires zero new npm packages. All functionality is achievable with the existing stack.

## Architecture Patterns

### Recommended File Structure

```
src/
├── lib/api/
│   └── chores.ts              # Supabase CRUD for chores + chore_completions
├── lib/
│   └── choreSchedule.ts       # Pure functions: isChoreNeeded, getperiodBoundary, groupByAssignee
├── hooks/
│   └── useChores.ts           # React Query + realtime hook (follows useGroceries pattern)
├── components/chore/
│   ├── ChorePanel.tsx          # full (mobile) + compact (wall sidebar) variants
│   ├── ChoreList.tsx           # Renders grouped chore items
│   ├── ChoreItem.tsx           # Single chore row with completion toggle
│   └── ChoreInput.tsx          # Add new chore form (mobile only)
```

### Pattern 1: API Module (follows `src/lib/api/groceries.ts`)

**What:** Thin async functions wrapping Supabase queries.
**When to use:** All database operations.
**Example:**

```typescript
// src/lib/api/chores.ts
import { supabase } from '../supabase';
import type { Chore, ChoreCompletion } from '../../types/database';

export async function fetchChores(): Promise<Chore[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .eq('is_active', true)
    .order('assigned_to', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCompletions(since: string): Promise<ChoreCompletion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chore_completions')
    .select('*')
    .gte('completed_at', since)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addChore(
  title: string,
  assignedTo: string | null,
  schedule: 'daily' | 'weekly' | 'once',
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chores')
    .insert({ title, assigned_to: assignedTo, schedule });
  if (error) throw error;
}

export async function completeChore(choreId: string, completedBy: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chore_completions')
    .insert({ chore_id: choreId, completed_by: completedBy });
  if (error) throw error;
}

export async function deactivateChore(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('chores')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}
```

### Pattern 2: Schedule-Aware Completion Logic (novel for this phase)

**What:** Pure functions that determine if a chore needs doing based on schedule type and last completion time.
**When to use:** Both wall display (progress calculation) and mobile (toggle state).
**Key insight:** "Reset" is not a database operation. It is a derived computation. A daily chore "resets" when the current time passes the start of a new day in Berlin timezone. No cron job, no scheduled DB cleanup.

```typescript
// src/lib/choreSchedule.ts
import { startOfDay, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Chore, ChoreCompletion } from '../types/database';

const TIMEZONE = 'Europe/Berlin';

/** Get the start of the current period for a chore's schedule */
export function getPeriodStart(schedule: 'daily' | 'weekly' | 'once'): Date {
  const now = toZonedTime(new Date(), TIMEZONE);
  if (schedule === 'daily') return startOfDay(now);
  if (schedule === 'weekly') return startOfWeek(now, { weekStartsOn: 1 }); // Monday
  return new Date(0); // 'once' -- any completion ever counts
}

/** Check if a chore has been completed in its current period */
export function isChoreCompleted(
  chore: Chore,
  completions: ChoreCompletion[],
): boolean {
  const periodStart = getPeriodStart(chore.schedule);
  return completions.some(
    (c) =>
      c.chore_id === chore.id &&
      new Date(c.completed_at) >= periodStart,
  );
}

/** Get who completed a chore in the current period (for display) */
export function getCompletionInfo(
  chore: Chore,
  completions: ChoreCompletion[],
): ChoreCompletion | undefined {
  const periodStart = getPeriodStart(chore.schedule);
  return completions.find(
    (c) =>
      c.chore_id === chore.id &&
      new Date(c.completed_at) >= periodStart,
  );
}

/** Group chores by assignee for display */
export function groupByAssignee(chores: Chore[]): Map<string, Chore[]> {
  const grouped = new Map<string, Chore[]>();
  for (const chore of chores) {
    const key = chore.assigned_to ?? 'unassigned';
    const group = grouped.get(key) ?? [];
    group.push(chore);
    grouped.set(key, group);
  }
  return grouped;
}
```

### Pattern 3: Hook (follows `useGroceries` / `useTimers`)

**What:** React Query queries + mutations + realtime subscription.
**Key difference from groceries:** Two queries (chores + completions), two realtime subscriptions (both tables).

```typescript
// src/hooks/useChores.ts -- skeleton
const CHORES_KEY = ['chores'];
const COMPLETIONS_KEY = ['chore-completions'];

export function useChores() {
  // Query 1: active chores
  // Query 2: completions since earliest relevant period (7 days ago covers weekly)
  // Realtime: subscribe to both 'chores' and 'chore_completions' tables
  // Mutations: addChore, completeChore, deactivateChore
  // Derived: combine chores + completions using isChoreCompleted()
  // Return: chores, completedCount, totalCount, addChore, completeChore, etc.
}
```

### Pattern 4: Panel Variants (follows GroceryPanel / TimerPanel)

**What:** Single component with `variant: 'full' | 'compact'` prop.
- **compact:** Wall sidebar card showing progress summary (e.g., "Chores 4/7 done") with list of remaining items.
- **full:** Mobile view with chore list grouped by person, completion toggles, and add-chore form.

### Pattern 5: Mobile Nav Integration

**What:** Add "Chores" tab to MobileNav alongside Calendar, Groceries, Timers.
**Requires:** Update `MobileView` type union in `useMobileNav.ts`, add tab entry in `MobileNav.tsx`, add view switch in `App.tsx`.

### Anti-Patterns to Avoid

- **Cron-based reset:** Do NOT create a scheduled job to "reset" chores by deleting completions. Completions are permanent history. "Reset" is derived from time comparison.
- **Separate tables for routines vs jobs:** Both are chores. Filter by `assigned_to` for kid routines. One table, one hook.
- **Deleting completions on "undo":** If someone accidentally marks complete, insert a DELETE for that completion row. Do not clear all completions.
- **Per-chore realtime subscriptions:** Subscribe to the whole `chore_completions` table once, invalidate both query keys. Same pattern as groceries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Period boundary calculation | Manual date math | date-fns `startOfDay`, `startOfWeek` with date-fns-tz | Timezone-aware, handles DST transitions |
| Realtime sync | Custom WebSocket logic | `useSupabaseRealtime` hook (already built) | Handles cleanup, reconnection, subscription management |
| Data caching | Manual state management | React Query with `invalidateQueries` | Proven in groceries/timers, handles stale data |
| Optimistic updates | Custom rollback logic | React Query `onMutate` / `onError` pattern | Proven pattern in useGroceries |

## Common Pitfalls

### Pitfall 1: Timezone-Incorrect Period Boundaries
**What goes wrong:** Using `new Date()` directly for `startOfDay()` gives UTC midnight, not Berlin midnight. A chore completed at 11pm Berlin time would appear as "not done" if period boundary is UTC.
**Why it happens:** JavaScript Date is UTC-based.
**How to avoid:** Always convert to Berlin zoned time before computing period boundaries: `toZonedTime(new Date(), 'Europe/Berlin')`.
**Warning signs:** Chores "resetting" at 1am or 2am Berlin time instead of midnight.

### Pitfall 2: Fetching Too Many Completions
**What goes wrong:** Fetching ALL completions ever for every render. Table grows unbounded over time.
**Why it happens:** No time filter on completions query.
**How to avoid:** Only fetch completions since 7 days ago (covers weekly schedule). For `once` chores, the chore itself can track completed state or fetch completions without time limit but only for `once`-scheduled chores.
**Recommendation:** Fetch completions from `startOfWeek(now) - 1 day` as a safety margin. For `once` chores, a simpler approach: when a `once` chore is completed, set `is_active = false` on the chore itself, removing it from the active list entirely.

### Pitfall 3: Duplicate Completions
**What goes wrong:** User taps "complete" twice quickly, creating two completion records.
**Why it happens:** No optimistic UI preventing double-tap.
**How to avoid:** Optimistically mark the chore as completed in the UI immediately on first tap (same pattern as grocery toggleItem). Disable the button while mutation is in-flight.

### Pitfall 4: Wall Display Clutter
**What goes wrong:** Showing all chores on the compact sidebar makes it too busy.
**Why it happens:** Treating compact variant same as full variant.
**How to avoid:** Compact variant shows only a progress summary ("Chores: 5/8 done") and optionally lists only the REMAINING (uncompleted) chores. Group by person with emoji badges from calendar config.

### Pitfall 5: Week Start Day
**What goes wrong:** Weekly chores reset on Sunday (date-fns default) instead of Monday.
**Why it happens:** `startOfWeek` defaults to `weekStartsOn: 0` (Sunday).
**How to avoid:** Always pass `{ weekStartsOn: 1 }` for Monday start (European convention, consistent with Berlin locale).

## Code Examples

### Fetching Completions with Time Boundary

```typescript
// Only fetch completions relevant to current display period
export async function fetchRecentCompletions(): Promise<ChoreCompletion[]> {
  if (!supabase) return [];

  // 8 days back covers any weekly boundary
  const since = new Date();
  since.setDate(since.getDate() - 8);

  const { data, error } = await supabase
    .from('chore_completions')
    .select('*')
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

### Family Member Constants (reuse from calendar config)

```typescript
// Reuse person IDs from calendar config for consistency
// assigned_to values: 'papa', 'daddy', 'wren', 'ellis'
// These match CALENDAR_FEEDS[].id from src/lib/calendar/config.ts
```

### Completing a Chore with Optimistic Update

```typescript
const completeChoreMutation = useMutation({
  mutationFn: ({ choreId, completedBy }: { choreId: string; completedBy: string }) =>
    completeChore(choreId, completedBy),
  onMutate: async ({ choreId, completedBy }) => {
    await queryClient.cancelQueries({ queryKey: COMPLETIONS_KEY });
    const previous = queryClient.getQueryData<ChoreCompletion[]>(COMPLETIONS_KEY);

    const optimistic: ChoreCompletion = {
      id: crypto.randomUUID(),
      chore_id: choreId,
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
    };
    queryClient.setQueryData<ChoreCompletion[]>(COMPLETIONS_KEY, (old = []) => [optimistic, ...old]);

    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) {
      queryClient.setQueryData(COMPLETIONS_KEY, context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY });
  },
});
```

### Progress Calculation for Wall Display

```typescript
export function getChoreProgress(
  chores: Chore[],
  completions: ChoreCompletion[],
): { completed: number; total: number } {
  const total = chores.length;
  const completed = chores.filter((c) => isChoreCompleted(c, completions)).length;
  return { completed, total };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cron job resets chores daily | Derived from completion timestamps | N/A (design choice) | No background jobs, no data loss, full history |
| Separate routine/chore tables | Single chores table, filtered by assigned_to | N/A (design choice) | Simpler schema, one hook |
| Delete completions on "reset" | Keep all completions, filter by period | N/A (design choice) | Audit trail of who did what when |

## Integration Points

### App.tsx Changes
- Import `useChores` hook for sidebar priority check (optional -- chores may or may not interrupt rotation)
- Add `activeView === 'chores'` branch in main content area
- Render `<ChorePanel variant="compact" />` in sidebar (always visible, or in priority mode)

### MobileNav Changes
- Add `'chores'` to `MobileView` type union
- Add chores tab with `IoCheckmarkDoneCircleOutline` or similar icon

### Priority Interrupt Decision
Chores are NOT time-sensitive like timers. They should appear in the sidebar rotation or as a static card, NOT as a priority interrupt. The wall display should show chore progress as an always-visible compact card in the sidebar, similar to how groceries work in priority mode but without interrupting content rotation.

**Recommendation:** Add ChorePanel compact as a persistent sidebar element below the rotation area, OR add it as a 4th rotation panel. The simpler approach is to show it as a persistent card below rotation (similar to how groceries show in priority mode).

## Open Questions

1. **Who is "completing" on mobile?**
   - What we know: No auth system. Groceries use `added_by` as an optional label.
   - What's unclear: Should the app ask "Who are you?" when marking a chore complete, or default to a selection?
   - Recommendation: Simple person picker (4 buttons: Papa, Daddy, Wren, Ellis) shown when completing a chore. Store selection in localStorage as default for next time. Low friction.

2. **Should chores appear in sidebar rotation or as persistent card?**
   - What we know: Priority interrupts are for time-sensitive items (timers, groceries).
   - Recommendation: Persistent compact card below sidebar rotation area. Chore progress is ambient information, always relevant, not time-urgent.

3. **Pre-seeded chores vs empty start?**
   - What we know: Family has specific routines (brush teeth, pack bag, etc.)
   - Recommendation: App starts empty. User adds chores from mobile. Could provide a "seed data" SQL script in docs, but app should work without it.

## Sources

### Primary (HIGH confidence)
- `supabase/schema.sql` -- existing chores + chore_completions table definitions
- `src/types/database.ts` -- existing TypeScript types for Chore and ChoreCompletion
- `src/hooks/useGroceries.ts` -- proven hook pattern (React Query + realtime + optimistic updates)
- `src/hooks/useTimers.ts` -- proven hook pattern (React Query + realtime)
- `src/lib/api/groceries.ts` -- proven API module pattern
- `src/lib/api/timers.ts` -- proven API module pattern
- `src/components/grocery/GroceryPanel.tsx` -- proven full/compact panel pattern
- `src/components/timer/TimerPanel.tsx` -- proven full/compact panel pattern
- `src/hooks/useMobileNav.ts` -- MobileView type to extend
- `src/lib/calendar/config.ts` -- family member IDs and emoji mapping

### Secondary (HIGH confidence)
- date-fns `startOfDay`, `startOfWeek` -- well-known API, already in project
- date-fns-tz `toZonedTime` -- already used in clock/calendar features

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns proven in codebase
- Architecture: HIGH -- direct extension of groceries/timers patterns
- Schedule logic: HIGH -- pure date math with well-known date-fns functions
- Pitfalls: HIGH -- identified from real timezone and data growth concerns

**Research date:** 2026-02-17
**Valid until:** 2026-04-17 (stable domain, no external API dependencies)
