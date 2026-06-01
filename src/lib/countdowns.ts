/**
 * countdowns.ts — Family milestone countdown config + logic
 *
 * Exports:
 *   - CountdownEvent         — interface for a countdown entry
 *   - computeEaster(year)    — Anonymous Gregorian algorithm (Meeus-Jones-Butcher)
 *   - getUpcomingCountdowns  — filter + sort + limit upcoming events
 *   - COUNTDOWN_EVENTS       — static config: Easter, Berlin school holidays, family events
 */

import { differenceInDays, startOfDay } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CountdownEvent {
  id: string;
  emoji: string;
  label: string;
  date: Date;
}

export type CountdownWithDays = CountdownEvent & { daysRemaining: number };

// ---------------------------------------------------------------------------
// Easter algorithm
// Anonymous Gregorian algorithm (Meeus-Jones-Butcher)
// Source: https://en.wikipedia.org/wiki/Date_of_Easter#Anonymous_Gregorian_algorithm
// Valid for Gregorian calendar years 1583–4099
// Spot-check: 2025 = April 20, 2026 = April 5, 2027 = March 28
// ---------------------------------------------------------------------------

export function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day); // month - 1 for JS 0-indexed months
}

// ---------------------------------------------------------------------------
// Sorting / filtering logic
// ---------------------------------------------------------------------------

/**
 * Returns events sorted ascending by days remaining, filtered to >= 0.
 * Accepts optional `now` parameter for deterministic testing.
 *
 * Uses differenceInDays(startOfDay(target), startOfDay(now)) — DST-safe.
 * Returns daysRemaining = 0 for same-day events (displayed as "TODAY").
 */
export function getUpcomingCountdowns(
  events: CountdownEvent[],
  count = 4,
  now: Date = new Date(),
): CountdownWithDays[] {
  const todayStart = startOfDay(now);

  return events
    .map((event) => ({
      ...event,
      daysRemaining: differenceInDays(startOfDay(event.date), todayStart),
    }))
    .filter((event) => event.daysRemaining >= 0) // exclude past events
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, count);
}

// ---------------------------------------------------------------------------
// Config: Berlin school milestones
// Source: https://www.berlin.de/en/tourism/travel-information/1887651-2862820-public-holidays-school-holidays.en.html
// Summer Break: Jul 9 – Aug 22, 2026 → School starts Aug 24, 2026
// ---------------------------------------------------------------------------

const BERLIN_SCHOOL_EVENTS: CountdownEvent[] = [
  {
    id: 'berlin-summer-2026',
    emoji: '\u2600\uFE0F', // ☀️
    label: 'Summer Break',
    date: new Date('2026-07-09'), // Jul 9, 2026
  },
  {
    id: 'berlin-school-starts-2026',
    emoji: '\u{1F4DA}', // 📚
    label: 'School Starts',
    date: new Date('2026-08-24'), // Aug 24, 2026
  },
];

// ---------------------------------------------------------------------------
// Config: Family birthdays & annual events
// Person emoji mapping (matches calendar config):
//   🍪 Daddy  \u{1F36A}
//   🥑 Papa   \u{1F951}
//   🥭 Ellis  \u{1F96D}
//   🌸 Wren   \u{1F338}
// ---------------------------------------------------------------------------

const YEAR = new Date().getFullYear();
const NEXT_YEAR = YEAR + 1;

// Annual family events — update year in ID each January
const FAMILY_EVENTS: CountdownEvent[] = [
  // Birthdays (annual — date recalculated each year based on YEAR/NEXT_YEAR)
  {
    id: `daddy-birthday-${YEAR}`,
    emoji: '\u{1F36A}', // 🍪
    label: "Daddy's Birthday",
    date: new Date(`${YEAR}-01-03`), // Jan 3
  },
  {
    id: `daddy-birthday-${NEXT_YEAR}`,
    emoji: '\u{1F36A}', // 🍪
    label: "Daddy's Birthday",
    date: new Date(`${NEXT_YEAR}-01-03`), // Jan 3 (next year)
  },
  {
    id: `wren-birthday-${YEAR}`,
    emoji: '\u{1F338}', // 🌸
    label: "Wren's Birthday",
    date: new Date(`${YEAR}-01-19`), // Jan 19
  },
  {
    id: `wren-birthday-${NEXT_YEAR}`,
    emoji: '\u{1F338}', // 🌸
    label: "Wren's Birthday",
    date: new Date(`${NEXT_YEAR}-01-19`), // Jan 19 (next year)
  },
  {
    id: `ellis-birthday-${YEAR}`,
    emoji: '\u{1F96D}', // 🥭
    label: "Ellis' Birthday",
    date: new Date(`${YEAR}-02-10`), // Feb 10
  },
  {
    id: `ellis-birthday-${NEXT_YEAR}`,
    emoji: '\u{1F96D}', // 🥭
    label: "Ellis' Birthday",
    date: new Date(`${NEXT_YEAR}-02-10`), // Feb 10 (next year)
  },
  {
    id: `papa-birthday-${YEAR}`,
    emoji: '\u{1F951}', // 🥑
    label: "Papa's Birthday",
    date: new Date(`${YEAR}-12-05`), // Dec 5
  },
  {
    id: `papa-birthday-${NEXT_YEAR}`,
    emoji: '\u{1F951}', // 🥑
    label: "Papa's Birthday",
    date: new Date(`${NEXT_YEAR}-12-05`), // Dec 5 (next year)
  },
  // Annual holidays
  {
    id: `halloween-${YEAR}`,
    emoji: '\u{1F383}', // 🎃
    label: 'Halloween',
    date: new Date(`${YEAR}-10-31`), // Oct 31
  },
  {
    id: `halloween-${NEXT_YEAR}`,
    emoji: '\u{1F383}', // 🎃
    label: 'Halloween',
    date: new Date(`${NEXT_YEAR}-10-31`), // Oct 31 (next year)
  },
  {
    id: `christmas-${YEAR}`,
    emoji: '\u{1F384}', // 🎄
    label: 'Christmas',
    date: new Date(`${YEAR}-12-25`), // Dec 25
  },
  {
    id: `christmas-${NEXT_YEAR}`,
    emoji: '\u{1F384}', // 🎄
    label: 'Christmas',
    date: new Date(`${NEXT_YEAR}-12-25`), // Dec 25 (next year)
  },
];

// ---------------------------------------------------------------------------
// Config: One-off camps & trips — specific dates, not annual.
// Remove or update each entry once the date has passed.
// ---------------------------------------------------------------------------

const CAMP_EVENTS: CountdownEvent[] = [
  {
    id: 'ellis-horse-camp-2026',
    emoji: '\u{1F434}', // 🐴
    label: 'Horse Camp',
    date: new Date('2026-07-18'), // iCanDo "Reiten auf dem Schloss", 18–25 Jul 2026
  },
  {
    id: 'ellis-beach-camp-2026',
    emoji: '\u{1F3D6}️', // 🏖️
    label: 'Beach Camp',
    date: new Date('2026-07-13'), // "Summer camp" in the calendar — Mon before horse camp
  },
  {
    id: 'wren-america-2026',
    emoji: '\u{1F1FA}\u{1F1F8}', // 🇺🇸
    label: 'Wren in America!',
    date: new Date('2026-07-21'),
  },
];

// ---------------------------------------------------------------------------
// Main export: all countdown events
// ---------------------------------------------------------------------------

export const COUNTDOWN_EVENTS: CountdownEvent[] = [
  // Easter — computed algorithmically (both years to handle May-December gap)
  { id: `easter-${YEAR}`, emoji: '\u{1F423}', label: 'Easter', date: computeEaster(YEAR) },
  { id: `easter-${NEXT_YEAR}`, emoji: '\u{1F423}', label: 'Easter', date: computeEaster(NEXT_YEAR) },

  // Berlin school milestones
  ...BERLIN_SCHOOL_EVENTS,

  // Family birthdays and annual events
  ...FAMILY_EVENTS,

  // One-off camps & trips
  ...CAMP_EVENTS,
];
