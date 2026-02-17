# Phase 15: Siri Voice Integration - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Family can manage groceries and timers hands-free via Siri on their iPhones. Two separate Apple Shortcuts write directly to Supabase via PostgREST using the anon key. Shortcuts are shared via iCloud link for easy family distribution.

</domain>

<decisions>
## Implementation Decisions

### Shortcut invocation design
- Two separate Apple Shortcuts: one for groceries, one for timers
- Trigger phrases: "Hey Siri, grocery [input]" and "Hey Siri, timer [input]"
- Input is inline with the trigger phrase — no follow-up voice prompts (except when timer duration is missing)
- Distribution via shared iCloud link — create once, family installs from link

### Grocery input parsing
- Supports multiple items in one command (e.g., "grocery milk eggs bread")
- Claude's Discretion: delimiter/splitting strategy for multi-item speech transcription (commas, "and", spaces — pick most reliable)
- Optional quantities supported (e.g., "2 milk" works, "milk" alone also works with no quantity)
- Duplicate items are skipped silently — if item name already exists on the list, don't add again

### Timer input parsing
- Format: "timer [name] [duration]" — name first, then duration (e.g., "timer pasta 10 minutes")
- No default duration — if duration is missing, Siri prompts "How long should the timer be?"
- No max duration limit — trust the user
- Duplicate timer names allowed — multiple timers with the same name can run simultaneously

### Error handling & feedback
- Grocery success: Siri says "Added [item]" (or "Added [item1], [item2]" for multiple)
- Timer success: Siri says "[Name] timer set for [duration]"
- Supabase unreachable: retry once silently, then error "Couldn't reach the dashboard" on second failure
- Missing timer duration: Siri asks "How long should the timer be?" via voice prompt

### Claude's Discretion
- Multi-item delimiter parsing strategy (commas vs "and" vs spaces)
- How quantities are stored in Supabase (separate column vs part of item name)
- Exact Apple Shortcuts action flow and configuration
- PostgREST endpoint URL construction

</decisions>

<specifics>
## Specific Ideas

- Shortcuts use Supabase anon key (not service_role) — RLS policies already verified in Phase 11
- Items added via Siri propagate to all connected devices via existing realtime subscriptions
- Keep Siri responses concise — family wants quick confirmation, not chatty replies

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-siri-voice-integration*
*Context gathered: 2026-02-17*
