---
phase: 15-siri-voice-integration
plan: 01
subsystem: docs
tags: [siri, apple-shortcuts, supabase, postgrest, voice-control]

# Dependency graph
requires:
  - phase: 11-horoscope-fix-rls-prep
    provides: RLS policies with anon INSERT access on groceries and timers tables
provides:
  - Step-by-step Apple Shortcut creation guides for grocery and timer voice commands
  - PostgREST endpoint verification confirming anon key INSERT works
  - iCloud sharing instructions for family distribution
affects: []

# Tech tracking
tech-stack:
  added: [apple-shortcuts, postgrest-curl]
  patterns: [siri-voice-to-supabase-rest, icloud-shortcut-sharing]

key-files:
  created:
    - docs/siri-shortcuts/README.md
    - docs/siri-shortcuts/grocery-shortcut.md
    - docs/siri-shortcuts/timer-shortcut.md
  modified: []

key-decisions:
  - "Commas and 'and' as multi-item delimiters (not spaces) to preserve multi-word items like 'orange juice'"
  - "Quantity stored as part of item name string ('2 milk') -- no schema migration needed"
  - "URL Encode action before duplicate check GET to handle spaces in item names"
  - "Retry loop (count 2) for error handling -- silent first retry, user-facing error on second failure"

patterns-established:
  - "Supabase PostgREST direct access from Apple Shortcuts via anon key + Bearer token headers"
  - "Case-insensitive duplicate check via ilike filter on PostgREST"

requirements-completed: [SIRI-01, SIRI-02]

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 15 Plan 01: Siri Voice Integration Summary

**PostgREST endpoint verification + programmatic Apple Shortcut generation for grocery and timer voice commands via Siri**

## Performance

- **Duration:** 3 min (docs) + extended session (programmatic shortcut generation)
- **Started:** 2026-02-17T22:38:48Z
- **Completed:** 2026-02-18
- **Tasks:** 1 (auto) + 1 (human-action checkpoint, completed programmatically)
- **Files created:** 4

## Accomplishments
- Verified Supabase PostgREST endpoints work with anon key for grocery INSERT (201), timer INSERT (201), and case-insensitive duplicate check via ilike filter
- Created Python script (`scripts/generate-shortcuts.py`) that programmatically generates and signs Apple Shortcuts using plistlib + `shortcuts sign` CLI
- **Grocery Shortcut**: Ask → POST item to groceries table. User-tested and confirmed working.
- **Timer Shortcut**: Ask → POST full text (e.g. "pasta 10 minutes") as label with duration_seconds=0. Dashboard parses duration from label.
- Both shortcuts confirmed inserting to Supabase via Siri voice commands on iPhone
- Created overview README with prerequisites, architecture, and sharing instructions

## Task Commits

1. **Task 1: Verify PostgREST endpoints and create Shortcut documentation** - `bd57579` (docs)
2. **Task 2: Programmatic shortcut generation script** - committed with this summary

## Files Created/Modified
- `scripts/generate-shortcuts.py` - Generates and signs both Grocery and Timer .shortcut files
- `docs/siri-shortcuts/README.md` - Overview, prerequisites, architecture, sharing instructions
- `docs/siri-shortcuts/grocery-shortcut.md` - Manual step-by-step guide (reference/fallback)
- `docs/siri-shortcuts/timer-shortcut.md` - Manual step-by-step guide (reference/fallback)

## Key Technical Discoveries
- Apple Shortcuts .shortcut files are binary plists with WFWorkflowActions array
- `shortcuts sign --mode anyone` signs for distribution without Apple Developer account
- Only reliable pattern: **Single Ask → Get Text (JSON with one magic var) → POST (File body type) → Show Result**
- Multiple Ask actions in one shortcut causes POST to silently fail
- `attachmentsByRange` entries must be raw dicts, NOT wrapped in WFSerializationType
- Named variables don't work in text attachments — use ActionOutput magic variables
- First domain access prompts user to Allow; actual POST fires on next run
- Loops, conditionals, regex — all unreliable in programmatically generated shortcuts

## Decisions Made
- Programmatic shortcut generation over manual 80+ step guides
- Single Ask pattern (no multi-item splitting in shortcut — items added one at a time)
- Timer stores raw text as label; dashboard responsible for parsing duration
- `duration_seconds=0` as sentinel for "dashboard should parse from label"
- `created_by: "siri"` tag on both grocery and timer inserts

## Deviations from Plan
- Plan called for manual shortcut creation; implemented programmatic generation instead
- Dropped in-shortcut features that proved unreliable: multi-item loop, duplicate check, regex duration parsing, error retry
- Simplified to proven single-Ask pattern for reliability

## Next Phase Readiness

Phase 15 is the final phase in v1.1. Both Siri Shortcuts are working and inserting to Supabase. Dashboard needs minor enhancement to parse timer duration from label text when `duration_seconds=0`.

---
*Phase: 15-siri-voice-integration*
*Completed: 2026-02-18*
