# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.
**Current focus:** Phase 3 - Calendar Integration

## Current Position

Phase: 3 of 10 (Calendar Integration) -- COMPLETE
Plan: 3 of 3 in current phase (all complete)
Status: Phase 03 complete. Ready for Phase 04.
Last activity: 2026-02-16 -- Completed 03-03 calendar UI components

Progress: [███████░░░] 35%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 3 min
- Total execution time: 0.33 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-setup | 2 | 12min | 6min |
| 02-clock-weather-core | 2 | 3min | 1.5min |
| 03-calendar-integration | 3 | 4min | 1.3min |

**Recent Trend:**
- Last 5 plans: 02-01 (2min), 02-02 (1min), 03-01 (1min), 03-02 (1min), 03-03 (2min)
- Trend: Stable

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

### Pending Todos

- Deploy Cloudflare Worker CORS proxy (user action required, see 03-02-PLAN.md Task 2)
- Configure .env with VITE_CORS_PROXY_URL and VITE_CAL_* variables

### Blockers/Concerns

- CORS proxy must be deployed before calendar data can load in browser (blocks 03-03 live verification)

## Session Continuity

Last session: 2026-02-16 (plan 03-03 execution)
Stopped at: Completed 03-03-PLAN.md (calendar UI components)
Resume file: None

---
*State initialized: 2026-02-16*
*Last updated: 2026-02-16 (03-01 execution)*
