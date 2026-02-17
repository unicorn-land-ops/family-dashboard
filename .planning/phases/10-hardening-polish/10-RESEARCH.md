# Phase 10: Hardening & Polish - Research

**Researched:** 2026-02-17
**Domain:** Production reliability, performance optimization, error resilience for 24/7 kiosk SPA
**Confidence:** HIGH

## Summary

Phase 10 hardens the family dashboard for unattended 24/7 operation on a Raspberry Pi Chromium kiosk. The app already has a solid foundation: `useAutoRefresh` schedules a 3am reload, `vite-plugin-pwa` provides basic service worker precaching, Supabase realtime channels use `removeChannel` for proper cleanup, and React Query manages data fetching with retry logic. The work ahead is adding error boundaries to prevent full-screen crashes, enhancing the service worker with runtime caching for API resilience, auditing for memory leaks (especially around intervals, subscriptions, and DOM references), optimizing CSS compositing for Pi GPU limitations, and adding lightweight error/performance logging.

The existing codebase is well-structured with consistent patterns. 67 source files across hooks, components, and lib modules. The main risks for 24/7 operation are: (1) memory accumulation from React Query cache growth over hours, (2) backdrop-filter causing GPU compositing overhead on Pi, (3) unhandled render errors crashing the entire app, and (4) API failures degrading the display without recovery.

**Primary recommendation:** Add `react-error-boundary` around each major panel, configure React Query `gcTime` and `maxPages` limits, add workbox runtime caching for API responses, audit CSS for Pi GPU bottlenecks (especially `backdrop-filter`), and enhance `useAutoRefresh` with a memory pressure watchdog.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| (cross-cutting) | Hardens all previous requirements for production | Error boundaries, memory management, service worker caching, performance optimization |
| DISP-06 | Auto-refresh with memory leak prevention for 24/7 unattended operation | useAutoRefresh enhancement, memory pressure watchdog, React Query gc tuning |
| DISP-03 | Modern, polished visual design with smooth animations | CSS compositing audit for Pi, will-change optimization, animation frame budget |
| DISP-01 | Dashboard renders in landscape kiosk mode on Raspberry Pi Chromium | Pi-specific Chromium flags, GPU acceleration, performance profiling |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.0 | UI framework | Already in use |
| @tanstack/react-query | ^5.90.21 | Data fetching/caching | Already in use, needs gc tuning |
| vite-plugin-pwa | ^1.2.0 | Service worker generation | Already configured, needs runtime caching |
| @supabase/supabase-js | ^2.95.3 | Realtime data | Already in use with proper cleanup |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-error-boundary | ^6.1.1 | Declarative error boundaries | De facto standard; 6.1M weekly downloads; provides fallbackRender, onError, resetKeys, onReset |

### No New Dependencies Needed For
| Capability | Approach |
|------------|----------|
| Error logging | `console.error` + `window.onerror` + `window.onunhandledrejection` to structured log |
| Performance monitoring | `PerformanceObserver` API (built into browser) + `navigator.memory` (Chromium-only) |
| Memory watchdog | `performance.memory` API (Chromium) - no library needed |
| Bundle analysis | `npx vite-bundle-visualizer` (dev-time only, no install) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-error-boundary | Hand-rolled class component | More boilerplate, no resetKeys, no onReset callback; library is tiny (~2KB) |
| console-based logging | Sentry/LogRocket | Overkill for a family dashboard; adds SDK weight; no need for cloud error tracking |
| PerformanceObserver | web-vitals library | web-vitals is good but adds dependency; raw API is sufficient for our metrics |

**Installation:**
```bash
npm install react-error-boundary
```

## Architecture Patterns

### Error Boundary Strategy: Granular Panel Isolation

Wrap each major UI section in its own error boundary so a crash in one panel does not take down the entire dashboard.

```
App
├── ErrorBoundary (global fallback — auto-reload after 30s)
│   ├── Header
│   │   └── ErrorBoundary (weather/clock — show "--" on error)
│   ├── Main Content
│   │   └── ErrorBoundary (calendar/grocery/timer/chore — show retry button)
│   ├── Sidebar
│   │   └── ErrorBoundary (rotation content — show placeholder)
│   └── StatusBar
└── (no boundary needed — pure display)
```

### Memory Management Strategy

```
┌─────────────────────────────────────────────┐
│ Layer 1: Preventive — React Query GC tuning │
│   gcTime: 10min, staleTime per-query        │
│   maxPages: undefined (no infinite queries)  │
├─────────────────────────────────────────────┤
│ Layer 2: Scheduled — 3am full page reload   │
│   Already implemented in useAutoRefresh     │
├─────────────────────────────────────────────┤
│ Layer 3: Reactive — Memory pressure watchdog│
│   Check performance.memory every 5min       │
│   Force reload if jsHeapSizeLimit > 80%     │
└─────────────────────────────────────────────┘
```

### Service Worker Caching Strategy

```
┌─────────────────────────────────────────────┐
│ Precache (already configured)               │
│   *.js, *.css, *.html, *.woff2, *.png      │
├─────────────────────────────────────────────┤
│ Runtime Cache: API Responses (NEW)          │
│   Open-Meteo → StaleWhileRevalidate, 1hr   │
│   BVG Transit → NetworkFirst, 2min         │
│   RestCountries → CacheFirst, 7 days       │
│   Horoscope → StaleWhileRevalidate, 6hr    │
│   Google Fonts → CacheFirst, 1 year        │
└─────────────────────────────────────────────┘
```

### Anti-Patterns to Avoid
- **Global single error boundary:** One boundary around the entire app means any crash shows a blank screen. Use granular boundaries per panel.
- **will-change on everything:** `will-change` creates a compositing layer, consuming GPU memory. Only apply to elements that actually animate.
- **backdrop-filter everywhere on Pi:** GPU-composited blur is expensive on Pi hardware. Limit to critical surfaces or replace with solid semi-transparent backgrounds.
- **Unbounded React Query cache:** Default `gcTime` of 5 minutes is fine per-query, but with many queries all caching simultaneously, memory grows. Set explicit limits.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundaries | Class component with getDerivedStateFromError | react-error-boundary ^6.1.1 | Provides resetKeys, onError callback, fallbackRender; handles edge cases |
| Service worker | Custom SW with fetch interceptors | vite-plugin-pwa workbox generateSW with runtimeCaching | Workbox handles cache invalidation, quota management, versioning |
| Performance metrics | Custom timing code | PerformanceObserver API + performance.memory | Browser-native, zero overhead, Chromium memory API is exactly what we need |
| Bundle splitting | Manual dynamic imports for every file | Vite's default chunk splitting + manualChunks for vendor | Vite already splits on dynamic import boundaries; manual override only for large vendors |

## Common Pitfalls

### Pitfall 1: setTimeout drift in long-running apps
**What goes wrong:** The 3am reload uses `setTimeout` with a calculated delay. Over 24+ hours, `setTimeout` can drift due to browser throttling (especially in background tabs) or system sleep.
**Why it happens:** Browsers throttle timers in background tabs to 1-second resolution minimum; system sleep pauses timers entirely.
**How to avoid:** The kiosk is always in the foreground, so drift is minimal. But add a secondary check: an interval that fires every 15 minutes and checks if current time is past the reload hour. This catches cases where the Pi's system clock adjusts (NTP sync) or the timer overshot.
**Warning signs:** Dashboard still running at 4am when it should have reloaded at 3am.

### Pitfall 2: React Query cache memory growth
**What goes wrong:** Each unique query key creates a cache entry. Weather queries with timestamp-based keys, transit departures refreshing every minute, horoscope fetches — over 24 hours, thousands of stale cache entries accumulate.
**Why it happens:** Default `gcTime` (5 min) cleans up after unmount, but queries that remain mounted (like weather in the always-visible header) never unmount and never get garbage collected.
**How to avoid:** Set explicit `gcTime` on the QueryClient defaults (e.g., 10 minutes). Ensure query keys are stable (not timestamp-based). For frequently refreshing queries, ensure the old data is replaced in-place, not creating new entries.
**Warning signs:** `queryClient.getQueryCache().getAll().length` growing over time.

### Pitfall 3: Supabase realtime channel accumulation
**What goes wrong:** If a component unmounts and remounts (e.g., mobile navigation switching), a new channel subscription is created without the old one being cleaned up.
**Why it happens:** Race conditions between channel creation and cleanup, or missing cleanup in useEffect.
**How to avoid:** The codebase already uses `removeChannel` (not just `unsubscribe`) in cleanup — good. Verify with `supabase.getChannels().length` logging that channel count stays stable.
**Warning signs:** Channel count increasing over time in console logs.

### Pitfall 4: backdrop-filter GPU memory on Raspberry Pi
**What goes wrong:** `backdrop-filter: blur()` creates a compositing layer that requires the GPU to re-render the blurred background on every frame. On Pi with limited GPU memory (typically 128-256MB shared), this causes frame drops and increased memory usage.
**Why it happens:** Pi's VideoCore GPU has limited compositing capabilities. Each `backdrop-filter` element is a separate compositing layer.
**How to avoid:** Replace `backdrop-filter: blur(8px)` with a solid semi-transparent background (already using `rgba(255,255,255,0.05)` which is fine). Only use blur on hover/active states that are mobile-only, not on always-visible kiosk elements. The `.card-glass` class currently uses both — the solid color is sufficient for the wall display.
**Warning signs:** Chromium DevTools Rendering > "Layer borders" shows many yellow-bordered compositing layers.

### Pitfall 5: Service worker update during kiosk operation
**What goes wrong:** `registerType: 'autoUpdate'` means the service worker updates silently, but old cached assets may conflict with new JS expecting new APIs.
**Why it happens:** Workbox precache updates the cache but the running page still uses old JS until refresh.
**How to avoid:** The 3am auto-reload naturally picks up new service worker content. Add `skipWaiting: true` and `clientsClaim: true` to workbox config so the new service worker activates immediately, and the 3am reload loads fresh code.
**Warning signs:** Console showing "New content available" but page behavior inconsistent.

### Pitfall 6: CSS animation jank from layout thrashing
**What goes wrong:** Animations that trigger layout (top, left, width, height) instead of compositing-only properties (transform, opacity) cause expensive reflows, especially on Pi.
**Why it happens:** Existing animations use `opacity` (good) but the timer-pulse animation changes `background-color` which triggers paint (not layout, but still per-frame work).
**How to avoid:** Audit all @keyframes for properties that trigger layout or paint. Prefer `transform` and `opacity`. For the timer pulse, use `opacity` on a pseudo-element instead of animating `background-color`.
**Warning signs:** Chrome DevTools Performance tab showing green (paint) bars during animations.

## Code Examples

### Error Boundary with Auto-Reset and Logging

```typescript
// Source: react-error-boundary docs + custom pattern
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

function PanelFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="card-glass p-4 text-center">
      <p className="text-text-secondary text-sm">Something went wrong</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 text-xs text-accent-gold underline"
      >
        Try again
      </button>
    </div>
  );
}

function logError(error: Error, info: { componentStack?: string | null }) {
  console.error('[ErrorBoundary]', error.message, info.componentStack);
}

// Usage in App.tsx
<ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
  <CalendarPanel />
</ErrorBoundary>
```

### Global Error Boundary with Auto-Reload

```typescript
function GlobalFallback({ error }: FallbackProps) {
  useEffect(() => {
    // Auto-reload after 30 seconds on catastrophic failure
    const timer = setTimeout(() => window.location.reload(), 30_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
      <div className="text-center">
        <p className="text-xl">Dashboard will restart shortly...</p>
        <p className="text-text-secondary mt-2 text-sm">{error.message}</p>
      </div>
    </div>
  );
}
```

### Memory Pressure Watchdog

```typescript
// Chromium-only: performance.memory API
function useMemoryWatchdog(thresholdPercent = 80, checkIntervalMs = 5 * 60_000) {
  useEffect(() => {
    // Only available in Chromium
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if (!perf.memory) return;

    const interval = setInterval(() => {
      const { usedJSHeapSize, jsHeapSizeLimit } = perf.memory!;
      const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
      console.log(`[MemoryWatchdog] Heap usage: ${usagePercent.toFixed(1)}%`);

      if (usagePercent > thresholdPercent) {
        console.warn('[MemoryWatchdog] Memory pressure detected, reloading...');
        window.location.reload();
      }
    }, checkIntervalMs);

    return () => clearInterval(interval);
  }, [thresholdPercent, checkIntervalMs]);
}
```

### Enhanced useAutoRefresh with Backup Check

```typescript
// Enhancement to existing useAutoRefresh hook
export function useAutoRefresh(): void {
  useEffect(() => {
    const msUntilReload = getNextReloadMs();
    const timerId = setTimeout(() => {
      window.location.reload();
    }, msUntilReload);

    // Backup: check every 15 minutes if we've passed reload hour
    const backupId = setInterval(() => {
      const berlinStr = new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
      const berlinNow = new Date(berlinStr);
      const hour = berlinNow.getHours();
      const minute = berlinNow.getMinutes();
      // If it's between 3:00 and 3:15, we missed the reload — do it now
      if (hour === RELOAD_HOUR && minute < 15) {
        console.log('[AutoRefresh] Backup check triggered reload');
        window.location.reload();
      }
    }, 15 * 60_000);

    return () => {
      clearTimeout(timerId);
      clearInterval(backupId);
    };
  }, []);
}
```

### Workbox Runtime Caching Configuration

```typescript
// vite.config.ts — enhanced workbox configuration
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        // Google Fonts stylesheets
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-stylesheets',
        },
      },
      {
        // Google Fonts webfont files
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Open-Meteo weather API
        urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'weather-api',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // BVG Transit API
        urlPattern: /^https:\/\/v6\.bvg\.transport\.rest\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'transit-api',
          expiration: { maxEntries: 5, maxAgeSeconds: 2 * 60 },
          networkTimeoutSeconds: 5,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // RestCountries API
        urlPattern: /^https:\/\/restcountries\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'countries-api',
          expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})
```

### React Query GC Tuning

```typescript
// main.tsx — tuned QueryClient for long-running operation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
      gcTime: 10 * 60 * 1000,          // Garbage collect unused queries after 10 min
      staleTime: 60 * 1000,             // Consider data stale after 1 min (per-query overrides)
    },
  },
});
```

### Global Error Handlers

```typescript
// src/lib/errorReporting.ts
export function setupGlobalErrorHandlers() {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GlobalError]', { message, source, lineno, colno, error });
    // Could POST to a simple logging endpoint if desired
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledRejection]', event.reason);
  });
}
```

### Pi-Optimized CSS: Replace backdrop-filter

```css
/* Before — GPU-expensive on Pi */
.card-glass {
  background: rgba(255, 255, 255, 0.05);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

/* After — same visual effect, zero GPU compositing cost */
.card-glass {
  background: rgba(255, 255, 255, 0.05);
  /* backdrop-filter removed for Pi performance */
  /* On dark backgrounds with low-alpha surfaces, blur is imperceptible */
}

/* If blur is desired on capable devices only: */
@media (min-width: 769px) and (hover: hover) {
  /* Desktop/tablet with pointer — likely not a Pi */
  .card-glass-blur {
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based error boundaries | react-error-boundary v6 with hooks | 2024 (v5+) | Declarative, resetKeys, no class component needed |
| Manual SW registration | vite-plugin-pwa autoUpdate + skipWaiting | 2023+ | Zero-config precaching, automatic updates |
| Workbox v5 strategies | Workbox v7 (bundled with vite-plugin-pwa 1.x) | 2024 | Better tree-shaking, cleaner API |
| performance.now() timing | PerformanceObserver + web vitals | 2023+ | Browser-native LCP/FCP/CLS measurement |
| navigator.serviceWorker.register | VitePWA registerSW virtual module | 2023+ | Type-safe, auto-generated registration |

## Open Questions

1. **Raspberry Pi model and GPU memory allocation**
   - What we know: Pi runs Chromium in kiosk mode with autostart
   - What's unclear: Which Pi model (3/4/5), current GPU memory split, whether hardware acceleration flags are enabled
   - Recommendation: Document Pi setup requirements in a deployment guide; suggest `gpu_mem=256` in `/boot/config.txt` and enabling GPU rasterization in chrome://flags

2. **Actual memory profile under load**
   - What we know: The 3am reload prevents indefinite growth
   - What's unclear: How fast memory grows with all features active (calendar, transit, groceries, timers, chores, realtime subscriptions)
   - Recommendation: Add memory logging in the watchdog; run a 48-hour test and review console logs

3. **Horoscope API reliability**
   - What we know: Third-party API, no SLA
   - What's unclear: How often it fails, whether cached responses are acceptable fallback
   - Recommendation: StaleWhileRevalidate caching ensures last-good response shows during outage

## Sources

### Primary (HIGH confidence)
- vite-pwa-org.netlify.app — generateSW workbox configuration, runtimeCaching syntax
- github.com/bvaughn/react-error-boundary — v6.1.1 API, props, usage patterns
- React docs (react.dev) — Error boundary concepts, componentDidCatch
- MDN — PerformanceObserver API, performance.memory (Chromium-only)

### Secondary (MEDIUM confidence)
- [Raspberry Pi Forums — CSS animation performance](https://forums.raspberrypi.com/viewtopic.php?t=298219) — GPU acceleration flags, compositing challenges
- [Raspberry Pi Forums — Hardware acceleration in Chromium](https://forums.raspberrypi.com/viewtopic.php?t=331036) — GPU memory allocation, chrome://flags settings
- [Vite bundle optimization discussion](https://github.com/vitejs/vite/discussions/17730) — manualChunks, code splitting strategies
- [Medium — Memory leaks in React SPAs](https://medium.com/kustomerengineering/optimizing-memory-usage-in-single-page-apps-a-kustomer-case-study-de81ca9b105a) — Real-world SPA memory optimization case study

### Tertiary (LOW confidence)
- Specific `backdrop-filter` performance impact on Pi — no official benchmarks found; recommendation based on general GPU compositing knowledge and forum reports of CSS animation issues on Pi hardware

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-error-boundary is established, vite-plugin-pwa workbox config is well-documented
- Architecture (error boundaries): HIGH — well-documented pattern with clear react-error-boundary API
- Architecture (memory management): MEDIUM — Chromium performance.memory API is non-standard but works in target browser; real thresholds need testing
- Pitfalls: HIGH — common SPA longevity issues are well-documented; Pi GPU limitations confirmed by multiple forum threads
- CSS performance on Pi: MEDIUM — based on general GPU compositing principles; no specific backdrop-filter benchmarks on Pi found

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain, slow-moving ecosystem)
