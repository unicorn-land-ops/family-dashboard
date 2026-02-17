# Phase 14: Behavior Cleanup - Research

**Researched:** 2026-02-17
**Domain:** React state logic, mobile navigation, priority interrupt filtering
**Confidence:** HIGH

## Summary

Phase 14 addresses two behavior corrections: (1) grocery list items should NOT trigger the priority interrupt on the wall display -- only active timers should, and (2) the timer tab should be removed from the mobile navigation bar since timers are set via Siri (Phase 15) and only displayed as priority interrupts on the wall.

Both changes are surgical modifications to existing code. The priority interrupt logic lives in `usePriorityInterrupt.ts` (54 lines) and currently treats both active timers AND unchecked groceries as priority triggers. The mobile navigation lives in `MobileNav.tsx` (34 lines) with a simple `tabs` array that includes a `timers` entry. The `MobileView` type union in `useMobileNav.ts` also includes `'timers'`.

**Primary recommendation:** Remove grocery count from the priority interrupt condition in `usePriorityInterrupt`, remove the timer tab from `MobileNav.tsx`, update the `MobileView` type to exclude `'timers'`, and clean up the timer view rendering path in `App.tsx`. Verify no dead states remain after removal.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BEHV-01 | Grocery list does not trigger priority interrupt (only active timers do) | Direct modification to `usePriorityInterrupt` hook -- remove `uncheckedGroceryCount` from priority condition |
| BEHV-02 | Timer tab removed from mobile navigation (timers remain visible as priority interrupt on wall) | Remove timer entry from `MobileNav.tsx` tabs array, update `MobileView` type, clean up `App.tsx` timer view branch |

</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase modifies existing code only.

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| React | 19.x | Component state, hooks | Yes |
| TypeScript | 5.x | Type safety for MobileView union | Yes |
| Tailwind CSS | v4 | Layout styling (nav bar spacing) | Yes |

## Architecture Patterns

### Current Priority Interrupt Logic (`usePriorityInterrupt.ts`)

```typescript
// CURRENT: Both timers AND groceries trigger priority mode
const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;
const hasGroceries = uncheckedGroceryCount > 0;
const hasPriority = hasActiveTimers || hasGroceries;  // <-- groceries included
```

**Problem:** Grocery items are persistent (they stay until checked off). This means the sidebar rotation is permanently interrupted whenever a grocery list exists, which defeats the purpose of the rotating content (transit, horoscopes, country).

### Target Priority Interrupt Logic

```typescript
// TARGET: Only timers trigger priority mode
const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;
const hasPriority = hasActiveTimers;  // <-- groceries removed
```

**Impact on return value:** The `showGroceries` and `showTimers` fields in the `PriorityState` interface need updating. Since groceries no longer trigger priority mode, `showGroceries` can be removed or kept as always-false. The simplest approach is to remove it entirely and simplify the interface.

### Current Mobile Navigation (`MobileNav.tsx`)

```typescript
// CURRENT: 4 tabs including timers
const tabs = [
  { view: 'calendar', label: 'Calendar', icon: IoCalendarOutline },
  { view: 'groceries', label: 'Groceries', icon: IoCartOutline },
  { view: 'timers', label: 'Timers', icon: IoTimerOutline },      // <-- to remove
  { view: 'chores', label: 'Chores', icon: IoCheckmarkDoneCircleOutline },
];
```

### Target Mobile Navigation

```typescript
// TARGET: 3 tabs, no timers
const tabs = [
  { view: 'calendar', label: 'Calendar', icon: IoCalendarOutline },
  { view: 'groceries', label: 'Groceries', icon: IoCartOutline },
  { view: 'chores', label: 'Chores', icon: IoCheckmarkDoneCircleOutline },
];
```

**Visual impact:** Going from 4 tabs to 3. Each tab uses `flex-1` so they auto-distribute. Three tabs will be wider (33% vs 25% each), which is actually better for touch targets. No CSS changes needed.

### Files That Need Modification

| File | Change | Complexity |
|------|--------|------------|
| `src/hooks/usePriorityInterrupt.ts` | Remove grocery count from priority condition; simplify interface | Trivial |
| `src/hooks/useMobileNav.ts` | Remove `'timers'` from `MobileView` type union | Trivial |
| `src/components/layout/MobileNav.tsx` | Remove timer tab from `tabs` array; remove `IoTimerOutline` import | Trivial |
| `src/App.tsx` | Remove `activeView === 'timers'` rendering branch; remove unused grocery params from `usePriorityInterrupt` call | Low |

### Files That Might Need Checking

| File | Why Check |
|------|-----------|
| `src/components/timer/TimerPanel.tsx` | Confirm `variant="compact"` still works independently for wall sidebar |
| `src/components/grocery/GroceryPanel.tsx` | Confirm grocery panel still shows in sidebar when priority is for timers only (it won't -- groceries no longer trigger priority) |

### Key Design Decision: What Happens to Grocery Sidebar Display?

Currently, when groceries exist, they show in the wall sidebar as priority content. After BEHV-01, groceries will NO LONGER appear in the sidebar at all (since they no longer trigger priority mode). This means:

- Groceries are only visible via mobile navigation (the "Groceries" tab)
- The wall display only shows groceries... never (unless we add them to the rotation)

This is the intended behavior per BEHV-01: "Grocery list does not trigger priority interrupt." The grocery list is a mobile-managed feature; the wall display focuses on timers for urgency and rotating informational content.

### Cleanup: Unused Parameters and Imports

After removing grocery priority:
1. `usePriorityInterrupt` still accepts `uncheckedGroceryCount` parameter -- remove it
2. `App.tsx` passes `uncheckedCount` to `usePriorityInterrupt` -- remove that argument
3. The `useGroceries` import in `App.tsx` may become unused if no other code uses `uncheckedCount` at the App level -- check and clean up
4. `showGroceries` field in `PriorityState` -- remove from interface and return value
5. `App.tsx` sidebar references `priority.showGroceries` -- remove that conditional
6. `IoTimerOutline` import in `MobileNav.tsx` -- remove unused import

### Safeguard: Default View on Invalid State

If a user somehow has `activeView === 'timers'` in state (e.g., they were on the timer tab when the code updates), the app would render nothing in the main content area. To prevent this:

```typescript
// In useMobileNav.ts - default to 'calendar' if invalid
export function useMobileNav() {
  const [activeView, setActiveView] = useState<MobileView>('calendar');
  return { activeView, setActiveView };
}
```

Since `useState('calendar')` is already the default, and the type will exclude `'timers'`, TypeScript will catch any remaining references at compile time. However, since this is client-side state (not persisted), there's no risk of stale `'timers'` values surviving a deploy.

### Anti-Patterns to Avoid

- **Don't add a "timer coming soon" placeholder to mobile nav:** The timer tab is being removed intentionally, not temporarily.
- **Don't keep the `showGroceries` field "for later":** Dead code is confusing. Remove it cleanly.
- **Don't add grocery items to the content rotation:** That would be a new feature (out of scope for this phase).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab layout redistribution | Custom CSS for 3-tab layout | `flex-1` already handles it | Tabs auto-distribute |
| Type safety after removal | Runtime checks for invalid views | TypeScript union type | Compiler catches all references |
| State migration | localStorage migration for old state | Fresh useState default | State is not persisted between sessions |

## Common Pitfalls

### Pitfall 1: Forgetting to Remove All Timer View References
**What goes wrong:** The `activeView === 'timers'` branch in App.tsx still renders but is unreachable, or TypeScript errors appear because the type no longer includes `'timers'`.
**Why it happens:** Multiple files reference the `MobileView` type.
**How to avoid:** Change the type FIRST, then let TypeScript errors guide cleanup of all references.
**Warning signs:** TypeScript compilation errors (good -- they show what to fix).

### Pitfall 2: Grocery Sidebar Display Confusion
**What goes wrong:** After removing grocery priority, someone wonders why groceries don't show on the wall display.
**Why it happens:** The behavior change is intentional but not immediately obvious.
**How to avoid:** This is by design per BEHV-01. Groceries are phone-only. Document in commit message.

### Pitfall 3: Sidebar Shows Nothing When No Timers and No Groceries
**What goes wrong:** Nothing -- this is the desired state. The ContentRotator takes over.
**Why it happens:** Priority mode now only activates for timers.
**How to avoid:** Already handled. When `hasPriority` is false (no active timers), the sidebar shows ContentRotator with transit, horoscopes, and country panels.

### Pitfall 4: GroceryPanel compact variant becomes dead code
**What goes wrong:** The `variant="compact"` path in `GroceryPanel.tsx` is no longer used anywhere.
**Why it happens:** It was only used in the sidebar priority display, which no longer shows groceries.
**How to avoid:** Either remove the compact variant code or leave it as-is (it's harmless). Recommend leaving it since it's part of the component's API and may be useful if rotation integration is added later.

## Code Examples

### BEHV-01: Modified `usePriorityInterrupt.ts`

```typescript
// Source: src/hooks/usePriorityInterrupt.ts (target state)
import { useState, useEffect } from 'react';

export type SidebarMode = 'rotation' | 'priority';

export interface PriorityState {
  mode: SidebarMode;
  showTimers: boolean;
  rotationPaused: boolean;
}

export function usePriorityInterrupt(
  activeTimerCount: number,
  completedTimersCount: number,
): PriorityState {
  const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;

  const [debouncedMode, setDebouncedMode] = useState<SidebarMode>(
    hasActiveTimers ? 'priority' : 'rotation',
  );

  useEffect(() => {
    if (hasActiveTimers) {
      setDebouncedMode('priority');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedMode('rotation');
    }, 500);
    return () => clearTimeout(timer);
  }, [hasActiveTimers]);

  return {
    mode: debouncedMode,
    showTimers: hasActiveTimers,
    rotationPaused: debouncedMode === 'priority',
  };
}
```

### BEHV-02: Modified `useMobileNav.ts`

```typescript
// Source: src/hooks/useMobileNav.ts (target state)
import { useState } from 'react';

export type MobileView = 'calendar' | 'groceries' | 'chores';

export function useMobileNav() {
  const [activeView, setActiveView] = useState<MobileView>('calendar');
  return { activeView, setActiveView };
}
```

### BEHV-02: Modified `MobileNav.tsx`

```typescript
// Source: src/components/layout/MobileNav.tsx (target state)
import { IoCalendarOutline, IoCartOutline, IoCheckmarkDoneCircleOutline } from 'react-icons/io5';
import type { MobileView } from '../../hooks/useMobileNav';

const tabs: { view: MobileView; label: string; icon: typeof IoCalendarOutline }[] = [
  { view: 'calendar', label: 'Calendar', icon: IoCalendarOutline },
  { view: 'groceries', label: 'Groceries', icon: IoCartOutline },
  { view: 'chores', label: 'Chores', icon: IoCheckmarkDoneCircleOutline },
];
// ... rest unchanged
```

### BEHV-01 + BEHV-02: Modified `App.tsx` (relevant sections)

```typescript
// Source: src/App.tsx (target state - key changes only)

// Remove: import { useGroceries } from './hooks/useGroceries';
// (only if useGroceries is not used elsewhere in App.tsx)

function App() {
  // ...
  // const { uncheckedCount } = useGroceries();  // REMOVE if unused
  const { activeCount: activeTimerCount, completedTimers } = useTimers();
  const priority = usePriorityInterrupt(activeTimerCount, completedTimers.length);
  // ... (no more uncheckedCount parameter)

  // In main content area, remove:
  //   {activeView === 'timers' && <TimerPanel variant="full" />}

  // In sidebar priority section, remove:
  //   {priority.showGroceries && <GroceryPanel variant="compact" />}
}
```

**Note on `useGroceries` in App.tsx:** Currently `useGroceries` is imported and `uncheckedCount` is destructured solely to pass to `usePriorityInterrupt`. After removing the grocery parameter, check if `useGroceries` is used elsewhere in App.tsx. If not, remove the import and destructuring entirely. The `GroceryPanel` component calls `useGroceries` internally, so the hook is still used -- just not at the App level.

## State of the Art

No external dependencies or evolving standards involved. This is purely internal behavior modification.

| Current Behavior | Target Behavior | Requirement |
|------------------|-----------------|-------------|
| Groceries + timers both trigger sidebar priority interrupt | Only timers trigger priority interrupt | BEHV-01 |
| Mobile nav has 4 tabs (calendar, groceries, timers, chores) | Mobile nav has 3 tabs (calendar, groceries, chores) | BEHV-02 |
| Timer tab on mobile shows full timer panel | Timer management via Siri only (Phase 15) | BEHV-02 |
| Grocery list shows on wall sidebar during priority | Grocery list only accessible via mobile | BEHV-01 |

## Open Questions

1. **Should `GroceryPanel` compact variant be removed?**
   - What we know: After BEHV-01, the compact variant is no longer rendered anywhere
   - What's unclear: Whether future features might use it (e.g., adding groceries to content rotation)
   - Recommendation: Leave the code in place. It is harmless dead code (30 lines) and may be useful later. Do not add it to the rotation without explicit requirements.

2. **Should `useGroceries` remain imported in App.tsx?**
   - What we know: After removing the priority interrupt parameter, it may be unused at App level
   - What's unclear: Whether any other App-level logic references `uncheckedCount`
   - Recommendation: Remove if unused. TypeScript will flag it.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `usePriorityInterrupt.ts`, `MobileNav.tsx`, `useMobileNav.ts`, `App.tsx`, `TimerPanel.tsx`, `GroceryPanel.tsx`, `index.css`
- Phase 8 research (`.planning/phases/08-priority-interrupts/08-RESEARCH.md`) for original priority interrupt design rationale

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, purely existing code modifications
- Architecture: HIGH -- all files identified, all changes are simple deletions/modifications
- Pitfalls: HIGH -- changes are straightforward; main risk is incomplete cleanup (mitigated by TypeScript)

**Research date:** 2026-02-17
**Valid until:** No expiry -- internal codebase patterns, no external dependencies
