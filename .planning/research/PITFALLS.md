# Domain Pitfalls

**Domain:** Family Dashboard v1.1 Polish Features
**Researched:** 2026-02-17
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

Mistakes that cause rewrites, data exposure, or dashboard downtime on the always-on Pi.

### Pitfall 1: Siri Shortcuts Exposing Supabase Service Role Key

**What goes wrong:** To make Apple Shortcuts work with Supabase, developers embed the `service_role` key directly in the Shortcut's "Get Contents of URL" action. The service role key bypasses all RLS policies. Anyone who copies or inspects the Shortcut (shared via iCloud link, visible in Shortcuts app) gains full database access -- can delete all groceries, timers, chores, and completions.

**Why it happens:**
- The current RLS policy is `"Allow all" ... using (true)` on every table, so the anon key already works for inserts. Developers mistakenly think they need the service role key "for authentication."
- Apple Shortcuts stores HTTP headers in plaintext, visible to anyone with device access.
- Supabase requires both `apikey` header AND `Authorization: Bearer <key>` header for PostgREST. Developers confuse these two headers and use the wrong key for each.
- No Supabase Edge Function intermediary means the Shortcut talks directly to the database API.

**Consequences:**
- Full database read/write/delete from anyone with the key
- No audit trail of who made changes (anon key vs service_role both appear as anonymous)
- Cannot revoke access without rotating the key, which breaks the dashboard too

**Prevention:**
- Use the **anon key** in Shortcuts, not service_role. Your current RLS is `using (true)` so the anon key already has full CRUD access. This is actually fine for a family-only dashboard.
- If you later tighten RLS, create a Supabase Edge Function as a thin wrapper: Shortcut calls Edge Function with a simple shared secret, Edge Function uses service_role server-side.
- Never embed service_role in any client -- Shortcut, browser, or otherwise.
- Add a `source` column to grocery/timer inserts so you can distinguish "added via Siri" from "added via dashboard."

**Detection:**
- Review any Shortcut .shortcut files for `service_role` strings
- Supabase dashboard > API > Check which key is being used in logs

**Phase to address:** Siri Shortcuts integration phase -- design the auth approach BEFORE building Shortcuts.

**Sources:**
- [Understanding API keys | Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Securing your API | Supabase Docs](https://supabase.com/docs/guides/api/securing-your-api)
- Current codebase: `supabase/schema.sql` lines 61-64 show permissive RLS policies

---

### Pitfall 2: Apple Shortcuts JSON Payload Silently Malformed

**What goes wrong:** Siri Shortcuts' "Get Contents of URL" action has a visual JSON builder that silently drops nested objects, reorders fields, or converts types incorrectly. A grocery item insert that works in Postman fails from Shortcuts with a cryptic `400 Bad Request` or, worse, inserts with null/empty fields.

**Why it happens:**
- Shortcuts' JSON builder does not support nested objects reliably -- it flattens or drops them.
- Type coercion: Shortcuts treats all "Ask for Input" results as strings, including numbers. `duration_seconds` for timers would arrive as `"300"` not `300`, which PostgreSQL rejects for integer columns.
- The `Prefer: return=representation` header (needed to get back the inserted row) is not added by default, so you get an empty `{}` response and assume the insert failed.
- No error details visible in Shortcuts -- HTTP errors show as generic "The request was not successful."

**Consequences:**
- Siri says "Done" but nothing appears on the dashboard
- Silent data corruption (wrong types, missing fields)
- Impossible to debug without a separate HTTP logging tool

**Prevention:**
- Build the JSON body as a **Text action** (raw JSON string), then pass it as **File** body type in "Get Contents of URL." This bypasses the visual JSON builder entirely.
- Always include `Content-Type: application/json` header explicitly.
- For timer creation, ensure `duration_seconds` is wrapped in a "Calculate" action to force number type before insertion.
- Add `Prefer: return=representation` header to verify the response contains the created row.
- Test every Shortcut payload against Supabase's PostgREST endpoint manually first (curl or Postman).
- Consider a Supabase Edge Function that accepts simplified/lenient input and does server-side validation and type coercion.

**Detection:**
- Test each Shortcut by checking the Supabase table after execution
- Use Shortcuts' "Show Result" action after the HTTP call to inspect the response during development

**Phase to address:** Siri Shortcuts integration phase -- build and test one Shortcut completely before building others.

**Sources:**
- [Custom JSON payload for Get contents of URL in iOS Shortcuts](https://blog.alexwendland.com/2020-07-01-custom-json-payload-for-get-contents-of-url-in-ios-shortcuts/)
- [Apple Community: Shortcuts JSON issues](https://discussions.apple.com/thread/254691588)
- [Supabase Troubleshooting: HTTP API issues](https://supabase.com/docs/guides/troubleshooting/http-api-issues)
- Current codebase: `src/types/database.ts` shows `duration_seconds: number` type requirement

---

### Pitfall 3: Country Flag SVGs Causing Memory Bloat on Raspberry Pi

**What goes wrong:** The current `CountryPanel` loads country flag SVGs directly from `restcountries.com` via `<img src={country.flags.svg}>`. Some country flags are extremely complex SVGs (Bolivia's coat of arms, Mexico's eagle) with thousands of path elements. On a Raspberry Pi running Chromium 24/7, these SVGs get rasterized into memory at potentially large dimensions, consuming 10-50MB per flag and never being garbage collected because the `ContentRotator` keeps all panels mounted with `absolute inset-0` positioning.

**Why it happens:**
- SVG rendering cost scales with path complexity, not file size. A 50KB SVG with 2000 paths can consume 20MB+ of rasterized memory.
- The `ContentRotator` component (line 14-31) keeps ALL rotation panels mounted simultaneously with CSS opacity toggling. The country panel's SVG stays rasterized in memory even when not visible.
- No `width`/`height` constraints on the `<img>` tag means the browser may rasterize at intrinsic SVG dimensions (often 900x600 or larger).
- Chromium on ARM has more limited GPU memory than desktop -- complex SVG rasterization competes with the dashboard's other rendering.
- `fetchCountryOfDay()` fetches ALL 250 countries' data every call (the full REST Countries response), even though only one is displayed.

**Consequences:**
- Gradual memory increase as different flags are loaded across days
- Browser tab crash after accumulating several complex SVGs over days/weeks
- Existing memory watchdog (at 80% threshold) triggers unnecessary reloads

**Prevention:**
- Use PNG flags (`country.flags.png`) instead of SVG. PNG has fixed memory cost proportional to pixel dimensions, not path complexity. The PNG versions from restcountries are typically 320x213 pixels (~200KB file, ~260KB decoded).
- Add explicit `width` and `height` to the `<img>` tag: `className="h-16 w-auto"` is CSS-only; add `width="256" height="170"` HTML attributes for browser decode hints.
- Cache the selected country's flag locally (IndexedDB or service worker cache) so you are not re-fetching daily.
- Fetch only the needed country instead of all 250: use `https://restcountries.com/v3.1/name/{name}` once you have the selected country, or cache the full list in localStorage and only fetch the flag image on demand.
- Consider using emoji flags (country code to flag emoji) as a zero-memory alternative for the small display.

**Detection:**
- Monitor `performance.memory.usedJSHeapSize` (already done in `useMemoryWatchdog`)
- Check which country flags are most complex (test Bolivia, Mexico, Turkmenistan specifically)
- Watch for memory threshold triggers in error reporting

**Phase to address:** Country images phase -- switch to PNG flags and add caching before deploying.

**Sources:**
- [SVG memory issues in Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1017847)
- [SVG performance planning - O'Reilly](https://oreillymedia.github.io/Using_SVG/extras/ch19-performance.html)
- [Chrome memory issues on Raspberry Pi](https://forums.raspberrypi.com/viewtopic.php?t=221967)
- Current codebase: `src/components/sidebar/CountryPanel.tsx` line 62 uses `country.flags.svg`
- Current codebase: `src/components/sidebar/ContentRotator.tsx` keeps all panels mounted

---

### Pitfall 4: Horoscope API Migration Breaking the Content Rotator

**What goes wrong:** The current horoscope API (`ohmanda.com/api/horoscope`) stops working (it is a free hobby project with no SLA). You migrate to a new API, but the new API has different response shapes, rate limits, or authentication requirements. The `HoroscopePanel` crashes, and because it is rendered inside the `ContentRotator` (which keeps all panels mounted), the error propagates and can crash the entire sidebar rotation including Transit and Country panels.

**Why it happens:**
- `ohmanda.com` is a free, single-developer project. No uptime guarantee, no versioned API, no rate limit documentation.
- The `ErrorBoundary` wraps the entire sidebar rotation block (App.tsx line 74), not individual panels. A crash in `HoroscopePanel` takes down the whole `ContentRotator`.
- The current `useHoroscope` hook uses React Query with only `retry: 2` and no `placeholderData` or fallback. If the API changes shape, `response.json()` succeeds but downstream rendering crashes on missing properties.
- New horoscope APIs may require API keys, have different field names (`horoscope` vs `text` vs `description`), or return different date formats.

**Consequences:**
- Sidebar shows error fallback instead of any rotating content
- Transit and Country panels also disappear due to shared ErrorBoundary
- Family loses three features (transit, horoscopes, country) from one API failure

**Prevention:**
- Wrap each child of `ContentRotator` in its own `ErrorBoundary`. Currently there is one ErrorBoundary around the entire sidebar rotation block. Each panel (Transit, Horoscope, Country) should catch its own errors independently.
- Add response shape validation in `fetchHoroscopes()`: check that `data.horoscope` exists and is a string before returning. If not, return a safe fallback or throw a descriptive error.
- Add `placeholderData` to the React Query hook so stale horoscope data persists while migration is in progress.
- Abstract the API behind a data adapter: `fetchHoroscopes()` should return a normalized `HoroscopeData[]` regardless of which upstream API is used. Swap the adapter, not the consumer.
- Consider caching the last successful horoscope response in `localStorage` as a fallback.
- When migrating APIs, run both old and new in parallel (try new first, fall back to old) for a transition period.

**Detection:**
- The current `console.warn` in `fetchHoroscopes()` is the only signal. Add structured error reporting.
- Monitor the `horoscope` React Query key for elevated error rates.
- Check `ohmanda.com` availability periodically (it has gone down before).

**Phase to address:** Horoscope fix phase -- add per-panel ErrorBoundaries BEFORE swapping the API.

**Sources:**
- [Horoscope API alternatives comparison](https://vedika.io/blog/best-astrology-api-developers-2025)
- Current codebase: `src/lib/api/horoscope.ts` -- single API dependency, minimal error handling
- Current codebase: `src/App.tsx` lines 74-89 -- single ErrorBoundary around all rotation content

---

## Moderate Pitfalls

### Pitfall 5: Calendar Layout Changes Breaking Event Rendering

**What goes wrong:** Changing the calendar layout (e.g., adding time-block visualization, multi-column day view, or event grouping) causes subtle breakages in the existing `DayRow`/`EventCard` rendering. Events disappear, overlap, or show at wrong positions. The bug is intermittent because it only affects certain event types (all-day vs timed, multi-person vs single-person, events with travel timezone).

**Why it happens:**
- `EventCard` uses `React.memo` (line 10) -- changing props shape or adding new props without updating the memo comparison causes stale renders.
- The `DayRow` component mixes weather data indexing (`dayIndex < weather.daily.time.length`) with event rendering. Changing the day structure can break weather badge alignment.
- Event card layout uses `flex items-start gap-2` with fixed-width time column (`w-[clamp(40px,4vw,60px)]`). Adding new columns or changing flex direction breaks the time/summary/badge alignment.
- Travel timezone display (`travelTimeDisplay`) is conditionally rendered and adds variable height. Layout changes that assume fixed event card height will break when travel times appear.
- `clamp()` values are carefully tuned for current layout. Changing container dimensions shifts all clamp calculations.

**Prevention:**
- Before any layout changes, document the current rendering for these event variants: (1) all-day event, (2) timed event single person, (3) timed event multi-person, (4) event with travel timezone, (5) Schulfrei event, (6) day with no events.
- Make layout changes additive, not restructuring. Add new visual elements alongside existing ones rather than rearranging the flex structure.
- If restructuring is necessary, keep `EventCard` untouched and wrap it in a new layout component.
- Test with real calendar data, not mock data. Edge cases exist in production calendars that mocks miss.

**Detection:**
- Visual regression: screenshot current calendar on all 4 days visible, compare after changes
- Check all conditional CSS classes: `event-schulfrei`, `day-today`, travel timezone opacity

**Phase to address:** Calendar layout changes phase -- document current variants and test against real data.

**Sources:**
- Current codebase: `src/components/calendar/EventCard.tsx` -- complex conditional rendering
- Current codebase: `src/components/calendar/DayRow.tsx` -- weather index coupling
- [Common Sense Refactoring of a Messy React Component](https://alexkondov.com/refactoring-a-messy-react-component/)

---

### Pitfall 6: Removing Grocery Priority Interrupt Without Updating All Consumers

**What goes wrong:** The `usePriorityInterrupt` hook is removed or modified to no longer include groceries, but the change does not propagate correctly through the component tree. The sidebar gets stuck in "priority" mode, the content rotation never resumes, or the grocery panel appears in unexpected places.

**Why it happens:**
- `usePriorityInterrupt` is called in `App.tsx` (line 29) with three arguments: `activeTimerCount`, `completedTimers.length`, and `uncheckedCount`. Its return value feeds into `useContentRotation` (line 30) via `priority.rotationPaused`, and also controls the sidebar conditional rendering (lines 66-89).
- The priority state has four properties (`mode`, `showTimers`, `showGroceries`, `rotationPaused`). Removing grocery logic requires updating ALL consumers of ALL four properties.
- The sidebar renders `priority.showGroceries && <GroceryPanel variant="compact" />` (line 70). If you remove the grocery condition but not the component reference, the compact grocery panel either always shows or never shows.
- The 500ms debounce (lines 41-46) is designed for the transition FROM priority TO rotation. If you change what triggers priority mode, the debounce timing may cause the rotation to appear stuck for half a second when timers are the only trigger.

**Prevention:**
- Map all consumers of `usePriorityInterrupt` return value before making changes. There are exactly two: `App.tsx` lines 29-30 (state derivation) and lines 66-89 (conditional rendering).
- If removing grocery interrupt entirely: change `usePriorityInterrupt` to accept only timer counts, remove the `showGroceries` property from `PriorityState`, remove the grocery conditional from the sidebar priority block.
- If keeping grocery in sidebar but not as interrupt: move `<GroceryPanel variant="compact" />` from inside the priority conditional to a fixed position (like `ChorePanel` on line 91).
- Test the transition sequence: no timers + no groceries = rotation, add timer = priority mode with timer panel, clear timer = 500ms debounce then back to rotation.

**Detection:**
- Sidebar stuck in priority mode with no active timers
- Content rotation not resuming after conditions clear
- Compact grocery panel appearing/disappearing unexpectedly

**Phase to address:** Priority interrupt removal phase -- trace all data flow paths before changing the hook.

**Sources:**
- Current codebase: `src/hooks/usePriorityInterrupt.ts` -- full hook implementation
- Current codebase: `src/App.tsx` lines 27-31, 66-89 -- all consumers

---

### Pitfall 7: Removing Mobile Nav Timer Tab Breaking Navigation State

**What goes wrong:** Removing the `timers` tab from `MobileNav` causes the `activeView` state to become `'timers'` with no corresponding tab to display it or navigate away from it. Users on mobile see a blank screen with no way to navigate back.

**Why it happens:**
- `useMobileNav` initializes `activeView` to `'calendar'` (safe default), BUT if the state was previously set to `'timers'` in the same session and the component re-renders after the tab removal, React preserves the stale state.
- The `MobileView` type union includes `'timers'` (`type MobileView = 'calendar' | 'groceries' | 'timers' | 'chores'`). Removing the tab without updating the type means TypeScript still allows setting `activeView` to `'timers'`.
- `App.tsx` renders `activeView === 'timers' && <TimerPanel variant="full" />` (lines 52-55). If the tab is removed but this conditional remains, users can never reach the timer view but the code path still exists. If the conditional is also removed, any external navigation to timers breaks.

**Prevention:**
- Update `MobileView` type to remove `'timers'`: `type MobileView = 'calendar' | 'groceries' | 'chores'`
- Remove the `activeView === 'timers'` conditional block from `App.tsx`
- Remove the timers entry from the `tabs` array in `MobileNav.tsx`
- Add a guard in `useMobileNav`: if `activeView` is not in the valid set, reset to `'calendar'`
- Consider if timer functionality should still be accessible on mobile via a different path (e.g., always visible in sidebar, or accessible from a chores sub-view)

**Detection:**
- TypeScript compilation errors will catch most issues IF you update the type first
- Test mobile layout after removal: navigate to each remaining tab, verify no blank screen state

**Phase to address:** Mobile nav cleanup phase -- update type, component, and App.tsx together as an atomic change.

**Sources:**
- Current codebase: `src/hooks/useMobileNav.ts` -- type definition and state
- Current codebase: `src/components/layout/MobileNav.tsx` -- tab rendering
- Current codebase: `src/App.tsx` lines 42-61 -- view conditional rendering

---

### Pitfall 8: REST Countries API Fetching All 250 Countries for One

**What goes wrong:** `fetchCountryOfDay()` downloads the entire REST Countries dataset (~250 countries, ~200KB JSON) every time it is called. On Pi with limited bandwidth or when the API is slow, this delays the entire sidebar content rotation. If the API returns an error or times out, there is no cached fallback.

**Why it happens:**
- The current implementation uses `https://restcountries.com/v3.1/all?fields=...` because the country selection is deterministic based on date seed. You need the full array to do `countries[daySeed % countries.length]`.
- `useCountryOfDay` has `staleTime: 24 hours` and `refetchInterval: 24 hours`, so it refetches once per day. But on the daily 3am auto-refresh (from `useAutoRefresh`), the React Query cache is cleared and it re-fetches.
- REST Countries API has reported slow response times and intermittent outages in 2025.

**Prevention:**
- Cache the full country list in `localStorage` (it rarely changes). Only fetch from API if cache is empty or older than 30 days.
- Pre-compute the country selection server-side or in a build step: generate a JSON file mapping day-of-year to country, bundle it with the app. Zero API dependency.
- If keeping the API call: add a `localStorage` fallback so a failed fetch still shows yesterday's country rather than "Country unavailable."
- Reduce payload: you only need `name`, `flags`, `capital`, `population`, `languages`, `region`, `currencies` (already filtered), but consider if you can drop any of these.

**Detection:**
- Network tab shows 200KB+ fetch on every page load/refresh
- "Country unavailable" showing when API is down

**Phase to address:** Country images phase -- add caching before adding any new image features.

**Sources:**
- [REST Countries API reliability issues](https://community.make.com/t/rest-countries-api-module-slow-response-causes-scenarios-to-error/39380)
- [ApiCountries alternative](https://www.apicountries.com/blog/alternative-to-restcountries)
- Current codebase: `src/lib/api/countryOfDay.ts` -- fetches all countries

---

## Minor Pitfalls

### Pitfall 9: Siri Input Parsing Ambiguity

**What goes wrong:** Siri dictates "add bananas and milk to the grocery list" but the Shortcut receives this as a single string `"bananas and milk"`. One grocery item named "bananas and milk" is created instead of two separate items.

**Prevention:**
- In the Shortcut, add a "Split Text" action on the input using ", " and " and " as delimiters, then loop through results to insert each item individually.
- Alternatively, accept single-item input only and let users run the Shortcut multiple times ("Hey Siri, add bananas" then "Hey Siri, add milk").
- Document the expected input format in the Shortcut name/description: "Add Grocery Item" (singular) sets expectations.

**Phase to address:** Siri Shortcuts integration phase.

---

### Pitfall 10: New Image Content Increasing Pi Page Weight Beyond Memory Budget

**What goes wrong:** Adding country images (beyond flags) or any photo content pushes the page's decoded image memory past what the Pi's Chromium can handle alongside the dashboard's other content. The memory watchdog triggers frequent reloads, making the dashboard feel unstable.

**Prevention:**
- Set a memory budget for images: no more than 10MB decoded image data at any time.
- Use `loading="lazy"` on all non-critical images.
- Prefer CSS-based visuals (gradients, borders, emoji) over raster images where possible.
- If adding country photos: use thumbnails (max 400px wide), WebP format, and unload when not visible (set `src=""` when panel is not active instead of using CSS opacity).
- Monitor `performance.memory` before and after adding image features.

**Phase to address:** Country images phase -- establish memory budget before adding any images.

**Sources:**
- [Browser memory issues on Raspberry Pi](https://forums.raspberrypi.com/viewtopic.php?t=221967)
- Current codebase: `src/hooks/useMemoryWatchdog.ts` -- existing 80% threshold

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Siri Shortcuts | Service role key exposure (Pitfall 1) | Use anon key; consider Edge Function wrapper |
| Siri Shortcuts | Malformed JSON payloads (Pitfall 2) | Use Text action for JSON, test with curl first |
| Siri Shortcuts | Input parsing ambiguity (Pitfall 9) | Single-item design, Split Text for multi-item |
| Horoscope fix | API migration crashing sidebar (Pitfall 4) | Per-panel ErrorBoundaries, data adapter pattern |
| Country images | SVG memory bloat (Pitfall 3) | Switch to PNG flags, add width/height attributes |
| Country images | Full API fetch overhead (Pitfall 8) | Cache country list in localStorage |
| Country images | Page weight exceeding Pi budget (Pitfall 10) | Set 10MB image memory budget, use WebP thumbnails |
| Calendar layout | Breaking existing event rendering (Pitfall 5) | Document all 6 event variants, additive changes only |
| Remove grocery interrupt | Stale priority state (Pitfall 6) | Trace all data flow paths, update all consumers atomically |
| Remove timer mobile tab | Navigation dead state (Pitfall 7) | Update type + component + App.tsx as atomic change |

## Integration Risk Matrix

| Change | Risk Level | Blast Radius | Rollback Difficulty |
|--------|-----------|-------------|-------------------|
| Siri Shortcuts (new feature) | MEDIUM | Low -- additive, no existing code changes | Easy -- just remove Shortcuts |
| Horoscope API migration | HIGH | Medium -- sidebar rotation affected | Medium -- can revert to old API if still up |
| Country PNG flags | LOW | Low -- swap src attribute | Easy -- revert one line |
| Country image caching | LOW | Low -- additive caching layer | Easy -- remove cache, fall back to API |
| Calendar layout changes | HIGH | High -- core dashboard feature | Hard -- layout intertwined with data rendering |
| Remove grocery interrupt | MEDIUM | Medium -- sidebar behavior changes | Easy -- revert hook changes |
| Remove timer mobile tab | LOW | Low -- mobile only | Easy -- re-add tab entry |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service role key leaked | HIGH | Rotate both keys in Supabase dashboard, update all .env files, update all Shortcuts |
| Malformed Siri data in DB | LOW | Query and clean malformed rows, fix Shortcut, re-test |
| SVG memory crash on Pi | LOW | SSH into Pi, restart Chromium, deploy PNG flag fix |
| Horoscope sidebar crash | LOW | Deploy per-panel ErrorBoundary fix, sidebar self-heals |
| Calendar layout regression | MEDIUM | Git revert layout commit, redeploy, plan changes more carefully |
| Priority mode stuck | LOW | Hard refresh on Pi clears React state, deploy hook fix |
| Mobile nav dead state | LOW | Hard refresh resets to calendar view, deploy type fix |

---

*Pitfalls research for: Family Dashboard v1.1 Polish Features*
*Researched: 2026-02-17*
*Confidence: MEDIUM-HIGH based on codebase analysis, Supabase official docs, community reports, and platform-specific research*
