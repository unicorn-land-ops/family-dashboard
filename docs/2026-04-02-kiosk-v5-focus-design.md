# Kiosk v5 "Focus" — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Summary

Overhaul the kiosk dashboard to focus on what matters: calendar visibility, photo prominence, and readability. Remove the rotating stage panels (horoscopes, transit, country, countdowns, groceries, chores) — hidden, not deleted. Switch to an always-dark theme. Fix travel auto-detection for same-timezone destinations.

## Changes

### 1. Layout — Remove Stage, Expand Calendar + Photo

The kiosk grid becomes (top to bottom, portrait 1080x1920):

| Row | Content | Grid sizing |
|-----|---------|-------------|
| Header | Clock, date, weather, sun times, travel | `auto` |
| Today | Hero card — accent border, full event list | `auto` |
| Days 2-3 | Two medium cards side-by-side with events | `auto` |
| Days 4-10 | 7-cell grid with day, date, weather, event names | `auto` |
| Photo | Framed photo with crossfade rotation | `minmax(200px, 1fr)` |
| Ticker | News headline carousel | `auto` |
| Status | Status bar | `auto` |

The `stage` row is removed. Photo is the sole `1fr` row — it absorbs all remaining vertical space.

**CSS grid template:**
```
grid-template-areas:
  'header'
  'today'
  'next'
  'compact'
  'photo'
  'ticker'
  'status';
grid-template-rows: auto auto auto auto minmax(200px, 1fr) auto auto;
```

### 2. Calendar — Days 4-10 Expanded Compact Row

Replace the current 4-cell compact row (days 4-7, shows only day name + weather icon + event count) with a 7-cell grid (days 4-10).

Each cell shows:
- **Day abbreviation + date number** (e.g. "Mon 7")
- **Weather icon + high/low temps**
- **First 2-3 event summaries** — truncated with ellipsis, prefixed with person emoji

Layout: 7 equal columns. If 7 columns proves too cramped at 1080px width during implementation, fall back to a 4+3 wrapped layout (two rows).

**Data change:** `useCalendar` currently returns 7 days. Extend to return 10 days. The `useWeather` Open-Meteo call already returns 7 days of forecast by default — extend to 10 (`forecast_days=10` parameter).

### 3. Theme — Always Dark with Subtle Time-of-Day Variation

Remove the bright cream theme entirely. Both phases are dark, with night being slightly deeper.

**Night / dawn / dusk (darker):**
```css
--fd-bg-1: #141210;
--fd-bg-2: #1C1816;
--fd-card-bg: #1C1816;
--fd-card-border: rgba(255, 255, 255, 0.06);
--fd-text-1: #F5F0E8;
--fd-text-2: #C4B8AC;
--fd-photo-frame: #1C1816;
--fd-compact-bg: #2A2420;
--fd-ticker-bg: #2A2420;
--fd-divider: #2A2420;
```

**Day / golden (lighter dark):**
```css
--fd-bg-1: #1E1A16;
--fd-bg-2: #2A2420;
--fd-card-bg: #2A2420;
--fd-card-border: rgba(255, 255, 255, 0.08);
--fd-text-1: #F5F0E8;
--fd-text-2: #C4B8AC;
--fd-photo-frame: #2A2420;
--fd-compact-bg: #3D3530;
--fd-ticker-bg: #3D3530;
--fd-divider: #3D3530;
```

The `:root` default and the `night/dawn/dusk` phase all use the deeper dark values. Accent colors, shimmer colors unchanged.

### 4. Header — 30-40% Size Bump

Scale up `clamp()` values for all header elements. No layout changes — same flexbox with clock+date on left, weather+sun on right.

Target sizes (approximate, will tune during implementation):
- Clock: bump from current range to ~30-40% larger
- Date: proportional bump
- Weather temp + icon: proportional bump
- Sun times: proportional bump

### 5. Photo Frame — Framed Print Treatment

Replace the current flat colored mat (`var(--fd-photo-frame)` background + thick padding) with a subtle framed print look:

```css
.kiosk-gallery-photo {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.5),
    0 1px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  /* Remove the thick colored padding/mat */
  padding: 0;
  background: transparent;
}

.kiosk-gallery-photo .photo-frame {
  /* Inner vignette for depth */
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.2);
}
```

The photo fills its container edge-to-edge (minus the thin border), with a soft shadow giving it depth against the dark background.

### 6. News Ticker — Size Bump

The ticker text is currently `clamp(1rem, 1.3vw, 1.2rem)` (16-19px) — unreadable from across the room. Scale it up to match the overall 30-40% size increase applied to the rest of the kiosk. Bump the container padding and carousel line-height proportionally.

Target: `clamp(1.3rem, 1.8vw, 1.6rem)` or similar — tuned during implementation for readability at 6-10 feet alongside the other enlarged elements.

### 7. Travel Auto-Detection Fix

**File:** `src/hooks/useAutoTravelTarget.ts`

**Bug:** The `resolveTravelTarget` function (line ~127) selects a geocoded result only if its timezone differs from `HOME_TIMEZONE`. Same-timezone cities (Paris, Amsterdam, Rome, Warsaw, etc.) are skipped.

**Fix:** Remove the timezone-difference requirement. The travel signal should be:
1. Calendar event has travel keywords (flight, trip, hotel, conference, etc.) OR has a non-home location
2. Geocoded location is not in the home area (Berlin/Germany) per `isHomeArea()`

Specifically in `resolveTravelTarget`:
- Remove: `results.find((result) => result.timezone !== HOME_TIMEZONE)`
- Replace with: select the first geocoded result
- Keep the `isHomeArea` skip (so "Meeting in Berlin" doesn't trigger travel)

### Hidden Components (Not Deleted)

These are removed from the kiosk render but remain in the codebase for future re-enablement:

**Components:**
- `KioskRotatingStage`
- `KioskPageA` (life: countdowns, groceries, chores)
- `KioskPageB` (world: horoscopes, transit, country)

**Hooks (no longer imported by kiosk):**
- `useStageRotation`
- `useContentRotation`
- `useHoroscope`
- `useCountryOfDay`
- `useBvgDepartures`

The default (mobile) dashboard view is unchanged — only the kiosk view is affected.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/kiosk/KioskDashboard.tsx` | Remove stage, extend compact row to days 4-10 |
| `src/components/kiosk/KioskCompactRow.tsx` | Show 7 days with event names instead of 4 days with counts |
| `src/index.css` | Update grid template, theme tokens, photo frame styles |
| `src/hooks/useCalendar.ts` | Return 10 days instead of 7 |
| `src/hooks/useWeather.ts` | Request 10-day forecast from Open-Meteo |
| `src/hooks/useAutoTravelTarget.ts` | Fix same-timezone travel detection |
| `src/components/layout/Header.tsx` | Scale up clamp values (or child components) |
| `src/components/clock/Clock.tsx` | Larger font sizes |
| `src/components/clock/DateDisplay.tsx` | Larger font sizes |
| `src/components/weather/CurrentWeather.tsx` | Larger font sizes |
| `src/components/weather/SunTimes.tsx` | Larger font sizes |
| `src/components/kiosk/KioskNewsTicker.tsx` | Larger font/padding (if component has inline styles) |

## Not Changing

- Default (mobile) dashboard view
- News ticker behavior (slide-up carousel, 8s per headline)
- Photo rotation cadence (5 min) and crossfade (1.8s)
- Supabase realtime subscriptions
- Error boundaries
- Service worker caching
- GitHub Actions deploy pipeline
