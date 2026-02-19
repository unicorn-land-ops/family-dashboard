# Phase 8: Priority Interrupts - Research

**Researched:** 2026-02-17
**Domain:** React state management, CSS transitions, content priority hierarchy
**Confidence:** HIGH

## Summary

Phase 8 implements DISP-05: "Active timers and non-empty grocery list interrupt rotation and take visual priority." The current codebase already renders TimerPanel and GroceryPanel in the sidebar above the ContentRotator when data exists, but the ContentRotator continues running underneath -- it never yields its space. The goal is to make priority content truly replace the rotation area when active, and smoothly resume rotation when conditions clear.

This is primarily a UI orchestration task within existing code. No new libraries are needed. The existing `useTimers` and `useGroceries` hooks already expose `activeCount`, `completedTimers`, and `uncheckedCount` -- these are the signals that drive interrupt state. The implementation requires a new `usePriorityInterrupt` hook to centralize the priority logic, modifications to `useContentRotation` to support pausing, and changes to the sidebar layout in App.tsx to swap between priority and rotation views.

**Primary recommendation:** Create a `usePriorityInterrupt` hook that computes the current display mode (timers | groceries | rotation) from existing hook data, pause the content rotation timer when interrupted, and use CSS transitions to crossfade between priority content and the rotation area.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-05 | Active timers and non-empty grocery list interrupt rotation and take visual priority | Priority hierarchy logic, pause/resume rotation, visual transitions |

</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase uses only existing project dependencies.

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| React | 19.x | Component state, hooks | Yes |
| Tailwind CSS | v4 | Transition utilities, layout | Yes |
| @tanstack/react-query | 5.x | Data layer (useTimers, useGroceries already use it) | Yes |

### Supporting

No additional libraries needed. The existing `useInterval` hook already supports `null` delay for pausing, which is the key mechanism for pausing content rotation.

## Architecture Patterns

### Current Sidebar Layout (App.tsx lines 38-52)

```
sidebar/
  TimerPanel compact    (conditional: activeTimerCount > 0 || completedTimers.length > 0)
  GroceryPanel compact  (conditional: uncheckedCount > 0)
  ContentRotator        (always rendered, keeps rotating regardless)
  RotationIndicator     (always rendered)
```

**Problem:** Timer and grocery panels stack ABOVE the rotator, pushing it down. The rotator never stops. This means:
1. The sidebar gets taller than viewport when all three show
2. Content rotation wastes resources when nobody can see it
3. No clear visual hierarchy -- priority content is just "more stuff above"

### Target Sidebar Layout

```
sidebar/
  IF priority mode:
    TimerPanel compact   (when timers active)
    GroceryPanel compact (when groceries exist, and no timers OR after timers)
  ELSE:
    ContentRotator       (transit, horoscopes, country)
    RotationIndicator
```

### Pattern 1: Priority State Machine (`usePriorityInterrupt`)

**What:** A custom hook that reads timer and grocery state and returns the current display mode.
**When to use:** Single source of truth for what the sidebar shows.

```typescript
type SidebarMode = 'rotation' | 'priority';

interface PriorityState {
  mode: SidebarMode;
  showTimers: boolean;
  showGroceries: boolean;
  rotationPaused: boolean;
}

function usePriorityInterrupt(
  activeTimerCount: number,
  completedTimersCount: number,
  uncheckedGroceryCount: number
): PriorityState {
  const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;
  const hasGroceries = uncheckedGroceryCount > 0;
  const hasPriority = hasActiveTimers || hasGroceries;

  return {
    mode: hasPriority ? 'priority' : 'rotation',
    showTimers: hasActiveTimers,
    showGroceries: hasGroceries,
    rotationPaused: hasPriority,
  };
}
```

### Pattern 2: Pausing Content Rotation

**What:** Pass `null` as delay to `useInterval` to pause the rotation timer.
**Key insight:** `useInterval` already supports `null` delay (line 18 of useInterval.ts: `if (delay === null) return;`). The `useContentRotation` hook needs a `paused` parameter.

```typescript
export function useContentRotation(paused = false) {
  const panelCount = ROTATION_PANELS.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useInterval(() => {
    setActiveIndex((prev) => (prev + 1) % panelCount);
  }, paused ? null : ROTATION_INTERVAL_MS);

  // ... rest unchanged
}
```

### Pattern 3: Crossfade Between Priority and Rotation

**What:** Use the same opacity crossfade technique as ContentRotator to transition between priority content and rotation content.
**Why:** Consistent with existing visual language (ContentRotator already uses 500ms opacity transitions).

```tsx
{/* Priority content */}
<div
  className="transition-opacity duration-500 ease-in-out"
  style={{
    opacity: mode === 'priority' ? 1 : 0,
    pointerEvents: mode === 'priority' ? 'auto' : 'none',
    position: mode === 'priority' ? 'relative' : 'absolute',
  }}
>
  {showTimers && <TimerPanel variant="compact" />}
  {showGroceries && <GroceryPanel variant="compact" />}
</div>

{/* Rotation content */}
<div
  className="transition-opacity duration-500 ease-in-out"
  style={{
    opacity: mode === 'rotation' ? 1 : 0,
    pointerEvents: mode === 'rotation' ? 'auto' : 'none',
    position: mode === 'rotation' ? 'relative' : 'absolute',
  }}
>
  <ContentRotator activeIndex={activeIndex}>...</ContentRotator>
  <RotationIndicator ... />
</div>
```

**Alternative (simpler):** Since priority and rotation are mutually exclusive, a simple conditional render with CSS transition wrapper may be cleaner than dual-mounted crossfade. The priority panels have different heights than rotation panels, so absolute positioning for crossfade would need a fixed-height container. A simple conditional render with a fade-in animation class is likely better.

### Pattern 4: Priority Visual Indicator

**What:** Visual cue that the sidebar is showing priority content, not rotation.
**Options:**
- Subtle accent border or glow on the priority section
- A small label like "Priority" or icon indicator
- The existing `timer-alert-pulse` animation already provides urgency for completed timers

### Anti-Patterns to Avoid

- **Don't create a separate priority overlay:** The sidebar is already a flex column. Just swap what goes inside it rather than layering an overlay.
- **Don't keep rotation running when paused:** Wastes CPU cycles on hidden transitions and makes React Query refetch data nobody sees.
- **Don't use complex state machines:** The priority logic is simple boolean derivation (timers active OR groceries exist). No need for useReducer or state machine libraries.
- **Don't animate height changes:** Animating container height when switching between priority and rotation modes is janky on low-power devices (Raspberry Pi). Use opacity transitions instead, or just cut.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval pause/resume | Custom timer management | `useInterval(cb, paused ? null : delay)` | Already built into existing hook |
| Priority computation | Complex state machine | Simple derived booleans from existing hooks | Two boolean conditions, not a state machine |
| Crossfade transitions | JavaScript animation library | CSS `transition-opacity duration-500` | Already used by ContentRotator, Raspberry Pi friendly |

## Common Pitfalls

### Pitfall 1: Stale Rotation Index After Unpause
**What goes wrong:** When rotation pauses for timers, then resumes, it picks up exactly where it left off -- which may have been showing the same panel for a long time.
**Why it happens:** The activeIndex state persists while paused.
**How to avoid:** Optionally reset activeIndex to 0 when resuming from priority mode (or advance by 1). This is a UX choice -- either is reasonable.
**Warning signs:** User clears timers and sees the same transit panel they saw 10 minutes ago.

### Pitfall 2: Flicker When Priority Briefly Clears
**What goes wrong:** If the last timer is dismissed and a new one is set immediately, the sidebar flickers to rotation then back to priority.
**Why it happens:** State updates are synchronous -- the old timer dismisses before the new one appears.
**How to avoid:** Consider a brief debounce (300-500ms) before switching back to rotation mode. Only switch if priority conditions remain false after the debounce.
**Warning signs:** Visible flash of rotation content during timer management.

### Pitfall 3: Grocery Panel Takes Over Permanently
**What goes wrong:** Family adds grocery items and never clears them. The rotation area is permanently interrupted.
**Why it happens:** Grocery items persist until checked off and cleared.
**How to avoid:** This is expected behavior per DISP-05 ("non-empty grocery list interrupts rotation"). The family needs to clear groceries to get rotation back. This is actually desirable -- if you have a grocery list, it should be visible. Document this as intended behavior.
**Warning signs:** None -- this is by design.

### Pitfall 4: Mobile Layout Unaffected
**What goes wrong:** Developer spends time on mobile priority handling.
**Why it happens:** Forgetting that the sidebar is hidden on mobile (CSS: `.grid-area-sidebar { display: none }` on portrait).
**How to avoid:** Priority interrupts only affect the kiosk (landscape) sidebar. Mobile already has explicit tab navigation (calendar, groceries, timers tabs via MobileNav). No priority interrupt logic needed for mobile.
**Warning signs:** Unnecessary mobile-specific code.

## Code Examples

### Current useContentRotation (to be modified)

```typescript
// Source: src/hooks/useContentRotation.ts
export function useContentRotation() {
  const panelCount = ROTATION_PANELS.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useInterval(() => {
    setActiveIndex((prev) => (prev + 1) % panelCount);
  }, ROTATION_INTERVAL_MS);
  // ...
}
```

### Current Sidebar in App.tsx (to be modified)

```tsx
// Source: src/App.tsx lines 38-52
<div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
  {(activeTimerCount > 0 || completedTimers.length > 0) && <TimerPanel variant="compact" />}
  {uncheckedCount > 0 && <GroceryPanel variant="compact" />}
  <ContentRotator activeIndex={activeIndex}>
    <TransitPanel />
    <HoroscopePanel />
    <CountryPanel />
  </ContentRotator>
  <RotationIndicator ... />
</div>
```

### Target Sidebar (after phase 8)

```tsx
<div className="grid-area-sidebar flex flex-col gap-[clamp(10px,1vw,20px)]">
  {priority.mode === 'priority' ? (
    <>
      {priority.showTimers && <TimerPanel variant="compact" />}
      {priority.showGroceries && <GroceryPanel variant="compact" />}
    </>
  ) : (
    <>
      <ContentRotator activeIndex={activeIndex}>
        <TransitPanel />
        <HoroscopePanel />
        <CountryPanel />
      </ContentRotator>
      <RotationIndicator ... />
    </>
  )}
</div>
```

### useInterval Pause Support (already exists)

```typescript
// Source: src/hooks/useInterval.ts line 18
// delay === null pauses the interval -- no cleanup/restart needed
useEffect(() => {
  if (delay === null) return;
  const id = setInterval(() => savedCallback.current(), delay);
  return () => clearInterval(id);
}, [delay]);
```

## State of the Art

This phase does not involve any external libraries or APIs. It is purely internal React state orchestration using patterns already established in the codebase.

| Old Approach (current) | New Approach (phase 8) | Impact |
|------------------------|------------------------|--------|
| Timer/grocery panels stack above rotator | Priority mode replaces rotator entirely | Clean visual hierarchy |
| Rotation runs continuously | Rotation pauses when priority content showing | Saves CPU, prevents hidden data fetching |
| No transition between modes | Crossfade or conditional swap | Polished feel |

## Open Questions

1. **Resume behavior after priority clears**
   - What we know: activeIndex persists during pause
   - What's unclear: Should rotation reset to index 0 or continue where it left off?
   - Recommendation: Continue where left off (simpler, less jarring). User can always manually navigate via RotationIndicator.

2. **Debounce threshold for mode switching**
   - What we know: Rapid timer dismiss/create could cause flicker
   - What's unclear: Optimal debounce duration
   - Recommendation: Start with 500ms debounce on transition FROM priority TO rotation. No debounce on transition TO priority (should be instant).

3. **Priority visual differentiation**
   - What we know: Timer alerts already have `timer-alert-pulse` animation
   - What's unclear: Whether grocery-only priority needs additional visual emphasis
   - Recommendation: The card-glass styling is sufficient. Timers already have urgency styling. Keep it simple.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all relevant files (App.tsx, useTimers.ts, useGroceries.ts, useContentRotation.ts, ContentRotator.tsx, useInterval.ts, constants.ts, index.css)
- Existing patterns established across 7 completed phases

### Secondary
- None needed -- this phase is purely internal orchestration with no new dependencies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing code
- Architecture: HIGH -- simple boolean-driven conditional rendering, patterns already in codebase
- Pitfalls: HIGH -- identified from direct code analysis of existing behavior

**Research date:** 2026-02-17
**Valid until:** No expiry -- internal codebase patterns, no external dependencies
