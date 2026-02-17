# Architecture Research: v1.1 Polish Features Integration

**Domain:** Siri voice integration, UI refinements, image caching for existing family dashboard
**Researched:** 2026-02-17
**Confidence:** HIGH

## Integration Overview

This research covers three distinct integration points into the existing React + Supabase + Vite dashboard:

1. **Siri Shortcuts -> Supabase** (new external data path)
2. **Country flag/image caching on Pi** (service worker enhancement)
3. **Calendar emoji configurability** (component tree modification)

```
                       EXISTING ARCHITECTURE
                       =====================

iPhone                    GitHub Pages              Raspberry Pi
┌──────────────┐         ┌──────────────┐          ┌──────────────┐
│ Siri Voice   │         │ Static Site  │          │ Chromium     │
│  "Add milk"  │         │ (React+Vite) │          │ Kiosk Mode   │
│      │       │         │              │          │              │
│      v       │         │  React Query │◄────────►│  React Query │
│  Shortcuts   │         │  + Realtime  │          │  + Realtime  │
│  App         │         │  Subscripts  │          │  Subscripts  │
│      │       │         └──────┬───────┘          └──────┬───────┘
│      v       │                │                         │
│ HTTP POST ───┼────┐          │                         │
└──────────────┘    │   ┌──────▼─────────────────────────▼──────┐
                    └──►│           Supabase                     │
                        │  PostgREST API  ←── NEW: direct POST  │
                        │  Realtime WS    ←── existing           │
                        │  RLS Policies   ←── NEW: anon INSERT   │
                        └───────────────────────────────────────┘
```

---

## Integration 1: Siri Shortcuts -> Supabase (Direct PostgREST)

### Verdict: No Edge Function needed. POST directly to PostgREST.

**Confidence:** HIGH (verified against Supabase REST API docs and Apple Shortcuts documentation)

### Why Direct PostgREST Works

The existing codebase already uses PostgREST under the hood -- the `supabase-js` client in `src/lib/supabase.ts` wraps PostgREST calls. Apple Shortcuts can replicate these same HTTP calls natively using the "Get Contents of URL" action.

**What the Shortcut does:**
```
POST https://<project-ref>.supabase.co/rest/v1/groceries
Headers:
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_ANON_KEY>
  Content-Type: application/json
  Prefer: return=minimal
Body:
  {"name": "milk", "checked": false, "added_by": "siri"}
```

**What the Shortcut does NOT need:**
- No Edge Function (no business logic beyond INSERT)
- No authentication flow (anon key + RLS is sufficient for a family app)
- No CORS handling (Shortcuts makes native HTTP calls, not browser requests)

### Why NOT an Edge Function

Edge Functions add value when you need:
- Multi-step transactions (not needed -- single INSERT)
- Complex validation (not needed -- RLS + column defaults handle it)
- Third-party API orchestration (not needed -- direct to DB)
- Secret management beyond anon key (not needed for family-only use)

The current `addGrocery()` in `src/lib/api/groceries.ts` is a single `.insert()` call. The Shortcut replicates this exact operation via raw HTTP.

### Required: RLS INSERT Policy for anon Role

The existing Supabase setup likely has RLS enabled. A new policy is needed to allow the `anon` role to INSERT into tables that Siri will write to.

```sql
-- Allow anonymous inserts to groceries (for Siri Shortcuts)
CREATE POLICY "anon_insert_groceries" ON public.groceries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous inserts to timers (for Siri Shortcuts)
CREATE POLICY "anon_insert_timers" ON public.timers
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

**Security note:** The anon key is already exposed in the client-side JS bundle (`VITE_SUPABASE_ANON_KEY`). This is a family dashboard, not a multi-tenant SaaS. The RLS policy scope is INSERT-only; reads and deletes remain protected by existing policies.

### Siri Shortcut Architecture (per command type)

**Shortcut: "Add to grocery list"**
```
1. Siri triggers shortcut by name ("Hey Siri, add to grocery list")
2. "Ask for Input" action -> Siri reads prompt, user dictates item name
3. "Get Contents of URL" action:
   - Method: POST
   - URL: https://<ref>.supabase.co/rest/v1/groceries
   - Headers: apikey, Authorization, Content-Type, Prefer
   - Body (JSON): {"name": [Dictated Text], "checked": false, "added_by": "siri"}
4. "Show Result" or "Speak Text" -> confirms "Added [item] to grocery list"
```

**Shortcut: "Set a timer"**
```
1. Siri triggers shortcut
2. "Ask for Input" -> "What timer?" (e.g., "pizza 12 minutes")
3. Text parsing step to extract label and duration
   - "Choose from Menu" for preset durations OR
   - Parse with "Replace Text" regex to extract number + unit
4. "Get Contents of URL":
   - POST to /rest/v1/timers
   - Body: {"label": [parsed label], "duration_seconds": [parsed seconds],
            "started_at": [Current Date ISO8601]}
5. Speak confirmation
```

**Timer parsing is the tricky part.** Apple Shortcuts has limited text parsing. Two approaches:
- **Preset menu (recommended):** "Choose from Menu" with options like "5 min", "10 min", "15 min", "30 min", "45 min", "1 hour" -- simpler and more reliable than free-form parsing
- **Free-form:** Use "Ask for Input" with type Number for duration, then a second ask for label

### Data Flow After Siri INSERT

The existing realtime architecture handles propagation automatically:

```
Siri POST → Supabase INSERT → postgres_changes broadcast
                                      │
                                      ▼
                         useSupabaseRealtime hook fires
                         (src/hooks/useSupabaseRealtime.ts)
                                      │
                                      ▼
                         queryClient.invalidateQueries()
                         (in useGroceries.ts / useTimers.ts)
                                      │
                                      ▼
                         React Query refetches → UI updates
                                      │
                                      ▼
                         usePriorityInterrupt detects new items
                         → sidebar switches to priority mode
                         → wall display shows grocery/timer
```

**No new React code needed for the data flow.** The existing `useSupabaseRealtime` hook in `useGroceries.ts` and `useTimers.ts` already invalidates React Query cache on any postgres_changes event, regardless of where the INSERT originated. The `added_by: "siri"` field is already supported in the `groceries` table schema (`added_by: string | null`).

### New Components: None for Core Flow

The only frontend change is optional: showing a "via Siri" badge on items where `added_by === 'siri'`. This is a minor modification to `GroceryItem.tsx` or `TimerCard.tsx`, not a new component.

### Files Modified

| File | Change | Type |
|------|--------|------|
| Supabase dashboard (SQL editor) | Add RLS INSERT policies for `anon` role | New policy |
| Apple Shortcuts app | Create 2-3 shortcuts | New (not in repo) |
| `src/components/grocery/GroceryItem.tsx` | Optional "via Siri" badge | Modify |
| `src/components/timer/TimerCard.tsx` | Optional "via Siri" badge | Modify |

---

## Integration 2: Country Image Caching on Pi

### Current Behavior

`CountryPanel.tsx` renders flags via:
```tsx
<img src={country.flags.svg} ... />
```

The `flags.svg` URL comes from `restcountries.com` API response (e.g., `https://flagcdn.com/ch.svg`). Each day's country loads a new flag image.

### Existing Caching Already in Place

The `vite.config.ts` already configures a service worker via `vite-plugin-pwa` with Workbox runtime caching. The `restcountries.com` API response is cached with `CacheFirst` strategy for 7 days:

```typescript
// Already in vite.config.ts
{
  urlPattern: /^https:\/\/restcountries\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'countries-api',
    expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 7 },
  },
}
```

**But the flag images are NOT cached.** They come from `flagcdn.com`, not `restcountries.com`. The service worker has no rule matching `flagcdn.com`.

### Recommended Fix: Add Workbox Rule for Flag Images

Add a new runtime caching entry to `vite.config.ts`:

```typescript
{
  urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'country-flags',
    expiration: {
      maxEntries: 300,  // ~250 countries, SVGs are tiny (~1-5KB each)
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    },
    cacheableResponse: {
      statuses: [0, 200],
    },
  },
}
```

**Why CacheFirst:** Flags do not change. Once cached, serve from cache forever (within 30-day window). On Pi with limited bandwidth, this prevents re-downloading.

**Why NOT a different approach:**
- **Local flag assets:** Would add ~1-2MB to bundle for 250 SVGs. Not worth it when service worker caching achieves the same result with zero bundle impact.
- **Supabase Storage:** Unnecessary indirection. flagcdn.com is a free CDN, already reliable.
- **Pi filesystem cache:** Chromium's service worker cache IS the filesystem cache. No need for a custom layer.

### Broader Image Caching Strategy for "Country of the Day" Enhancement

If the v1.1 feature includes showing a country photo (not just flag), consider caching those too. Potential sources:
- Unsplash API (free, high-quality, but needs API key)
- Wikimedia Commons (free, no key, but inconsistent quality)

For any external image source, add a matching Workbox rule with `CacheFirst` and generous expiration.

### Files Modified

| File | Change | Type |
|------|--------|------|
| `vite.config.ts` | Add `flagcdn.com` runtime caching rule | Modify |

---

## Integration 3: Calendar Emoji Changes

### Current Emoji Architecture

Emojis are defined statically in `src/lib/calendar/config.ts`:

```typescript
export const CALENDAR_FEEDS: PersonConfig[] = [
  { id: 'papa', name: 'Papa', emoji: '\u{1F468}', ... },
  { id: 'daddy', name: 'Daddy', emoji: '\u{1F468}\u{200D}\u{1F9B0}', ... },
  { id: 'wren', name: 'Wren', emoji: '\u{1F985}', ... },
  { id: 'ellis', name: 'Ellis', emoji: '\u{1F31F}', ... },
  { id: 'family', name: 'Family', emoji: '\u{1F468}\u{200D}\u{1F468}\u{200D}\u{1F467}\u{200D}\u{1F466}', ... },
];
```

These emojis flow through the component tree as follows:

```
config.ts (CALENDAR_FEEDS)
    │
    ▼
EventCard.tsx
    │ event.persons -> CALENDAR_FEEDS.find(f => f.id === id)
    │ renders: p.emoji as <span>
    ▼
DayRow.tsx
    │ renders EventCard for each event
    ▼
CalendarPanel.tsx
    │ renders DayRow for each day
    ▼
App.tsx (grid-area-main)
```

Emojis also appear in:
- `ChoreItem.tsx` / `ChorePanel.tsx` (assigned_to field maps to person config)
- `GroceryItem.tsx` (added_by field could map to person)
- Any component that references `CALENDAR_FEEDS` for person lookup

### Where Emoji Changes Should Go

**Option A: Keep in config.ts (recommended for v1.1)**

If "emoji changes" means letting family members pick different emojis, the simplest approach is a Supabase `family_members` table that overrides `config.ts` defaults:

```typescript
// New: src/lib/api/familyMembers.ts
export async function fetchFamilyMembers(): Promise<PersonConfig[]> {
  if (!supabase) return CALENDAR_FEEDS; // fallback to static config
  const { data } = await supabase.from('family_members').select('*');
  if (!data?.length) return CALENDAR_FEEDS;
  // Merge DB overrides with static config
  return CALENDAR_FEEDS.map(feed => {
    const override = data.find(m => m.id === feed.id);
    return override ? { ...feed, emoji: override.emoji, name: override.name } : feed;
  });
}
```

**Option B: Move to React Context (recommended if emojis become dynamic)**

If emojis can change at runtime (e.g., via a settings panel), wrap the app in a `FamilyMembersProvider`:

```
App.tsx
└── FamilyMembersProvider  ← NEW context
    ├── Header.tsx
    ├── CalendarPanel.tsx
    │   └── EventCard.tsx  ← reads from context instead of config.ts
    ├── ChorePanel.tsx
    │   └── ChoreItem.tsx  ← reads from context
    └── GroceryPanel.tsx
        └── GroceryItem.tsx ← reads from context
```

### Recommended Approach for v1.1

**Use Option A (Supabase table + merge with config.ts).** Rationale:
- The existing `config.ts` already works as the source of truth
- A `family_members` table adds the ability to override emojis without redeploying
- No React Context needed -- just add a `useFamilyMembers()` hook that returns the merged config
- Components that currently import from `config.ts` would import from the hook instead
- React Query caches the result; staleTime can be long (1 hour) since emojis rarely change

### Component Tree Changes

```
BEFORE:
  EventCard imports CALENDAR_FEEDS from config.ts
  ChoreItem imports CALENDAR_FEEDS from config.ts

AFTER:
  EventCard receives personConfigs from useFamilyMembers() hook
  ChoreItem receives personConfigs from useFamilyMembers() hook
  (OR: CalendarPanel/ChorePanel fetch and pass down as props)
```

### New Table Schema

```sql
CREATE TABLE public.family_members (
  id TEXT PRIMARY KEY,           -- matches config.ts id: 'papa', 'daddy', etc.
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with current values
INSERT INTO public.family_members (id, name, emoji) VALUES
  ('papa', 'Papa', '👨'),
  ('daddy', 'Daddy', '👨‍🦰'),
  ('wren', 'Wren', '🦅'),
  ('ellis', 'Ellis', '🌟'),
  ('family', 'Family', '👨‍👨‍👧‍👦');

-- RLS: anyone can read, only authenticated can update
CREATE POLICY "anon_read_members" ON public.family_members FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_members" ON public.family_members FOR UPDATE TO anon USING (true);
```

### Files Modified / Created

| File | Change | Type |
|------|--------|------|
| Supabase SQL | Create `family_members` table + seed data | New |
| `src/types/database.ts` | Add `family_members` table type | Modify |
| `src/lib/api/familyMembers.ts` | Fetch + merge with config fallback | New |
| `src/hooks/useFamilyMembers.ts` | React Query hook | New |
| `src/components/calendar/EventCard.tsx` | Use hook instead of direct config import | Modify |
| `src/components/chore/ChoreItem.tsx` | Use hook instead of direct config import | Modify |
| `src/lib/calendar/config.ts` | Keep as fallback defaults (no change needed) | Unchanged |

---

## Suggested Build Order

Based on dependency analysis:

### Phase 1: Siri Shortcuts Integration
**Why first:** Zero frontend changes needed. Pure backend (RLS policy) + external (Shortcuts app) work. Validates the most architecturally risky piece (can Shortcuts reliably POST to PostgREST?). Existing realtime hooks handle propagation automatically.

1. Add RLS INSERT policies for `anon` role on `groceries` and `timers` tables
2. Test with `curl` from terminal to verify direct PostgREST INSERT works
3. Build "Add Grocery" Shortcut in iOS Shortcuts app
4. Build "Set Timer" Shortcut with preset duration menu
5. Verify wall display updates via existing realtime subscriptions
6. Optional: Add "via Siri" badge to GroceryItem/TimerCard

### Phase 2: Country Flag Caching
**Why second:** Single-line config change. Low risk, immediate benefit for Pi performance.

1. Add `flagcdn.com` Workbox rule to `vite.config.ts`
2. Deploy and verify flags are cached in service worker storage on Pi

### Phase 3: Calendar Emoji Configuration
**Why third:** Requires new Supabase table, new hook, and modifications to multiple components. Most files touched, most testing surface area.

1. Create `family_members` table in Supabase
2. Add TypeScript types to `database.ts`
3. Create `fetchFamilyMembers()` API function
4. Create `useFamilyMembers()` React Query hook
5. Update `EventCard.tsx` to use hook
6. Update `ChoreItem.tsx` to use hook
7. Optional: Build emoji picker settings panel (could be a Siri Shortcut too -- POST to update emoji)

---

## Anti-Patterns to Avoid

### Anti-Pattern: Edge Function for Simple INSERTs
**What people do:** Create a Supabase Edge Function that validates input and inserts a row.
**Why wrong here:** Adds cold-start latency (Deno runtime boot), deployment complexity, and another codebase to maintain. PostgREST does the same job with zero latency overhead. Edge Functions are for orchestration, not proxying single INSERTs.

### Anti-Pattern: Storing Shortcut Config in the App
**What people do:** Build a "Shortcut generator" UI in the dashboard that creates Shortcuts programmatically.
**Why wrong:** Apple Shortcuts cannot be programmatically created via web API. The Shortcuts must be manually built in the iOS Shortcuts app. Document the setup steps instead.

### Anti-Pattern: Custom Image Download Script for Pi
**What people do:** Write a cron job on the Pi that pre-downloads tomorrow's country flag.
**Why wrong:** The service worker already handles this. Adding a Pi-side script creates a parallel caching layer that can go stale or conflict with the browser cache. Let Workbox handle it.

### Anti-Pattern: React Context for Rarely-Changing Config
**What people do:** Wrap the entire app in `<FamilyConfigContext>` for emoji overrides.
**Why wrong for v1.1:** Context re-renders all consumers when any value changes. Emojis change maybe once a month. React Query with a long staleTime is more efficient and already established in the codebase pattern. Only add Context if emoji changes need to be instant across all components (they do not -- a refetch on next query invalidation is fine).

---

## Scalability Considerations

| Concern | Current (v1.0) | After v1.1 |
|---------|-----------------|------------|
| Supabase API calls | Browser clients only | +Siri Shortcuts (adds ~5-20 inserts/day) |
| RLS policy surface | SELECT + UPDATE + DELETE for anon | +INSERT for anon on groceries, timers |
| Service worker cache size | ~5MB (fonts, API responses) | +~500KB (flag SVGs accumulate over time) |
| Component re-renders | Config.ts is static import | useFamilyMembers hook adds 1 query per mount |

All well within Supabase free tier limits. No architectural concerns at family scale.

---

## Sources

### Supabase PostgREST Direct API
- [REST API | Supabase Docs](https://supabase.com/docs/guides/api) - AUTO confidence: HIGH
- [Creating API Routes | Supabase Docs](https://supabase.com/docs/guides/api/creating-routes) - confidence: HIGH
- [Securing your API | Supabase Docs](https://supabase.com/docs/guides/api/securing-your-api) - confidence: HIGH
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - confidence: HIGH

### Apple Shortcuts HTTP Capabilities
- [Request your first API in Shortcuts | Apple Support](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) - confidence: HIGH
- [Send POST request with "Get Contents of URL" | Automators Talk](https://talk.automators.fm/t/send-post-request-with-get-contents-of-url/15943) - confidence: MEDIUM
- [How to Send a POST Request With Apple Shortcuts | RoutineHub](https://blog.routinehub.co/how-to-send-a-post-request-with-apple-shortcuts/) - confidence: MEDIUM
- [Creating Shortcuts That Accept Voice Input | MacMost](https://macmost.com/creating-shortcuts-that-accept-voice-input.html) - confidence: MEDIUM

### Supabase Edge Functions vs Direct PostgREST
- [Supabase Database vs Edge Functions | CloseFuture](https://www.closefuture.io/blogs/supabase-database-vs-edge-functions) - confidence: MEDIUM
- [Edge Functions | Supabase Docs](https://supabase.com/docs/guides/functions) - confidence: HIGH

### Service Worker / Workbox Caching
- [Chromium kiosk mode on Raspberry Pi | GitHub Gist](https://gist.github.com/lellky/673d84260dfa26fa9b57287e0f67d09e) - confidence: MEDIUM

---
*Architecture research for: v1.1 polish features (Siri, caching, emoji config)*
*Researched: 2026-02-17*
