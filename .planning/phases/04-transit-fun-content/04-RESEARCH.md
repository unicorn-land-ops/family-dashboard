# Phase 4: Transit & Fun Content - Research

**Researched:** 2026-02-16
**Domain:** External API integration (transit, horoscope, country data) + content rotation UI
**Confidence:** HIGH

## Summary

Phase 4 adds a rotating content sidebar that cycles through three data sources: BVG U2 departures at Senefelderplatz, daily horoscopes for three zodiac signs, and a "Country of the Day" with facts. All three APIs are free, require no authentication, and support CORS from browser origins. The existing project already uses React Query for data fetching (weather), `useInterval` for periodic updates, and has a sidebar area in the grid layout with placeholder cards ready for replacement.

The primary technical challenge is the content rotation system -- cycling through panels with smooth transitions on a configurable interval. Since the project does not currently use framer-motion/motion and the transition needs are simple (crossfade between panels), CSS transitions with React state are sufficient. Adding motion (framer-motion) would be overkill for this phase but could be considered if Phase 8 (Priority Interrupts) needs more complex animations later.

**Primary recommendation:** Use React Query for all three API data layers (matching existing patterns), a custom `useContentRotation` hook with `useInterval` for cycling, and CSS `opacity` + `transition` for crossfade animations between panels.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRNS-01 | Show upcoming BVG departures for U2 at Senefelderplatz | BVG transport.rest v6 API -- free, CORS-enabled, real-time delays, stop ID 900110005 |
| FUN-01 | Daily horoscopes for family members (Capricorn, Aquarius, Sagittarius) | ohmanda.com/api/horoscope -- free, no auth, CORS, returns daily text per sign |
| FUN-02 | Country of the Day with flag, facts, cuisine, population, language | restcountries.com v3.1 -- free, no auth, CORS, all needed fields available |
| DISP-04 | Content rotates through schedule, country of the day with configurable intervals and transitions | Custom useContentRotation hook + CSS crossfade; intervals stored in constants |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.21 | API data fetching, caching, refetch | Already used for weather; same pattern for all APIs |
| date-fns | ^4.1.0 | Time formatting for departures | Already in project |
| date-fns-tz | ^3.2.0 | Berlin timezone for departure times | Already in project |
| react-icons | ^5.5.0 | Icons for transit, horoscope, country panels | Already in project |

### New Dependencies
None required. All three APIs return simple JSON. No new libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions | framer-motion/motion | Overkill for simple crossfade; adds ~30KB; save for Phase 8 if needed |
| Custom rotation hook | embla-carousel / swiper | Carousel libraries designed for user-swipeable content; this is auto-rotating display content, not interactive carousel |
| Fetch wrapper | axios | React Query already handles fetch; no benefit |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── api/
│   │   ├── bvgTransit.ts        # BVG departures fetch + types
│   │   ├── horoscope.ts         # Horoscope fetch + types
│   │   └── countryOfDay.ts      # REST Countries fetch + types + day-seeded selection
│   └── constants.ts             # Add rotation intervals
├── hooks/
│   ├── useTransit.ts            # React Query wrapper for BVG
│   ├── useHoroscope.ts          # React Query wrapper for horoscope
│   ├── useCountryOfDay.ts       # React Query wrapper for country
│   └── useContentRotation.ts    # Rotation state machine
├── components/
│   └── sidebar/
│       ├── ContentRotator.tsx    # Container with transition logic
│       ├── TransitPanel.tsx      # U2 departures display
│       ├── HoroscopePanel.tsx    # Daily horoscopes display
│       ├── CountryPanel.tsx      # Country of the day display
│       └── RotationIndicator.tsx # Dots/progress showing current panel
```

### Pattern 1: React Query Hook per API (matching existing project pattern)
**What:** Each API gets its own fetch function + React Query hook with appropriate stale/refetch times
**When to use:** Every external data source
**Example:**
```typescript
// src/lib/api/bvgTransit.ts
const BVG_BASE = 'https://v6.bvg.transport.rest';
const SENEFELDERPLATZ_ID = '900110005';

export interface Departure {
  tripId: string;
  direction: string;
  line: { name: string; product: string };
  when: string | null;       // ISO 8601, null if cancelled
  plannedWhen: string;       // ISO 8601
  delay: number | null;      // seconds
  platform: string | null;
  remarks: Array<{ type: string; text: string }>;
}

export async function fetchDepartures(): Promise<Departure[]> {
  const url = `${BVG_BASE}/stops/${SENEFELDERPLATZ_ID}/departures?duration=30&results=10&subway=true&tram=false&bus=false&ferry=false&express=false&regional=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BVG API error: ${res.status}`);
  const data = await res.json();
  return data.departures;
}

// src/hooks/useTransit.ts
export function useTransit() {
  return useQuery({
    queryKey: ['transit', 'senefelderplatz'],
    queryFn: fetchDepartures,
    staleTime: 30 * 1000,        // 30 seconds
    refetchInterval: 60 * 1000,  // every 60 seconds
    retry: 2,
  });
}
```

### Pattern 2: Content Rotation with useInterval
**What:** A hook that cycles through content panels on a timer, exposing current index and manual controls
**When to use:** The sidebar content rotator
**Example:**
```typescript
// src/hooks/useContentRotation.ts
import { useState, useCallback } from 'react';
import { useInterval } from './useInterval';

export interface ContentRotationOptions {
  panelCount: number;
  intervalMs: number;
}

export function useContentRotation({ panelCount, intervalMs }: ContentRotationOptions) {
  const [activeIndex, setActiveIndex] = useState(0);

  useInterval(() => {
    setActiveIndex((prev) => (prev + 1) % panelCount);
  }, intervalMs);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index % panelCount);
  }, [panelCount]);

  return { activeIndex, goTo, panelCount };
}
```

### Pattern 3: Day-Seeded Country Selection
**What:** Pick a deterministic "random" country each day so all devices show the same country
**When to use:** Country of the Day feature
**Example:**
```typescript
// src/lib/api/countryOfDay.ts
function getDayHash(): number {
  const today = new Date();
  // Simple day-based seed: YYYYMMDD as integer
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

export function pickCountryOfDay<T>(countries: T[]): T {
  const hash = getDayHash();
  return countries[hash % countries.length];
}
```

### Pattern 4: CSS Crossfade Transition
**What:** Overlay all panels absolutely, toggle opacity with CSS transition
**When to use:** ContentRotator component
**Example:**
```tsx
// src/components/sidebar/ContentRotator.tsx
function ContentRotator({ activeIndex, children }: Props) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {React.Children.map(children, (child, i) => (
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{ opacity: i === activeIndex ? 1 : 0, pointerEvents: i === activeIndex ? 'auto' : 'none' }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Mounting/unmounting panels on rotation:** Causes flash of loading state; keep all panels mounted, toggle visibility with opacity
- **Fetching data only when panel is visible:** All data should be fetched continuously regardless of which panel is displayed; otherwise stale data shows when rotating back
- **Using setInterval directly:** Already have `useInterval` hook that handles cleanup and ref-based callback; use it
- **Hardcoding API URLs in components:** Put all API base URLs and config in `lib/api/` files or constants

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API caching & refetch | Manual cache with localStorage | React Query (already in project) | Handles stale time, background refetch, error retry, deduplication |
| Timezone conversion | Manual UTC offset math | date-fns-tz formatInTimeZone (already in project) | DST handling, timezone database |
| Country data | Scraping Wikipedia or manual JSON | restcountries.com v3.1 API | 250 countries, maintained, structured data |
| Horoscope content | Scraping astrology websites | ohmanda.com/api/horoscope | Simple JSON, daily refresh, all 12 signs |

**Key insight:** All three APIs are free, unauthenticated, CORS-enabled, and return clean JSON. There is zero need for a backend proxy, Cloudflare Worker, or API key management for this phase.

## Common Pitfalls

### Pitfall 1: BVG API Returns Null `when` for Cancelled Departures
**What goes wrong:** Departure `when` field is `null` when a trip is cancelled; using it directly causes runtime errors
**Why it happens:** BVG marks cancellations by nulling the `when` field while keeping `plannedWhen`
**How to avoid:** Always check `when !== null` before displaying; show "cancelled" badge when null
**Warning signs:** TypeError on date formatting functions

### Pitfall 2: BVG Replacement Bus Services Mixed In
**What goes wrong:** During construction, replacement bus (SEV) services appear alongside subway departures
**Why it happens:** BVG currently has construction on U2 (verified in live API response -- "Ersatzverkehr" present as of 2026-02-16)
**How to avoid:** Filter or visually distinguish entries where `line.product === 'bus'` and remarks contain "Ersatzverkehr"; don't hide them (they're useful transit info) but show them differently
**Warning signs:** "Bus" departures appearing for a subway station

### Pitfall 3: BVG Delay is in Seconds, Not Minutes
**What goes wrong:** Showing "delay: 120" when it means 2 minutes
**Why it happens:** API returns delay in seconds
**How to avoid:** Divide by 60 and round for display; show "+2 min" not "+120"

### Pitfall 4: REST Countries Response is Large (~300KB)
**What goes wrong:** Fetching all 250 countries with all fields is slow and wasteful
**Why it happens:** Default response includes everything
**How to avoid:** Use `?fields=name,flags,capital,population,languages,region,currencies` parameter to filter; cache aggressively (data changes rarely)
**Warning signs:** Slow initial load, large network transfer

### Pitfall 5: Country of the Day Inconsistency Across Timezones
**What goes wrong:** If day-seeded selection uses local time, devices in different timezones could show different countries
**Why it happens:** `new Date()` uses device local time
**How to avoid:** Use Berlin timezone (date-fns-tz) for the day seed calculation, consistent with the rest of the dashboard

### Pitfall 6: Horoscope API Rate Limiting / Downtime
**What goes wrong:** ohmanda.com is a personal project; could go down or rate-limit
**Why it happens:** Not a commercial API; single maintainer
**How to avoid:** Cache aggressively (staleTime: 6 hours, data only changes daily); have graceful fallback UI ("Horoscope unavailable today"); retry with backoff
**Warning signs:** 429 or 5xx responses

### Pitfall 7: Content Rotator Memory Leak on Unmount
**What goes wrong:** Interval keeps running after component unmounts
**Why it happens:** Direct setInterval without cleanup
**How to avoid:** Already solved -- `useInterval` hook handles cleanup; just use it

## Code Examples

### BVG Departure Display with Delay Formatting
```typescript
// Format departure time and delay for display
function formatDeparture(dep: Departure): { time: string; delay: string | null; direction: string } {
  const when = dep.when ?? dep.plannedWhen;
  const time = formatInTimeZone(new Date(when), 'Europe/Berlin', 'HH:mm');

  let delay: string | null = null;
  if (dep.delay && dep.delay > 0) {
    delay = `+${Math.round(dep.delay / 60)}`;
  }

  return { time, delay, direction: dep.direction };
}
```

### Horoscope Fetch with Caching
```typescript
// src/lib/api/horoscope.ts
const HOROSCOPE_BASE = 'https://ohmanda.com/api/horoscope';
const FAMILY_SIGNS = ['capricorn', 'aquarius', 'sagittarius'] as const;
type ZodiacSign = typeof FAMILY_SIGNS[number];

export interface HoroscopeData {
  sign: string;
  date: string;
  horoscope: string;
}

export async function fetchHoroscopes(): Promise<HoroscopeData[]> {
  const results = await Promise.all(
    FAMILY_SIGNS.map(async (sign) => {
      const res = await fetch(`${HOROSCOPE_BASE}/${sign}`);
      if (!res.ok) throw new Error(`Horoscope API error: ${res.status}`);
      return res.json() as Promise<HoroscopeData>;
    })
  );
  return results;
}

// src/hooks/useHoroscope.ts
export function useHoroscope() {
  return useQuery({
    queryKey: ['horoscope', 'daily'],
    queryFn: fetchHoroscopes,
    staleTime: 6 * 60 * 60 * 1000,     // 6 hours (changes daily)
    refetchInterval: 6 * 60 * 60 * 1000, // refetch every 6 hours
    retry: 2,
  });
}
```

### REST Countries Fetch with Field Filtering
```typescript
// src/lib/api/countryOfDay.ts
const COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,flags,capital,population,languages,region,currencies';

export interface CountryData {
  name: { common: string; official: string };
  flags: { svg: string; png: string; alt: string };
  capital: string[];
  population: number;
  languages: Record<string, string>;
  region: string;
  currencies: Record<string, { name: string; symbol: string }>;
}

export async function fetchCountryOfDay(): Promise<CountryData> {
  const res = await fetch(COUNTRIES_URL);
  if (!res.ok) throw new Error(`REST Countries API error: ${res.status}`);
  const countries: CountryData[] = await res.json();
  return pickCountryOfDay(countries);
}
```

### Rotation Indicator Component
```tsx
// src/components/sidebar/RotationIndicator.tsx
const PANEL_LABELS = ['Transit', 'Horoscopes', 'Country'];

function RotationIndicator({ activeIndex, panelCount, onSelect }: Props) {
  return (
    <div className="flex justify-center gap-2 py-2">
      {Array.from({ length: panelCount }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === activeIndex
              ? 'bg-accent-gold w-6'
              : 'bg-white/30 hover:bg-white/50'
          }`}
          aria-label={PANEL_LABELS[i]}
        />
      ))}
    </div>
  );
}
```

## API Details

### BVG transport.rest v6
| Property | Value |
|----------|-------|
| Base URL | `https://v6.bvg.transport.rest` |
| Departures endpoint | `GET /stops/{stopId}/departures` |
| Senefelderplatz stop ID | `900110005` |
| Auth | None required |
| CORS | Enabled (confirmed on homepage) |
| Rate limit | 100 req/min (burst 200 req/min) |
| Key parameters | `duration` (minutes), `results` (count), `subway`/`tram`/`bus` (boolean filters) |
| Response format | `{ departures: Departure[], realtimeDataUpdatedAt: number }` |
| Delay field | Seconds (integer), positive = late, null = no prediction |
| Caching | ETag and Cache-Control headers supported |
| Note | Currently has construction/replacement services on U2 (as of 2026-02-16) |

### ohmanda.com Horoscope API
| Property | Value |
|----------|-------|
| Base URL | `https://ohmanda.com/api/horoscope` |
| Endpoint | `GET /{sign}` |
| Signs needed | `capricorn`, `aquarius`, `sagittarius` |
| Auth | None required |
| CORS | Enabled |
| Response format | `{ sign: string, date: string, horoscope: string }` |
| Update frequency | Daily |
| Reliability | Personal project; may have intermittent downtime |

### REST Countries v3.1
| Property | Value |
|----------|-------|
| Base URL | `https://restcountries.com/v3.1` |
| All countries | `GET /all` |
| Field filtering | `?fields=name,flags,capital,population,languages,region,currencies` |
| Auth | None required |
| CORS | Enabled |
| Response size | ~300KB unfiltered, ~80KB with field filter |
| Update frequency | Static data; cache for 24 hours |

## Caching Strategy

| Data Source | staleTime | refetchInterval | Rationale |
|-------------|-----------|-----------------|-----------|
| BVG departures | 30 seconds | 60 seconds | Real-time data; needs freshness for delays |
| Horoscopes | 6 hours | 6 hours | Changes daily; 3 requests per fetch is light |
| Country list | 24 hours | 24 hours | Static data; pick-of-day changes at midnight |

## CORS Summary

All three APIs support CORS. No proxy needed for any of these APIs, unlike the calendar feeds in Phase 3.

| API | CORS | Proxy Needed |
|-----|------|-------------|
| v6.bvg.transport.rest | Yes (confirmed) | No |
| ohmanda.com/api/horoscope | Yes (confirmed via successful fetch) | No |
| restcountries.com | Yes (confirmed) | No |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BVG v5 API | BVG v6 API | 2023 | New response structure; v5 still works but v6 is current |
| aztro horoscope API | ohmanda.com API | 2024 | aztro upstream source (astrology.kudosmedia.net) died; ohmanda is more reliable |
| framer-motion | motion (rebranded) | 2024 | Same package, new name; but not needed for this phase |

**Deprecated/outdated:**
- `aztro.sameerkumar.website`: Upstream data source died (astrology.kudosmedia.net). May return stale or no data. Use ohmanda.com instead.
- BVG v5 API (`v5.bvg.transport.rest`): Still functional but v6 has better response structure.

## Mobile Considerations

The current layout hides the sidebar in portrait/mobile mode (`grid-area-sidebar { display: none }` in the portrait media query). For Phase 4, the rotating content needs to be accessible on mobile too. Two approaches:

1. **Move rotation into main area on mobile** -- Show transit/horoscope/country in the main content area below calendar on mobile
2. **Keep sidebar hidden on mobile** -- These are "nice to have" glanceable content, not essential on phone

Recommendation: Keep sidebar hidden on mobile for now (matches existing behavior). The primary use case for transit, horoscopes, and country info is the wall display. If the family wants these on mobile later, it can be added as a section below calendar in a future iteration.

## Open Questions

1. **Horoscope API reliability**
   - What we know: ohmanda.com works today and returns good data; it's a personal project
   - What's unclear: Long-term reliability; no SLA
   - Recommendation: Cache aggressively and build graceful fallback UI. If it dies, swapping to another free API is trivial (same JSON shape pattern)

2. **BVG construction disruptions**
   - What we know: U2 currently has replacement bus services at Senefelderplatz (construction through Oct 2026)
   - What's unclear: Whether to show replacement buses alongside subway departures
   - Recommendation: Show all departures but visually distinguish replacement services (different icon/badge). Filter only by `subway=true` to get just U-Bahn; but show SEV buses too if they serve the station, since family needs them during construction

3. **Rotation interval preference**
   - What we know: Requirement says "configurable intervals"
   - What's unclear: What default interval feels right
   - Recommendation: Default to 15 seconds per panel (45 second full cycle). Store in constants.ts for easy tuning.

## Sources

### Primary (HIGH confidence)
- v6.bvg.transport.rest -- Live API response verified, departures structure confirmed, stop ID 900110005 confirmed for Senefelderplatz
- ohmanda.com/api/horoscope/capricorn -- Live API response verified, returns `{ sign, date, horoscope }` JSON
- restcountries.com/v3.1 -- Live API response verified for Germany, field filtering confirmed working

### Secondary (MEDIUM confidence)
- v6.bvg.transport.rest/api.html -- Official API docs for query parameters and rate limits
- v6.bvg.transport.rest homepage -- Confirmed CORS enabled, 100 req/min rate limit, no auth required
- github.com/sameerkumar18/aztro -- Confirmed aztro upstream source died; validates choosing ohmanda.com

### Tertiary (LOW confidence)
- Framer Motion carousel patterns from web search -- Not needed for this phase but validated that CSS transitions are simpler for auto-rotating non-interactive content

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All APIs verified with live requests; all return expected data
- Architecture: HIGH -- Follows established project patterns (React Query hooks, useInterval, constants)
- Pitfalls: HIGH -- Verified BVG construction disruptions, null when fields, delay-in-seconds from live data
- CORS: HIGH -- All three APIs confirmed CORS-enabled through direct browser-context fetches

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (APIs are stable; BVG construction schedule confirmed through Oct 2026)
