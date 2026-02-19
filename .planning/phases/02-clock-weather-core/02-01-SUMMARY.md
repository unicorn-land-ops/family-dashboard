---
phase: 02-clock-weather-core
plan: 01
subsystem: ui
tags: [react-query, date-fns-tz, clock, weather, open-meteo, hooks]

# Dependency graph
requires:
  - phase: 01-foundation-setup
    provides: "Dashboard shell with Header component and grid layout"
provides:
  - "useInterval, useClock, useWeather hooks"
  - "Open-Meteo API client with TypeScript types"
  - "WMO weather code mapping"
  - "Berlin timezone formatting utilities"
  - "Clock and DateDisplay UI components"
  - "React Query provider at app root"
affects: [02-clock-weather-core plan 02, weather-ui, calendar]

# Tech tracking
tech-stack:
  added: ["@tanstack/react-query", "date-fns", "date-fns-tz", "react-icons"]
  patterns: ["Dan Abramov useInterval hook", "React Query wrapper hooks", "Isolated clock components"]

key-files:
  created:
    - src/hooks/useInterval.ts
    - src/hooks/useClock.ts
    - src/hooks/useWeather.ts
    - src/lib/api/openMeteo.ts
    - src/lib/utils/weatherCodes.ts
    - src/lib/utils/timeFormat.ts
    - src/components/clock/Clock.tsx
    - src/components/clock/DateDisplay.tsx
  modified:
    - src/components/layout/Header.tsx
    - src/main.tsx
    - package.json

key-decisions:
  - "Used date-fns-tz formatInTimeZone instead of Intl API for consistent Berlin timezone formatting"
  - "Clock uses HH:mm:ss format (with seconds) for real-time feel on dashboard"
  - "QueryClientProvider placed in main.tsx (not App.tsx) to survive App re-renders"
  - "tabular-nums CSS for clock prevents layout shifts on digit changes"

patterns-established:
  - "useInterval pattern: ref-based callback to avoid stale closures in intervals"
  - "React Query wrapper hooks: thin hook wrapping useQuery with domain-specific config"
  - "Isolated clock components: Clock/DateDisplay self-contained with own state via useClock"

requirements-completed: [CLKW-01, CLKW-02]

# Metrics
duration: 2min
completed: 2026-02-16
---

# Phase 02 Plan 01: Clock & Weather Data Layer Summary

**Berlin timezone clock with date-fns-tz, Open-Meteo weather API client, React Query provider, and WMO code mapping**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-16T21:57:08Z
- **Completed:** 2026-02-16T21:58:50Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Data layer with useInterval, useClock, and useWeather hooks ready for consumption
- Open-Meteo API client with full TypeScript types and error handling
- Complete WMO weather code mapping (28 codes) with react-icons references
- Header upgraded from inline clock logic to isolated Clock/DateDisplay components
- React Query provider configured at app root with sensible defaults

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create data layer** - `9b728d9` (feat)
2. **Task 2: Upgrade Header with Clock/DateDisplay and React Query** - `65c6fe4` (feat)

## Files Created/Modified
- `src/hooks/useInterval.ts` - Dan Abramov useInterval with ref-based callback
- `src/hooks/useClock.ts` - Berlin timezone clock state updated every second
- `src/hooks/useWeather.ts` - React Query wrapper for weather data (5min stale, 15min refetch)
- `src/lib/api/openMeteo.ts` - Open-Meteo forecast API client with typed response
- `src/lib/utils/timeFormat.ts` - Berlin timezone formatting helpers (time, date, short date)
- `src/lib/utils/weatherCodes.ts` - WMO code to description/icon mapping
- `src/components/clock/Clock.tsx` - Real-time clock display with tabular-nums
- `src/components/clock/DateDisplay.tsx` - English long date format display
- `src/components/layout/Header.tsx` - Refactored to use Clock/DateDisplay components
- `src/main.tsx` - Added QueryClientProvider wrapping App
- `package.json` - Added react-query, date-fns, date-fns-tz, react-icons

## Decisions Made
- Used date-fns-tz formatInTimeZone instead of Intl API for consistent Berlin timezone formatting
- Clock shows HH:mm:ss (with seconds) for real-time dashboard feel
- QueryClientProvider in main.tsx (not App.tsx) to survive App re-renders
- tabular-nums CSS property on clock prevents layout shifts during digit changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All hooks and API layer ready for Plan 02 weather UI components
- useWeather hook can be consumed directly by weather display components
- WMO code mapping provides icon references for weather visualization
- Header right side intentionally empty for weather summary (Plan 02)

## Self-Check: PASSED

All 8 created files verified present. Both task commits (9b728d9, 65c6fe4) verified in git log. Build succeeds with zero errors.

---
*Phase: 02-clock-weather-core*
*Completed: 2026-02-16*
