---
phase: 03-calendar-integration
plan: 01
subsystem: api
tags: [ical-expander, ics-parsing, calendar, dedup, cors-proxy, date-fns]

requires:
  - phase: 01-foundation-setup
    provides: Vite + TypeScript project structure with Tailwind
  - phase: 02-clock-weather-core
    provides: date-fns/date-fns-tz already installed, React Query configured

provides:
  - CalendarEvent, DaySchedule, PersonConfig TypeScript interfaces
  - 5-feed calendar config with env var URLs and person metadata
  - ICS parser with ical-expander recurring event expansion (7-day window)
  - Cross-calendar event deduplication with person tag merging
  - Work-hours filter and Schulfrei/No School detection
  - CORS-proxied calendar feed fetch client
  - ical-expander TypeScript type declarations

affects: [03-calendar-integration, 04-calendar-ui]

tech-stack:
  added: [ical-expander]
  patterns: [config-driven-feeds, hash-based-dedup, pipeline-architecture]

key-files:
  created:
    - src/lib/calendar/types.ts
    - src/lib/calendar/config.ts
    - src/lib/calendar/parser.ts
    - src/lib/calendar/dedup.ts
    - src/lib/calendar/filters.ts
    - src/lib/api/calendarFetch.ts
    - src/types/ical-expander.d.ts
    - .env.example
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Used unicode escapes for emoji in config.ts to avoid encoding issues"
  - "Work-hours filter only removes Papa's solo events (shared events kept)"
  - "Schulfrei detection uses regex matching three patterns: schulfrei, no school, kein unterricht"

patterns-established:
  - "Pipeline architecture: fetch -> parse -> dedup -> filter"
  - "Config-driven calendar feeds with PersonConfig interface"
  - "Hash-based dedup using normalized summary|start|end as key"

requirements-completed: [CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07]

duration: 2min
completed: 2026-02-16
---

# Phase 3 Plan 1: Calendar Data Layer Summary

**ICS parsing pipeline with ical-expander, cross-calendar dedup with person tag merging, and smart work-hours/Schulfrei filtering**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-16T22:23:35Z
- **Completed:** 2026-02-16T22:25:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Complete calendar data pipeline: fetch -> parse -> dedup -> filter
- ical-expander integration with TypeScript type declarations for safe API usage
- Cross-calendar deduplication that merges person tags (shared events show all attendees)
- Smart filtering: Papa's solo work-hours events removed, Schulfrei days flagged for UI highlighting
- Environment variable config keeps Google Calendar secret URLs out of git

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ical-expander and create types, config, and type declarations** - `2ac3aea` (feat)
2. **Task 2: Create parser, dedup, filters, and fetch client** - `f30ba69` (feat)

## Files Created/Modified
- `src/lib/calendar/types.ts` - CalendarEvent, DaySchedule, PersonConfig interfaces
- `src/lib/calendar/config.ts` - 5-feed config with env var URLs, CORS proxy URL, home timezone
- `src/lib/calendar/parser.ts` - ICS text to CalendarEvent[] via ical-expander with 7-day window
- `src/lib/calendar/dedup.ts` - Hash-based dedup with person tag merging
- `src/lib/calendar/filters.ts` - Work-hours filter and Schulfrei detection
- `src/lib/api/calendarFetch.ts` - CORS-proxied ICS fetch with error handling
- `src/types/ical-expander.d.ts` - TypeScript declarations for ical-expander module
- `.env.example` - Documents all required VITE_CAL_* and VITE_CORS_PROXY_URL variables
- `package.json` - Added ical-expander dependency
- `.gitignore` - Added .env patterns

## Decisions Made
- Used unicode escapes for emoji characters in config.ts to avoid potential file encoding issues
- Work-hours filter checks `event.persons.length === 1` so shared events (Papa + others) are kept visible
- Schulfrei detection matches three German/English patterns via regex for broad coverage

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required at this stage. Calendar feed URLs will be needed when the useCalendar hook is wired up in Plan 02.

## Next Phase Readiness
- All calendar data layer functions are pure and testable, ready for useCalendar hook consumption
- Types are shared across all calendar modules via types.ts
- Pipeline is modular: each stage (fetch, parse, dedup, filter) can be tested independently
- .env.example documents the 6 environment variables needed for runtime

## Self-Check: PASSED

All 8 files verified present. Both task commits (2ac3aea, f30ba69) confirmed in git log.

---
*Phase: 03-calendar-integration*
*Completed: 2026-02-16*
