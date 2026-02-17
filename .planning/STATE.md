# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.
**Current focus:** Phase 10 COMPLETE. All 10 phases delivered. Dashboard production-ready.

## Current Position

Phase: 10 of 10 (Hardening & Polish) -- COMPLETE
Plan: 3 of 3 in current phase -- COMPLETE
Status: All phases complete. Pi GPU optimization, final build verified. Dashboard production-ready.
Last activity: 2026-02-17 -- Completed 10-03 Pi GPU optimization

Progress: [█████████████████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 1.8 min
- Total execution time: 0.73 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-setup | 2 | 12min | 6min |
| 02-clock-weather-core | 2 | 3min | 1.5min |
| 03-calendar-integration | 3 | 4min | 1.3min |
| 04-transit-fun-content | 2 | 3min | 1.5min |
| 05-realtime-infrastructure | 2 | 3min | 1.5min |
| 06-grocery-list | 3 | 7min | 2.3min |
| 07-timer-system | 3 | 3min | 1min |
| 08-priority-interrupts | 1 | 1min | 1min |
| 09-chore-tracking | 3 | 4min | 1.3min |
| 10-hardening-polish | 3 | 6min | 2min |

**Recent Trend:**
- Last 5 plans: 09-02 (2min), 09-03 (1min), 10-01 (2min), 10-02 (2min), 10-03 (2min)
- Trend: Consistently fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Static site + cloud database approach pending validation in Phase 1
- Responsive single codebase (wall + mobile) to be implemented in Phase 1
- iCloud shared album for photos deferred to later milestone (v2)
- [01-01] Moved Google Fonts @import to HTML link tag (CSS @import ordering with Tailwind v4)
- [01-01] Used vite-plugin-pwa v1.2.0 (research referenced non-existent v0.22)
- [01-02] Used CSS classes in index.css for grid-template-areas instead of Tailwind arbitrary values
- [01-02] Fluid typography with clamp() for kiosk (2m) and mobile (arm's length) readability
- [Phase 02]: Used date-fns-tz formatInTimeZone for Berlin timezone (not Intl API)
- [Phase 02]: QueryClientProvider in main.tsx to survive App re-renders
- [Phase 02]: tabular-nums CSS on clock prevents layout shifts
- [02-02] Weather components wrapped in React.memo to isolate from clock re-renders
- [02-02] No standalone forecast card -- 7-day data reserved for Phase 3 calendar rows
- [03-01] Unicode escapes for emoji in config.ts to avoid encoding issues
- [03-01] Work-hours filter only removes Papa's solo events (shared events kept)
- [03-01] Pipeline architecture: fetch -> parse -> dedup -> filter
- [03-02] CORS proxy URL allowlist restricted to calendar.google.com only
- [03-02] 5-minute edge cache (max-age=300) for calendar proxy responses
- [03-02] Stateless worker -- no KV or Durable Object bindings needed
- [03-03] useQueries enabled flag skips feeds with missing env vars for graceful degradation
- [03-03] Partial success model: available feeds display even when others fail
- [03-03] Schulfrei events get accent-gold left border for visual prominence
- [04-01] No BVG transport type filter -- includes bus for U2 replacement services during construction
- [04-01] Horoscope partial failure tolerance -- one sign failing returns others
- [04-01] Berlin timezone day seed for deterministic country-of-the-day selection
- [04-02] All sidebar panels stay mounted (opacity crossfade) to preserve React Query cache
- [04-02] SEV detection via line.product === 'bus' OR remarks containing 'Ersatzverkehr'
- [05-01] Hand-written DB types instead of CLI generation (only 4 simple tables)
- [05-01] Supabase client returns null when env vars missing (graceful degradation)
- [05-01] Web Worker heartbeats for mobile Safari background tab resilience
- [05-02] useSupabaseRealtime uses removeChannel (not unsubscribe) for proper cleanup
- [05-02] ConnectionStatus auto-hides label after 3s when connected (kiosk noise reduction)
- [05-02] Offline queue uses any-typed client for dynamic table operations
- [06-01] Rewrote Database types to match supabase-js v2.95 GenericSchema format (explicit Insert/Update/Relationships)
- [Phase 07-01]: WAV audio in .mp3 extension -- browsers handle content-type sniffing
- [Phase 07-01]: 60s window for recently completed timers in fetchActiveTimers for alert display
- [Phase 07-01]: No optimistic update on addTimer -- server generates ID and started_at
- [Phase 07-02]: Single useInterval tick in TimerPanel drives all countdown re-renders (no per-timer intervals)
- [Phase 07-02]: Module-level Set in TimerAlert prevents duplicate sound alerts across re-renders
- [Phase 07-03]: Sidebar order: timers above groceries (timers are more time-sensitive)
- [Phase 07-03]: Timer sidebar shows when activeCount > 0 OR completedTimers.length > 0 (catches alerting timers)
- [Phase 08-01]: Conditional render (not dual-mount crossfade) for priority vs rotation to handle different panel heights
- [Phase 08-01]: 500ms debounce only on priority-to-rotation exit to prevent flicker
- [09-01] 8-day completion fetch window covers weekly boundary with margin
- [09-01] Period start uses toZonedTime before startOfDay/startOfWeek for Berlin-correct boundaries
- [09-01] No optimistic update on addChore (server generates ID); optimistic on complete/uncomplete/deactivate
- [Phase 09-02]: localStorage default person reduces tap count for repeat completions
- [Phase 09-02]: Kids-first sort order in grouped list (wren, ellis, papa, daddy, unassigned)
- [Phase 09-02]: Compact variant uses progress bar with accent-gold fill and hides completed chores
- [09-03] ChorePanel compact placed outside priority/rotation ternary for always-visible ambient status
- [09-03] Chores tab positioned last in mobile nav (newest feature, least time-urgent)
- [10-02] Backup interval checks every 15 minutes with <15 minute window to avoid double reload
- [10-02] Memory watchdog is Chromium-only no-op -- Safari/Firefox gracefully skip
- [10-01] logError accepts unknown error type to match react-error-boundary v6 onError signature
- [10-01] error instanceof Error guard in GlobalFallback for type-safe message display
- [10-02] Transit API uses NetworkFirst with 5s timeout (real-time, cache fallback)
- [10-02] Countries API uses CacheFirst with 7-day TTL (rarely changes)
- [10-03] backdrop-filter blur removed from card-glass (5% alpha on dark bg makes blur imperceptible)
- [10-03] Timer pulse uses opacity animation instead of background-color (compositor thread, no paint)
- [10-03] prefers-reduced-motion disables all non-essential animations for accessibility

### Pending Todos

- Deploy Cloudflare Worker CORS proxy (user action required, see 03-02-PLAN.md Task 2)
- Configure .env with VITE_CORS_PROXY_URL and VITE_CAL_* variables
- Create Supabase project and run supabase/schema.sql (see 05-01-PLAN.md Task 2)
- Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local

### Blockers/Concerns

- CORS proxy must be deployed before calendar data can load in browser (blocks 03-03 live verification)
- Supabase project must be created before realtime features work (code gracefully degrades without it)

## Session Continuity

Last session: 2026-02-17 (plan 10-03 execution)
Stopped at: Completed 10-03-PLAN.md (Pi GPU optimization and build verification) -- ALL PHASES COMPLETE
Resume file: None

---
*State initialized: 2026-02-16*
*Last updated: 2026-02-17 (10-03 execution)*
