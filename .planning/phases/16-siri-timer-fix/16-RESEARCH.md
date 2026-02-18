# Phase 16: Siri Timer Duration Fix - Research

**Researched:** 2026-02-18
**Domain:** Apple Shortcuts duration parsing + React timer hook fix
**Confidence:** HIGH

## Summary

Phase 15 shipped a working Timer Shortcut that successfully inserts rows into the `timers` Supabase table via Siri voice commands. However, it uses `duration_seconds=0` as a sentinel value and stores the full user input (e.g., "pasta 10 minutes") as the `label` field. The dashboard's `useTimers.ts` hook has no logic to handle this sentinel -- `getRemainingSeconds()` computes `started_at + 0ms`, which is immediately in the past, causing every Siri timer to appear as an instant "Done!" alert instead of a running countdown.

There are two viable fix approaches: **(A) fix the shortcut** to parse the duration and send a real `duration_seconds` value, or **(B) fix the dashboard** to parse the label when it encounters the sentinel. Phase 15's key discovery was that complex shortcut logic (regex, conditionals, loops) is unreliable when programmatically generated. However, the timer shortcut only needs a single "Ask for Input" with TWO separate asks -- one for name, one for duration -- which avoids regex entirely and stays within the proven "single action per ask" pattern.

**Primary recommendation:** Fix the shortcut to use two separate Ask actions (one for name, one for duration in minutes), compute `duration_seconds` in the shortcut via a Multiply action, and send the real value. This is cleaner than dashboard-side parsing because it keeps the label clean (just the name) and sends a proper integer duration. If two-ask shortcut proves unreliable, fall back to dashboard-side label parsing as a safety net.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIRI-02 | User can set timers via Siri voice command ("Set a timer for X, Y minutes") | Shortcut must send valid `duration_seconds` (not 0 sentinel); OR dashboard must parse it from label. Realtime subscription already propagates the row to all devices. |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase modifies existing code only.

| Component | Version | Purpose | Already Present |
|-----------|---------|---------|-----------------|
| Python 3 + plistlib | stdlib | Shortcut generation (`scripts/generate-shortcuts.py`) | Yes |
| React + TanStack Query | 19.x / 5.x | Timer hook (`src/hooks/useTimers.ts`) | Yes |
| Supabase PostgREST | v12 | REST API for timer inserts | Yes |
| `shortcuts sign` CLI | macOS built-in | Signs .shortcut files for distribution | Yes |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Apple Shortcuts "Ask for Input" action | Capture voice/text input from Siri | Timer name and duration capture |
| Apple Shortcuts "Calculate" action | Multiply minutes by 60 to get seconds | Duration conversion in shortcut |
| Apple Shortcuts "Get Contents of URL" | POST to Supabase REST API | Timer insert |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two-ask shortcut (name + minutes) | Single ask with dashboard-side regex parsing | Two-ask is more reliable (proven pattern per Phase 15); dashboard parsing adds complexity and fragility to speech-to-text variations |
| Shortcut-side duration calculation | Dashboard-side `duration_seconds=0` sentinel handling | Shortcut-side is cleaner: label stays a pure name, duration is a proper integer. Dashboard parsing would need regex for "10 minutes", "ten minutes", "10 min", "10m", etc. |
| Supabase Edge Function for parsing | Direct PostgREST insert | Edge Function is overkill; project constraint is "no Edge Functions" |

## Architecture Patterns

### The Bug: How duration_seconds=0 Breaks Timers

**Current flow (broken):**
```
Siri: "What timer?" -> User: "pasta 10 minutes"
Shortcut POSTs: { label: "pasta 10 minutes", duration_seconds: 0, created_by: "siri" }
                                                ^^^^^^^^^^^^^^^^^^
DB default fills: started_at = now()

Dashboard useTimers.ts getRemainingSeconds():
  endTime = new Date(started_at).getTime() + 0 * 1000  // = started_at
  remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))  // = 0 immediately
  -> Timer lands in completedTimers -> Shows "Done!" alert instantly
```

**Source:** `src/hooks/useTimers.ts` lines 16-19, `scripts/generate-shortcuts.py` lines 192-230

### Pattern 1: Two-Ask Shortcut (Recommended)

**What:** Split the timer input into two separate Ask actions -- one for the timer name, one for the duration in minutes. This avoids regex parsing entirely.

**Target flow:**
```
Siri: "What should the timer be called?" -> User: "pasta"
Siri: "How many minutes?" -> User: "10"
Shortcut calculates: 10 * 60 = 600
Shortcut POSTs: { label: "pasta", duration_seconds: 600, created_by: "siri" }
```

**Why this works:** Phase 15 discovered that the reliable pattern is "single Ask -> single Text (JSON) -> POST". Two asks is slightly more complex, but each ask produces a simple value (a string name and a number). The Calculate action (multiply) is a basic arithmetic operation, not regex/conditionals. The JSON text construction uses two magic variables instead of one.

**Phase 15 constraint check:** Phase 15 SUMMARY states: "Multiple Ask actions in one shortcut causes POST to silently fail." This was observed with the grocery shortcut's attempted multi-feature flow. However, the failure was attributed to the combination of asks + conditionals + loops, not asks alone. Testing is needed to verify two sequential asks + one POST works. If it fails, fall back to single-ask with dashboard parsing.

**Confidence:** MEDIUM -- Two asks is slightly outside the "single ask" proven pattern, needs testing.

### Pattern 2: Dashboard-Side Label Parsing (Fallback)

**What:** When `useTimers.ts` encounters a timer with `duration_seconds === 0`, parse the label text to extract a duration.

**Parsing logic:**
```typescript
function parseDurationFromLabel(label: string): { cleanLabel: string; durationSeconds: number } {
  // Match patterns: "10 minutes", "10 min", "10m", "5 hours", "30 seconds", "30s"
  const match = label.match(/(\d+)\s*(s(?:ec(?:ond)?s?)?|m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?)/i);
  if (!match) {
    return { cleanLabel: label, durationSeconds: 300 }; // fallback: 5 minutes
  }

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  let seconds: number;

  if (unit.startsWith('h')) seconds = num * 3600;
  else if (unit.startsWith('s')) seconds = num;
  else seconds = num * 60; // minutes is default

  const cleanLabel = label.replace(match[0], '').trim();
  return { cleanLabel: cleanLabel || 'Timer', durationSeconds: seconds };
}
```

**Where to place:** In `src/lib/api/timers.ts` `fetchActiveTimers()` -- transform rows with `duration_seconds === 0` before returning. Or as a utility in `src/hooks/useTimers.ts`.

**Confidence:** HIGH -- regex on known text format is reliable. Speech-to-text always produces digits (not word numbers) for recent iOS versions.

### Pattern 3: Both Fixes (Belt and Suspenders)

**What:** Fix the shortcut to send a real duration AND add dashboard-side parsing as a safety net. If the shortcut sends a valid duration, the dashboard uses it directly. If `duration_seconds === 0` arrives (from an old shortcut version or edge case), the dashboard parses the label.

**Why recommended:** The shortcut fix depends on two-ask reliability, which needs testing. The dashboard fix is a cheap safety net (one function, ~15 lines). Having both means the system is robust even if one path fails.

### Recommended Change Locations

```
scripts/generate-shortcuts.py      # Fix shortcut: two asks, calculate duration, send real value
src/hooks/useTimers.ts             # Safety net: parse label when duration_seconds === 0
  OR
src/lib/api/timers.ts              # Safety net: transform in fetchActiveTimers()
```

### Anti-Patterns to Avoid

- **Don't add NLP or fuzzy parsing to the dashboard:** Keep the regex simple. If Siri says "ten minutes" as text, it's an edge case for the fallback -- the shortcut should be the primary fix.
- **Don't add a new Supabase column:** The existing schema (`label` + `duration_seconds` + `started_at`) is sufficient. No migration needed.
- **Don't change the timer insert API shape:** `createTimer(label, durationSeconds)` works fine. The shortcut is the caller that needs fixing.
- **Don't overcomplicate the shortcut:** Two asks + multiply + POST is the max complexity. No conditionals, no regex, no loops in the shortcut.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duration text parsing | Complex NLP parser | Simple regex `/(\d+)\s*(s\|m\|h)/i` | Siri produces consistent digit + unit format |
| Minute-to-second conversion in shortcut | Text manipulation | Shortcuts "Calculate" action (multiply by 60) | Built-in, reliable, no string operations needed |
| Testing shortcut changes | Manual iPhone testing only | Python script generates + signs; `open` command installs | Iteration cycle is fast on macOS |

**Key insight:** The fix is small -- either a shortcut restructure (~20 lines of Python) or a dashboard parsing function (~15 lines of TypeScript), or both. No new infrastructure, no schema changes, no new dependencies.

## Common Pitfalls

### Pitfall 1: Two-Ask Shortcut POST Failure
**What goes wrong:** Adding a second "Ask for Input" causes the POST action to silently fail or send wrong data, similar to Phase 15's discovery.
**Why it happens:** Programmatic shortcut generation has undocumented constraints around magic variable references when multiple Ask actions exist.
**How to avoid:** Test the generated shortcut immediately after building. If it fails, fall back to the single-ask approach with dashboard-side parsing.
**Warning signs:** Shortcut runs without error but no row appears in Supabase, or `duration_seconds` is still 0.

### Pitfall 2: started_at Timing Mismatch
**What goes wrong:** The shortcut does not send `started_at`, relying on the DB default `now()`. If there's network latency between the user saying "start" and the POST arriving, the timer's `started_at` could be seconds after the user expected.
**Why it happens:** DB `now()` is server-time when the INSERT is processed, not client-time when the user spoke.
**How to avoid:** This is a minor issue (seconds, not minutes). For v1, accept the DB default. If precision matters later, add a "Current Date" action in the shortcut to send `started_at` explicitly.
**Warning signs:** Timer shows 9:58 remaining instead of 10:00 right after creation.

### Pitfall 3: Siri Transcribes Duration as Words
**What goes wrong:** User says "ten minutes" and Siri transcribes it as the word "ten" instead of the digit "10".
**Why it happens:** Siri speech-to-text inconsistency (varies by iOS version and context).
**How to avoid:** The two-ask shortcut approach sidesteps this entirely -- the second ask explicitly requests a number, and Siri's numeric input mode produces digits. For the dashboard-side fallback, the regex only handles digits. A word-to-number mapping could be added but is low priority.
**Warning signs:** Dashboard parsing returns the 5-minute fallback for timers where the user said a word-number.

### Pitfall 4: Label Becomes Empty After Parsing
**What goes wrong:** If the entire label is "10 minutes" (no name), the parsed `cleanLabel` is empty.
**Why it happens:** User didn't provide a timer name.
**How to avoid:** Default to "Timer" when `cleanLabel` is empty after removing the duration text.
**Warning signs:** Timer card shows empty label.

### Pitfall 5: Existing UI Timers Confused by duration_seconds=0
**What goes wrong:** TimerCard and TimerAlert already handle `duration_seconds === 0` (progress bar shows 100% via `getTimerProgress`). If a stale `duration_seconds=0` timer exists in the DB, it could behave unexpectedly after the dashboard parsing fix.
**Why it happens:** Old Siri-created timers with `duration_seconds=0` still in the database.
**How to avoid:** The dashboard parsing function should handle these gracefully -- parse label, compute duration, use it for display. Old timers will have `started_at` far in the past, so they'll naturally expire and filter out of `fetchActiveTimers()` (which drops timers where `endTime < now - 60s`).
**Warning signs:** None -- old timers are already filtered out by the 60-second cutoff.

## Code Examples

### Current Timer Shortcut (Broken)
```python
# Source: scripts/generate-shortcuts.py lines 192-230
# POSTs: {"label":"pasta 10 minutes","duration_seconds":0,"created_by":"siri"}
# Problem: duration_seconds=0 -> timer expires immediately
```

### Fixed Timer Shortcut: Two-Ask Approach
```python
# Pseudocode for generate-shortcuts.py changes:
def build_timer_shortcut():
    actions = []
    name_ask_uid = make_uuid()   # Ask 1: "What should the timer be called?"
    mins_ask_uid = make_uuid()   # Ask 2: "How many minutes?"
    calc_uid = make_uuid()       # Calculate: minutes * 60
    json_uid = make_uuid()       # Text: JSON body with label + duration_seconds
    post_uid = make_uuid()       # POST to /rest/v1/timers

    # 1. Ask for timer name
    actions.append(act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "What should the timer be called?",
        "WFInputType": "Text",
        "UUID": name_ask_uid,
    }))

    # 2. Ask for duration in minutes
    actions.append(act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "How many minutes?",
        "WFInputType": "Number",
        "UUID": mins_ask_uid,
    }))

    # 3. Calculate: minutes * 60 = seconds
    # Uses is.workflow.actions.math with WFMathOperand and WFMathOperation
    actions.append(act("is.workflow.actions.math", {
        "WFMathOperand": 60,
        "WFMathOperation": "Multiply",  # or "×"
        "UUID": calc_uid,
    }))
    # Input to math is implicitly the previous action's output (mins_ask)

    # 4. Build JSON with name (ask 1) and seconds (calculate result)
    actions.append(act("is.workflow.actions.gettext", {
        "WFTextActionText": twv([
            '{"label":"', mv(name_ask_uid, "Provided Input"),
            '","duration_seconds":', mv(calc_uid, "Calculation Result"),
            ',"created_by":"siri"}',
        ]),
        "UUID": json_uid,
    }))

    # 5. POST
    actions.append(make_post_action(base_url, ANON_KEY, json_uid, uid=post_uid))

    # 6. Confirm
    actions.append(act("is.workflow.actions.showresult", {
        "Text": twv(["Timer set: ", mv(name_ask_uid, "Provided Input")]),
    }))
```

**Confidence:** MEDIUM -- Two-ask + Calculate pattern is logical but needs testing since Phase 15 found multi-action flows can be fragile.

### Dashboard-Side Parsing (Safety Net)
```typescript
// Add to src/hooks/useTimers.ts or src/lib/api/timers.ts

/** Parse duration from label text when duration_seconds is 0 (Siri sentinel) */
export function parseSiriTimer(timer: Timer): Timer {
  if (timer.duration_seconds !== 0) return timer;

  const match = timer.label.match(/(\d+)\s*(s(?:ec(?:ond)?s?)?|m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?)/i);
  if (!match) {
    // No parseable duration found -- default to 5 minutes
    return { ...timer, duration_seconds: 300 };
  }

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  let durationSeconds: number;

  if (unit.startsWith('h')) durationSeconds = num * 3600;
  else if (unit.startsWith('s')) durationSeconds = num;
  else durationSeconds = num * 60;

  const cleanLabel = timer.label.replace(match[0], '').trim() || 'Timer';
  return { ...timer, label: cleanLabel, duration_seconds: durationSeconds };
}
```

**Placement option A -- in fetchActiveTimers():**
```typescript
// Source: src/lib/api/timers.ts
export async function fetchActiveTimers(): Promise<Timer[]> {
  // ... existing query ...
  return (data ?? [])
    .map(parseSiriTimer)  // <-- transform sentinel timers
    .filter((timer) => {
      const endTime = new Date(timer.started_at).getTime() + timer.duration_seconds * 1000;
      return endTime > cutoff;
    });
}
```

**Placement option B -- in useTimers hook:**
```typescript
// Source: src/hooks/useTimers.ts
const timers = (query.data ?? []).map(parseSiriTimer);
```

**Confidence:** HIGH -- regex is simple, placement is straightforward.

### Existing Timer Flow (Working Parts -- No Changes Needed)
```
Supabase INSERT → realtime postgres_changes event → useSupabaseRealtime invalidates query
  → useTimers refetches → getRemainingSeconds() computes countdown → TimerCard renders
  → useInterval ticks every 1s → re-renders countdown display
  → usePriorityInterrupt switches sidebar to priority mode → wall display shows timer
```

**Source:** `src/hooks/useSupabaseRealtime.ts`, `src/hooks/useTimers.ts`, `src/components/timer/TimerPanel.tsx`, `src/hooks/usePriorityInterrupt.ts`, `src/App.tsx`

**Everything downstream of a valid `duration_seconds` already works.** The only fix needed is ensuring `duration_seconds` has a real value.

## State of the Art

| Current (Broken) | Target (Fixed) | Impact |
|-------------------|----------------|--------|
| Shortcut sends `duration_seconds=0` sentinel | Shortcut sends real computed `duration_seconds` | Timer works as a countdown |
| Dashboard has no sentinel handling | Dashboard parses label as safety net | Robust against old/broken shortcuts |
| User says one combined phrase ("pasta 10 minutes") | User answers two questions (name, then minutes) | Slightly longer Siri interaction, but more reliable |

## Open Questions

1. **Does the two-ask shortcut pattern actually work?**
   - What we know: Phase 15 found that "multiple Ask actions in one shortcut causes POST to silently fail." But that was in the context of asks + conditionals + loops.
   - What's unclear: Whether two sequential asks + calculate + text + POST (no conditionals) works.
   - Recommendation: Build it, test it. If it fails, ship dashboard-side parsing only and keep the single-ask shortcut.

2. **Shortcuts Calculate action: exact parameter names?**
   - What we know: The action identifier is `is.workflow.actions.math`. It multiplies input by an operand.
   - What's unclear: Exact parameter key names (`WFMathOperand`, `WFMathOperation`, input variable reference).
   - Recommendation: Inspect a manually-created shortcut with a Calculate action, or test iteratively with the signing pipeline.

3. **Should the shortcut send `started_at` explicitly?**
   - What we know: Currently relies on DB default `now()`. Network latency could cause a few seconds discrepancy.
   - What's unclear: Whether this matters for a kitchen timer (probably not).
   - Recommendation: Accept DB default for now. The `started_at` field has `default now()` which is adequate.

4. **What if the two-ask shortcut is too chatty for Siri UX?**
   - What we know: The original design had "timer pasta 10 minutes" as a single phrase.
   - What's unclear: Whether two separate Siri prompts feel too slow.
   - Recommendation: Test the UX. If too chatty, revert to single-ask + dashboard parsing. The user experience of "name?" then "minutes?" is still faster than opening a phone app.

## Sources

### Primary (HIGH confidence)
- `scripts/generate-shortcuts.py` -- Current shortcut generation code, Phase 15 patterns
- `src/hooks/useTimers.ts` -- Timer hook with `getRemainingSeconds()` bug
- `src/lib/api/timers.ts` -- Timer CRUD operations, `fetchActiveTimers()` filter logic
- `src/types/database.ts` -- Timer schema type (`duration_seconds: number`)
- `supabase/schema.sql` -- Timer table DDL, `started_at` default
- `src/components/timer/TimerPanel.tsx` -- Timer UI components (no changes needed)
- `src/hooks/usePriorityInterrupt.ts` -- Priority sidebar logic (no changes needed)
- `src/hooks/useSupabaseRealtime.ts` -- Realtime subscription (no changes needed)
- `.planning/phases/15-siri-voice-integration/15-01-SUMMARY.md` -- Phase 15 discoveries and constraints
- `.planning/phases/15-siri-voice-integration/15-RESEARCH.md` -- Phase 15 research on shortcut patterns
- `.planning/v1.1-MILESTONE-AUDIT.md` -- Audit confirming SIRI-02 is unsatisfied

### Secondary (MEDIUM confidence)
- Phase 15 discovery: "Multiple Ask actions in one shortcut causes POST to silently fail" -- needs revalidation for the simpler two-ask pattern

### Tertiary (LOW confidence)
- Apple Shortcuts "Calculate" action parameter names -- inferred from action identifier, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing code
- Architecture: HIGH -- the bug is clearly understood, both fix approaches are straightforward
- Shortcut fix (two-ask): MEDIUM -- two-ask pattern needs testing against Phase 15's discovery that multi-ask shortcuts can fail
- Dashboard fix (label parsing): HIGH -- simple regex on known text format
- Pitfalls: HIGH -- identified from Phase 15 post-mortem and direct code analysis

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable -- internal codebase, Apple Shortcuts API is stable)
