# Phase 7: Timer System - Research

**Researched:** 2026-02-17
**Domain:** Real-time countdown timers with Supabase sync, sound alerts, React hooks
**Confidence:** HIGH

## Summary

The timer system builds directly on the patterns established in Phase 6 (Grocery List). The database schema already exists (`timers` table in `supabase/schema.sql`), the TypeScript types are already defined (`Timer` in `src/types/database.ts`), and realtime infrastructure is in place (`useSupabaseRealtime`). The core technical challenge is computing countdown display from server-side timestamps rather than client-side state, and playing an alert sound when timers complete.

The architecture uses a server-authoritative model: `started_at` (timestamptz) + `duration_seconds` (integer) stored in Supabase. Every client independently computes remaining time as `(started_at + duration_seconds) - now()`. This avoids clock drift between devices and means timers survive page refreshes. A `useInterval` at 1-second ticks drives the countdown display. Timer completion is detected client-side when remaining time reaches zero; the alert sound plays via `HTMLAudioElement`.

**Primary recommendation:** Follow the exact same hook+API+component pattern from Phase 6 grocery list. Use `useInterval` with 1s tick for countdown rendering. Use `HTMLAudioElement` for the completion sound (not Web Audio API -- overkill for a single alert). Add `--autoplay-policy=no-user-gesture-required` to the Raspberry Pi kiosk Chromium launch flags to allow sound on the wall display.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TIMR-01 | Set timer with label and duration from mobile phone | Timer CRUD API + mobile TimerPanel with preset buttons and custom input |
| TIMR-02 | Countdown display visible on wall display | `useInterval` 1s tick computing remaining from `started_at + duration_seconds - now()`, wall sidebar TimerPanel compact variant |
| TIMR-03 | Timer completion alert (visual + sound) | HTMLAudioElement for sound, CSS animation pulse/flash for visual, detected when remaining <= 0 |
| TIMR-04 | Cancel/dismiss timer from mobile phone | `cancelTimer` API sets `cancelled: true`, `dismissTimer` deletes the row |
| TIMR-05 | Multiple concurrent timers supported | Query returns all active timers, each rendered independently with own countdown |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95.3 | Timer CRUD + realtime sync | Already configured with typed client |
| @tanstack/react-query | ^5.90.21 | Query/mutation/cache for timer data | Same pattern as groceries |
| react | ^19.2.0 | UI rendering | Project framework |
| react-icons | ^5.5.0 | Timer/clock icons (IoTimerOutline, IoStopOutline) | Already used for nav icons |
| tailwindcss | ^4.1.0 | Styling | Project CSS framework |

### Supporting (no new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| HTMLAudioElement (browser API) | N/A | Play timer completion sound | When timer reaches 0 |
| crypto.randomUUID (browser API) | N/A | Optimistic timer IDs | Same pattern as grocery optimistic updates |
| date-fns | ^4.1.0 | Date arithmetic if needed | Already in project, but raw Date math suffices here |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTMLAudioElement | Web Audio API | Web Audio API is overkill for a single alert sound; HTMLAudioElement is 2 lines of code |
| Custom useInterval | react-timer-hook library | Extra dependency for something that is ~15 lines of code; project avoids unnecessary deps |
| Client-side timer state | Server-side started_at + duration | Server-side is correct -- survives refresh, syncs across devices, no drift |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── lib/api/
│   └── timers.ts              # CRUD functions (fetchTimers, createTimer, cancelTimer, dismissTimer)
├── hooks/
│   ├── useTimers.ts           # React Query + realtime + mutations (mirrors useGroceries)
│   └── useInterval.ts         # Generic useInterval hook for 1s countdown tick
├── components/timer/
│   ├── TimerPanel.tsx         # Full (mobile) + compact (wall sidebar) variants
│   ├── TimerCard.tsx          # Single timer: countdown display, progress ring, cancel button
│   ├── TimerInput.tsx         # Duration picker: preset buttons + custom minutes input
│   └── TimerAlert.tsx         # Completion overlay: flashing + sound + dismiss button
└── assets/
    └── sounds/
        └── timer-complete.mp3 # Short alert tone (~1-2 seconds)
```

### Pattern 1: Server-Authoritative Countdown
**What:** Store `started_at` (timestamptz) and `duration_seconds` (integer) in the database. Every client computes remaining time independently.
**When to use:** Always -- this is the only correct approach for multi-device timers.
**Example:**
```typescript
// Computing remaining seconds from server data
function getRemainingSeconds(timer: Timer): number {
  const endTime = new Date(timer.started_at).getTime() + timer.duration_seconds * 1000;
  const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  return remaining;
}

// Determining timer status
function getTimerStatus(timer: Timer): 'running' | 'completed' | 'cancelled' {
  if (timer.cancelled) return 'cancelled';
  return getRemainingSeconds(timer) <= 0 ? 'completed' : 'running';
}
```

### Pattern 2: useInterval Hook (Dan Abramov pattern)
**What:** A declarative setInterval wrapper that uses refs to avoid stale closures and supports dynamic delay (null to pause).
**When to use:** For the 1-second countdown tick that drives all timer displays.
**Example:**
```typescript
// Source: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  savedCallback.current = callback;

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### Pattern 3: Timer CRUD API (mirrors groceries.ts)
**What:** Thin Supabase query functions for timer operations.
**Example:**
```typescript
// src/lib/api/timers.ts
import { supabase } from '../supabase';
import type { Timer } from '../../types/database';

export async function fetchActiveTimers(): Promise<Timer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('timers')
    .select('*')
    .eq('cancelled', false)
    .order('started_at', { ascending: false });
  if (error) throw error;

  // Filter to only running + recently completed (last 60s) timers
  const now = Date.now();
  return (data ?? []).filter((t) => {
    const endTime = new Date(t.started_at).getTime() + t.duration_seconds * 1000;
    // Keep if still running OR completed within last 60 seconds (for alert display)
    return endTime > now - 60_000;
  });
}

export async function createTimer(label: string, durationSeconds: number): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .insert({ label, duration_seconds: durationSeconds, started_at: new Date().toISOString() });
  if (error) throw error;
}

export async function cancelTimer(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .update({ cancelled: true })
    .eq('id', id);
  if (error) throw error;
}

export async function dismissTimer(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('timers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
```

### Pattern 4: useTimers Hook (mirrors useGroceries)
**What:** React Query fetch + Supabase realtime subscription + optimistic mutations.
**Example:**
```typescript
// src/hooks/useTimers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import { fetchActiveTimers, createTimer, cancelTimer, dismissTimer } from '../lib/api/timers';
import { useSupabaseRealtime } from './useSupabaseRealtime';

const QUERY_KEY = ['timers'];

export function useTimers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveTimers,
    enabled: supabaseEnabled,
    staleTime: 10_000, // shorter than groceries -- timers are time-sensitive
    refetchInterval: 30_000, // periodic refetch catches any missed realtime events
  });

  useSupabaseRealtime({
    table: 'timers',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const addTimer = useMutation({
    mutationFn: ({ label, durationSeconds }: { label: string; durationSeconds: number }) =>
      createTimer(label, durationSeconds),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelTimer(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Timer[]>(QUERY_KEY);
      queryClient.setQueryData<Timer[]>(QUERY_KEY, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, cancelled: true } : t)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => dismissTimer(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Timer[]>(QUERY_KEY);
      queryClient.setQueryData<Timer[]>(QUERY_KEY, (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const activeTimers = (query.data ?? []).filter(
    (t) => !t.cancelled && getRemainingSeconds(t) > 0,
  );

  return {
    timers: query.data ?? [],
    activeTimers,
    activeCount: activeTimers.length,
    isLoading: query.isLoading,
    addTimer: (label: string, durationSeconds: number) =>
      addTimer.mutate({ label, durationSeconds }),
    cancelTimer: (id: string) => cancel.mutate(id),
    dismissTimer: (id: string) => dismiss.mutate(id),
  };
}
```

### Pattern 5: Sound Alert with HTMLAudioElement
**What:** Pre-load an Audio element, play on timer completion. Requires user interaction first on mobile Safari; kiosk bypasses with Chromium flag.
**Example:**
```typescript
// src/lib/sounds.ts

// Pre-create audio element (loaded once, reusable)
let alertAudio: HTMLAudioElement | null = null;

function getAlertAudio(): HTMLAudioElement {
  if (!alertAudio) {
    alertAudio = new Audio('/sounds/timer-complete.mp3');
    alertAudio.preload = 'auto';
  }
  return alertAudio;
}

export async function playTimerAlert(): Promise<void> {
  try {
    const audio = getAlertAudio();
    audio.currentTime = 0; // rewind if already played
    await audio.play();
  } catch (err) {
    // Autoplay blocked -- user hasn't interacted yet. Silent fail.
    console.warn('[playTimerAlert] Audio play blocked:', err);
  }
}
```

### Anti-Patterns to Avoid
- **Client-side timer state:** Never store "remaining seconds" and decrement locally. This drifts across devices, resets on refresh, and breaks multi-device sync.
- **setInterval without ref cleanup:** Always use the useInterval hook pattern with cleanup to avoid memory leaks in 24/7 kiosk mode.
- **Polling for completion:** Don't poll the server to check if a timer is done. Compute locally from started_at + duration_seconds.
- **Web Audio API for simple alerts:** Unnecessary complexity for playing a single MP3. HTMLAudioElement is the right tool.
- **Separate countdown state per component:** Share the 1-second tick across all timer cards via a single useInterval in the parent, not one interval per TimerCard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval management | Raw setInterval in components | useInterval hook with ref pattern | Avoids stale closures, memory leaks, handles cleanup |
| Timer sync across devices | WebSocket message passing for countdown | Supabase realtime + server timestamps | Already built infrastructure, timestamp math is simpler |
| Sound playback | Web Audio API AudioContext graph | HTMLAudioElement | 2 lines vs 20 lines, same result for single sound |
| Duration input | Custom time picker wheel | Preset buttons (1m, 3m, 5m, 10m, 15m, 30m) + custom minutes field | Preset buttons are faster for 90% of kitchen timer use cases |

**Key insight:** The timer system has very little genuinely new code. The CRUD+realtime pattern is identical to groceries. The only new concerns are the 1-second countdown tick and the sound alert, both of which are small, well-understood browser APIs.

## Common Pitfalls

### Pitfall 1: Clock Skew Between Devices
**What goes wrong:** If devices have different system clocks, countdown displays show different values.
**Why it happens:** `started_at` is a server timestamp, but `Date.now()` is the client clock.
**How to avoid:** Use `started_at: new Date().toISOString()` on the creating device, but Supabase `now()` default handles this if not provided. For display differences of 1-2 seconds, this is acceptable for a kitchen timer. Not worth adding NTP sync complexity.
**Warning signs:** Two devices showing different countdown values for the same timer.

### Pitfall 2: Timer Alert Fires Multiple Times
**What goes wrong:** The completion alert (sound + visual) triggers on every 1-second tick after the timer reaches 0.
**Why it happens:** The interval keeps running and `remaining <= 0` stays true.
**How to avoid:** Track "already alerted" state per timer ID in a `Set<string>`. Once a timer ID enters the set, don't fire the alert again. Clear the set when the timer is dismissed.
**Warning signs:** Sound playing repeatedly every second.

### Pitfall 3: Audio Autoplay Blocked on Mobile Safari
**What goes wrong:** `audio.play()` throws `NotAllowedError` because no user gesture preceded it.
**Why it happens:** Browser autoplay policy requires user interaction before audio can play.
**How to avoid:** On mobile, the user taps "Start Timer" which counts as user interaction -- pre-warm the audio context with a silent play in the tap handler. On the kiosk Raspberry Pi, launch Chromium with `--autoplay-policy=no-user-gesture-required`. Catch and log the error gracefully if autoplay is still blocked.
**Warning signs:** Console errors about `NotAllowedError`.

### Pitfall 4: Stale Timer Data After Page Sits Open
**What goes wrong:** Timer list shows timers that completed hours ago.
**Why it happens:** The fetch query returns all non-cancelled timers without filtering by completion time.
**How to avoid:** Filter fetched timers to only include running timers + recently completed (within last 60 seconds for alert display). Use `refetchInterval` to periodically clean stale data.
**Warning signs:** Old completed timers cluttering the display.

### Pitfall 5: Memory Leak from Intervals in 24/7 Kiosk
**What goes wrong:** If TimerCard components unmount but intervals aren't cleaned, intervals accumulate.
**Why it happens:** Direct setInterval without cleanup in useEffect.
**How to avoid:** Use the useInterval hook which properly cleans up on unmount. Have a SINGLE interval in the parent component, not one per timer card.
**Warning signs:** Increasing CPU usage over time, visible in DevTools Performance tab.

### Pitfall 6: Mobile Nav Not Updated for Timers View
**What goes wrong:** Timer view can't be accessed on mobile.
**Why it happens:** `MobileView` type is `'calendar' | 'groceries'` -- needs `'timers'` added.
**How to avoid:** Update `useMobileNav` type, `MobileNav` tabs array, and `App.tsx` view switching.
**Warning signs:** Build errors from type mismatch.

## Code Examples

### Countdown Display Formatting
```typescript
// Format seconds into MM:SS or H:MM:SS
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}
```

### Timer Progress (for circular progress ring or linear bar)
```typescript
export function getTimerProgress(timer: Timer): number {
  const remaining = getRemainingSeconds(timer);
  if (timer.duration_seconds === 0) return 1;
  return 1 - remaining / timer.duration_seconds; // 0 = just started, 1 = complete
}
```

### Single Interval Driving All Timers
```typescript
// In TimerPanel parent -- one interval for all timers
function TimerPanel() {
  const { timers, cancelTimer, dismissTimer } = useTimers();
  const [tick, setTick] = useState(0);

  // Single 1-second interval forces re-render for all countdown displays
  useInterval(() => setTick((t) => t + 1), timers.length > 0 ? 1000 : null);

  return (
    <div>
      {timers.map((timer) => (
        <TimerCard
          key={timer.id}
          timer={timer}
          remaining={getRemainingSeconds(timer)}
          onCancel={() => cancelTimer(timer.id)}
          onDismiss={() => dismissTimer(timer.id)}
        />
      ))}
    </div>
  );
}
```

### Duration Preset Buttons
```typescript
const PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
] as const;
```

### Raspberry Pi Kiosk Audio Flag
```bash
# In the Pi's autostart script, add the flag:
chromium-browser --kiosk --autoplay-policy=no-user-gesture-required https://your-dashboard-url
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Web Audio API for all sounds | HTMLAudioElement for simple playback | Always was simpler, but Web Audio got overhyped | Less code, same reliability for single-sound use cases |
| Client-side timer state | Server timestamps + client computation | Standard with realtime databases | Multi-device sync works correctly |
| Per-component setInterval | Shared interval / Dan Abramov useInterval | 2019 (blog post) | Prevents memory leaks, stale closures |

**Deprecated/outdated:**
- None relevant -- the timer pattern is stable web technology.

## Open Questions

1. **Timer completion sound file**
   - What we know: Need a short (~1-2 second) alert tone MP3.
   - What's unclear: What specific sound to use.
   - Recommendation: Use a free kitchen timer sound from a royalty-free source, or generate a simple tone. Place in `public/sounds/timer-complete.mp3`. Can also generate programmatically with Web Audio API OscillatorNode as a fallback if no MP3 is provided.

2. **Timer data cleanup**
   - What we know: Completed/cancelled timers accumulate in the database over time.
   - What's unclear: When to delete old timer rows.
   - Recommendation: For v1, just filter client-side (show only recent). Add a periodic cleanup (delete timers older than 24h) in Phase 10 hardening if needed. Simple SQL: `DELETE FROM timers WHERE started_at < now() - interval '24 hours'`.

3. **Wall display layout when multiple timers active**
   - What we know: Multiple timers must run concurrently (TIMR-05).
   - What's unclear: How many timers can realistically fit in the sidebar.
   - Recommendation: Stack vertically in sidebar, max-height with scroll. Practically, families rarely run more than 3-4 simultaneous kitchen timers. Compact card with label + countdown + cancel button = ~60px per timer.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/hooks/useGroceries.ts`, `src/lib/api/groceries.ts` -- established patterns to follow
- Project codebase: `supabase/schema.sql` -- timer table already defined
- Project codebase: `src/types/database.ts` -- Timer type already defined
- Project codebase: `src/hooks/useSupabaseRealtime.ts` -- realtime subscription hook

### Secondary (MEDIUM confidence)
- [Dan Abramov - Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) -- useInterval pattern
- [MDN - HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio) -- Audio constructor API
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay) -- kiosk autoplay bypass with `--autoplay-policy` flag
- [Chromium Autoplay](https://www.chromium.org/audio-video/autoplay/) -- enterprise policy options

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns already proven in Phase 6
- Architecture: HIGH -- server-authoritative timestamps is the textbook approach, proven in codebase
- Pitfalls: HIGH -- based on well-known browser API behavior (autoplay policy) and React patterns (stale closures)
- Sound alert: MEDIUM -- HTMLAudioElement approach is solid, but kiosk autoplay flag needs verification on the actual Pi

**Research date:** 2026-02-17
**Valid until:** 2026-04-17 (90 days -- all technologies are stable/mature)
