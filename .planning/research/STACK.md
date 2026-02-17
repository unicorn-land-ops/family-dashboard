# Technology Stack: v1.1 Polish Additions

**Project:** Family Dashboard v1.1
**Domain:** Stack additions for Siri Shortcuts integration, horoscope API replacement, country images
**Researched:** 2026-02-17
**Overall Confidence:** HIGH

## Context: Existing Stack (DO NOT CHANGE)

The dashboard already runs React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + Supabase (realtime) + React Query + Cloudflare Worker CORS proxy. This document covers ONLY new additions for v1.1 features.

---

## Feature 1: Siri Shortcuts to Supabase

### What's Needed: NOTHING on the frontend

Apple Shortcuts uses the built-in "Get Contents of URL" action to make HTTP requests. Supabase already exposes a PostgREST API at `https://<project>.supabase.co/rest/v1/<table>`. The dashboard already subscribes to realtime changes on `groceries` and `timers` tables. When a Shortcut inserts a row, the dashboard picks it up automatically.

**This is a configuration task, not a code task.**

### Shortcut Architecture

| Component | Technology | Already Exists? |
|-----------|-----------|-----------------|
| Shortcut HTTP POST | Apple Shortcuts "Get Contents of URL" | No - create shortcut |
| REST endpoint | Supabase PostgREST auto-generated API | YES - already running |
| Realtime subscription | `useSupabaseRealtime` hook | YES - already running |
| RLS policies | Supabase Row Level Security | VERIFY - need INSERT for anon |

### Required Headers for Shortcuts

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
Prefer: return=minimal
```

### RLS Policy Requirement

The `groceries` and `timers` tables need an INSERT policy for the `anon` role. The current RLS policies likely allow this (the web dashboard uses the anon key), but this MUST be verified before building Shortcuts.

```sql
-- Example: allow anonymous inserts on groceries
CREATE POLICY "Allow anon insert" ON groceries
  FOR INSERT TO anon
  WITH CHECK (true);
```

**Confidence: HIGH** - Supabase REST API is standard PostgREST. Apple Shortcuts' "Get Contents of URL" supports POST with custom headers and JSON body. This is well-documented on both sides.

### What NOT to Build

| Avoid | Why |
|-------|-----|
| Custom API proxy for Shortcuts | Supabase REST API is the proxy. Adding another layer adds latency and a failure point. |
| Siri Intents / App Intents framework | Requires building a native iOS app. Apple Shortcuts with HTTP requests is zero-code. |
| Authentication flow in Shortcuts | Use the anon key directly. This is a family dashboard, not a bank. RLS + anon key is sufficient. |
| n8n or Zapier middleware | Unnecessary indirection. Shortcuts can POST directly to Supabase. |

### Shortcut Design (for groceries)

```
Shortcut: "Add to grocery list"
1. Ask for input: "What do you need?" -> variable: item_name
2. Get Contents of URL:
   - URL: https://<project>.supabase.co/rest/v1/groceries
   - Method: POST
   - Headers:
     - apikey: <ANON_KEY>
     - Authorization: Bearer <ANON_KEY>
     - Content-Type: application/json
     - Prefer: return=minimal
   - Body (JSON):
     - name: [item_name]
     - checked: false
     - added_by: "Siri"
3. Show notification: "Added [item_name] to grocery list"
```

### Shortcut Design (for timers)

```
Shortcut: "Set kitchen timer"
1. Ask for input: "Timer name?" -> variable: timer_label
2. Ask for input: "How many minutes?" -> variable: minutes
3. Calculate: minutes * 60 -> variable: duration_seconds
4. Get current date (ISO 8601) -> variable: started_at
5. Get Contents of URL:
   - URL: https://<project>.supabase.co/rest/v1/timers
   - Method: POST
   - Headers: (same as above)
   - Body (JSON):
     - label: [timer_label]
     - duration_seconds: [duration_seconds]
     - started_at: [started_at]
     - created_by: "Siri"
6. Show notification: "Timer '[timer_label]' started for [minutes] minutes"
```

### Sources

- [Supabase REST API Docs](https://supabase.com/docs/guides/api) - PostgREST auto-generated endpoints
- [Apple Shortcuts HTTP Requests](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) - Official Apple guide
- [Custom JSON in Shortcuts](https://blog.alexwendland.com/2020-07-01-custom-json-payload-for-get-contents-of-url-in-ios-shortcuts/) - Workaround for complex JSON payloads

---

## Feature 2: Horoscope API Replacement

### Current State

The dashboard uses `ohmanda.com/api/horoscope` which is broken/unreliable. The existing code fetches daily horoscopes for three signs (capricorn, aquarius, sagittarius) and displays them in a sidebar panel.

### Recommendation: API Ninjas Horoscope API

| Property | Value |
|----------|-------|
| **Endpoint** | `GET https://api.api-ninjas.com/v1/horoscope?sign=capricorn` |
| **Auth** | `X-Api-Key` header with free API key |
| **Free tier** | 100,000 requests/month |
| **Rate limit** | Not explicitly stated; paid plans say "no rate limiting" |
| **Response format** | `{ "date": "YYYY-MM-DD", "zodiac": "capricorn", "horoscope": "text..." }` |
| **CORS** | Likely restricted - route through existing Cloudflare Worker CORS proxy |

**Why API Ninjas:**
- 100K requests/month is massive overkill (dashboard needs ~3 requests/day)
- Clean REST API with GET requests (simpler than aztro's POST requirement)
- Response format maps nearly 1:1 to the existing `HoroscopeData` interface
- Stable commercial service (not a hobby project on Heroku that goes down)

**Confidence: MEDIUM-HIGH** - API Ninjas is a commercial service with paid tiers, indicating stability. Free tier is generous. Response format verified from their docs page. CORS behavior needs testing.

### Migration: Minimal Code Change

The existing `HoroscopeData` interface is:
```typescript
interface HoroscopeData {
  sign: string;
  date: string;
  horoscope: string;
}
```

API Ninjas returns `zodiac` instead of `sign`. The migration is a field rename in `fetchHoroscopes()`:

```typescript
// New fetch function
const API_NINJAS_BASE = 'https://api.api-ninjas.com/v1/horoscope';
const API_KEY = import.meta.env.VITE_API_NINJAS_KEY;

// Per sign:
const response = await fetch(`${API_NINJAS_BASE}?sign=${sign}`, {
  headers: { 'X-Api-Key': API_KEY },
});
const data = await response.json();
return { sign: data.zodiac, date: data.date, horoscope: data.horoscope };
```

### CORS Consideration

API Ninjas may not include permissive CORS headers. If so, route requests through the existing Cloudflare Worker CORS proxy that already handles calendar fetches. This is a one-line URL change, not new infrastructure.

### Alternatives Considered

| API | Why Not |
|-----|---------|
| **ohmanda.com** (current) | Broken/unreliable, no status page, hobby project |
| **aztro** (aztro.sameerkumar.website) | Uses POST for reads (unusual), hosted on uncertain infrastructure, no commercial backing |
| **horoscope-free-api.herokuapp.com** | Heroku hobby dynos have cold start delays, scrapes AskGanesh (fragile), low maintenance activity |
| **Prokerala / AstrologyAPI** | Paid-only for horoscope endpoints, overkill for daily readings |
| **DivineAPI** | Paid service ($29+/month), unnecessary for simple daily horoscopes |
| **Self-hosted scraper** | Fragile, maintenance burden, legal gray area |

### Environment Variable Addition

```bash
# .env
VITE_API_NINJAS_KEY=your_api_ninjas_key_here
```

### Sources

- [API Ninjas Horoscope API](https://www.api-ninjas.com/api/horoscope) - Endpoint docs, response format
- [API Ninjas Pricing](https://api-ninjas.com/pricing) - Free tier exists, 100K calls/month on paid ($39/mo)

---

## Feature 3: Country-of-the-Day Images

### Current State

The `CountryPanel` displays flag, name, capital, population, languages, region, and currency from the restcountries API. There is NO photo/image of the country. The feature request is to add a landscape/landmark photo.

### Recommendation: Unsplash API

| Property | Value |
|----------|-------|
| **Endpoint** | `GET https://api.unsplash.com/search/photos?query=Germany+landmark&per_page=1&orientation=landscape` |
| **Auth** | `Authorization: Client-ID YOUR_ACCESS_KEY` header |
| **Free tier** | 50 requests/hour (Demo), 5000/hour (Production after approval) |
| **Image URLs** | `urls.regular` (1080px wide), `urls.small` (400px), `urls.thumb` (200px) |
| **Attribution** | REQUIRED - must credit photographer and link to Unsplash |
| **CORS** | Yes - API responses include CORS headers. Image CDN (images.unsplash.com) also CORS-enabled. |

**Why Unsplash:**
- 50 requests/hour is plenty (dashboard needs 1 request/day, cached by React Query)
- Highest quality free images of any service
- Search by country name returns relevant landmark/landscape photos
- Image CDN requests do NOT count against rate limit (only API calls do)
- Well-documented, stable API used by thousands of apps

**Confidence: HIGH** - Unsplash API docs verified directly. Rate limits, response format, and attribution requirements confirmed.

### Integration Pattern

```typescript
const UNSPLASH_BASE = 'https://api.unsplash.com/search/photos';
const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export async function fetchCountryImage(countryName: string): Promise<{
  url: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
} | null> {
  const query = encodeURIComponent(`${countryName} landmark landscape`);
  const response = await fetch(
    `${UNSPLASH_BASE}?query=${query}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.results?.length) return null;

  const photo = data.results[0];
  return {
    url: photo.urls.regular,         // 1080px wide
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
  };
}
```

### Attribution Requirement (Mandatory)

Unsplash API guidelines REQUIRE visible attribution. Add a small credit line below the image:

```
Photo by [Photographer Name] on Unsplash
```

Both "Photographer Name" and "Unsplash" must be links. This is non-negotiable per Unsplash API Terms of Service.

### Caching Strategy

- Use React Query with `staleTime: 24 * 60 * 60 * 1000` (24 hours) - country changes daily
- The country pick is deterministic (seeded by date), so the image query is also deterministic per day
- This means exactly 1 Unsplash API call per day, well within the 50/hour limit
- Consider caching the image URL in localStorage as a fallback

### Pi Display Optimization

- Use `urls.regular` (1080px) for Pi kiosk display
- Use `urls.small` (400px) for mobile view
- Add `loading="lazy"` to the img tag
- Set explicit `width` and `height` to prevent layout shift

### Alternatives Considered

| Service | Free Tier | Why Not |
|---------|-----------|---------|
| **Pexels API** | 200 req/hour, 20K/month | Good alternative. Slightly lower image quality than Unsplash. No attribution required (but encouraged). Use as fallback if Unsplash rate limits become an issue. |
| **Pixabay API** | 100 req/min | Lower image quality, more stock-photo feel. Less relevant results for country searches. |
| **Wikipedia/Wikimedia Commons** | Unlimited | Complex API, inconsistent image quality, harder to find landscape photos by country name |
| **Google Places Photos** | Requires billing account | Not free, requires Google Cloud billing even for free tier |
| **Static curated images** | N/A | 250 countries x manual curation = massive effort. Images become stale. |

### Environment Variable Addition

```bash
# .env
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### Sources

- [Unsplash API Documentation](https://unsplash.com/documentation) - Endpoints, auth, rate limits
- [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) - Attribution requirements
- [Pexels API Documentation](https://www.pexels.com/api/) - Alternative option

---

## Summary: New Dependencies

### NPM Packages to Install

**NONE.** All three features use standard `fetch()` calls to REST APIs. No new npm packages needed.

### New Environment Variables

| Variable | Service | Where to Get |
|----------|---------|-------------|
| `VITE_API_NINJAS_KEY` | API Ninjas (horoscope) | https://api-ninjas.com/register (free) |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash (country images) | https://unsplash.com/developers (free, instant) |

### External Service Accounts Needed

| Service | Account Type | Cost | Setup Time |
|---------|-------------|------|-----------|
| API Ninjas | Free tier | $0 | 2 minutes |
| Unsplash Developer | Demo app | $0 | 5 minutes (create app in dashboard) |
| Apple Shortcuts | Built-in iOS | $0 | N/A |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/api/horoscope.ts` | Replace ohmanda.com with API Ninjas endpoint |
| `src/lib/api/countryOfDay.ts` | Add `fetchCountryImage()` function |
| `src/components/sidebar/CountryPanel.tsx` | Add image display with Unsplash attribution |
| `src/types/database.ts` | No changes needed (schema unchanged) |
| `.env` | Add `VITE_API_NINJAS_KEY` and `VITE_UNSPLASH_ACCESS_KEY` |
| Cloudflare Worker | May need to allowlist `api.api-ninjas.com` for CORS proxy |

### Files NOT to Modify

| File | Why |
|------|-----|
| `src/lib/supabase.ts` | Shortcuts use REST API directly, not the JS client |
| `src/hooks/useSupabaseRealtime.ts` | Already subscribes to groceries/timers changes |
| `src/lib/api/groceries.ts` | Shortcut inserts go through REST API, not this code |
| `src/lib/api/timers.ts` | Same - Shortcuts bypass the React app entirely |
| `package.json` | No new dependencies |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API Ninjas CORS blocks browser requests | MEDIUM | LOW | Route through existing Cloudflare Worker CORS proxy |
| Unsplash returns irrelevant images for obscure countries | LOW | LOW | Fallback to flag-only display (current behavior) |
| Siri Shortcut JSON formatting issues | MEDIUM | LOW | Use Text action to build JSON manually, pass as File body |
| Supabase RLS blocks anon INSERT from Shortcuts | MEDIUM | HIGH | Verify RLS policies before building Shortcuts |
| API Ninjas deprecates free tier | LOW | MEDIUM | Aztro API as backup, or self-host horoscope content |
| Unsplash Demo rate limit hit | VERY LOW | LOW | 1 request/day vs 50/hour limit; apply for Production if needed |

---

## Implementation Order

1. **Verify Supabase RLS policies** allow anon INSERT on groceries and timers (5 min)
2. **Replace horoscope API** - smallest code change, immediate visible fix (30 min)
3. **Add country images** - new Unsplash integration + UI update (1-2 hours)
4. **Build Apple Shortcuts** - configuration only, no code changes (30 min per shortcut)

This order prioritizes fixing what's broken (horoscopes), then adding new value (images), then the Siri integration which depends on verifying the backend first.
