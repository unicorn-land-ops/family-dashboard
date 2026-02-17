# Phase 12: Calendar Polish - Research

**Researched:** 2026-02-17
**Domain:** React component refactoring (CSS/layout + config changes)
**Confidence:** HIGH

## Summary

Phase 12 is a focused UI polish phase requiring three specific changes to the existing calendar components. The codebase already has all the infrastructure in place -- person-to-feed mapping, emoji config, weather data per day, and a well-structured component hierarchy (`CalendarPanel > DayRow > EventCard`). The changes are config updates and layout adjustments, not new features.

The three changes are: (1) update person emojis in `config.ts` to match the family's preferred set, (2) move person emoji badges from after the event name to before it in `EventCard.tsx`, and (3) relocate the `WeatherBadge` from the day header row to a separate row underneath it in `DayRow.tsx`.

**Primary recommendation:** This is pure component refactoring with no new dependencies. Update config, rearrange JSX, adjust Tailwind classes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-02 | Calendar events show correct person emoji (avocado Papa, cookie Daddy, cherry blossom Wren, mango Ellis, house Family) | Current `config.ts` uses different emojis (man, man+red-hair, eagle, star, family-unit). Change the `emoji` field for each `PersonConfig` entry. |
| CALL-01 | Weather info (temp, icon) displays underneath the day header, not inline with events | Current `DayRow.tsx` renders `WeatherBadge` inline in the header flex row (line 45-50). Move it to its own row below the header div. |
| CALL-02 | Person emoji badge precedes each event name in the calendar row | Current `EventCard.tsx` renders person badges AFTER the summary (lines 63-77). Move the badge div BEFORE the summary div. |
</phase_requirements>

## Standard Stack

### Core (already installed, no new dependencies)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | existing | Component framework | No changes needed |
| Tailwind CSS | existing | Styling/layout | No changes needed |
| date-fns / date-fns-tz | existing | Date formatting | No changes needed |

### Supporting

No new libraries required. All changes use existing project infrastructure.

## Architecture Patterns

### Current Component Hierarchy (no changes to structure)
```
CalendarPanel
  -> DayRow (per day, receives DaySchedule + weather)
       -> WeatherBadge (weather icon + temps)
       -> EventCard (per event, receives CalendarEvent)
```

### Current Data Flow (no changes needed)
```
config.ts (CALENDAR_FEEDS with PersonConfig[])
  -> useCalendar hook (fetches all feeds, parses, deduplicates, filters)
    -> CalendarPanel (receives DaySchedule[])
      -> DayRow (groups events by day, attaches weather from useWeather)
        -> EventCard (looks up person emoji via CALENDAR_FEEDS)
```

### Pattern 1: Emoji Config Update
**What:** Change the `emoji` field in each `PersonConfig` in `config.ts`
**Current vs Required:**

| Person | Current Emoji | Required Emoji | Unicode |
|--------|--------------|----------------|---------|
| Papa | `\u{1F468}` (man) | avocado | `\u{1F951}` |
| Daddy | `\u{1F468}\u{200D}\u{1F9B0}` (red-hair man) | cookie | `\u{1F36A}` |
| Wren | `\u{1F985}` (eagle) | cherry blossom | `\u{1F338}` |
| Ellis | `\u{1F31F}` (star) | mango | `\u{1F96D}` |
| Family | `\u{1F468}\u{200D}...` (family unit) | house | `\u{1F3E0}` |

**Key insight:** The `emoji` field is ONLY used for display in `EventCard.tsx`. Changing it has zero side effects on calendar parsing, dedup, or filtering -- those all use the `id` field.

### Pattern 2: Badge Position Swap (EventCard.tsx)
**What:** Move person emoji badges from right side (after summary) to left side (before summary, after time column)
**Current layout:** `[Time] [Summary...] [Emoji]`
**Required layout:** `[Time] [Emoji] [Summary...]`

```tsx
// Current order in EventCard JSX:
// 1. Time column (div with shrink-0)
// 2. Summary (div with flex-1)
// 3. Person badges (div with shrink-0)  <-- MOVE THIS

// Required order:
// 1. Time column (div with shrink-0)
// 2. Person badges (div with shrink-0)  <-- HERE
// 3. Summary (div with flex-1)
```

### Pattern 3: Weather Row Relocation (DayRow.tsx)
**What:** Move `WeatherBadge` from inline in the day header to its own row below
**Current structure:**
```tsx
<div className="flex items-baseline justify-between">
  <div> {/* day label + date */} </div>
  {dailyWeather && <WeatherBadge ... />}  {/* INLINE with header */}
</div>
```
**Required structure:**
```tsx
<div className="flex items-baseline gap-2">
  <div> {/* day label + date */} </div>
</div>
{dailyWeather && (
  <div className="px-1 mt-0.5 mb-1">  {/* BELOW header, own row */}
    <WeatherBadge ... />
  </div>
)}
```

### Anti-Patterns to Avoid
- **Adding new components for this:** No new files needed. All changes happen within existing `config.ts`, `EventCard.tsx`, and `DayRow.tsx`.
- **Breaking the clamp() sizing system:** The existing responsive sizing uses `clamp()` everywhere. New elements must follow the same pattern.
- **Touching the data pipeline:** No changes to `parser.ts`, `dedup.ts`, `filters.ts`, `useCalendar.ts`, or `calendarFetch.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Emoji rendering | Custom emoji sprite system | Native Unicode emoji | Already works, all target devices support these emoji |
| Weather row layout | New WeatherRow component | Move existing WeatherBadge in DayRow JSX | WeatherBadge component is fine as-is |

## Common Pitfalls

### Pitfall 1: Emoji Rendering Differences Across Devices
**What goes wrong:** Emoji look different on Raspberry Pi (Chromium/Linux) vs iPhone (iOS)
**Why it happens:** Each OS has its own emoji font
**How to avoid:** Use simple, widely-supported emoji (avocado, cookie, cherry blossom, mango, house are all standard). Test on the wall display after deploying.
**Warning signs:** Emoji appear as boxes or question marks on the Pi

### Pitfall 2: Breaking Responsive Layout
**What goes wrong:** Moving badge before summary could cause text truncation issues on narrow screens
**Why it happens:** The emoji badge div takes up space before the flex-1 summary
**How to avoid:** Keep badge div as `shrink-0` with small fixed width. The summary already has `truncate` and `min-w-0` classes which handle overflow correctly.
**Warning signs:** Event names cut off too aggressively on mobile

### Pitfall 3: Weather Row Adding Too Much Vertical Space
**What goes wrong:** Moving weather to its own row increases the vertical space per day, potentially pushing day 7 off-screen on the kiosk
**Why it happens:** Each day now has an extra row of content
**How to avoid:** Use tight spacing (`mt-0.5 mb-0.5`) and small font size matching the existing WeatherBadge sizing. Consider only showing weather for the next 4-5 days to save space.
**Warning signs:** Last days of the week are not visible without scrolling on the wall display

### Pitfall 4: Forgetting Unicode Escapes
**What goes wrong:** Pasting emoji directly into source could cause encoding issues in some editors/build tools
**Why it happens:** The existing code uses Unicode escapes (`\u{1F468}`) rather than raw emoji characters
**How to avoid:** Follow the existing pattern -- use Unicode escape sequences in `config.ts`

## Code Examples

### Config Update (config.ts)
```typescript
// Source: current codebase pattern
export const CALENDAR_FEEDS: PersonConfig[] = [
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',  // avocado (was \u{1F468} man)
    calendarUrl: import.meta.env.VITE_CAL_PAPA ?? '',
    isWorkCalendar: true,
  },
  {
    id: 'daddy',
    name: 'Daddy',
    emoji: '\u{1F36A}',  // cookie (was \u{1F468}\u{200D}\u{1F9B0} red-hair man)
    calendarUrl: import.meta.env.VITE_CAL_DADDY ?? '',
  },
  {
    id: 'wren',
    name: 'Wren',
    emoji: '\u{1F338}',  // cherry blossom (was \u{1F985} eagle)
    calendarUrl: import.meta.env.VITE_CAL_WREN ?? '',
  },
  {
    id: 'ellis',
    name: 'Ellis',
    emoji: '\u{1F96D}',  // mango (was \u{1F31F} star)
    calendarUrl: import.meta.env.VITE_CAL_ELLIS ?? '',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '\u{1F3E0}',  // house (was family-unit emoji)
    calendarUrl: import.meta.env.VITE_CAL_FAMILY ?? '',
  },
];
```

### Badge Position Swap (EventCard.tsx)
```tsx
// Move person badges div BEFORE summary div:
return (
  <div className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${...}`}>
    {/* Time column - unchanged */}
    <div className="shrink-0 w-[clamp(40px,4vw,60px)] ...">
      {/* ... time display unchanged ... */}
    </div>

    {/* Person badges - MOVED BEFORE summary */}
    <div className="flex gap-0.5 shrink-0">
      {personConfigs.map((p) => p && (
        <span key={p.id} title={p.name} className="text-[clamp(12px,0.9vw,16px)]">
          {p.emoji}
        </span>
      ))}
    </div>

    {/* Summary - unchanged, still flex-1 */}
    <div className="flex-1 min-w-0 text-[clamp(12px,0.9vw,15px)] leading-snug truncate">
      {event.summary}
    </div>
  </div>
);
```

### Weather Row Relocation (DayRow.tsx)
```tsx
return (
  <div className={`py-[clamp(6px,0.5vw,12px)] ${today ? 'day-today' : ''}`}>
    {/* Day header - remove WeatherBadge from here */}
    <div className="flex items-baseline gap-2 px-1 mb-0.5">
      <span className={`text-[clamp(13px,1vw,16px)] font-semibold ${
        today ? 'text-accent-gold' : 'text-text-primary'
      }`}>
        {dayLabel}
      </span>
      <span className="text-[clamp(11px,0.8vw,13px)] text-text-secondary">
        {dateLabel}
      </span>
    </div>

    {/* Weather row - NEW location, underneath header */}
    {dailyWeather && (
      <div className="px-1 mb-1">
        <WeatherBadge
          high={dailyWeather.high}
          low={dailyWeather.low}
          weatherCode={dailyWeather.weatherCode}
        />
      </div>
    )}

    {/* Events - unchanged */}
    {day.events.length > 0 ? (
      <div className="flex flex-col gap-0.5">
        {day.events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    ) : (
      <div className="px-2 py-1 text-[clamp(11px,0.8vw,13px)] text-text-secondary opacity-50">
        No events
      </div>
    )}

    {/* Separator - unchanged */}
    <div className="mt-[clamp(6px,0.5vw,12px)] border-b border-white/[0.06]" />
  </div>
);
```

## State of the Art

No changes in this domain. This is pure layout refactoring within an existing, stable React + Tailwind codebase.

## Open Questions

1. **Emoji font on Raspberry Pi / Chromium Linux**
   - What we know: Standard emoji should render. The original emoji (man, eagle, star) presumably worked.
   - What's unclear: Whether avocado/mango/cherry-blossom are in the Pi's emoji font
   - Recommendation: Deploy and visually verify. If missing, install `fonts-noto-color-emoji` on the Pi.

2. **Vertical space budget on wall display**
   - What we know: Moving weather to its own row adds ~20px per day. Over 7 days that is ~140px extra.
   - What's unclear: Whether the calendar panel already scrolls or needs to fit everything visible.
   - Recommendation: The panel already has `overflow-y-auto scrollbar-hide` on CalendarPanel, so scrolling is supported. Keep spacing tight.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all calendar-related files:
  - `src/lib/calendar/config.ts` - PersonConfig with emoji definitions
  - `src/lib/calendar/types.ts` - CalendarEvent and DaySchedule interfaces
  - `src/lib/calendar/parser.ts` - ICS parsing with person assignment
  - `src/lib/calendar/dedup.ts` - Event deduplication with person merging
  - `src/lib/calendar/filters.ts` - Work-hours filtering
  - `src/hooks/useCalendar.ts` - Calendar data hook
  - `src/components/calendar/CalendarPanel.tsx` - Top-level calendar component
  - `src/components/calendar/DayRow.tsx` - Day row with weather badge
  - `src/components/calendar/EventCard.tsx` - Event card with person badges
  - `src/components/calendar/WeatherBadge.tsx` - Weather display component

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all changes in existing code
- Architecture: HIGH - direct codebase inspection, exact line numbers identified
- Pitfalls: HIGH - straightforward UI changes with well-understood edge cases

**Research date:** 2026-02-17
**Valid until:** Indefinite (no external dependencies or API changes)
