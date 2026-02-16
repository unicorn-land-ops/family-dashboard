# Phase 6: Grocery List - Research

**Researched:** 2026-02-17
**Domain:** Supabase CRUD, React Query optimistic updates, touch-friendly mobile UI, realtime sync
**Confidence:** HIGH

## Summary

Phase 6 builds the first interactive household feature on top of the Phase 5 realtime infrastructure. The grocery list is a straightforward CRUD application against the existing `groceries` Supabase table (already defined in `supabase/schema.sql` and typed in `src/types/database.ts`). The architecture combines React Query for server state management with Supabase Realtime subscriptions for cross-device sync, and the existing `useSupabaseRealtime` hook for live updates.

The key architectural pattern is "React Query as primary state layer, Supabase Realtime as invalidation trigger." Initial data loads via `useQuery` with Supabase `.from('groceries').select()`. Mutations use `useMutation` with optimistic updates (update cache immediately, roll back on error). The existing `useSupabaseRealtime` hook listens for `postgres_changes` and calls `queryClient.invalidateQueries` when another device makes changes. This gives instant local feedback AND cross-device sync without complex state management.

The mobile UI needs to be touch-friendly with large tap targets (minimum 44px per Apple HIG), an always-visible text input for adding items, and a simple tap-to-check/uncheck interaction. Swipe-to-delete is deferred to avoid adding a gesture library dependency for this phase -- a delete button revealed on tap or a long-press delete is simpler and more reliable. On the wall display (kiosk), the grocery list appears in the sidebar when items exist, replacing or interrupting the content rotation (full priority interrupt behavior is Phase 8, but basic visibility is Phase 6).

**Primary recommendation:** Build a `useGroceries` hook combining `useQuery` + `useMutation` + `useSupabaseRealtime` for full CRUD with optimistic updates and realtime sync. No new dependencies needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GROC-01 | Add grocery items from mobile phone | `useMutation` with Supabase `.insert()`, touch-friendly input component |
| GROC-02 | Check off / remove items from mobile phone | `useMutation` with `.update()` for check, `.delete()` for remove, optimistic cache updates |
| GROC-03 | Shared list syncs in real-time across all devices | `useSupabaseRealtime` on `groceries` table triggers `invalidateQueries` |
| GROC-04 | Wall display shows grocery list when items exist | Conditional rendering in sidebar based on unchecked item count |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95 (existing) | Database CRUD + realtime subscriptions | Already installed, Phase 5 infrastructure |
| @tanstack/react-query | ^5.90 (existing) | Server state, optimistic updates, cache | Already installed, used throughout the app |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-icons | ^5.5 (existing) | Icons for check, delete, add buttons | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual optimistic updates | @supabase-cache-helpers/postgrest-react-query | Automates cache sync but adds dependency + learning curve; overkill for one table |
| Tap-to-delete | react-swipeable-list (swipe-to-delete) | More native feel but adds dependency; defer to Phase 10 polish if desired |
| Manual realtime + invalidation | supaquery | Wrapper lib that automates realtime+query; too opinionated, hides the simple pattern |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useGroceries.ts          # useQuery + useMutation + realtime invalidation
  components/
    grocery/
      GroceryPanel.tsx        # Main container (used in both mobile and kiosk)
      GroceryInput.tsx        # Text input + add button
      GroceryItem.tsx         # Single item row (checkbox, name, delete)
      GroceryList.tsx         # Scrollable list of GroceryItem
  lib/
    api/
      groceries.ts            # Supabase query/mutation functions
```

### Pattern 1: React Query as Primary State + Realtime Invalidation
**What:** Use `useQuery` for initial fetch and cache, `useMutation` for writes with optimistic updates, and `useSupabaseRealtime` to invalidate the query when another device makes changes.
**When to use:** Every Supabase-backed feature (groceries, timers, chores).
**Example:**
```typescript
// src/hooks/useGroceries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { Grocery } from '../types/database';

const QUERY_KEY = ['groceries'];

// Fetch all grocery items, unchecked first, then by creation date
async function fetchGroceries(): Promise<Grocery[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groceries')
    .select('*')
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useGroceries() {
  const queryClient = useQueryClient();

  // Initial fetch + cache
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchGroceries,
    enabled: supabaseEnabled,
    staleTime: 30_000,
  });

  // Realtime: invalidate cache when another device changes data
  useSupabaseRealtime({
    table: 'groceries',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // ... mutations (see Pattern 2)
  return { ...query, addItem, toggleItem, removeItem };
}
```

### Pattern 2: Optimistic Mutations with Rollback
**What:** Update the local cache immediately on user action, then confirm with server. Roll back if server fails.
**When to use:** Add, check/uncheck, and delete operations where instant feedback matters.
**Example:**
```typescript
// Add item mutation with optimistic update
const addItem = useMutation({
  mutationFn: async (name: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('groceries')
      .insert({ name, checked: false, added_by: null });
    if (error) throw error;
  },
  onMutate: async (name: string) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEY });
    const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);

    // Optimistic: add temp item to cache
    const optimistic: Grocery = {
      id: crypto.randomUUID(), // temp ID, replaced on refetch
      name,
      checked: false,
      added_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) => [optimistic, ...old]);
    return { previous };
  },
  onError: (_err, _name, context) => {
    // Roll back on failure
    if (context?.previous) {
      queryClient.setQueryData(QUERY_KEY, context.previous);
    }
  },
  onSettled: () => {
    // Always refetch to get server truth
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  },
});

// Toggle checked mutation
const toggleItem = useMutation({
  mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('groceries')
      .update({ checked, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
  onMutate: async ({ id, checked }) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEY });
    const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);
    queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) =>
      old.map((item) => (item.id === id ? { ...item, checked } : item))
    );
    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
});

// Delete mutation
const removeItem = useMutation({
  mutationFn: async (id: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('groceries').delete().eq('id', id);
    if (error) throw error;
  },
  onMutate: async (id: string) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEY });
    const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);
    queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) =>
      old.filter((item) => item.id !== id)
    );
    return { previous };
  },
  onError: (_err, _id, context) => {
    if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
});
```

### Pattern 3: Conditional Sidebar Visibility (Wall Display)
**What:** Show grocery list in sidebar only when unchecked items exist. On mobile, show as main content.
**When to use:** Wall display layout integration.
**Example:**
```typescript
// In App.tsx or a parent component
const { data: groceries } = useGroceries();
const uncheckedCount = groceries?.filter(g => !g.checked).length ?? 0;
const hasGroceryItems = uncheckedCount > 0;

// Wall display: show grocery panel in sidebar when items exist
// Mobile: show grocery panel in main area (always accessible for input)
```

### Pattern 4: Mobile-First Input
**What:** Sticky input at bottom of screen with large touch targets.
**When to use:** Mobile grocery input.
**Example:**
```tsx
// GroceryInput.tsx
function GroceryInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add item..."
        className="flex-1 min-h-[44px] rounded-lg bg-white/10 px-4 text-white
                   placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent-gold"
        autoComplete="off"
        enterKeyHint="done"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="min-h-[44px] min-w-[44px] rounded-lg bg-accent-gold text-bg-primary
                   font-bold disabled:opacity-30"
      >
        +
      </button>
    </form>
  );
}
```

### Anti-Patterns to Avoid
- **Using useState for grocery list state:** React Query already manages server state. Adding local state creates sync issues. Use the query cache as the single source of truth.
- **Subscribing to realtime AND refetching on a timer:** The realtime subscription makes polling unnecessary. Only refetch via `invalidateQueries` when a realtime event arrives or after a mutation.
- **Deleting checked items automatically:** Users expect checked items to remain visible until explicitly removed. Auto-deletion causes confusion.
- **Separate realtime channels per event type:** One channel with `event: '*'` is sufficient for groceries. Three channels (INSERT, UPDATE, DELETE) waste connections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server state cache | Manual useState + fetch | React Query useQuery | Handles loading, error, stale, refetch, cache |
| Optimistic updates | Manual pending state tracking | React Query useMutation onMutate | Built-in rollback, cache updates, settled refetch |
| Realtime sync | Custom WebSocket message parsing | useSupabaseRealtime + invalidateQueries | Already built in Phase 5, handles cleanup |
| UUID generation | Custom ID scheme | crypto.randomUUID() | Browser-native, same format as Supabase UUIDs |
| Form submission | onClick with manual enter key handling | HTML form onSubmit | Handles Enter key, mobile "done" button, accessibility |

**Key insight:** The Phase 5 infrastructure (`useSupabaseRealtime`, `useOfflineQueue`, `useConnectionStatus`) combined with React Query's `useMutation` optimistic updates covers 90% of the grocery list's complexity. The actual Phase 6 work is mostly UI components.

## Common Pitfalls

### Pitfall 1: Realtime Event Causes Double Refetch
**What goes wrong:** A mutation triggers `onSettled` which calls `invalidateQueries`. The same mutation also triggers a realtime event which calls `invalidateQueries` again. Two refetches fire.
**Why it happens:** The mutation is both a local action (triggering onSettled) and a database change (triggering realtime).
**How to avoid:** This is mostly harmless -- React Query deduplicates concurrent refetches for the same query key. The second invalidation is a no-op if the first is already in-flight. No special handling needed.
**Warning signs:** Network tab shows duplicate SELECT queries (acceptable, not a bug).

### Pitfall 2: Optimistic Update Uses Wrong Sort Order
**What goes wrong:** Optimistic update inserts item at start of array, but server returns items sorted differently.
**Why it happens:** The `onMutate` update and the server query use different sort logic.
**How to avoid:** Match the optimistic insert position to the server sort order. If server sorts `checked ASC, created_at DESC`, insert unchecked items at the top of the unchecked section.
**Warning signs:** Item "jumps" position after server confirms.

### Pitfall 3: Stale Closure in Realtime Callback
**What goes wrong:** The `onPayload` callback in `useSupabaseRealtime` captures a stale `queryClient` reference.
**Why it happens:** The hook uses `useRef` for `onPayload` (already handled in Phase 5's implementation), but if the consumer creates a new function on every render, it could be an issue.
**How to avoid:** The existing `useSupabaseRealtime` hook already stores `onPayload` in a ref (`onPayloadRef.current = onPayload`). This is safe. Just pass a stable or inline callback -- the ref handles staleness.
**Warning signs:** Realtime events arrive but cache does not update.

### Pitfall 4: Mobile Keyboard Pushes Layout
**What goes wrong:** On iPhone Safari, the virtual keyboard pushes the page up, hiding the grocery list items above the input.
**Why it happens:** iOS Safari resizes the visual viewport when the keyboard appears.
**How to avoid:** Use `dvh` units (already in use: `h-dvh` on DashboardShell), and place the input at the bottom with `sticky` positioning. The `dvh` unit accounts for the keyboard. Also consider `scrollIntoView` on the input focus.
**Warning signs:** Items scroll out of view when typing on iPhone.

### Pitfall 5: Empty State Confusion
**What goes wrong:** Wall display shows an empty grocery panel taking up space when there are no items.
**Why it happens:** Component renders regardless of item count.
**How to avoid:** Only render `GroceryPanel` in the sidebar when `uncheckedCount > 0`. On mobile, always show (so users can add items), but show a friendly empty state message.
**Warning signs:** Empty white card visible on wall display.

## Code Examples

### Supabase Grocery CRUD Functions
```typescript
// src/lib/api/groceries.ts
import { supabase } from '../supabase';
import type { Grocery } from '../../types/database';

export async function fetchGroceries(): Promise<Grocery[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groceries')
    .select('*')
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addGrocery(name: string, addedBy?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .insert({ name, checked: false, added_by: addedBy ?? null });
  if (error) throw error;
}

export async function toggleGrocery(id: string, checked: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .update({ checked, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeGrocery(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function clearCheckedGroceries(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('groceries')
    .delete()
    .eq('checked', true);
  if (error) throw error;
}
```

### GroceryItem Component (Touch-Friendly)
```tsx
// src/components/grocery/GroceryItem.tsx
import { IoCheckmarkCircle, IoEllipseOutline, IoTrashOutline } from 'react-icons/io5';
import type { Grocery } from '../../types/database';

interface GroceryItemProps {
  item: Grocery;
  onToggle: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
}

export function GroceryItem({ item, onToggle, onRemove }: GroceryItemProps) {
  return (
    <div className="flex items-center gap-3 min-h-[44px] px-3 py-2 group">
      {/* Checkbox -- 44px minimum touch target */}
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center"
        aria-label={item.checked ? 'Uncheck' : 'Check'}
      >
        {item.checked ? (
          <IoCheckmarkCircle className="w-6 h-6 text-green-400" />
        ) : (
          <IoEllipseOutline className="w-6 h-6 text-white/40" />
        )}
      </button>

      {/* Item name */}
      <span className={`flex-1 text-base ${item.checked ? 'line-through text-white/30' : 'text-white'}`}>
        {item.name}
      </span>

      {/* Delete button -- visible on hover (desktop) or always subtle (mobile) */}
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center
                   text-white/20 hover:text-red-400 transition-colors"
        aria-label="Remove"
      >
        <IoTrashOutline className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### Wall Display Integration
```tsx
// In App.tsx sidebar section, conditional rendering
{hasGroceryItems && (
  <div className="card-glass p-4">
    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
      Groceries ({uncheckedCount})
    </h3>
    <GroceryList items={groceries.filter(g => !g.checked)} />
  </div>
)}
```

### Mobile Layout Approach
```tsx
// On mobile, grocery list is a full-screen scrollable view
// with sticky input at bottom
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">
    <GroceryList items={groceries} onToggle={toggle} onRemove={remove} />
  </div>
  <div className="sticky bottom-0 bg-bg-primary/80 backdrop-blur-sm border-t border-white/10">
    <GroceryInput onAdd={add} />
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState + manual fetch | React Query useQuery + useMutation | 2023+ | Eliminates manual loading/error/cache state |
| Manual WebSocket state sync | Realtime invalidation via queryClient | 2024+ | One line instead of event-type-specific handlers |
| Swipe-to-delete via custom gestures | Simple tap delete button | Always valid | Swipe adds complexity; tap is universally understood |
| Separate mobile/desktop components | Responsive Tailwind with fluid sizing | 2024+ | One component, CSS handles layout differences |

**Deprecated/outdated:**
- React Query v4 `onMutate` API: v5 changed callback signatures slightly. Use v5 patterns.
- `supabase-js` v1 subscription API: Completely different. Use v2 channel-based API.

## Open Questions

1. **Mobile navigation to grocery list**
   - What we know: Mobile layout currently hides the sidebar and shows only the main content (calendar).
   - What's unclear: How does the user navigate to the grocery list on mobile? Options: (a) tab bar at bottom, (b) swipe between views, (c) button in header.
   - Recommendation: Add a simple tab/nav bar at the bottom of the mobile layout with icons for Calendar and Groceries. This is the simplest pattern that scales to Timers (Phase 7) and Chores (Phase 9). Two tabs for now, add more later.

2. **Clear checked items UX**
   - What we know: Checked items should remain visible until explicitly cleared.
   - What's unclear: Should there be a "Clear completed" button, or should users delete items one by one?
   - Recommendation: Add a "Clear done" button that appears only when checked items exist. Uses `clearCheckedGroceries()` (delete where checked=true). Single batch operation is faster than individual deletes.

3. **Wall display grocery placement**
   - What we know: Phase 8 handles priority interrupts (grocery list interrupts content rotation). Phase 6 just needs basic visibility.
   - What's unclear: Should grocery list appear in the sidebar alongside rotation, or replace it?
   - Recommendation: For Phase 6, show the grocery list as an additional card above the ContentRotator in the sidebar when items exist. Phase 8 will handle the full priority interrupt pattern (replacing rotation). Keep it simple now.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/hooks/useSupabaseRealtime.ts`, `src/hooks/useOfflineQueue.ts`, `src/types/database.ts`, `supabase/schema.sql`
- [TanStack Query v5 Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates) - onMutate/onError/onSettled pattern
- [TanStack Query v5 Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations) - useMutation API

### Secondary (MEDIUM confidence)
- [Supabase + TanStack Query Integration Guide](https://makerkit.dev/blog/saas/supabase-react-query) - Combining realtime with React Query
- [Supabase Postgres Changes Docs](https://supabase.com/docs/guides/realtime/postgres-changes) - Subscription API (verified in Phase 5 research)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/buttons) - 44pt minimum touch target

### Tertiary (LOW confidence)
- [react-swipeable-list](https://www.npmjs.com/package/react-swipeable-list) - Swipe-to-delete option (deferred, not recommended for Phase 6)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, no new packages needed
- Architecture: HIGH - Pattern (React Query + Supabase Realtime invalidation) is well-documented and verified
- CRUD operations: HIGH - Supabase `.from().insert/update/delete` API is straightforward, schema already defined
- Optimistic updates: HIGH - TanStack Query v5 pattern is mature and well-documented
- Mobile UI: MEDIUM - Touch target sizes verified, but mobile navigation (tab bar) is an open question
- Wall display integration: MEDIUM - Basic sidebar card is clear, but interaction with content rotation needs Phase 8

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no new dependencies, patterns are mature)
