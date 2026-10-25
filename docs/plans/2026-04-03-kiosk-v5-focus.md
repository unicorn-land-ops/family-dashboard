# Kiosk v5 "Focus" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the kiosk dashboard to prioritize calendar visibility, photo prominence, and readability — remove the rotating stage, expand calendar to 10 days, switch to always-dark theme, enlarge UI elements, upgrade photo frame styling, and fix travel auto-detection for same-timezone cities.

**Architecture:** The kiosk view (`?view=kiosk`) is a single-column CSS grid in `KioskDashboard.tsx`. Changes are kiosk-only — the default mobile dashboard is untouched. The grid loses its `stage` row, gains more calendar days, and the photo row becomes the sole flex element absorbing remaining space.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind 4, CSS custom properties, Open-Meteo API, date-fns

**Spec:** `docs/2026-04-02-kiosk-v5-focus-design.md`

---

### Task 1: Always-Dark Theme

**Files:**
- Modify: `src/index.css:19-77` (theme token definitions)

- [ ] **Step 1: Replace the root and night/dawn/dusk theme tokens with deeper dark values**

In `src/index.css`, replace the `:root` default block (lines 19-36) with:

```css
:root {
  --fd-bg-1: #141210;
  --fd-bg-2: #1C1816;
  --fd-card-bg: #1C1816;
  --fd-card-border: rgba(255, 255, 255, 0.06);
  --fd-accent: #D4813A;
  --fd-accent-teal: #56BDB0;
  --fd-text-1: #F5F0E8;
  --fd-text-2: #C4B8AC;
  --fd-photo-frame: #1C1816;
  --fd-compact-bg: #2A2420;
  --fd-ticker-bg: #2A2420;
  --fd-divider: #2A2420;
  --fd-shimmer-1: #E8835A;
  --fd-shimmer-2: #D4A43A;
  --fd-shimmer-3: #56BDB0;
  --fd-shimmer-4: #7BA4D9;
}
```

- [ ] **Step 2: Update the night/dawn/dusk phase to match the root (deeper dark)**

Replace the `:root[data-phase="night"], :root[data-phase="dawn"], :root[data-phase="dusk"]` block (lines 38-57) with:

```css
:root[data-phase="night"],
:root[data-phase="dawn"],
:root[data-phase="dusk"] {
  --fd-bg-1: #141210;
  --fd-bg-2: #1C1816;
  --fd-card-bg: #1C1816;
  --fd-card-border: rgba(255, 255, 255, 0.06);
  --fd-accent: #D4813A;
  --fd-accent-teal: #56BDB0;
  --fd-text-1: #F5F0E8;
  --fd-text-2: #C4B8AC;
  --fd-photo-frame: #1C1816;
  --fd-compact-bg: #2A2420;
  --fd-ticker-bg: #2A2420;
  --fd-divider: #2A2420;
  --fd-shimmer-1: #E8835A;
  --fd-shimmer-2: #D4A43A;
  --fd-shimmer-3: #56BDB0;
  --fd-shimmer-4: #7BA4D9;
}
```

- [ ] **Step 3: Update the day/golden phase to the lighter dark values**

Replace the `:root[data-phase="day"], :root[data-phase="golden"]` block (lines 59-77) with:

```css
:root[data-phase="day"],
:root[data-phase="golden"] {
  --fd-bg-1: #1E1A16;
  --fd-bg-2: #2A2420;
  --fd-card-bg: #2A2420;
  --fd-card-border: rgba(255, 255, 255, 0.08);
  --fd-accent: #D4813A;
  --fd-accent-teal: #56BDB0;
  --fd-text-1: #F5F0E8;
  --fd-text-2: #C4B8AC;
  --fd-photo-frame: #2A2420;
  --fd-compact-bg: #3D3530;
  --fd-ticker-bg: #3D3530;
  --fd-divider: #3D3530;
  --fd-shimmer-1: #E8835A;
  --fd-shimmer-2: #D4A43A;
  --fd-shimmer-3: #56BDB0;
  --fd-shimmer-4: #7BA4D9;
}
```

- [ ] **Step 4: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(kiosk): always-dark theme with subtle day/night variation"
```

---

### Task 2: Remove Rotating Stage from Kiosk Grid

**Files:**
- Modify: `src/components/kiosk/KioskDashboard.tsx` (remove stage imports/render)
- Modify: `src/index.css:124-137` (grid template)

- [ ] **Step 1: Update the CSS grid template to remove the stage row**

In `src/index.css`, replace the `.kiosk-grid` block (lines 124-137) with:

```css
.kiosk-grid {
  display: grid;
  grid-template-areas:
    'header'
    'today'
    'next'
    'compact'
    'photo'
    'ticker'
    'status';
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto minmax(200px, 1fr) auto auto;
}
```

- [ ] **Step 2: Remove stage-related imports and rendering from KioskDashboard.tsx**

In `src/components/kiosk/KioskDashboard.tsx`:

Remove these imports (lines 8-12 selectively):
```typescript
import { KioskRotatingStage } from './KioskRotatingStage';
import { KioskPageA } from './KioskPageA';
import { KioskPageB } from './KioskPageB';
```

Remove the `StageSlot` type import:
```typescript
import type { StageSlot } from '../../hooks/useStageRotation';
```

Remove the `prevSlotRef` and `handleSlotChange` code (lines 36-39):
```typescript
  const prevSlotRef = useRef<StageSlot>('life');
  const handleSlotChange = useCallback((slot: StageSlot) => {
    prevSlotRef.current = slot;
  }, []);
```

Remove the `useRef` and `useCallback` from the React import if no longer used:
```typescript
// Change from:
import { useCallback, useRef } from 'react';
// To (if neither is used elsewhere):
import React from 'react';
```

Remove the entire stage ErrorBoundary block (lines 81-96):
```tsx
        <ErrorBoundary FallbackComponent={PanelFallback} onError={logError}>
          <KioskRotatingStage
            cadenceMs={60000}
            onSlotChange={handleSlotChange}
            lifeSlot={...}
            worldSlot={...}
          />
        </ErrorBoundary>
```

- [ ] **Step 3: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds. No references to KioskRotatingStage, KioskPageA, or KioskPageB remain in KioskDashboard.

- [ ] **Step 4: Commit**

```bash
git add src/components/kiosk/KioskDashboard.tsx src/index.css
git commit -m "feat(kiosk): remove rotating stage, simplify grid layout"
```

---

### Task 3: Extend Calendar to 10 Days

**Files:**
- Modify: `src/hooks/useCalendar.ts:49-68` (change `7` to `10`)
- Modify: `src/lib/api/openMeteo.ts:40` (change `forecast_days` to `10`)
- Modify: `src/components/kiosk/KioskDashboard.tsx:33` (update slice)

- [ ] **Step 1: Update useCalendar to return 10 days**

In `src/hooks/useCalendar.ts`, change both instances of `length: 7` to `length: 10`:

Line 51 (empty days fallback):
```typescript
      const emptyDays = Array.from({ length: 10 }, (_, i) => {
```

Line 68 (day schedules):
```typescript
    const daySchedules: DaySchedule[] = Array.from({ length: 10 }, (_, i) => {
```

- [ ] **Step 2: Update Open-Meteo to request 10-day forecast**

In `src/lib/api/openMeteo.ts`, line 40, change:
```typescript
    forecast_days: '7',
```
to:
```typescript
    forecast_days: '10',
```

- [ ] **Step 3: Update KioskDashboard to pass days 4-10 to the compact row**

In `src/components/kiosk/KioskDashboard.tsx`, line 33, change:
```typescript
  const compactDays = days.slice(3, 7);
```
to:
```typescript
  const compactDays = days.slice(3, 10);
```

And update the weather mapping on line 34 to match:
```typescript
  const compactWeather = compactDays.map((_, i) => getDailyWeather(weather, i + 3));
```
(This line stays the same — the `i + 3` offset correctly maps compact day index to weather day index.)

- [ ] **Step 4: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCalendar.ts src/lib/api/openMeteo.ts src/components/kiosk/KioskDashboard.tsx
git commit -m "feat(kiosk): extend calendar to 10 days, request 10-day weather forecast"
```

---

### Task 4: Expand Compact Row to Show Event Names

**Files:**
- Modify: `src/components/kiosk/KioskCompactRow.tsx` (full rewrite of render)
- Modify: `src/index.css` (update `.kiosk-compact-grid` for 7 columns)

- [ ] **Step 1: Update the compact grid CSS for 7 columns**

In `src/index.css`, replace the `.kiosk-compact-grid` rule (lines 386-390):

```css
.kiosk-compact-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(6px, 0.6vw, 10px);
  min-height: 0;
}
```

Update `.kiosk-compact-cell` (lines 392-398):

```css
.kiosk-compact-cell {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.2vw, 3px);
  padding: clamp(6px, 0.5vw, 8px);
  background: var(--fd-compact-bg);
  border-radius: 0.65rem;
  overflow: hidden;
  min-width: 0;
}
```

- [ ] **Step 2: Rewrite KioskCompactRow to show event names**

Replace the full content of `src/components/kiosk/KioskCompactRow.tsx`:

```tsx
import { format } from 'date-fns';
import type { CalendarEvent } from '../../lib/calendar/types';
import { WeatherIcon } from '../weather/WeatherIcon';

const MAX_EVENTS = 3;

interface CompactDay {
  date: Date;
  dateStr: string;
  events: CalendarEvent[];
}

interface KioskCompactRowProps {
  days: CompactDay[];
  dailyWeather: Array<{
    high: number;
    low: number;
    weatherCode: number;
  } | null>;
}

function CompactEvent({ event }: { event: CalendarEvent }) {
  const emoji = event.persons[0]
    ? undefined // person emoji is already in the summary for kiosk
    : undefined;
  const personEmojis = event.persons
    .filter((p) => p !== 'family')
    .slice(0, 2);

  return (
    <div
      className="truncate"
      style={{
        fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)',
        color: 'var(--fd-text-2)',
        lineHeight: 1.3,
      }}
      title={event.summary}
    >
      {event.summary}
    </div>
  );
}

export function KioskCompactRow({ days, dailyWeather }: KioskCompactRowProps) {
  return (
    <div className="kiosk-compact-grid">
      {days.map((day, i) => {
        const dayAbbrev = format(day.date, 'EEE');
        const dateNum = format(day.date, 'd');
        const weather = dailyWeather[i];
        const visibleEvents = day.events.slice(0, MAX_EVENTS);
        const extraCount = day.events.length - MAX_EVENTS;

        return (
          <div key={day.dateStr} className="kiosk-compact-cell">
            {/* Day header: abbrev + date */}
            <div className="flex items-baseline justify-between">
              <span
                style={{
                  fontSize: 'clamp(0.9rem, 1.1vw, 1.15rem)',
                  fontWeight: 600,
                  color: 'var(--fd-text-1)',
                }}
              >
                {dayAbbrev}
              </span>
              <span
                style={{
                  fontSize: 'clamp(0.75rem, 0.9vw, 0.95rem)',
                  color: 'var(--fd-text-2)',
                  opacity: 0.7,
                }}
              >
                {dateNum}
              </span>
            </div>

            {/* Weather */}
            {weather && (
              <div
                className="flex items-center gap-0.5"
                style={{
                  fontSize: 'clamp(0.7rem, 0.85vw, 0.9rem)',
                  color: 'var(--fd-accent)',
                }}
              >
                <WeatherIcon
                  code={weather.weatherCode}
                  size="clamp(0.9rem, 1vw, 1.1rem)"
                />
                <span className="tabular-nums font-medium">
                  {Math.round(weather.high)}&deg;
                </span>
                <span
                  className="tabular-nums"
                  style={{ color: 'var(--fd-text-2)', opacity: 0.6 }}
                >
                  {Math.round(weather.low)}&deg;
                </span>
              </div>
            )}

            {/* Events */}
            {visibleEvents.length > 0 ? (
              <div className="flex flex-col gap-px mt-0.5">
                {visibleEvents.map((event) => (
                  <CompactEvent key={event.id} event={event} />
                ))}
                {extraCount > 0 && (
                  <span
                    style={{
                      fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)',
                      color: 'var(--fd-text-2)',
                      opacity: 0.5,
                    }}
                  >
                    +{extraCount} more
                  </span>
                )}
              </div>
            ) : (
              <span
                style={{
                  fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)',
                  color: 'var(--fd-text-2)',
                  opacity: 0.35,
                  fontStyle: 'italic',
                }}
              >
                Free
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/kiosk/KioskCompactRow.tsx src/index.css
git commit -m "feat(kiosk): compact row shows 7 days with event names"
```

---

### Task 5: Header Size Bump (~30-40%)

**Files:**
- Modify: `src/components/clock/Clock.tsx` (scale kiosk font sizes)
- Modify: `src/components/clock/DateDisplay.tsx` (scale kiosk font size)
- Modify: `src/components/weather/CurrentWeather.tsx` (scale kiosk font sizes)
- Modify: `src/components/weather/SunTimes.tsx` (scale kiosk font sizes)

- [ ] **Step 1: Scale up Clock kiosk sizes**

In `src/components/clock/Clock.tsx`:

Main clock (line 35-36), change:
```typescript
          fontSize: isKiosk
            ? 'clamp(4rem, 12vw, 11rem)'
```
to:
```typescript
          fontSize: isKiosk
            ? 'clamp(5.5rem, 15vw, 14rem)'
```

Travel location label (line 49-50), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.7rem,1vw,0.95rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.95rem,1.35vw,1.3rem)'
```

Travel time (line 59-60), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.9rem,1.3vw,1.2rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(1.2rem,1.7vw,1.6rem)'
```

- [ ] **Step 2: Scale up DateDisplay kiosk size**

In `src/components/clock/DateDisplay.tsx`, line 20-21, change:
```typescript
        fontSize: isKiosk
          ? 'clamp(1.2rem, 1.8vw, 1.8rem)'
```
to:
```typescript
        fontSize: isKiosk
          ? 'clamp(1.6rem, 2.4vw, 2.4rem)'
```

- [ ] **Step 3: Scale up CurrentWeather kiosk sizes**

In `src/components/weather/CurrentWeather.tsx`:

Weather icon (lines 73-74), change:
```typescript
              ? 'clamp(2.2rem, 3.6vw, 4rem)'
```
to:
```typescript
              ? 'clamp(3rem, 4.8vw, 5.5rem)'
```

Temperature (lines 83-84), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(2.3rem, 3.8vw, 4.2rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(3rem, 5vw, 5.5rem)'
```

Weather description (lines 93-94), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.86rem,1.25vw,1.1rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(1.15rem,1.7vw,1.5rem)'
```

Travel weather icon (lines 110-111), change:
```typescript
              ? 'clamp(1rem, 1.4vw, 1.4rem)'
```
to:
```typescript
              ? 'clamp(1.3rem, 1.9vw, 1.9rem)'
```

Travel temp (lines 119-120), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.8rem, 1.1vw, 1rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(1.05rem, 1.5vw, 1.35rem)'
```

Travel location name (lines 129-130), change:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.65rem, 0.9vw, 0.85rem)'
```
to:
```typescript
              fontSize: isKiosk
                ? 'clamp(0.85rem, 1.2vw, 1.15rem)'
```

- [ ] **Step 4: Scale up SunTimes kiosk sizes**

In `src/components/weather/SunTimes.tsx`:

Container font size (lines 38-39), change:
```typescript
        fontSize: isKiosk
          ? 'clamp(0.82rem,1.18vw,1.02rem)'
```
to:
```typescript
        fontSize: isKiosk
          ? 'clamp(1.1rem,1.6vw,1.4rem)'
```

Sunrise/sunset icon sizes (line 46 and similar), change both:
```typescript
          size={isKiosk ? 'clamp(1.2rem,1.8vw,1.9rem)' : 'clamp(1rem, 1.5vw, 1.5rem)'}
```
to:
```typescript
          size={isKiosk ? 'clamp(1.6rem,2.4vw,2.5rem)' : 'clamp(1rem, 1.5vw, 1.5rem)'}
```

(Apply to both the `WiSunrise` and `WiSunset` icon size props.)

- [ ] **Step 5: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/clock/Clock.tsx src/components/clock/DateDisplay.tsx src/components/weather/CurrentWeather.tsx src/components/weather/SunTimes.tsx
git commit -m "feat(kiosk): scale up header elements ~35% for distance readability"
```

---

### Task 6: News Ticker Size Bump

**Files:**
- Modify: `src/index.css` (ticker CSS rules)

- [ ] **Step 1: Scale up ticker container, carousel, and slide sizes**

In `src/index.css`, update the ticker CSS rules:

Replace `.ticker-container` (lines 288-293):
```css
.ticker-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  background: var(--fd-ticker-bg);
  border-radius: 0.75rem;
  padding: 0.85rem 1.2rem;
}
```

Replace `.ticker-carousel` (lines 295-298):
```css
.ticker-carousel {
  position: relative;
  height: 2.1em;
  overflow: hidden;
}
```

Replace `.ticker-slide` (lines 300-312):
```css
.ticker-slide {
  height: 2.1em;
  line-height: 2.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1.3rem, 1.8vw, 1.6rem);
  color: var(--fd-text-1);
  font-family: 'Outfit', sans-serif;
  letter-spacing: 0.01em;
  will-change: transform;
}
```

Replace `.ticker-accent-pip` (lines 320-328):
```css
.ticker-accent-pip {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--fd-accent);
  margin-right: 0.5em;
  vertical-align: middle;
}
```

- [ ] **Step 2: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(kiosk): scale up news ticker ~35% for distance readability"
```

---

### Task 7: Photo Frame — Framed Print Treatment

**Files:**
- Modify: `src/index.css` (photo frame CSS rules)

- [ ] **Step 1: Update photo frame CSS for framed print look**

In `src/index.css`, replace `.kiosk-gallery-frame` (lines 206-212):

```css
.kiosk-gallery-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: clamp(8px, 1vw, 16px);
}
```

Replace `.kiosk-gallery-photo` (lines 214-223):

```css
.kiosk-gallery-photo {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.5),
    0 1px 4px rgba(0, 0, 0, 0.3);
  background: transparent;
  padding: 0;
}
```

Replace `.kiosk-gallery-photo .photo-frame` (lines 225-227):

```css
.kiosk-gallery-photo .photo-frame {
  border-radius: 0.5rem;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.2);
}
```

- [ ] **Step 2: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(kiosk): framed print photo treatment — shadow + thin border"
```

---

### Task 8: Fix Travel Auto-Detection for Same-Timezone Cities

**Files:**
- Modify: `src/hooks/useAutoTravelTarget.ts:121-149` (resolveTravelTarget function)

- [ ] **Step 1: Fix resolveTravelTarget to not require timezone difference**

In `src/hooks/useAutoTravelTarget.ts`, replace the `resolveTravelTarget` function (lines 121-150):

```typescript
async function resolveTravelTarget(candidates: TravelCandidate[]): Promise<TravelTarget | null> {
  for (const candidate of candidates.slice(0, 12)) {
    const results = await geocodeLocation(candidate.query);
    if (results.length === 0) continue;

    const selected = results[0];
    if (!selected) continue;

    // Skip if the location is in the home area (Berlin/Germany)
    if (isHomeArea(candidate.query) || isHomeArea(selected.name)) {
      continue;
    }

    const person = candidate.personId
      ? CALENDAR_FEEDS.find((feed) => feed.id === candidate.personId)
      : null;
    const who = person ? `${person.emoji} ${person.name}` : 'Travel';
    const where = selected.country ? `${selected.name}, ${selected.country}` : selected.name;

    return {
      id: `auto-${candidate.personId ?? 'unknown'}-${candidate.query.toLowerCase()}`,
      label: `${who} (${where})`,
      timezone: selected.timezone,
      latitude: selected.latitude,
      longitude: selected.longitude,
    };
  }

  return null;
}
```

Key changes:
- Removed `results.find((result) => result.timezone !== HOME_TIMEZONE) ?? results[0]` — now always uses `results[0]`
- Removed the `selected.timezone === HOME_TIMEZONE && isHomeArea(candidate.query)` check — replaced with a simpler `isHomeArea` guard on both the candidate query and the geocoded name
- Paris, Amsterdam, Rome, Warsaw etc. will now correctly trigger travel weather display

- [ ] **Step 2: Build and verify**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAutoTravelTarget.ts
git commit -m "fix(travel): detect same-timezone travel (Paris, Amsterdam, etc.)"
```

---

### Task 9: Final Build Verification

- [ ] **Step 1: Full build**

Run: `cd family-dashboard-code && npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Visual check list**

Open the dev server and verify at `?view=kiosk`:

Run: `cd family-dashboard-code && npm run dev`

Check:
- [ ] Dark theme active at all times of day (no bright cream)
- [ ] No rotating stage visible
- [ ] Today hero card shows full events
- [ ] Days 2-3 show medium cards with events
- [ ] Days 4-10 show in compact grid with event names
- [ ] Photo frame fills remaining vertical space
- [ ] Photo has subtle shadow + thin border (no colored mat)
- [ ] Clock, date, weather, sun times are visibly larger
- [ ] News ticker text is readable
- [ ] If a travel event exists, travel weather appears for same-timezone cities
