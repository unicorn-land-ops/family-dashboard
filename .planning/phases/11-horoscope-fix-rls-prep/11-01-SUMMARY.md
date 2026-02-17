---
phase: 11-horoscope-fix-rls-prep
plan: 01
subsystem: api, database
tags: [cloudflare-worker, api-ninjas, horoscope, rls, supabase, cors-proxy]

# Dependency graph
requires:
  - phase: 02-clock-weather-core
    provides: "Cloudflare Worker CORS proxy (cors-proxy.js), sidebar panel pattern"
provides:
  - "Horoscope API via Cloudflare Worker /horoscope route (API Ninjas)"
  - "RLS policies on groceries and timers tables for anon CRUD"
  - "Emoji-only zodiac headings pattern in sidebar"
affects: [15-siri-shortcuts, 12-country-deep-dive]

# Tech tracking
tech-stack:
  added: [api-ninjas-horoscope]
  patterns: [worker-route-pattern, rls-with-row-count-guardrails, emoji-only-headings]

key-files:
  created:
    - supabase/rls-policies.sql
  modified:
    - cloudflare-worker/cors-proxy.js
    - src/lib/api/horoscope.ts
    - src/hooks/useHoroscope.ts
    - src/components/sidebar/HoroscopePanel.tsx
    - src/lib/constants.ts

key-decisions:
  - "API Ninjas uses ?zodiac= param (not ?sign=) and returns 'sign' field (not 'zodiac') -- discovered during deployment testing"
  - "Strip sign name from horoscope text for cleaner display"
  - "Emoji-only inline headings (no sign names, no person names)"
  - "Remove line-clamp entirely to show full horoscope text"
  - "RLS policies use row count guardrails (100 groceries, 10 active timers)"

patterns-established:
  - "Worker route pattern: add new API proxy routes to cors-proxy.js with dedicated handler functions"
  - "RLS guardrail pattern: INSERT policies with subquery row count checks"

requirements-completed: [FIX-01]

# Metrics
duration: ~9h (including deployment and user verification)
completed: 2026-02-17
---

# Phase 11 Plan 01: Horoscope API Migration & RLS Prep Summary

**Migrated horoscope API from broken ohmanda.com to API Ninjas via Cloudflare Worker proxy, emoji-only zodiac headings, and Supabase RLS policies on groceries/timers for anon CRUD**

## Performance

- **Duration:** ~9h (code: ~15min, deployment + verification: user-paced)
- **Started:** 2026-02-17T12:40:31Z
- **Completed:** 2026-02-17T21:30:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Horoscope panel displays daily readings for Capricorn, Aquarius, and Sagittarius via API Ninjas
- Cloudflare Worker /horoscope route proxies API calls with server-side API key injection
- Emoji-only inline headings with full horoscope text (no truncation)
- Panel hides entirely when API is down and no cache exists
- RLS policies on groceries and timers tables with row count guardrails
- 24-hour cache at both Worker (Cache-Control) and React Query (staleTime) layers

## Task Commits

Each task was committed atomically:

1. **Task 1: Horoscope API migration and panel update** - `8c16c62` (feat)
   - Fix: `3461598` - Correct API Ninjas parameter (?zodiac= not ?sign=) and response field mapping
   - Fix: `be51fd9` - Emoji-only inline headings, remove line-clamp, strip sign name from text
2. **Task 2: Deploy Worker, set secret, apply RLS, verify** - Human verification checkpoint (no commit)

## Files Created/Modified
- `cloudflare-worker/cors-proxy.js` - Added /horoscope route with API Ninjas proxy, error handling, 24h cache headers
- `src/lib/api/horoscope.ts` - Switched from ohmanda.com to Worker proxy URL, updated response mapping
- `src/hooks/useHoroscope.ts` - Added gcTime for 24h cache persistence
- `src/components/sidebar/HoroscopePanel.tsx` - Emoji-only headings, hide on error, full text display, strip sign name
- `src/lib/constants.ts` - Changed HOROSCOPE_REFRESH_MS from 6h to 24h
- `supabase/rls-policies.sql` - RLS policies for groceries and timers with row count guardrails

## Decisions Made
- API Ninjas response shape differs from docs: uses `sign` field not `zodiac`, and requires `?zodiac=` query param not `?sign=` -- discovered during live testing
- Stripped sign name prefix from horoscope text for cleaner reading display
- Removed line-clamp entirely (was 3, then 4) to show full horoscope text since readings are a key family feature
- Emoji-only headings inline with text (no sign names, no person names per user preference)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] API Ninjas parameter name mismatch**
- **Found during:** Task 1 deployment testing
- **Issue:** Plan specified `?sign=` parameter but API Ninjas requires `?zodiac=`; response field is `sign` not `zodiac`
- **Fix:** Updated fetch URL to use `?zodiac=` and response mapping to read `data.sign`
- **Files modified:** `src/lib/api/horoscope.ts`, `cloudflare-worker/cors-proxy.js`
- **Verification:** Worker returns correct horoscope data
- **Committed in:** `3461598`

**2. [Rule 1 - Bug] Horoscope display improvements**
- **Found during:** Task 1 visual verification
- **Issue:** Sign name repeated in text, line-clamp truncated readings, headings too large
- **Fix:** Strip sign name from API text, remove line-clamp, use inline emoji headings
- **Files modified:** `src/components/sidebar/HoroscopePanel.tsx`
- **Verification:** Dashboard shows clean full-text readings with emoji-only headings
- **Committed in:** `be51fd9`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary for correct display and API integration. No scope creep.

## Issues Encountered
- API Ninjas documentation/research had incorrect field names -- resolved through live testing and iterative fixes

## User Setup Required

Worker deployment and RLS application were completed as part of Task 2 (human-verify checkpoint):
- Cloudflare Worker deployed with `wrangler deploy`
- API Ninjas key set as Worker secret via `wrangler secret put API_NINJAS_KEY`
- RLS policies applied via Supabase SQL Editor

## Next Phase Readiness
- Horoscope feature fully operational -- no further work needed
- RLS policies active on groceries and timers -- ready for Phase 15 (Siri Shortcuts via PostgREST)
- Blocker resolved: API Ninjas CORS confirmed to need Worker proxy (now implemented)
- Blocker resolved: Supabase RLS policies verified with anon role

## Self-Check: PASSED

All 6 files verified present. All 3 commits (8c16c62, 3461598, be51fd9) verified in git log.

---
*Phase: 11-horoscope-fix-rls-prep*
*Completed: 2026-02-17*
