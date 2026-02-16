# Phase 2: Clock & Weather Core - Research

**Researched:** 2026-02-16
**Domain:** Real-time clock display, timezone handling, weather data integration (Open-Meteo API), auto-refreshing data in React
**Confidence:** HIGH

## Summary

Phase 2 implements the always-visible clock, date, and weather panel that forms the information core of the family dashboard. The technical challenges center on three areas: (1) real-time clock updates without causing re-render cascades, (2) timezone-aware date/time formatting for Berlin with proper DST handling, and (3) weather data fetching from Open-Meteo API with intelligent caching and auto-refresh.

Open-Meteo provides a free, no-API-key weather API with excellent documentation. It returns current conditions, 7-day forecasts, and sunrise/sunset times via a simple HTTP GET endpoint. The API natively supports timezone parameters and returns WMO weather codes that map to icon sets. React Query (TanStack Query) is the industry-standard solution for server state management, handling caching, background refetching, and stale-while-revalidate patterns automatically.

For the clock, the pattern is well-established: a React hook wrapping `setInterval` with proper cleanup, paired with either `Intl.DateTimeFormat` (native browser API, zero bundle cost) or `date-fns-tz` (better format control, small bundle addition). The existing dashboard already runs 24/7, so memory leak prevention through `useEffect` cleanup is critical.

**Primary recommendation:** Use `@tanstack/react-query` for weather data with 5-minute stale time and window-focus refetching. Implement a `useInterval` custom hook (Dan Abramov pattern) for the clock. Use `date-fns-tz` with `formatInTimeZone` for timezone-aware formatting. Map Open-Meteo WMO codes to `react-icons` weather symbols.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLKW-01 | Real-time clock and date display (Berlin timezone), always visible | `useInterval` hook with 1-second interval prevents stale closures. `date-fns-tz` provides `formatInTimeZone(date, 'Europe/Berlin', format)` for timezone display. `Intl.DateTimeFormat` is zero-bundle alternative with `timeZone: 'Europe/Berlin'` option. Both handle DST automatically via browser/IANA database. |
| CLKW-02 | Current weather conditions with temperature and icon (Open-Meteo API) | Open-Meteo `/v1/forecast` endpoint returns current conditions via `current=temperature_2m,weather_code`. Weather code is WMO standard (0-99) mapping to conditions. Free tier, no API key, CORS-friendly. React Query handles caching and background refetch. |
| CLKW-03 | 7-day weather forecast with highs/lows | Open-Meteo `daily=temperature_2m_max,temperature_2m_min,weather_code` parameter returns 7-day forecast arrays. Default `forecast_days=7`, extendable to 16. Response includes `daily.time[]` (ISO dates) and temperature arrays. |
| CLKW-04 | Sunrise and sunset times | Open-Meteo `daily=sunrise,sunset` returns Unix timestamps. API handles timezone conversion when `timezone=Europe/Berlin` parameter is set. Response format: `daily.sunrise[]` and `daily.sunset[]` as ISO strings or Unix time (configurable via `timeformat` param). |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@tanstack/react-query** | 5.x | Server state management (weather API) | Industry standard for API data caching; handles stale-while-revalidate, background refetch, window focus refetch automatically; separates server state from UI state (best practice 2026) |
| **date-fns** | 4.x | Date/time utilities | Tree-shakeable, modern replacement for Moment.js; excellent TypeScript support; active maintenance |
| **date-fns-tz** | 3.x | Timezone support for date-fns | Official timezone companion for date-fns v3+; uses browser Intl API (no bundle bloat); `formatInTimeZone` is simpler than manual conversion |

**Confidence: HIGH** -- React Query is ubiquitous for server state in 2026. date-fns v4 is stable and well-documented. date-fns-tz v3 officially supports date-fns v3+.

**Note:** date-fns v4.0 introduced first-class timezone support, but date-fns-tz remains recommended for convenience functions like `formatInTimeZone`.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-icons | 5.x | Weather icon display | Tree-shakeable icon library; includes `wi-` Weather Icons set and generic icons; zero runtime overhead with proper imports |

**Alternative: Native Intl API** -- For clock only, `Intl.DateTimeFormat` provides timezone formatting with zero bundle cost:
```typescript
new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}).format(new Date())
```
Trade-off: Less format control than date-fns, but native and performant.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Query | SWR (Vercel) | Similar API, smaller bundle (~5KB vs ~13KB). Less feature-rich (no query invalidation, simpler devtools). Good alternative if bundle size critical. |
| date-fns-tz | Intl.DateTimeFormat (native) | Zero bundle cost, but less format flexibility. Can't easily produce formats like "Monday, Feb 16" without manual string building. |
| Open-Meteo | OpenWeatherMap | Requires API key, rate limits on free tier. Open-Meteo is free, no key, better for this use case. |
| Open-Meteo | Weather.gov (US only) | Free but US-specific. Family is in Berlin, so not applicable. |

**Installation:**
```bash
npm install @tanstack/react-query date-fns date-fns-tz react-icons
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── clock/
│   │   ├── Clock.tsx              # Real-time clock display
│   │   └── DateDisplay.tsx        # Current date (long format)
│   ├── weather/
│   │   ├── CurrentWeather.tsx     # Temp + icon + conditions
│   │   ├── WeatherForecast.tsx    # 7-day forecast grid
│   │   ├── SunTimes.tsx           # Sunrise/sunset display
│   │   └── WeatherIcon.tsx        # WMO code → icon mapper
├── hooks/
│   ├── useInterval.ts             # Dan Abramov interval hook
│   ├── useClock.ts                # Clock state + formatting
│   └── useWeather.ts              # Weather API integration (wraps React Query)
├── lib/
│   ├── api/
│   │   └── openMeteo.ts           # Open-Meteo fetch functions
│   └── utils/
│       ├── weatherCodes.ts        # WMO code → description/icon mapping
│       └── timeFormat.ts          # Timezone formatting helpers
```

### Pattern 1: Real-Time Clock with useInterval

**What:** Custom React hook that runs a callback on an interval, with automatic cleanup and "pauseable" delay.

**When to use:** Any component that needs to update on a fixed interval (clock, countdown timers, polling).

**Why this pattern:** Native `setInterval` in `useEffect` has closure issues -- interval callback captures stale props/state. Dan Abramov's `useInterval` pattern solves this via `useRef` for the callback.

**Example:**
```typescript
// hooks/useInterval.ts
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return; // Pause if delay is null

    const tick = () => savedCallback.current?.();
    const id = setInterval(tick, delay);

    return () => clearInterval(id); // Cleanup on unmount
  }, [delay]);
}
```
*Source: [Dan Abramov's Blog](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)*

### Pattern 2: Timezone Formatting with date-fns-tz

**What:** Format dates in a specific timezone without manual UTC conversion.

**When to use:** Displaying clock/date for a timezone different from the user's system timezone (e.g., always show Berlin time).

**Example:**
```typescript
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';

const now = new Date();

// Clock display (HH:mm:ss)
const time = formatInTimeZone(now, 'Europe/Berlin', 'HH:mm:ss');

// Date display (EEEE, MMMM d, yyyy)
const date = formatInTimeZone(
  now,
  'Europe/Berlin',
  'EEEE, MMMM d, yyyy',
  { locale: enUS }
);
// Output: "Monday, February 16, 2026"
```
*Source: [date-fns-tz npm](https://www.npmjs.com/package/date-fns-tz)*

**Why not utcToZonedTime?** `formatInTimeZone` does the conversion + formatting in one step. It's equivalent to `format(utcToZonedTime(date, tz), pattern)` but cleaner.

### Pattern 3: Weather Data with React Query

**What:** Fetch weather data with automatic caching, background refetch, and stale-while-revalidate.

**When to use:** Any API data that should refresh periodically (weather, transit, horoscopes).

**Example:**
```typescript
// lib/api/openMeteo.ts
const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.419;

export async function fetchWeather() {
  const params = new URLSearchParams({
    latitude: BERLIN_LAT.toString(),
    longitude: BERLIN_LON.toString(),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
    timezone: 'Europe/Berlin',
    forecast_days: '7'
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) throw new Error('Weather API failed');
  return response.json();
}

// hooks/useWeather.ts
import { useQuery } from '@tanstack/react-query';

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'berlin'],
    queryFn: fetchWeather,
    staleTime: 5 * 60 * 1000,      // 5 minutes - data stays fresh
    refetchInterval: 15 * 60 * 1000, // 15 minutes - background refetch
    refetchOnWindowFocus: true       // Refresh when tab regains focus
  });
}
```
*Source: [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)*

**Configuration rationale:**
- `staleTime: 5min` -- Weather doesn't change second-by-second; avoid excessive requests
- `refetchInterval: 15min` -- Background refresh for always-on wall display
- `refetchOnWindowFocus: true` -- Mobile users get fresh data when opening app
- `queryKey` includes location for future multi-location support

### Pattern 4: WMO Weather Code Mapping

**What:** Convert Open-Meteo's WMO weather codes (0-99) to human-readable descriptions and icon names.

**When to use:** Displaying weather conditions from Open-Meteo API.

**Example:**
```typescript
// lib/utils/weatherCodes.ts
export const WMO_CODES = {
  0: { description: 'Clear sky', icon: 'wi-day-sunny' },
  1: { description: 'Mainly clear', icon: 'wi-day-sunny' },
  2: { description: 'Partly cloudy', icon: 'wi-day-cloudy' },
  3: { description: 'Overcast', icon: 'wi-cloudy' },
  45: { description: 'Fog', icon: 'wi-fog' },
  48: { description: 'Depositing rime fog', icon: 'wi-fog' },
  51: { description: 'Light drizzle', icon: 'wi-sprinkle' },
  // ... see full mapping in WMO standard
  95: { description: 'Thunderstorm', icon: 'wi-thunderstorm' },
  96: { description: 'Thunderstorm with hail', icon: 'wi-storm-showers' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'wi-storm-showers' }
} as const;

export function getWeatherInfo(code: number) {
  return WMO_CODES[code as keyof typeof WMO_CODES] || {
    description: 'Unknown',
    icon: 'wi-na'
  };
}
```
*Source: [WMO Code Gist](https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c)*

**Icon library:** Weather Icons (`wi-*`) are available in `react-icons` as `WiDaySunny`, `WiCloudy`, etc. Import like:
```typescript
import { WiDaySunny, WiCloudy } from 'react-icons/wi';
```

### Anti-Patterns to Avoid

- **❌ Fetching weather in useEffect without cleanup:** Leads to race conditions and memory leaks. Use React Query instead.
- **❌ Storing weather data in useState:** Server state belongs in React Query cache, not local component state.
- **❌ Clock updates triggering full component re-renders:** Use React.memo to prevent weather/forecast components from re-rendering every second.
- **❌ Hardcoding timezone offsets:** Daylight saving time breaks this twice a year. Use IANA timezone names ('Europe/Berlin') and let libraries handle DST.
- **❌ Polling weather API every second:** Weather data changes slowly. Use `staleTime` to prevent excessive requests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API data caching | Custom fetch wrapper with localStorage/state | React Query | Handles cache invalidation, background refetch, request deduplication, error retries, garbage collection. Complex state machine under the hood. |
| Timezone conversion | Manual UTC math (`new Date().getTimezoneOffset()`) | date-fns-tz or Intl API | DST transitions, leap seconds, historical timezone changes. IANA database has decades of edge cases. |
| Interval cleanup | Manual `setInterval`/`clearInterval` in useEffect | useInterval custom hook | Closure stale values, cleanup timing, dynamic delay changes. Dan Abramov's pattern solves all of these. |
| Weather icon mapping | Scraping weather service icons | WMO code library + react-icons | WMO codes are standardized. Icon fonts are optimized and accessible. Don't download PNGs at runtime. |

**Key insight:** Time, timezones, and caching are deceptively complex. Libraries exist because the edge cases are numerous and subtle. For a 24/7 dashboard, using battle-tested solutions prevents 3am debugging sessions.

## Common Pitfalls

### Pitfall 1: Clock Component Re-Render Cascade

**What goes wrong:** Clock updates every second, triggering re-render of entire dashboard tree, including expensive weather/calendar components.

**Why it happens:** By default, React re-renders all children when parent state changes. If `App` manages clock state, every child re-renders.

**How to avoid:**
1. Isolate clock state to `<Clock>` component only
2. Use `React.memo` on sibling components (weather, calendar) to prevent unnecessary re-renders
3. Alternatively, use `useSyncExternalStore` for clock (React 18+) to subscribe to time changes without triggering parent re-renders

**Warning signs:** DevTools profiler shows weather/calendar components re-rendering every second. Animations stutter. Battery drain on mobile.

### Pitfall 2: Stale Weather Data on Long-Running Display

**What goes wrong:** Wall display runs for days without page reload, but weather data never updates after initial fetch.

**Why it happens:** Without `refetchInterval`, React Query only refetches on mount or manual invalidation. If the page never unmounts, data goes stale.

**How to avoid:**
- Set `refetchInterval: 15 * 60 * 1000` (15 minutes) in useQuery config
- Enable `refetchOnWindowFocus: true` for mobile (but irrelevant for kiosk)
- Rely on Phase 1's auto-refresh (3am reload) as safety net

**Warning signs:** Weather still shows yesterday's forecast. Temperature doesn't match current conditions.

### Pitfall 3: Timezone Display Shows User's Local Time Instead of Berlin

**What goes wrong:** Dashboard shows New York time when accessed from US, Berlin time when accessed from Germany.

**Why it happens:** `new Date().toLocaleString()` uses browser's timezone by default. `date-fns` format also uses system timezone unless explicitly overridden.

**How to avoid:**
- Always use `formatInTimeZone(date, 'Europe/Berlin', pattern)` from date-fns-tz
- Or use `Intl.DateTimeFormat` with `{ timeZone: 'Europe/Berlin' }` option
- Never rely on system timezone for display

**Warning signs:** Clock shows different time when tested on laptop vs Pi. DST transitions happen at wrong times.

### Pitfall 4: Open-Meteo API Rate Limiting from Aggressive Polling

**What goes wrong:** API returns 429 Too Many Requests, weather stops updating.

**Why it happens:** Open-Meteo has rate limits (10,000 requests/day for free tier). Polling every minute = 1,440 requests/day per client. Fine for one device, but excessive.

**How to avoid:**
- Use `staleTime: 5 * 60 * 1000` (5 minutes) to prevent refetch on every component mount
- Use `refetchInterval: 15 * 60 * 1000` (15 minutes) for background updates
- Open-Meteo docs recommend "reasonable request rates" -- 15-minute intervals are safe

**Warning signs:** Network tab shows weather requests every few seconds. Console errors about rate limits.

### Pitfall 5: Sunrise/Sunset Times Display in Wrong Timezone

**What goes wrong:** Sunrise shows as 4:32 AM instead of 6:32 AM (UTC vs Berlin).

**Why it happens:** Open-Meteo returns sunrise/sunset as Unix timestamps or ISO strings. If you don't specify `timezone=Europe/Berlin` in API params, times are returned in UTC.

**How to avoid:**
- Include `timezone=Europe/Berlin` in Open-Meteo API request
- API automatically converts sunrise/sunset to specified timezone
- Verify response includes `"timezone": "Europe/Berlin"` field

**Warning signs:** Sunrise/sunset times are exactly 1-2 hours off (UTC offset). Times don't adjust for DST.

## Code Examples

Verified patterns from official sources and real-world implementations.

### Real-Time Clock Component

```typescript
// hooks/useClock.ts
import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useInterval } from './useInterval';

const TIMEZONE = 'Europe/Berlin';

export function useClock() {
  const [now, setNow] = useState(new Date());

  useInterval(() => {
    setNow(new Date());
  }, 1000);

  return {
    time: formatInTimeZone(now, TIMEZONE, 'HH:mm:ss'),
    date: formatInTimeZone(now, TIMEZONE, 'EEEE, MMMM d, yyyy'),
    dateShort: formatInTimeZone(now, TIMEZONE, 'MMM d'),
  };
}

// components/clock/Clock.tsx
import { useClock } from '@/hooks/useClock';

export function Clock() {
  const { time, date } = useClock();

  return (
    <div className="flex flex-col items-center">
      <div className="text-[clamp(2rem,5vw,4rem)] font-bold tabular-nums">
        {time}
      </div>
      <div className="text-[clamp(1rem,2vw,1.5rem)] text-text-secondary">
        {date}
      </div>
    </div>
  );
}
```

### Weather Data Fetching

```typescript
// lib/api/openMeteo.ts
export interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
}

const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.419;

export async function fetchWeather(): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: BERLIN_LAT.toString(),
    longitude: BERLIN_LON.toString(),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
    timezone: 'Europe/Berlin',
    forecast_days: '7',
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}
```
*Source: [Open-Meteo Docs](https://open-meteo.com/en/docs)*

### React Query Integration

```typescript
// hooks/useWeather.ts
import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/api/openMeteo';

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'berlin'],
    queryFn: fetchWeather,
    staleTime: 5 * 60 * 1000,        // 5 minutes
    refetchInterval: 15 * 60 * 1000,  // 15 minutes
    refetchOnWindowFocus: true,
    retry: 3,                         // Retry failed requests
  });
}

// App.tsx (React Query setup)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Dashboard components */}
    </QueryClientProvider>
  );
}
```

### Current Weather Display

```typescript
// components/weather/CurrentWeather.tsx
import { useWeather } from '@/hooks/useWeather';
import { getWeatherInfo } from '@/lib/utils/weatherCodes';
import { WiDaySunny, WiCloudy, WiFog, WiRain } from 'react-icons/wi';

const WEATHER_ICONS = {
  'wi-day-sunny': WiDaySunny,
  'wi-cloudy': WiCloudy,
  'wi-fog': WiFog,
  'wi-rain': WiRain,
  // ... map all WMO codes
};

export function CurrentWeather() {
  const { data, isLoading, error } = useWeather();

  if (isLoading) return <div>Loading weather...</div>;
  if (error) return <div>Weather unavailable</div>;

  const { description, icon } = getWeatherInfo(data.current.weather_code);
  const Icon = WEATHER_ICONS[icon] || WiDaySunny;

  return (
    <div className="flex items-center gap-4">
      <Icon className="text-6xl text-accent-gold" />
      <div>
        <div className="text-4xl font-bold tabular-nums">
          {Math.round(data.current.temperature_2m)}°C
        </div>
        <div className="text-lg text-text-secondary">
          {description}
        </div>
      </div>
    </div>
  );
}
```

### 7-Day Forecast Display

```typescript
// components/weather/WeatherForecast.tsx
import { useWeather } from '@/hooks/useWeather';
import { format, parseISO } from 'date-fns';
import { getWeatherInfo } from '@/lib/utils/weatherCodes';

export function WeatherForecast() {
  const { data, isLoading } = useWeather();

  if (isLoading || !data) return null;

  return (
    <div className="grid grid-cols-7 gap-2">
      {data.daily.time.map((date, i) => {
        const { icon } = getWeatherInfo(data.daily.weather_code[i]);
        const dayName = format(parseISO(date), 'EEE'); // Mon, Tue, ...

        return (
          <div key={date} className="flex flex-col items-center">
            <div className="text-sm text-text-secondary">{dayName}</div>
            <div className="text-xs my-1">{/* Icon here */}</div>
            <div className="text-sm font-bold">
              {Math.round(data.daily.temperature_2m_max[i])}°
            </div>
            <div className="text-xs text-text-secondary">
              {Math.round(data.daily.temperature_2m_min[i])}°
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Moment.js for dates | date-fns or Intl API | ~2020 | Moment is 67KB and deprecated. date-fns is tree-shakeable (13KB) and actively maintained. Intl is native (0KB). |
| Redux for API data | React Query / SWR | ~2019-2020 | Separates server state from UI state. Eliminates boilerplate for caching, refetching, error handling. |
| Manual fetch in useEffect | React Query / useSWR | 2019+ | Automatic request deduplication, cache invalidation, background refetch, error retries. |
| Class components for intervals | Hooks with useInterval | React 16.8+ (2019) | Functional components + hooks eliminate lifecycle method complexity. Better cleanup patterns. |
| `100vh` for mobile | `100dvh` (dynamic viewport height) | 2023 (CSS spec) | Accounts for Safari address bar appearing/disappearing. Prevents content overflow on mobile. |

**Deprecated/outdated:**
- **Moment.js**: Officially in maintenance mode since 2020. Use date-fns or Luxon.
- **Manual timezone math**: Error-prone and breaks with DST. Use IANA timezone names with libraries.
- **localStorage for API caching**: No expiration, no memory management. React Query handles this automatically.

## Open Questions

1. **Weather icons: Font vs SVG vs PNG?**
   - What we know: react-icons uses SVG components (tree-shakeable, scalable)
   - What's unclear: Weather Icons font (`wi-*`) availability in react-icons
   - Recommendation: Verify `react-icons/wi` exports include all needed WMO mappings. Fallback to custom SVG components if gaps exist.

2. **React Query devtools for production?**
   - What we know: TanStack Query Devtools helps debug cache state
   - What's unclear: Bundle size impact, whether to include in production build
   - Recommendation: Include in development only (`import.meta.env.DEV` guard). ~30KB gzipped impact if included.

3. **Fallback weather data during API outage?**
   - What we know: React Query supports `placeholderData` and `initialData`
   - What's unclear: Whether to cache last-good-data in localStorage as fallback
   - Recommendation: Start simple (show error state). Add localStorage persistence if API reliability becomes issue.

## Sources

### Primary (HIGH confidence)

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs) - Official API reference
- [TanStack Query v5 Docs](https://tanstack.com/query/v5/docs/framework/react/overview) - Official React Query documentation
- [date-fns-tz npm package](https://www.npmjs.com/package/date-fns-tz) - Official timezone support library
- [Dan Abramov: Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) - useInterval pattern origin
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Native browser timezone API

### Secondary (MEDIUM confidence)

- [WMO Weather Code Mapping Gist](https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c) - Community-verified WMO code descriptions
- [Open-Meteo TypeScript SDK](https://github.com/open-meteo/typescript) - Official TypeScript client (not needed for simple fetch, but reference for types)
- [React Query: Window Focus Refetching Guide](https://tanstack.com/query/v4/docs/framework/react/guides/window-focus-refetching) - Official refetch behavior documentation
- [React Query: Important Defaults](https://tanstack.com/query/v4/docs/framework/react/guides/important-defaults) - Explains default cache/stale behavior
- [date-fns v4.0 Blog Post](https://blog.date-fns.org/v40-with-time-zone-support/) - First-class timezone support announcement

### Tertiary (LOW confidence - needs verification)

- Weather Icon mapping approaches found in GitHub projects
- Community blog posts on React Query patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React Query and date-fns are industry standards, well-documented
- Architecture: HIGH - Patterns verified from official sources (Dan Abramov, TanStack docs)
- Pitfalls: MEDIUM - Based on documented issues and community experience, not all tested in this specific project

**Research date:** 2026-02-16
**Valid until:** ~30 days (weather APIs and React Query are stable; unlikely to have breaking changes in short term)
