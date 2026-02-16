# Phase 3: Calendar Integration - Research

**Researched:** 2026-02-16
**Domain:** iCal parsing, CORS proxying, recurring event expansion, timezone handling
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 integrates 5 Google Calendar iCal feeds into the family dashboard, displaying events with person badges, recurring event expansion, duplicate detection, work-hour filtering, school holiday highlighting, and dual-timezone support for traveling family members. The existing `useWeather` hook already provides 7-day forecast data (hi/lo temps, weather codes per day) that should be merged into calendar day rows.

The recommended approach uses **ical-expander** (v3.2.0) which wraps ical.js v1 and handles RRULE expansion, EXDATE exceptions, and RECURRENCE-ID overrides out of the box. For CORS, a **Cloudflare Worker** is strongly recommended over corsproxy.io because corsproxy.io restricts content types to JSON/XML/CSV and may block `text/calendar` responses. The existing codebase already uses `date-fns` and `date-fns-tz` for timezone operations, which will handle dual-timezone display naturally.

**Primary recommendation:** Use ical-expander for parsing+expansion, a simple Cloudflare Worker for CORS proxying, and date-fns-tz formatInTimeZone for dual-timezone display. Store calendar config (feed URLs, person metadata, travel overrides) in a typed config file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAL-01 | Display events from 5 Google Calendar iCal feeds | ical-expander parses ICS text; Cloudflare Worker proxies Google Calendar secret URLs; React Query manages fetch/cache cycle |
| CAL-02 | Person-tagged events with emoji badges per family member | Config map of calendar URL to person metadata (name, emoji); tag events during parsing |
| CAL-03 | Handle recurring events (RRULE patterns) | ical-expander.between() expands RRULE, handles EXDATE and RECURRENCE-ID automatically |
| CAL-04 | Event deduplication across calendars | Hash-based dedup using normalized (summary + startTime + endTime) as key; merge person tags |
| CAL-05 | Travel detection with dual timezone display | Config-driven travel state per person with timezone; date-fns-tz formatInTimeZone renders both Berlin time and travel timezone |
| CAL-06 | Filter Papa's work-hours events (9-18 weekdays) | Post-parse filter: skip events from Papa's calendar that start/end within 09:00-18:00 on weekdays and are not all-day |
| CAL-07 | Highlight "No School/Schulfrei" all-day events | Post-parse filter: detect all-day events with summary matching /schulfrei|no school/i; apply highlight CSS class |
| CLKW-03 | 7-day weather forecast with highs/lows | useWeather hook already returns daily arrays (temperature_2m_max, temperature_2m_min, weather_code); integrate into calendar day row headers |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ical-expander | ^3.2.0 | Parse ICS + expand RRULE/EXDATE/RECURRENCE-ID | Only library that wraps ical.js and handles all recurrence edge cases (exceptions, overrides) in a single between() call |
| ical.js | ^1.5.0 | Transitive dependency of ical-expander | Installed automatically; provides ICAL.Event and ICAL.Component types |
| date-fns | ^4.1.0 | Date manipulation | Already in project |
| date-fns-tz | ^3.2.0 | Timezone conversion and formatting | Already in project; formatInTimeZone for dual-timezone display |
| @tanstack/react-query | ^5.90.21 | Calendar data fetching and caching | Already in project; manage 5 parallel feed fetches with stale/refetch config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Cloudflare Worker (custom) | N/A | CORS proxy for Google Calendar ICS feeds | Required for browser-side fetch of Google Calendar secret iCal URLs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ical-expander | Raw ical.js v2 + manual RecurExpansion | ical.js v2 has better types but you must manually handle EXDATE, RECURRENCE-ID, and RRULE expansion logic yourself (~100+ lines). ical-expander does this in one call. |
| ical-expander | node-ical | node-ical is Node.js-only (uses Node fs/http modules), does NOT work in browser bundles |
| ical-expander | rrule.js + manual parsing | rrule.js only handles RRULE strings, not full ICS parsing; you'd need a separate ICS parser |
| Cloudflare Worker | corsproxy.io | corsproxy.io restricts to JSON/XML/CSV content types; `text/calendar` may be blocked; rate limits on free tier; third-party reliability risk for 24/7 dashboard |
| Cloudflare Worker | Self-hosted cors-anywhere | Extra infrastructure to maintain; Cloudflare Workers free tier (100K requests/day) is more than sufficient |

**Installation:**
```bash
npm install ical-expander
```

No other new dependencies needed -- date-fns, date-fns-tz, and react-query are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── api/
│   │   ├── openMeteo.ts          # (existing)
│   │   └── calendarFetch.ts      # Fetch ICS via CORS proxy
│   ├── calendar/
│   │   ├── config.ts             # Feed URLs, person metadata, travel state
│   │   ├── parser.ts             # ICS text -> expanded events using ical-expander
│   │   ├── dedup.ts              # Cross-calendar duplicate detection
│   │   ├── filters.ts            # Work-hours filter, Schulfrei detection
│   │   └── types.ts              # CalendarEvent, PersonConfig, DaySchedule types
│   └── utils/
│       └── weatherCodes.ts       # (existing)
├── hooks/
│   ├── useWeather.ts             # (existing)
│   └── useCalendar.ts            # Orchestrates fetch -> parse -> dedup -> filter
├── components/
│   └── calendar/
│       ├── CalendarPanel.tsx      # Main calendar panel (replaces placeholder)
│       ├── DayRow.tsx             # Single day: date header + weather + events
│       ├── EventCard.tsx          # Individual event with person badge
│       └── WeatherBadge.tsx       # Hi/lo temp + icon for day row header
└── ...
```

### Pattern 1: Parallel Feed Fetching with React Query
**What:** Fetch all 5 calendar feeds in parallel using React Query's useQueries, then merge results.
**When to use:** Always -- the 5 feeds are independent and can be fetched concurrently.
**Example:**
```typescript
// src/hooks/useCalendar.ts
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { CALENDAR_FEEDS } from '../lib/calendar/config';
import { fetchCalendarFeed } from '../lib/api/calendarFetch';
import { parseICS } from '../lib/calendar/parser';
import { deduplicateEvents } from '../lib/calendar/dedup';
import { applyFilters } from '../lib/calendar/filters';

export function useCalendar() {
  const queries = useQueries({
    queries: CALENDAR_FEEDS.map((feed) => ({
      queryKey: ['calendar', feed.id],
      queryFn: () => fetchCalendarFeed(feed.url),
      staleTime: 5 * 60 * 1000,       // 5 min stale
      refetchInterval: 15 * 60 * 1000, // 15 min refresh
      retry: 3,
    })),
  });

  // Combine when all loaded
  const allLoaded = queries.every((q) => q.isSuccess);
  const events = useMemo(() => {
    if (!allLoaded) return [];
    const allEvents = queries.flatMap((q, i) =>
      parseICS(q.data!, CALENDAR_FEEDS[i])
    );
    const deduped = deduplicateEvents(allEvents);
    return applyFilters(deduped);
  }, [queries, allLoaded]);

  return {
    events,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}
```

### Pattern 2: Config-Driven Calendar Feeds
**What:** Store all calendar configuration in a typed config file, not scattered across components.
**When to use:** Always -- single source of truth for feed URLs, person metadata, and travel state.
**Example:**
```typescript
// src/lib/calendar/config.ts
export interface PersonConfig {
  id: string;
  name: string;
  emoji: string;
  calendarUrl: string;
  isWorkCalendar?: boolean;  // enables work-hours filtering
  travelTimezone?: string;   // set when person is traveling, e.g. 'America/New_York'
}

export const CALENDAR_FEEDS: PersonConfig[] = [
  { id: 'papa', name: 'Papa', emoji: '👨', calendarUrl: import.meta.env.VITE_CAL_PAPA, isWorkCalendar: true },
  { id: 'daddy', name: 'Daddy', emoji: '👨‍🦰', calendarUrl: import.meta.env.VITE_CAL_DADDY },
  { id: 'wren', name: 'Wren', emoji: '🦅', calendarUrl: import.meta.env.VITE_CAL_WREN },
  { id: 'ellis', name: 'Ellis', emoji: '🌟', calendarUrl: import.meta.env.VITE_CAL_ELLIS },
  { id: 'family', name: 'Family', emoji: '👨‍👨‍👧‍👦', calendarUrl: import.meta.env.VITE_CAL_FAMILY },
];
```

### Pattern 3: Hash-Based Deduplication
**What:** Detect duplicate events across calendars by creating a normalized hash key.
**When to use:** When the same event appears on multiple family member calendars (e.g., a family dinner on Papa, Daddy, and Family calendars).
**Example:**
```typescript
// src/lib/calendar/dedup.ts
import type { CalendarEvent } from './types';

function eventKey(event: CalendarEvent): string {
  const summary = event.summary.trim().toLowerCase();
  const start = event.startTime.toISOString();
  const end = event.endTime.toISOString();
  return `${summary}|${start}|${end}`;
}

export function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Map<string, CalendarEvent>();

  for (const event of events) {
    const key = eventKey(event);
    const existing = seen.get(key);
    if (existing) {
      // Merge person tags -- event exists on multiple calendars
      existing.persons = [...new Set([...existing.persons, ...event.persons])];
    } else {
      seen.set(key, { ...event });
    }
  }

  return Array.from(seen.values());
}
```

### Pattern 4: Weather Integration in Day Rows
**What:** Merge useWeather's daily forecast data into calendar day headers.
**When to use:** Each day row in the calendar shows the weather hi/lo alongside the date.
**Example:**
```typescript
// src/components/calendar/DayRow.tsx
import { useWeather } from '../../hooks/useWeather';
import { WeatherBadge } from './WeatherBadge';

interface DayRowProps {
  date: Date;
  dayIndex: number;  // 0-6, maps to useWeather daily arrays
  events: CalendarEvent[];
}

export function DayRow({ date, dayIndex, events }: DayRowProps) {
  const { data: weather } = useWeather();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{formatDayHeader(date)}</span>
        {weather && dayIndex < weather.daily.time.length && (
          <WeatherBadge
            high={weather.daily.temperature_2m_max[dayIndex]}
            low={weather.daily.temperature_2m_min[dayIndex]}
            weatherCode={weather.daily.weather_code[dayIndex]}
          />
        )}
      </div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Parsing ICS on every render:** Parse once when data arrives, memoize results. ICS parsing is synchronous and CPU-intensive.
- **Fetching all feeds sequentially:** Use useQueries for parallel fetching. Sequential fetching of 5 feeds would multiply load time.
- **Storing raw ICS text in state:** Parse immediately to typed CalendarEvent objects. Raw ICS text is large and wasteful to keep in memory.
- **Hardcoding calendar URLs in source:** Use .env variables (VITE_CAL_*) so secrets stay out of git. These are private Google Calendar secret URLs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RRULE expansion | Manual recurrence iteration | ical-expander.between() | RRULE spec has BYDAY, BYMONTH, BYSETPOS, COUNT, UNTIL, INTERVAL, WKST, EXDATE, RECURRENCE-ID -- hundreds of edge cases |
| ICS parsing | Regex-based parser | ical-expander (wraps ical.js) | ICS format has folded lines, escaped chars, multi-value properties, timezone references |
| CORS proxying | None (can't skip) | Cloudflare Worker (15 lines of code) | Google Calendar does not set CORS headers on iCal feed responses |
| Timezone math | Manual UTC offset calculations | date-fns-tz formatInTimeZone | DST transitions, historical timezone changes, IANA database updates |
| Event deduplication | Exact string match | Normalized hash (summary + start + end) | Events may differ in description, attendees, or UID across calendars but represent the same event |

**Key insight:** iCal/RRULE is one of the most deceptively complex standards in computing. What seems like "just parse a text file and expand dates" involves timezone-aware date math, exception handling, override merging, and multi-valued properties. ical-expander exists specifically because this is too hard to get right by hand.

## Common Pitfalls

### Pitfall 1: CORS Proxy Content-Type Blocking
**What goes wrong:** corsproxy.io (used by the old dashboard) now restricts to JSON/XML/CSV content types. Google Calendar returns `text/calendar`, which may be rejected.
**Why it happens:** Free CORS proxies tighten restrictions over time to prevent abuse.
**How to avoid:** Deploy a simple Cloudflare Worker (~15 lines) that proxies any URL with CORS headers. Free tier allows 100K requests/day, far exceeding dashboard needs.
**Warning signs:** Fetch returns 403 or empty response; works in dev (no CORS) but fails in production.

### Pitfall 2: ical-expander Uses ical.js v1, Not v2
**What goes wrong:** ical-expander v3.2.0 depends on ical.js ^1.5.0. If you also install ical.js v2 directly, you get version conflicts.
**Why it happens:** ical-expander has not been updated to use ical.js v2's new API.
**How to avoid:** Do NOT install ical.js separately. Let ical-expander bring its own ical.js v1 dependency. If you need ical.js types, use ical-expander's re-exports.
**Warning signs:** "ICAL is not defined" or duplicate module errors in bundle.

### Pitfall 3: Infinite RRULE Expansion
**What goes wrong:** Some recurring events have no UNTIL or COUNT (e.g., "every Monday forever"). Expanding these without a date range limit causes infinite loops or thousands of events.
**Why it happens:** ical-expander defaults maxIterations to 1000, but calling .all() on an unbounded rule is still wasteful.
**How to avoid:** Always use .between(startDate, endDate) with a 7-day window. Never use .all() on production calendar data.
**Warning signs:** Browser tab freezes or high memory usage after calendar load.

### Pitfall 4: Timezone-Naive Date Comparison
**What goes wrong:** Comparing event dates using JavaScript Date objects without considering timezone leads to off-by-one-day errors, especially around midnight.
**Why it happens:** ical-expander returns ICAL.Time objects that need proper timezone conversion. JS Date is always UTC internally.
**How to avoid:** Convert all event times to Berlin timezone using date-fns-tz before grouping into days. Use formatInTimeZone for display.
**Warning signs:** Events appearing on wrong day, especially late-night or early-morning events.

### Pitfall 5: All-Day Events Have No Time Component
**What goes wrong:** All-day events in iCal have DATE type (not DATE-TIME). They span midnight-to-midnight. Treating them like timed events causes display errors.
**Why it happens:** iCal represents all-day events as DATE values without time/timezone.
**How to avoid:** Check event.isAllDay or detect DATE vs DATE-TIME type. Display all-day events separately at the top of each day, before timed events.
**Warning signs:** All-day events showing at midnight, or spanning into the next day incorrectly.

### Pitfall 6: Google Calendar Secret URLs Are Sensitive
**What goes wrong:** Committing Google Calendar secret iCal URLs to git exposes private calendar data to anyone with repo access.
**Why it happens:** Easy to hardcode URLs during development.
**How to avoid:** Store URLs in .env file using VITE_CAL_* prefix. Add .env to .gitignore. The Cloudflare Worker URL itself can be in code (it's just a proxy), but the calendar URLs must stay in env vars.
**Warning signs:** Calendar URLs visible in git history or in browser network tab (the proxy URL will contain the target URL as a parameter).

## Code Examples

### Fetching ICS via CORS Proxy
```typescript
// src/lib/api/calendarFetch.ts
const CORS_PROXY_URL = import.meta.env.VITE_CORS_PROXY_URL;
// e.g., 'https://cal-proxy.your-domain.workers.dev'

export async function fetchCalendarFeed(calendarUrl: string): Promise<string> {
  const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(calendarUrl)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Calendar fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.text();  // ICS is plain text
}
```

### Parsing ICS with ical-expander
```typescript
// src/lib/calendar/parser.ts
import IcalExpander from 'ical-expander';
import { startOfToday, addDays } from 'date-fns';
import { PersonConfig } from './config';
import { CalendarEvent } from './types';

export function parseICS(icsText: string, feed: PersonConfig): CalendarEvent[] {
  const expander = new IcalExpander({ ics: icsText, maxIterations: 1000 });
  const start = startOfToday();
  const end = addDays(start, 7);

  const { events, occurrences } = expander.between(start, end);

  const parsed: CalendarEvent[] = [];

  // Single (non-recurring) events
  for (const event of events) {
    parsed.push({
      id: event.uid,
      summary: event.summary,
      startTime: event.startDate.toJSDate(),
      endTime: event.endDate.toJSDate(),
      isAllDay: event.startDate.isDate,  // DATE vs DATE-TIME
      persons: [feed.id],
      location: event.location || undefined,
    });
  }

  // Recurring event occurrences
  for (const occ of occurrences) {
    parsed.push({
      id: `${occ.item.uid}-${occ.startDate.toJSDate().toISOString()}`,
      summary: occ.item.summary,
      startTime: occ.startDate.toJSDate(),
      endTime: occ.endDate.toJSDate(),
      isAllDay: occ.startDate.isDate,
      persons: [feed.id],
      location: occ.item.location || undefined,
    });
  }

  return parsed;
}
```

### Cloudflare Worker CORS Proxy (deploy separately)
```javascript
// cloudflare-worker/cors-proxy.js
// Deploy to Cloudflare Workers (free tier: 100K req/day)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow Google Calendar URLs
    if (!targetUrl.startsWith('https://calendar.google.com/')) {
      return new Response('Only Google Calendar URLs allowed', { status: 403 });
    }

    const response = await fetch(targetUrl);
    const body = await response.text();

    return new Response(body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=300',  // 5 min cache at edge
      },
    });
  },
};
```

### Work-Hours and Schulfrei Filters
```typescript
// src/lib/calendar/filters.ts
import { getDay, getHours } from 'date-fns';
import type { CalendarEvent } from './types';
import { CALENDAR_FEEDS } from './config';

/** Filter out Papa's work-hours events (9-18 weekdays, non-all-day) */
function isWorkHoursEvent(event: CalendarEvent): boolean {
  if (event.isAllDay) return false;
  const day = getDay(event.startTime); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const hour = getHours(event.startTime);
  return hour >= 9 && hour < 18;
}

/** Check if event is a Schulfrei/No School day */
function isSchulfrei(event: CalendarEvent): boolean {
  if (!event.isAllDay) return false;
  return /schulfrei|no school|kein unterricht/i.test(event.summary);
}

export function applyFilters(events: CalendarEvent[]): CalendarEvent[] {
  const papaFeed = CALENDAR_FEEDS.find((f) => f.isWorkCalendar);

  return events
    .filter((event) => {
      // Remove Papa's work-hours events
      if (papaFeed && event.persons.includes(papaFeed.id) && isWorkHoursEvent(event)) {
        return false;
      }
      return true;
    })
    .map((event) => ({
      ...event,
      isSchulfrei: isSchulfrei(event),
    }));
}
```

### Dual Timezone Display
```typescript
// src/components/calendar/EventCard.tsx (timezone portion)
import { formatInTimeZone } from 'date-fns-tz';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';

function formatEventTime(event: CalendarEvent): string {
  const berlinTime = formatInTimeZone(event.startTime, 'Europe/Berlin', 'HH:mm');

  // Check if any person on this event is traveling
  const travelingPerson = event.persons
    .map((id) => CALENDAR_FEEDS.find((f) => f.id === id))
    .find((f) => f?.travelTimezone);

  if (travelingPerson?.travelTimezone) {
    const travelTime = formatInTimeZone(
      event.startTime,
      travelingPerson.travelTimezone,
      'HH:mm'
    );
    // e.g., "14:00 Berlin / 08:00 NYC"
    return `${berlinTime} Berlin / ${travelTime} ${travelingPerson.name}`;
  }

  return berlinTime;
}
```

### CalendarEvent Type
```typescript
// src/lib/calendar/types.ts
export interface CalendarEvent {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  persons: string[];        // person IDs from config
  location?: string;
  isSchulfrei?: boolean;    // added by filter pass
}

export interface DaySchedule {
  date: Date;
  dateStr: string;          // 'YYYY-MM-DD' for keying
  events: CalendarEvent[];
  weather?: {
    high: number;
    low: number;
    weatherCode: number;
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| corsproxy.io for CORS | Cloudflare Worker or dedicated proxy | 2025 (corsproxy content restrictions) | Must deploy own proxy; corsproxy may block text/calendar |
| ical.js v1 manual parsing | ical-expander wrapping ical.js v1 | ical-expander stable since 2022 | Single .between() call replaces 100+ lines of manual expansion |
| ical.js v1 (no types) | ical.js v2 (built-in TS types) | 2024 | v2 has types but ical-expander still uses v1; don't mix versions |
| Manual timezone offset | date-fns-tz formatInTimeZone | date-fns-tz v3 (2024) | Reliable IANA-based timezone formatting already in project |

**Deprecated/outdated:**
- **corsproxy.io free tier for ICS:** Now restricts content types; may not pass text/calendar responses
- **ical.js v1 direct usage:** Still works but lacks TypeScript types; prefer ical-expander wrapper
- **node-ical in browser:** Despite the name, it uses Node.js APIs (fs, http) and does NOT work in browser bundles

## Open Questions

1. **ical-expander TypeScript types**
   - What we know: ical-expander is plain JS with no @types package. ical.js v1 (its dependency) also lacks built-in types.
   - What's unclear: Whether community-maintained type definitions exist or if we need a local .d.ts declaration file.
   - Recommendation: Create a minimal `src/types/ical-expander.d.ts` declaration file for the subset of API we use (constructor, between(), event/occurrence shapes).

2. **Cloudflare Worker deployment**
   - What we know: Cloudflare Workers free tier allows 100K requests/day. The worker is ~15 lines. The family already hosts on GitHub Pages.
   - What's unclear: Whether the family has a Cloudflare account or if this needs setup.
   - Recommendation: Include Cloudflare Worker setup as a plan task. Alternatively, test if corsproxy.io actually works with text/calendar first as a fallback.

3. **Travel timezone configuration**
   - What we know: The config stores a travelTimezone per person. The old dashboard had travel detection.
   - What's unclear: Whether travel detection should be automatic (detect from event location) or manual (edit config). Automatic detection is complex and unreliable.
   - Recommendation: Start with manual config (set travelTimezone in .env or config when someone travels). Automatic detection is a v2 enhancement.

4. **ical-expander in Vite bundle**
   - What we know: ical-expander uses CommonJS (require). The project uses Vite with ESM.
   - What's unclear: Whether Vite's CJS-to-ESM interop handles ical-expander cleanly or if special config is needed.
   - Recommendation: Test import early. Vite handles most CJS modules via esbuild's CJS interop, but ical-expander may need `import IcalExpander from 'ical-expander'` default import or `optimizeDeps.include` config.

## Sources

### Primary (HIGH confidence)
- [ical-expander GitHub README](https://github.com/mifi/ical-expander) - API docs, between() method, EXDATE/RRULE/RECURRENCE-ID handling
- [ical-expander package.json](https://github.com/mifi/ical-expander/blob/master/package.json) - Confirmed ical.js ^1.2.2 dependency (NOT v2)
- [ical.js v2.2.1 package.json](https://github.com/kewisch/ical.js) - Confirmed built-in TypeScript types at dist/types/module.d.ts
- [ical.js Wiki - Common Use Cases](https://github.com/kewisch/ical.js/wiki/Common-Use-Cases) - RecurExpansion API examples
- [Cloudflare Workers CORS proxy docs](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) - Official CORS proxy example
- [Open-Meteo API](https://api.open-meteo.com) - Already integrated; daily forecast arrays confirmed in existing openMeteo.ts

### Secondary (MEDIUM confidence)
- [corsproxy.io status and restrictions](https://corsproxy.io/) - Content type restrictions (JSON/XML/CSV only) reported in search results; needs live verification
- [CORS Proxies 2025 gist](https://gist.github.com/reynaldichernando/eab9c4e31e30677f176dc9eb732963ef) - Community-maintained list of free CORS proxies
- [date-fns-tz timezone docs](https://github.com/date-fns/tz) - formatInTimeZone API for dual-timezone display
- [ical.js VTIMEZONE issue #455](https://github.com/kewisch/ical.js/issues/455) - Timezone handling requires IANA timezone registration

### Tertiary (LOW confidence)
- [ical-expander Google Calendar issue #8](https://github.com/mifi/ical-expander/issues/8) - Reported strange behavior with G-Suite recurring events; may be resolved in v3.x

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - ical-expander is the clear best choice for browser iCal parsing+expansion, but the ical.js v1 dependency and lack of TS types add minor risk
- Architecture: HIGH - Pattern of parallel React Query fetches, config-driven feeds, and modular parse/dedup/filter pipeline is well-established
- Pitfalls: HIGH - CORS, RRULE expansion limits, timezone handling, and all-day events are well-documented hazards
- CORS proxy: MEDIUM - Cloudflare Worker is the right approach but requires setup verification; corsproxy.io status needs live testing
- Travel/dual timezone: MEDIUM - Manual config approach is simple and reliable; automatic detection deferred

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days -- stable domain, libraries not changing rapidly)
