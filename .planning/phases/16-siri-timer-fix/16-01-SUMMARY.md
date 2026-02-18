---
phase: 16-siri-timer-fix
plan: 01
subsystem: api
tags: [siri, shortcuts, timers, apple-shortcuts, supabase]

# Dependency graph
requires:
  - phase: 15-siri-voice-integration
    provides: "Shortcut generation script and timer API"
provides:
  - "Timer shortcut with real duration_seconds computation (two asks + Calculate)"
  - "parseSiriTimer safety net for old shortcuts sending duration_seconds=0"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Siri sentinel parsing: parseSiriTimer transforms legacy 0-duration timers"
    - "Two-ask shortcut pattern: separate name + number inputs with Calculate action"

key-files:
  created: []
  modified:
    - scripts/generate-shortcuts.py
    - src/lib/api/timers.ts

key-decisions:
  - "Two separate Siri asks (name + minutes) instead of single combined ask for reliability"
  - "parseSiriTimer as API-layer safety net so all consumers benefit from fallback parsing"
  - "Default to 5 minutes when no duration pattern found in label"

patterns-established:
  - "Sentinel fallback: dashboard gracefully handles old shortcut data formats"

requirements-completed: [SIRI-02]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 16 Plan 01: Siri Timer Fix Summary

**Two-ask timer shortcut with Calculate action for real duration_seconds, plus dashboard parseSiriTimer safety net for legacy 0-duration timers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T15:23:22Z
- **Completed:** 2026-02-18T15:26:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Timer shortcut now asks for name and minutes separately, computes duration_seconds via Calculate action
- Dashboard handles duration_seconds=0 sentinel by parsing duration from label text (minutes, hours, seconds patterns)
- Signed Timer.shortcut regenerated with 6 actions (2 asks + calculate + text + post + confirm)
- TypeScript builds cleanly, no type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix timer shortcut to use two asks and compute real duration_seconds** - `d9666fd` (feat)
2. **Task 2: Add dashboard-side duration_seconds=0 parsing safety net** - `fb0ac0b` (feat)

## Files Created/Modified
- `scripts/generate-shortcuts.py` - Rewritten build_timer_shortcut() with two Ask actions + Calculate + JSON build
- `src/lib/api/timers.ts` - Added parseSiriTimer() function and applied in fetchActiveTimers pipeline

## Decisions Made
- Two separate Siri asks (name + minutes) instead of single combined ask -- more reliable for Siri voice input and avoids needing NLP parsing
- parseSiriTimer placed in API layer (not hook layer) so all consumers benefit
- Default to 5 minutes when no duration pattern found in label -- reasonable fallback for edge cases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
User should reinstall the Timer shortcut on their device:
```
open '/tmp/family-dashboard-shortcuts/Timer.shortcut'
```

## Next Phase Readiness
- Timer end-to-end flow fixed: Siri shortcut sends real duration, dashboard has fallback for old shortcuts
- No further phases depend on this fix

---
*Phase: 16-siri-timer-fix*
*Completed: 2026-02-18*
