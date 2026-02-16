---
phase: 04-transit-fun-content
plan: 02
subsystem: ui
tags: [react, crossfade, content-rotation, sidebar, transit-ui, horoscope-ui, country-ui]

# Dependency graph
requires:
  - phase: 04-transit-fun-content
    plan: 01
    provides: "useTransit, useHoroscope, useCountryOfDay hooks and typed API modules"
  - phase: 01-foundation-setup
    provides: "DashboardShell grid layout with sidebar area"
provides:
  - "Content rotation hook with configurable timer and manual navigation"
  - "TransitPanel with BVG departures, delay, cancellation, and SEV handling"
  - "HoroscopePanel with 3 family zodiac signs and truncated text"
  - "CountryPanel with flag, facts grid, and formatted population"
  - "ContentRotator with CSS crossfade keeping all panels mounted"
  - "RotationIndicator with active dot and next-panel label"
affects: [sidebar-ui, wall-display, mobile-layout]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CSS opacity crossfade for panel rotation", "All panels mounted to preserve React Query cache", "React.memo on data-consuming panels to isolate from rotation state"]

key-files:
  created:
    - src/hooks/useContentRotation.ts
    - src/components/sidebar/TransitPanel.tsx
    - src/components/sidebar/HoroscopePanel.tsx
    - src/components/sidebar/CountryPanel.tsx
    - src/components/sidebar/ContentRotator.tsx
    - src/components/sidebar/RotationIndicator.tsx
  modified:
    - src/App.tsx
    - src/index.css

key-decisions:
  - "All panels stay mounted (not conditionally rendered) to avoid loading flash when rotating back"
  - "SEV detection via line.product === bus OR remarks containing Ersatzverkehr"
  - "Removed unused React import in RotationIndicator to satisfy strict tsconfig"

patterns-established:
  - "Crossfade rotation: absolute positioning + opacity transition + pointerEvents toggle"
  - "Panel isolation: React.memo wrapping data panels to prevent rotation-driven re-renders"

requirements-completed: [TRNS-01, FUN-01, FUN-02, DISP-04]

# Metrics
duration: 2min
completed: 2026-02-16
---

# Phase 4 Plan 2: Content Rotation UI Summary

**Sidebar content rotator with crossfade transitions cycling through BVG transit departures, family horoscopes, and country-of-the-day panels every 15 seconds**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-16T22:47:56Z
- **Completed:** 2026-02-16T22:50:11Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Six new sidebar components/hooks replacing placeholder cards with live rotating content
- TransitPanel showing BVG departures with delay badges, cancellation handling, and SEV (replacement bus) visual distinction
- HoroscopePanel displaying daily readings for Papa, Daddy, and Wren with zodiac emoji and line-clamped text
- CountryPanel with large flag, name, and facts grid (capital, population, region, languages, currency)
- Smooth 500ms CSS crossfade between panels with all panels staying mounted to preserve cached data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useContentRotation hook and all sidebar panel components** - `b3cad6b` (feat)
2. **Task 2: Create ContentRotator, RotationIndicator, and wire into App.tsx** - `11e6924` (feat)

## Files Created/Modified
- `src/hooks/useContentRotation.ts` - Rotation state machine with timer and manual goTo()
- `src/components/sidebar/TransitPanel.tsx` - BVG departure list with delay/cancellation/SEV handling
- `src/components/sidebar/HoroscopePanel.tsx` - Daily horoscope cards for 3 family zodiac signs
- `src/components/sidebar/CountryPanel.tsx` - Country of the Day with flag, name, and facts grid
- `src/components/sidebar/ContentRotator.tsx` - Crossfade container keeping all panels mounted
- `src/components/sidebar/RotationIndicator.tsx` - Dot indicators with active state and next-panel label
- `src/App.tsx` - Replaced sidebar placeholders with ContentRotator and all panels
- `src/index.css` - Added departure-cancelled and departure-sev CSS classes

## Decisions Made
- All panels stay mounted (absolute positioned with opacity toggle) to preserve React Query cache and avoid loading flash on rotation
- SEV (replacement bus) detected via line.product === 'bus' OR remarks containing 'Ersatzverkehr' -- covers both API patterns
- Removed unused React import in RotationIndicator to satisfy strict tsconfig (auto-fix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused React import in RotationIndicator**
- **Found during:** Task 2 (build verification)
- **Issue:** TS6133 error -- React import unused since component uses JSX transform
- **Fix:** Removed `import React from 'react'` line
- **Files modified:** src/components/sidebar/RotationIndicator.tsx
- **Verification:** `npm run build` passes clean
- **Committed in:** 11e6924 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial fix for strict TypeScript config. No scope creep.

## Issues Encountered
None

## User Setup Required
None - all three APIs (BVG, ohmanda horoscope, REST Countries) are free and unauthenticated.

## Next Phase Readiness
- Phase 04 complete: all transit and fun content data + UI delivered
- Sidebar now fully functional with rotating content panels
- Ready for Phase 05 (photos/household or next milestone work)

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (b3cad6b, 11e6924) verified in git log. No placeholder text remains in App.tsx. Production build passes clean.

---
*Phase: 04-transit-fun-content*
*Completed: 2026-02-16*
