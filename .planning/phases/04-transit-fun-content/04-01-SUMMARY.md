---
phase: 04-transit-fun-content
plan: 01
subsystem: api
tags: [react-query, bvg, horoscope, restcountries, date-fns-tz]

# Dependency graph
requires:
  - phase: 02-clock-weather-core
    provides: "React Query setup, useWeather pattern, date-fns-tz"
provides:
  - "BVG departures fetch with typed Departure interface"
  - "Horoscope fetch for 3 family signs with partial failure tolerance"
  - "Country of the Day with Berlin-timezone deterministic daily selection"
  - "React Query hooks: useTransit, useHoroscope, useCountryOfDay"
  - "Rotation and refresh constants in constants.ts"
affects: [04-02-transit-fun-content, sidebar-ui, content-rotation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Partial failure tolerance in parallel fetches (horoscope)", "Day-seeded deterministic selection (country)"]

key-files:
  created:
    - src/lib/api/bvgTransit.ts
    - src/lib/api/horoscope.ts
    - src/lib/api/countryOfDay.ts
    - src/hooks/useTransit.ts
    - src/hooks/useHoroscope.ts
    - src/hooks/useCountryOfDay.ts
  modified:
    - src/lib/constants.ts

key-decisions:
  - "No transport type filter on BVG API -- includes bus results for U2 replacement services during construction"
  - "Horoscope fetches return partial results on individual sign failure instead of failing entirely"
  - "Berlin timezone day seed uses formatInTimeZone for consistent cross-device country selection"

patterns-established:
  - "Partial failure tolerance: Promise.all with per-item try/catch returning null, filtered out"
  - "Day-seeded selection: YYYYMMDD integer modulo array length for deterministic daily pick"

requirements-completed: [TRNS-01, FUN-01, FUN-02]

# Metrics
duration: 1min
completed: 2026-02-16
---

# Phase 4 Plan 1: Transit & Fun Content Data Layer Summary

**BVG transit, horoscope, and country-of-the-day API modules with React Query hooks matching existing useWeather pattern**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-16T22:44:29Z
- **Completed:** 2026-02-16T22:45:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Three typed API fetch modules for BVG departures, horoscopes, and country data
- Three React Query hooks with appropriate stale/refetch intervals
- Configurable rotation and refresh constants in constants.ts
- Partial failure tolerance in horoscope fetcher (one sign failing does not break others)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BVG transit, horoscope, and country API fetch modules** - `c2fa573` (feat)
2. **Task 2: Create React Query hooks and add rotation constants** - `127409e` (feat)

## Files Created/Modified
- `src/lib/api/bvgTransit.ts` - BVG departures fetch with typed Departure interface
- `src/lib/api/horoscope.ts` - Horoscope fetch for 3 family signs with partial failure tolerance
- `src/lib/api/countryOfDay.ts` - Country of the Day fetch with Berlin-timezone day-seeded selection
- `src/hooks/useTransit.ts` - React Query hook for BVG departures (30s stale, 60s refetch)
- `src/hooks/useHoroscope.ts` - React Query hook for horoscopes (6h stale/refetch)
- `src/hooks/useCountryOfDay.ts` - React Query hook for country data (24h stale/refetch)
- `src/lib/constants.ts` - Added rotation, transit, horoscope, and country refresh constants

## Decisions Made
- No transport type filter on BVG API to include bus results for U2 replacement services during construction through Oct 2026
- Horoscope fetches return partial results on individual sign failure instead of failing entirely
- Berlin timezone day seed uses formatInTimeZone for consistent cross-device country selection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. All three APIs are free, unauthenticated, and CORS-enabled.

## Next Phase Readiness
- All data hooks ready for Plan 02 (UI components and content rotation)
- Constants ready for ContentRotator interval configuration
- Horoscope SIGN_LABELS map ready for display use

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (c2fa573, 127409e) verified in git log.

---
*Phase: 04-transit-fun-content*
*Completed: 2026-02-16*
