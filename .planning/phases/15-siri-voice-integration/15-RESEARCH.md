# Phase 15: Siri Voice Integration - Research

**Researched:** 2026-02-17
**Domain:** Apple Shortcuts + Supabase PostgREST (no app code changes)
**Confidence:** HIGH

## Summary

This phase creates two Apple Shortcuts (Grocery, Timer) that write directly to Supabase via its auto-generated PostgREST REST API using the anon key. No code changes to the family-dashboard app are needed -- Siri inserts rows into the same `groceries` and `timers` tables the web app already reads via realtime subscriptions, so new items appear on all devices automatically.

The core pattern is: Siri triggers Shortcut -> Shortcut uses "Ask for Input" to capture voice text -> Shortcut parses the text -> Shortcut POSTs to Supabase REST API -> Siri speaks confirmation. Each Shortcut is a self-contained `.shortcut` file shared via iCloud link.

**Primary recommendation:** Build two Apple Shortcuts using "Get Contents of URL" (POST to `https://<ref>.supabase.co/rest/v1/<table>`) with JSON bodies. Use "Split Text" and "Repeat with Each" for multi-item grocery parsing. Use "Match Text" with regex for timer duration extraction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two separate Apple Shortcuts: one for groceries, one for timers
- Trigger phrases: "Hey Siri, grocery [input]" and "Hey Siri, timer [input]"
- Input is inline with the trigger phrase -- no follow-up voice prompts (except when timer duration is missing)
- Distribution via shared iCloud link -- create once, family installs from link
- Supports multiple items in one command (e.g., "grocery milk eggs bread")
- Optional quantities supported (e.g., "2 milk" works, "milk" alone also works with no quantity)
- Duplicate items are skipped silently -- if item name already exists on the list, don't add again
- Timer format: "timer [name] [duration]" -- name first, then duration (e.g., "timer pasta 10 minutes")
- No default duration -- if duration is missing, Siri prompts "How long should the timer be?"
- No max duration limit -- trust the user
- Duplicate timer names allowed -- multiple timers with the same name can run simultaneously
- Grocery success: Siri says "Added [item]" (or "Added [item1], [item2]" for multiple)
- Timer success: Siri says "[Name] timer set for [duration]"
- Supabase unreachable: retry once silently, then error "Couldn't reach the dashboard" on second failure
- Missing timer duration: Siri asks "How long should the timer be?" via voice prompt
- Shortcuts use Supabase anon key (not service_role)

### Claude's Discretion
- Multi-item delimiter parsing strategy (commas vs "and" vs spaces)
- How quantities are stored in Supabase (separate column vs part of item name)
- Exact Apple Shortcuts action flow and configuration
- PostgREST endpoint URL construction

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIRI-01 | User can add grocery items via Siri voice command ("Add X to the list") | Grocery Shortcut: "Ask for Input" captures voice text, "Split Text" parses multi-item, POST to `/rest/v1/groceries` with duplicate-skip via GET filter |
| SIRI-02 | User can set timers via Siri voice command ("Set a timer for X, Y minutes") | Timer Shortcut: "Ask for Input" captures voice text, regex extracts name + duration, POST to `/rest/v1/timers` with computed `duration_seconds` and `started_at` |
</phase_requirements>

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Apple Shortcuts | iOS 17+ | Visual automation tool on every iPhone | Native to iOS, zero install, Siri integration built-in |
| Supabase PostgREST | v12 | Auto-generated REST API for Postgres tables | Already running -- no new infrastructure needed |
| iCloud Link Sharing | N/A | Distribute Shortcuts to family members | Built into Shortcuts app, one-tap install |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| "Get Contents of URL" action | HTTP POST/GET to Supabase REST API | Every API call from Shortcuts |
| "Ask for Input" action | Capture voice input from Siri | Shortcut entry point for voice text |
| "Split Text" action | Parse multi-item grocery input | Grocery shortcut multi-item support |
| "Match Text" action | Regex extraction of timer name + duration | Timer shortcut duration parsing |
| "Repeat with Each" action | Loop over split grocery items | Grocery shortcut multi-item insert |
| "If" action | Conditional logic (error handling, duration check) | Both shortcuts |
| "Show Result" / "Show Alert" action | Speak confirmation back to user via Siri | Both shortcuts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| "Ask for Input" for voice capture | "Dictate Text" action | "Ask for Input" is simpler and works for both typed/voice; "Dictate Text" adds unnecessary complexity |
| GET filter for duplicate check | UNIQUE constraint + `on_conflict` header | `groceries.name` has no UNIQUE constraint and adding one would break the existing app (multiple items could share names with different `checked` states after being re-added). GET filter is the correct approach. |
| Separate quantity column | Quantity as part of item name string | Separate column would require schema migration; storing "2 milk" as the name is simpler and matches how the app displays items (see Discretion section below) |

## Architecture Patterns

### Pattern 1: Supabase PostgREST Insert via Apple Shortcuts

**What:** Use "Get Contents of URL" action in POST mode to insert a row into a Supabase table.

**Required Headers:**
```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
```

**URL format:**
```
https://<PROJECT_REF>.supabase.co/rest/v1/<table_name>
```

**Grocery insert body:**
```json
{
  "name": "milk",
  "checked": false,
  "added_by": "siri"
}
```

**Timer insert body:**
```json
{
  "label": "pasta",
  "duration_seconds": 600,
  "started_at": "2026-02-17T10:30:00.000Z"
}
```

**Confidence:** HIGH -- verified against existing `src/lib/api/groceries.ts` and `src/lib/api/timers.ts` which use identical column names and types.

### Pattern 2: Duplicate Check via GET Filter (Grocery)

**What:** Before inserting a grocery item, query PostgREST to check if an unchecked item with the same name already exists.

**URL:**
```
GET https://<ref>.supabase.co/rest/v1/groceries?name=eq.<item_name>&checked=eq.false
```

**Headers:** Same `apikey` + `Authorization` headers.

**Logic:** If the response body is `[]` (empty array), proceed with INSERT. If non-empty, skip silently.

**Why not `on_conflict`:** The `groceries` table has no UNIQUE constraint on `name`. Adding one would break existing behavior (users can add "milk", check it off, and add "milk" again). The GET-then-POST approach correctly checks only unchecked items.

**Confidence:** HIGH -- verified against `supabase/schema.sql` (no unique constraint on name).

### Pattern 3: Siri Voice Input Flow

**What:** When a Shortcut is triggered via "Hey Siri, [shortcut name]", Siri speaks the "Ask for Input" prompt and the user dictates their response.

**Critical finding:** Apple Shortcuts do NOT support inline text after the shortcut name (e.g., "Hey Siri, grocery milk eggs" does NOT automatically pass "milk eggs" to the shortcut). The user must respond to a voice prompt.

**Actual flow:**
1. User: "Hey Siri, grocery"
2. Siri: "What would you like to add?" (from "Ask for Input" prompt)
3. User: "milk eggs bread"
4. Shortcut processes the dictated text

**Impact on user decisions:** The context specifies "Hey Siri, grocery [input]" with input inline. This is NOT how Apple Shortcuts work. The shortcut name triggers it, then "Ask for Input" prompts for the actual items via a follow-up voice interaction. The experience is still hands-free and fast, just two-step rather than one.

**Confidence:** HIGH -- verified across multiple Apple Support docs and community sources. Only native App Intents (requiring a compiled Swift app) support true inline parameters.

### Pattern 4: Timer Duration Parsing

**What:** Extract timer name and duration from a single spoken string like "pasta 10 minutes".

**Regex pattern for Match Text action:**
```
(\d+)\s*(seconds?|minutes?|hours?)
```

**Parsing logic:**
1. Use "Match Text" with the regex above to find duration
2. Extract the number and unit from capture groups
3. Convert to seconds: seconds=1x, minutes=60x, hours=3600x
4. Everything before the matched duration pattern is the timer name
5. If no match found, prompt "How long should the timer be?" via "Ask for Input"

**Confidence:** MEDIUM -- regex works in Shortcuts "Match Text" (ICU standard), but speech-to-text may produce unexpected formats (e.g., "10 min" vs "ten minutes"). Testing needed for edge cases.

### Recommended Shortcut Structure

```
GROCERY SHORTCUT ("Grocery"):
1. Ask for Input (prompt: "What would you like to add?")
2. Split Text (by: New Lines + commas + "and") -> item list
3. Set variable: addedItems = empty list
4. Repeat with Each (item in list):
   a. Trim whitespace
   b. Skip if empty
   c. GET /rest/v1/groceries?name=eq.<item>&checked=eq.false
   d. If response is empty:
      - POST /rest/v1/groceries { name, checked: false, added_by: "siri" }
      - Append item to addedItems
5. If addedItems not empty:
   - Show Result: "Added [items]"
6. Else:
   - Show Result: "Already on the list"

TIMER SHORTCUT ("Timer"):
1. Ask for Input (prompt: "What timer would you like to set?")
2. Match Text: regex for duration (\d+)\s*(seconds?|minutes?|hours?)
3. If no match:
   a. Set timerName = full input
   b. Ask for Input (prompt: "How long should the timer be?")
   c. Match Text again on new input
4. Calculate duration_seconds from number + unit
5. Extract timer name (text before duration match, or full input if asked separately)
6. POST /rest/v1/timers { label, duration_seconds, started_at: Current Date ISO }
7. Show Result: "[Name] timer set for [duration]"
```

### Anti-Patterns to Avoid
- **Hardcoding the Supabase URL/key in every action:** Use Shortcuts "Text" actions at the top to define these as reusable variables. Easier to update if the project ref changes.
- **Using "Dictate Text" instead of "Ask for Input":** "Dictate Text" has a fixed listening duration and less reliable behavior. "Ask for Input" adapts to Siri context automatically.
- **Skipping the retry on failure:** Network glitches are common on mobile. Always retry once before showing an error.
- **Case-sensitive duplicate matching:** Siri may capitalize words differently. The GET filter for duplicates should use case-insensitive matching: `?name=ilike.<item>&checked=eq.false`.

## Discretion Recommendations

### Multi-item Delimiter Strategy
**Recommendation:** Split by commas first, then by " and ", then treat remaining items as space-separated words.

**Rationale:** Siri speech-to-text typically produces:
- "milk, eggs, bread" (comma-separated) -- most common for lists
- "milk and eggs and bread" (word "and")
- "milk eggs bread" (space-separated) -- least structured

**Implementation:** Use two "Split Text" actions chained:
1. Split by "Custom" separator: `,` (comma)
2. For each result, use "Replace Text" to replace " and " with `,`
3. Split again by `,`
4. Trim each result

This handles all three formats. Space-only separation is risky (e.g., "orange juice" would become two items). Use commas and "and" as delimiters, treat remaining text as a single item name.

**Confidence:** MEDIUM -- depends on how users naturally speak lists to Siri. The comma + "and" strategy is safest for multi-word item names like "orange juice".

### Quantity Storage
**Recommendation:** Store quantity as part of the item name string (e.g., "2 milk").

**Rationale:**
- The existing `groceries` table has no `quantity` column
- Adding a column requires a schema migration
- The web app displays `name` directly -- "2 milk" reads naturally
- The duplicate check can still match on name (e.g., "2 milk" won't match existing "milk")
- Keeps the Shortcut simple -- no parsing of quantity vs. item name needed

**Confidence:** HIGH -- matches existing schema, zero migration required.

### PostgREST Endpoint URL Construction
**Recommendation:**
```
Base URL:  https://<PROJECT_REF>.supabase.co/rest/v1
Groceries: POST /rest/v1/groceries
Timers:    POST /rest/v1/timers
Dup Check: GET  /rest/v1/groceries?name=ilike.<item>&checked=eq.false
```

The `<PROJECT_REF>` is the Supabase project identifier (found in project settings). The anon key goes in both `apikey` and `Authorization: Bearer` headers.

**Confidence:** HIGH -- verified against PostgREST v12 docs and existing Supabase client config in `src/lib/supabase.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP requests | Custom scripts or webhook services | Shortcuts "Get Contents of URL" action | Native, no external dependencies, handles headers/body natively |
| Text parsing | Complex nested If/Replace chains | "Split Text" + "Match Text" (regex) | Built-in Shortcuts actions, handles edge cases better |
| Duration conversion | Manual multiplication chains | "Calculate" action with If/Else for unit | Shortcuts has a native math action |
| Error retry | Manual duplicate request chain | "Repeat" action (count: 2) with "If" on result | Cleaner flow, easier to maintain |
| ISO date formatting | Text concatenation of date parts | "Format Date" action with ISO 8601 format | Handles timezone correctly |

**Key insight:** Everything needed exists as native Shortcuts actions. No external scripts, no Shortcut extensions, no server-side code.

## Common Pitfalls

### Pitfall 1: Siri Does Not Pass Inline Text
**What goes wrong:** Developer assumes "Hey Siri, grocery milk eggs" passes "milk eggs" directly to the Shortcut.
**Why it happens:** Confusion with App Intents (which DO support inline parameters but require a compiled Swift app).
**How to avoid:** Use "Ask for Input" action. Siri will voice-prompt the user. The flow is: "Hey Siri, grocery" -> Siri asks -> user dictates items.
**Warning signs:** If testing only by tapping the Shortcut (which uses keyboard input), the voice flow is untested.

### Pitfall 2: Case-Sensitive Duplicate Matching
**What goes wrong:** "Milk" (Siri capitalizes) doesn't match "milk" (previously added lowercase), so duplicates are added.
**Why it happens:** PostgREST `eq` filter is case-sensitive by default.
**How to avoid:** Use `ilike` instead of `eq` for the name filter: `?name=ilike.<item>`.
**Warning signs:** Duplicates appearing on the grocery list despite the check.

### Pitfall 3: Speech-to-Text Number Words
**What goes wrong:** User says "ten minutes" but Siri transcribes it as "10 minutes" (or vice versa: the number "10" as the word "ten").
**Why it happens:** Siri's speech-to-text can produce either numeric digits or written-out numbers inconsistently.
**How to avoid:** Handle both in the regex: `(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|forty-five|sixty)\s*(seconds?|minutes?|hours?)`. Provide a mapping for word-to-number conversion.
**Warning signs:** Timer creation fails silently when user says number words.

### Pitfall 4: "Get Contents of URL" Timeout
**What goes wrong:** Supabase is slow or unreachable, and the Shortcut hangs without user feedback.
**Why it happens:** "Get Contents of URL" has no configurable timeout in Shortcuts.
**How to avoid:** Wrap in a "Repeat" loop (count 2) with error handling. On first failure, retry. On second failure, show "Couldn't reach the dashboard".
**Warning signs:** Siri goes silent for extended periods after the user dictates input.

### Pitfall 5: Multi-Word Item Names Split Incorrectly
**What goes wrong:** "orange juice" becomes two items: "orange" and "juice".
**Why it happens:** Splitting by spaces treats every word as a separate item.
**How to avoid:** Do NOT split by spaces. Use commas and "and" as delimiters only. This means "orange juice, milk" correctly produces ["orange juice", "milk"].
**Warning signs:** Common multi-word items (orange juice, olive oil, toilet paper) appearing as separate entries.

### Pitfall 6: Timer `started_at` Timezone
**What goes wrong:** Timer starts at the wrong time because the ISO date is in local time without timezone offset.
**Why it happens:** Shortcuts "Current Date" formatted without timezone info.
**How to avoid:** Use "Format Date" action with format "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ" to produce proper ISO 8601 with timezone offset (or use UTC).
**Warning signs:** Timers appear to have wrong remaining time on the wall display.

### Pitfall 7: Supabase Anon Key Exposure in Shared Shortcut
**What goes wrong:** The anon key is visible to anyone who receives the Shortcut iCloud link.
**Why it happens:** Shortcuts are shared with all their configuration, including embedded text values.
**How to avoid:** This is acceptable per the project's security model (RLS guardrails, family-only use, row count limits already in place from Phase 11). The anon key is already exposed in the browser client-side code. No additional risk.
**Warning signs:** N/A -- this is by design.

## Code Examples

### Supabase REST API: Insert Grocery Item
```bash
# Source: PostgREST v12 docs + verified against src/lib/api/groceries.ts
curl -X POST "https://<PROJECT_REF>.supabase.co/rest/v1/groceries" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name": "milk", "checked": false, "added_by": "siri"}'
```

### Supabase REST API: Check for Duplicate Grocery (case-insensitive)
```bash
# Source: PostgREST v12 docs
curl "https://<PROJECT_REF>.supabase.co/rest/v1/groceries?name=ilike.milk&checked=eq.false&select=id" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
# Returns [] if no duplicate, or [{"id":"..."}] if exists
```

### Supabase REST API: Insert Timer
```bash
# Source: PostgREST v12 docs + verified against src/lib/api/timers.ts
curl -X POST "https://<PROJECT_REF>.supabase.co/rest/v1/timers" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"label": "pasta", "duration_seconds": 600, "started_at": "2026-02-17T10:30:00.000Z"}'
```

### Apple Shortcuts: Timer Duration Regex
```
# ICU regex for Match Text action
(\d+)\s*(seconds?|minutes?|hours?)

# Captures:
# Group 1: the number (e.g., "10")
# Group 2: the unit (e.g., "minutes")
```

### Apple Shortcuts: Grocery Shortcut Action Sequence
```
1.  [Ask for Input] Type: Text, Prompt: "What would you like to add?"
2.  [Replace Text] Find: " and " Replace: "," In: [Provided Input]
3.  [Split Text] Separator: Custom "," Input: [Updated Text]
4.  [Set Variable] Name: addedItems, Value: (empty)
5.  [Repeat with Each] Input: [Split Text]
6.    [Text] [Repeat Item] (trim whitespace -- use Replace Text to strip leading/trailing spaces)
7.    [If] [Text] has any value (skip empty strings)
8.      [Get Contents of URL]
          URL: https://<ref>.supabase.co/rest/v1/groceries?name=ilike.[Text]&checked=eq.false&select=id
          Method: GET
          Headers: apikey, Authorization
9.      [Count] Items in [Contents of URL]
10.     [If] [Count] = 0
11.       [Get Contents of URL]
            URL: https://<ref>.supabase.co/rest/v1/groceries
            Method: POST
            Headers: apikey, Authorization, Content-Type
            Body: JSON {"name": [Text], "checked": false, "added_by": "siri"}
12.       [Add to Variable] Variable: addedItems, Value: [Text]
13.     [End If]
14.   [End If]
15. [End Repeat]
16. [If] addedItems has any value
17.   [Show Result] "Added [addedItems]"
18. [Else]
19.   [Show Result] "Already on the list"
20. [End If]
```

### Apple Shortcuts: Timer Shortcut Action Sequence
```
1.  [Ask for Input] Type: Text, Prompt: "What timer would you like to set?"
2.  [Set Variable] Name: rawInput, Value: [Provided Input]
3.  [Match Text] Pattern: (\d+)\s*(seconds?|minutes?|hours?) In: [rawInput]
4.  [If] [Match Text] has any value
5.    [Get Group from Matched Text] Group: 1 -> durationNumber
6.    [Get Group from Matched Text] Group: 2 -> durationUnit
7.    [Replace Text] Find: \s*\d+\s*(seconds?|minutes?|hours?)\s* Replace: "" In: [rawInput] -> timerName
8.  [Else]
9.    [Set Variable] timerName = [rawInput]
10.   [Ask for Input] Type: Text, Prompt: "How long should the timer be?"
11.   [Match Text] Pattern: (\d+)\s*(seconds?|minutes?|hours?) In: [Provided Input]
12.   [Get Group from Matched Text] Group: 1 -> durationNumber
13.   [Get Group from Matched Text] Group: 2 -> durationUnit
14. [End If]
15. [If] durationUnit contains "hour"
16.   [Calculate] [durationNumber] * 3600 -> durationSeconds
17. [Else If] durationUnit contains "minute"
18.   [Calculate] [durationNumber] * 60 -> durationSeconds
19. [Else]
20.   [Set Variable] durationSeconds = [durationNumber]
21. [End If]
22. [Format Date] [Current Date] format: ISO 8601 -> isoNow
23. [Get Contents of URL]
      URL: https://<ref>.supabase.co/rest/v1/timers
      Method: POST
      Headers: apikey, Authorization, Content-Type
      Body: JSON {"label": [timerName], "duration_seconds": [durationSeconds], "started_at": [isoNow]}
24. [Show Result] "[timerName] timer set for [durationNumber] [durationUnit]"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SiriKit Intents (native app required) | Apple Shortcuts with REST API calls | iOS 13+ (2019) | No native app needed; Shortcuts can call any REST API |
| Custom server middleware for Siri | Direct PostgREST calls from Shortcuts | Supabase auto-generates REST | Zero server code needed |
| "Dictate Text" action | "Ask for Input" with Siri context | iOS 15+ improvements | "Ask for Input" auto-adapts to voice when triggered via Siri |

**Deprecated/outdated:**
- SiriKit custom intents for simple data entry: Overkill when Shortcuts + REST API achieves the same result
- "Dictate Text" action: Still exists but "Ask for Input" is preferred for Siri-triggered shortcuts

## Open Questions

1. **ilike filter URL encoding in Shortcuts**
   - What we know: PostgREST `ilike` filter works for case-insensitive matching
   - What's unclear: Whether Apple Shortcuts "Get Contents of URL" correctly URL-encodes special characters in the query parameter (e.g., spaces in item names like "orange juice" -> `orange%20juice`)
   - Recommendation: Test with URL-encoded values. May need a "URL Encode" text action before constructing the GET URL.

2. **Siri speech-to-text consistency for number words**
   - What we know: Siri sometimes transcribes "ten" as "10" and sometimes as "ten"
   - What's unclear: Whether this varies by iOS version, language settings, or context
   - Recommendation: Start with numeric-only regex. If users report issues, add word-to-number mapping in a later iteration.

3. **Error handling in "Get Contents of URL"**
   - What we know: The action returns empty/error on network failure
   - What's unclear: Exact error format returned (empty string? error dictionary? nothing?)
   - Recommendation: Test with Supabase turned off. Use "If" to check if result "has any value" or check for HTTP status in response.

## Sources

### Primary (HIGH confidence)
- `supabase/schema.sql` -- Table definitions for `groceries` and `timers`
- `supabase/rls-policies.sql` -- RLS policies confirming anon INSERT access with row limits
- `src/lib/api/groceries.ts` -- Existing grocery insert pattern (column names, types)
- `src/lib/api/timers.ts` -- Existing timer insert pattern (column names, types)
- `src/types/database.ts` -- TypeScript types matching exact schema
- `src/lib/supabase.ts` -- Client configuration (env var names, anon key usage)
- [PostgREST v12 docs: Tables and Views](https://docs.postgrest.org/en/v12/references/api/tables_views.html) -- Insert, filter, and `on_conflict` behavior

### Secondary (MEDIUM confidence)
- [Apple Support: Request your first API in Shortcuts](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) -- "Get Contents of URL" POST/JSON capabilities
- [Apple Support: Use the Ask for Input action](https://support.apple.com/guide/shortcuts/use-the-ask-for-input-action-apd68b5c9161/ios) -- Voice prompt behavior with Siri
- [Apple Support: Share shortcuts](https://support.apple.com/guide/shortcuts/share-shortcuts-apdf01f8c054/ios) -- iCloud link sharing mechanism
- [Apple Support: Use Repeat actions](https://support.apple.com/guide/shortcuts/use-repeat-actions-apdc11deb2c1/ios) -- Repeat with Each loop
- [macmost.com: Creating Shortcuts That Accept Voice Input](https://macmost.com/creating-shortcuts-that-accept-voice-input.html) -- Confirmed "Ask for Input" is the voice input mechanism (NOT inline text after shortcut name)
- [Supabase Docs: REST API](https://supabase.com/docs/guides/api) -- URL format, header requirements
- [Supabase Docs: API Keys](https://supabase.com/docs/guides/api/api-keys) -- Anon key usage pattern

### Tertiary (LOW confidence)
- [AppleToolBox: Regex with Shortcuts App](https://appletoolbox.com/how-to-start-using-regex-with-the-shortcuts-app/) -- ICU regex in Match Text action
- [Matthew Cassinelli: Split Text](https://matthewcassinelli.com/actions/split-text/) -- Split Text action details

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No libraries to install; Apple Shortcuts + Supabase PostgREST are the only components, both well-documented
- Architecture: HIGH -- PostgREST API format verified against existing codebase and official docs; Shortcut action flow verified against Apple docs
- Pitfalls: HIGH -- Key pitfalls (no inline Siri input, case sensitivity, multi-word items) identified and verified with multiple sources

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- Apple Shortcuts and PostgREST APIs change infrequently)
