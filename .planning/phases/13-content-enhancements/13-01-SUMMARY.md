---
phase: 13-content-enhancements
plan: 01
subsystem: ui, api
tags: [bvg, transit, unsplash, country, photo, attribution]

requires:
  - phase: 02-clock-weather-core
    provides: "TransitPanel and CountryPanel components"
provides:
  - "BVG departures limited to 3 results for cleaner glance view"
  - "Unsplash landscape photo integration for Country of the Day"
  - "UnsplashAttribution component with UTM params"
  - "fetchCountryImage API function with download trigger"
  - "useCountryImage React Query hook"
affects: []

tech-stack:
  added: [unsplash-api]
  patterns: [graceful-fallback-no-api-key, unsplash-download-trigger, utm-attribution-links]

key-files:
  created: []
  modified:
    - src/lib/api/bvgTransit.ts
    - src/components/sidebar/TransitPanel.tsx
    - src/lib/api/countryOfDay.ts
    - src/hooks/useCountryOfDay.ts
    - src/components/sidebar/CountryPanel.tsx

key-decisions:
  - "Remove unsplashUrl from destructuring to avoid TS6133 unused variable error"
  - "Unsplash attribution links use static unsplash.com URL with UTM params per guidelines"

patterns-established:
  - "Graceful API fallback: return null when env var missing, render nothing in UI"
  - "Unsplash compliance: download trigger on every photo display, attribution with UTM params"

requirements-completed: [TRNS-01, CTRY-01]

duration: 2min
completed: 2026-02-17
---

# Phase 13 Plan 01: Content Enhancements Summary

**BVG departures trimmed to 3 results and Unsplash landscape photos added to Country of the Day panel with proper attribution**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T21:57:57Z
- **Completed:** 2026-02-17T22:00:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- BVG transit API now requests exactly 3 departures instead of 10 for a cleaner glance
- Skeleton loader updated to match 3 departure rows
- Country panel displays Unsplash landscape photo when API key is configured
- Proper Unsplash attribution with photographer credit and UTM parameters
- Graceful fallback when no API key, no results, or API failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Limit BVG departures to 3** - `26853e6` (feat)
2. **Task 2: Add Unsplash country landscape photo with attribution** - `99f087c` (feat)

## Files Created/Modified
- `src/lib/api/bvgTransit.ts` - Changed results=10 to results=3
- `src/components/sidebar/TransitPanel.tsx` - Skeleton loader from 5 to 3 rows
- `src/lib/api/countryOfDay.ts` - Added UnsplashPhoto interface, fetchCountryImage() with download trigger
- `src/hooks/useCountryOfDay.ts` - Added useCountryImage hook with React Query
- `src/components/sidebar/CountryPanel.tsx` - Added UnsplashAttribution component, country image display

## Decisions Made
- Used static `https://unsplash.com/` URL with UTM params for attribution link (not per-photo unsplashUrl) to match Unsplash guidelines
- Kept unsplashUrl in prop type but not destructured to avoid unused variable TS error while maintaining API surface

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused variable TypeScript error**
- **Found during:** Task 2 (CountryPanel update)
- **Issue:** Destructuring `unsplashUrl` in UnsplashAttribution triggered TS6133 since the Unsplash link uses a static URL
- **Fix:** Removed `unsplashUrl` from destructuring while keeping it in the prop type interface
- **Files modified:** src/components/sidebar/CountryPanel.tsx
- **Verification:** `npm run build` passes
- **Committed in:** 99f087c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript strictness fix. No scope creep.

## Issues Encountered
None

## User Setup Required

**External service requires manual configuration:**
- Register at [unsplash.com/developers](https://unsplash.com/developers)
- Create a new application
- Copy the Access Key
- Add `VITE_UNSPLASH_ACCESS_KEY=<your-access-key>` to `.env`
- The country panel works without the key (no photo shown, no errors)

## Next Phase Readiness
- Content enhancements complete
- Unsplash integration functional once API key is configured
- No blockers for subsequent phases

## Self-Check: PASSED

All 5 modified files exist. Both task commits verified (26853e6, 99f087c).

---
*Phase: 13-content-enhancements*
*Completed: 2026-02-17*
