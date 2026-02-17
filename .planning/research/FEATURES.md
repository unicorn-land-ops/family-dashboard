# Feature Research: Family Dashboard v1.1 Polish

**Domain:** Family dashboard polish -- Siri voice control, horoscope fix, country photos, calendar emoji badges
**Researched:** 2026-02-17
**Overall confidence:** HIGH

---

## Table Stakes

Polish features that address broken functionality or obvious gaps in v1.0.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Fix Horoscope Panel | Currently broken; shows "Horoscopes unavailable" permanently | LOW | New API provider | ohmanda.com API is unreliable/dead; need a replacement that actually works |
| Country of the Day Photo | Empty visual space in panel; flag + text feels incomplete | LOW | Image API integration | Unsplash or Pexels search by country name fills the gap |
| Calendar Event Category Emoji | Events like "Dentist" or "Birthday" lack visual scanning cues beyond person badges | LOW | Keyword-to-emoji mapping | Person emoji badges exist; event-type badges do not |

---

## Differentiators

Features that elevate the dashboard beyond a fixed display into an interactive family tool.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Siri Voice --> Grocery List | "Hey Siri, add milk to the grocery list" from anywhere in the apartment, no phone unlock needed | MEDIUM | Supabase REST API + iOS Shortcuts app | Transforms grocery workflow from "open browser, navigate, type" to 3-second voice command |
| Siri Voice --> Timers | "Hey Siri, set a 20-minute homework timer" hands-free while cooking | MEDIUM | Supabase REST API + iOS Shortcuts app | Same Siri Shortcuts pattern as groceries; voice-first timer creation |
| Siri Voice --> Chore Completion | "Hey Siri, Wren finished brushing teeth" from the bathroom | MEDIUM | Supabase REST API + iOS Shortcuts app | Removes friction of phone interaction for routine tracking |

---

## Anti-Features

Features to explicitly NOT build in v1.1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full Siri/HomeKit integration via native app | Requires building a native iOS app with SiriKit intents, App Store submission, provisioning profiles, ongoing maintenance | Use Siri Shortcuts "Get Contents of URL" action -- zero native code, works today |
| AI-generated horoscopes | Tempting to use an LLM API for unique daily horoscopes; adds cost, API key management, prompt engineering | Use a free pre-written horoscope API; the content quality is irrelevant -- it is a fun conversation starter, not astrology software |
| Photo uploads/management | Adding ability to upload or curate country photos | Use API-sourced photos; the country changes daily so manual curation is impractical |
| Complex emoji customization UI | User-configurable emoji mapping for calendar events | Hardcode a sensible keyword-to-emoji map; family can request additions via code changes |
| Horoscope for Ellis (Scorpio) | Ellis is a toddler; horoscope is meaningless for them | Keep 3 signs (Papa=Capricorn, Daddy=Aquarius, Wren=Sagittarius); add Ellis when she can read |

---

## Feature Detail: Siri Shortcuts to Supabase

**Confidence: HIGH** -- This pattern is well-documented and uses only built-in iOS capabilities.

### How It Works

Siri Shortcuts has a built-in "Get Contents of URL" action that supports full HTTP requests (GET, POST, PUT, PATCH, DELETE) with custom headers and JSON request bodies. Supabase exposes a PostgREST API at `https://<project>.supabase.co/rest/v1/<table>` that accepts standard REST calls.

### Architecture

```
User speaks "Hey Siri, add milk" on iPhone/Apple Watch/HomePod
    --> iOS Shortcuts app activates
    --> "Ask for Input" action captures "milk" (or dictation extracts it)
    --> "Get Contents of URL" sends POST to Supabase REST API
    --> Supabase inserts row into groceries table
    --> Dashboard picks up change via existing Realtime subscription
    --> Wall display updates within 1-2 seconds
```

### Required Siri Shortcut Configuration

Each shortcut needs:
- **URL:** `https://<project>.supabase.co/rest/v1/groceries`
- **Method:** POST
- **Headers:**
  - `apikey`: Supabase anon key (safe -- RLS protects data)
  - `Authorization`: `Bearer <anon-key>`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`
- **Body (JSON):** `{"name": "<dictated text>", "checked": false}`

### Shortcuts to Build

| Shortcut Name | Voice Trigger | Supabase Table | Action |
|---------------|---------------|----------------|--------|
| "Add to grocery list" | "Hey Siri, add to grocery list" | `groceries` | INSERT with dictated item name |
| "Set a timer" | "Hey Siri, family timer" | `timers` | INSERT with dictated label + duration |
| "Mark chore done" | "Hey Siri, [name] finished [chore]" | `chores` | UPDATE to mark complete |

### Security Consideration

The Supabase anon key is embedded in the Shortcut. This is acceptable because:
1. The dashboard already ships the anon key in client-side JavaScript (visible in browser)
2. Row Level Security (RLS) policies should restrict operations appropriately
3. The dashboard is a family tool on a home network, not a multi-tenant SaaS

### Complexity Assessment

- **One-time setup per shortcut:** ~5 minutes each
- **No code changes to dashboard:** Supabase Realtime already syncs changes
- **No native app needed:** Shortcuts is pre-installed on every iPhone
- **Works on Apple Watch and HomePod:** Voice triggers work across all Siri-enabled devices

---

## Feature Detail: Horoscope API Replacement

**Confidence: HIGH** -- Multiple working alternatives verified.

### Current Problem

The dashboard uses `ohmanda.com/api/horoscope/<sign>` which is an unofficial scraper of Astrology.com. This API is unreliable -- it has had documented outages and returns empty data intermittently. The horoscope panel currently shows "Horoscopes unavailable."

### Recommended Replacement: API Ninjas Horoscope API

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `https://api.api-ninjas.com/v1/horoscope?zodiac=<sign>` |
| **Auth** | API key via `X-Api-Ninjas-Key` header |
| **Cost** | Free tier available |
| **Rate limit** | Sufficient for 3 requests/day (one per family member sign) |
| **Response** | `{ "date": "YYYY-MM-DD", "zodiac": "capricorn", "horoscope": "..." }` |
| **Reliability** | 4.7 rating, 2000+ applications using it |

### Why API Ninjas Over Alternatives

| API | Pros | Cons | Verdict |
|-----|------|------|---------|
| **ohmanda.com** (current) | No key needed, free | Unofficial scraper, unreliable, documented outages | REPLACE -- broken |
| **API Ninjas** | Free tier, reliable, simple JSON, well-documented | Requires free API key | USE THIS -- best reliability-to-effort ratio |
| **aztro** | No auth needed, open source | Hosted on Heroku (slow cold starts), uncertain maintenance | AVOID -- same reliability concerns as ohmanda |
| **Astrology API (astrologyapi.com)** | Full-featured | Paid ($29+/mo), overkill for daily horoscopes | AVOID -- paying for horoscopes is absurd |
| **horoscopefree (GitHub)** | Free, open source | Heroku-hosted, limited documentation | AVOID -- another fragile free host |

### Implementation Changes

```typescript
// Current (broken)
const HOROSCOPE_BASE = 'https://ohmanda.com/api/horoscope';
const response = await fetch(`${HOROSCOPE_BASE}/${sign}`);

// Replacement
const HOROSCOPE_BASE = 'https://api.api-ninjas.com/v1/horoscope';
const response = await fetch(`${HOROSCOPE_BASE}?zodiac=${sign}`, {
  headers: { 'X-Api-Ninjas-Key': import.meta.env.VITE_HOROSCOPE_API_KEY },
});
```

### Fallback Strategy

Cache the last successful horoscope per sign in localStorage. If the API fails, show yesterday's horoscope with a subtle "(yesterday)" indicator. Horoscopes are vague enough that stale content is indistinguishable from fresh content.

---

## Feature Detail: Country of the Day Photo

**Confidence: MEDIUM** -- APIs verified, but search quality for obscure countries is uncertain.

### Current State

The Country of the Day panel shows: flag (SVG from restcountries.com), country name, capital, population, languages, region, currencies. There is visual space that could show a representative photo.

### Recommended API: Unsplash

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `https://api.unsplash.com/search/photos?query=<country>&orientation=landscape&per_page=1` |
| **Auth** | `Authorization: Client-ID <access_key>` header |
| **Cost** | Free (50 req/hr demo, 5000 req/hr production) |
| **Rate limit** | 50/hr demo is sufficient (1 request/day) |
| **Image quality** | High-resolution, professionally curated |
| **Attribution** | Required: "Photo by [Name] on Unsplash" with link |

### Why Unsplash Over Alternatives

| API | Pros | Cons | Verdict |
|-----|------|------|---------|
| **Unsplash** | High quality, free, well-documented, landscape filter | Requires attribution, 50 req/hr demo limit | USE THIS -- best image quality, 1 req/day is nothing |
| **Pexels** | Free, good quality, 200 req/hr | Requires attribution, slightly lower curation quality | BACKUP -- use if Unsplash approval takes too long |
| **Pixabay** | Free, no attribution required | Lower quality, more stock-photo feel | AVOID -- quality matters for a wall display |
| **Flagpedia/FlagCDN** | Flags only | No country landscape photos | N/A -- already using restcountries.com for flags |

### Search Strategy

1. **Primary query:** Country common name (e.g., "Japan", "Brazil", "Madagascar")
2. **Orientation:** `landscape` -- matches dashboard panel aspect ratio
3. **Per page:** 1 -- just need one photo per day
4. **Content filter:** `high` -- family-safe content only
5. **Fallback:** If search returns 0 results (rare for countries), show the flag enlarged or a generic globe illustration

### Caching Strategy

Cache the photo URL in localStorage keyed by country name + date. The country changes daily and deterministically, so the same photo will be served all day without re-fetching. Unsplash image CDN URLs (`images.unsplash.com`) do NOT count against the API rate limit.

### Attribution Requirement

Unsplash requires visible attribution. Add a small "Photo: [photographer] / Unsplash" text below the image in the Country of the Day panel. This is a legal requirement, not optional.

---

## Feature Detail: Calendar Event Emoji Badges

**Confidence: HIGH** -- Pattern is straightforward keyword matching.

### Current State

The EventCard component shows:
- Time (HH:mm)
- Event summary text
- Person emoji badges (from CALENDAR_FEEDS config)

There are no event-type indicators. "Dentist appointment" and "Team standup" look identical except for the text.

### Recommended Approach: Keyword-to-Emoji Map

A static map of keywords to emoji, matched against event summary text. The emoji renders before the person badges or prepended to the summary.

### Suggested Emoji Map

| Category | Keywords (case-insensitive) | Emoji | Rationale |
|----------|-----------------------------|-------|-----------|
| Medical | dentist, doctor, arzt, zahnarzt, kinderarzt | ??? | Immediately signals health appointments |
| Birthday | birthday, geburtstag | ???? | Universal recognition |
| School | school, schule, kita, einschulung, class | ???? | Education context |
| Sport/Exercise | swim, schwimmen, sport, turnen, yoga, gym | ???? | Physical activity |
| Music | music, musik, piano, klavier, guitar, gitarre | ???? | Music lessons/events |
| Food/Dining | dinner, lunch, restaurant, essen, brunch | ???? | Social dining |
| Travel | flight, flug, train, zug, airport, reise, travel | ??? | Travel events (complements travel detection) |
| Holiday | holiday, feiertag, urlaub, vacation, ferien | ???? | Time off |
| Meeting | meeting, call, zoom, standup | ???? | Work meetings (Papa's work calendar) |
| Haircut | haircut, friseur, haare | ??? | Grooming appointments |
| Party | party, fest, feier | ???? | Social celebrations |
| Cleaning | cleaning, putzen, aufraumen | ???? | Household tasks |
| Shopping | shopping, einkaufen, ikea | ???? | Shopping trips |
| Schulfrei | schulfrei | ???? | Already detected; add visual indicator |

### Implementation Approach

```typescript
const EVENT_EMOJI_MAP: [RegExp, string][] = [
  [/\b(dentist|doctor|arzt|zahnarzt|kinderarzt)\b/i, '\u{1FA7A}'],
  [/\b(birthday|geburtstag)\b/i, '\u{1F382}'],
  [/\b(school|schule|kita|class)\b/i, '\u{1F3EB}'],
  // ... etc
];

function getEventEmoji(summary: string): string | null {
  for (const [pattern, emoji] of EVENT_EMOJI_MAP) {
    if (pattern.test(summary)) return emoji;
  }
  return null;
}
```

### Design Placement

Place the event-type emoji between the time column and the summary text. This creates a visual hierarchy: Time --> Category --> Summary --> Person.

```
14:00  ????  Dentist appointment     ????
15:30  ????  Piano lesson            ????
```

### Bilingual Keywords

The family lives in Berlin -- calendar events will be a mix of English and German. The keyword map must include both languages. German keywords are included in the map above (arzt, schule, zahnarzt, schwimmen, etc.).

---

## Feature Dependencies (v1.1)

```
Siri Voice Control (Grocery)
    requires --> Supabase REST API (already deployed)
    requires --> iOS Shortcuts app (pre-installed)
    requires --> Supabase anon key (already in env)
    NO code changes to dashboard needed

Siri Voice Control (Timers)
    requires --> Supabase REST API (already deployed)
    requires --> Timer table schema knowledge
    requires --> Duration parsing in Shortcut

Siri Voice Control (Chores)
    requires --> Supabase REST API (already deployed)
    requires --> Chore ID/name mapping

Horoscope Fix
    requires --> API Ninjas account (free signup)
    requires --> VITE_HOROSCOPE_API_KEY env var
    NO dependency on other v1.1 features

Country Photo
    requires --> Unsplash developer account (free signup)
    requires --> VITE_UNSPLASH_ACCESS_KEY env var
    requires --> Country of the Day panel (already built)

Calendar Emoji Badges
    requires --> EventCard component (already built)
    NO external dependencies
    NO API keys needed
```

### Dependency Notes

- **Siri Shortcuts require zero dashboard code changes** for groceries. The existing Supabase Realtime subscription already picks up new rows. Timer and chore shortcuts may need minor schema awareness.
- **Horoscope and Country Photo are fully independent** of each other and of Siri. They can be implemented in any order.
- **Calendar emoji badges are the simplest change** -- pure frontend keyword matching with no API or infrastructure changes.
- **All features require new env vars except emoji badges.** Two new API keys (API Ninjas, Unsplash) need to be added to `.env` and deployment config.

---

## v1.1 Prioritization

| Feature | User Value | Implementation Cost | Priority | Rationale |
|---------|------------|---------------------|----------|-----------|
| Fix Horoscope Panel | MEDIUM | LOW | P1 | Currently broken; embarrassing on a daily-use display |
| Calendar Emoji Badges | MEDIUM | LOW | P1 | Pure polish; no API keys; immediate visual improvement |
| Country of the Day Photo | MEDIUM | LOW | P1 | Fills empty space; single API call/day |
| Siri --> Grocery List | HIGH | MEDIUM | P1 | Highest daily-use value; voice adds items hands-free |
| Siri --> Timers | MEDIUM | MEDIUM | P2 | Less frequent than groceries; timer UI already works fine from phone |
| Siri --> Chore Completion | LOW | MEDIUM | P2 | Chores are daily but phone interaction is fast enough |

**Priority key:**
- **P1**: Do first -- fixes broken things and adds the highest-value new capability
- **P2**: Do after P1 -- nice-to-have Siri extensions once the grocery shortcut pattern is proven

---

## Sources

### Siri Shortcuts + REST API
- [Apple Support: Request your first API in Shortcuts](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) -- HIGH confidence
- [Matthew Cassinelli: Get Contents of URL action](https://matthewcassinelli.com/actions/get-contents-of-url/) -- HIGH confidence
- [Supabase REST API Docs](https://supabase.com/docs/guides/api) -- HIGH confidence
- [Supabase API Keys Docs](https://supabase.com/docs/guides/api/api-keys) -- HIGH confidence

### Horoscope APIs
- [API Ninjas Horoscope API](https://www.api-ninjas.com/api/horoscope) -- HIGH confidence
- [ohmanda.com Horoscope API](https://ohmanda.com/api/horoscope/) -- verified unreliable
- [aztro GitHub](https://github.com/sameerkumar18/aztro) -- MEDIUM confidence
- [Top Astrology APIs 2025](https://www.vigorousit.com/blog/top-astrology-apis/) -- MEDIUM confidence

### Country Photo APIs
- [Unsplash API Documentation](https://unsplash.com/documentation) -- HIGH confidence (50 req/hr free, landscape filter, content_filter)
- [Pexels API Documentation](https://www.pexels.com/api/documentation/) -- HIGH confidence (200 req/hr free)

### Calendar Emoji Patterns
- [Teamup: Display Emojis for Event Types](https://calendar.teamup.com/kb/how-to-set-up-and-display-emojis-on-your-calendar/) -- MEDIUM confidence
- [Chrome Unboxed: Emoji in Google Apps](https://chromeunboxed.com/using-emoji-in-google-apps-personalization) -- MEDIUM confidence
- [The Intelligence: How Emojis Enhance Your Calendar](https://theintelligence.com/27563/calendar-emojis/) -- MEDIUM confidence

---
*Feature research for: Family Dashboard v1.1 Polish*
*Researched: 2026-02-17*
