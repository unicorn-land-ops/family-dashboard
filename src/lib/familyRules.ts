import { formatInTimeZone } from 'date-fns-tz';
import { computeEaster } from './countdowns';
import type { CalendarEvent } from './calendar/types';

/** Dates here are Berlin calendar days as 'YYYY-MM-DD'. */
export type Kid = 'wren' | 'ellis';
export const KIDS: Kid[] = ['wren', 'ellis'];

// ponytail: static Berlin Ferien (schulferien.org + kalenderpedia, checked 15.10.2026).
// Add the next school year each summer; after 12.08.2028 every weekday counts as a school day.
// Both kids follow the Berlin calendar; per-kid lists if their schools ever diverge.
export const BERLIN_FERIEN: [from: string, to: string, name: string][] = [
  ['2026-10-19', '2026-10-31', 'Herbstferien'],
  ['2026-12-23', '2027-01-02', 'Weihnachtsferien'],
  ['2027-02-01', '2027-02-06', 'Winterferien'],
  ['2027-03-22', '2027-04-02', 'Osterferien'],
  ['2027-05-07', '2027-05-07', 'Brückentag'],
  ['2027-05-18', '2027-05-19', 'Pfingstferien'],
  ['2027-07-01', '2027-08-14', 'Sommerferien'],
  ['2027-10-11', '2027-10-23', 'Herbstferien'],
  ['2027-12-22', '2027-12-31', 'Weihnachtsferien'],
  ['2028-01-31', '2028-02-05', 'Winterferien'],
  ['2028-04-10', '2028-04-22', 'Osterferien'],
  ['2028-05-26', '2028-05-26', 'Brückentag'],
  ['2028-06-01', '2028-06-02', 'Pfingstferien'],
  ['2028-07-01', '2028-08-12', 'Sommerferien'],
];

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}

/** 0 = Sunday … 6 = Saturday */
export const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** Berlin public holidays (gesetzliche Feiertage) for a year. */
export function berlinPublicHolidays(year: number): Set<string> {
  const e = computeEaster(year);
  const easter = `${year}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`;
  return new Set([
    `${year}-01-01`, `${year}-03-08`, `${year}-05-01`, `${year}-10-03`, `${year}-12-25`, `${year}-12-26`,
    addDaysIso(easter, -2), addDaysIso(easter, 1), addDaysIso(easter, 39), addDaysIso(easter, 50),
  ]);
}

/** Name of the Ferien or public holiday on that day, if any. */
export function holidayName(iso: string): string | null {
  const f = BERLIN_FERIEN.find(([a, b]) => iso >= a && iso <= b);
  if (f) return f[2];
  return berlinPublicHolidays(Number(iso.slice(0, 4))).has(iso) ? 'Feiertag' : null;
}

/** A kid has school: weekday, not Ferien, not a public holiday, and no "Schulfrei" in their calendar. */
export function hasSchool(kid: Kid, iso: string, events: CalendarEvent[] = []): boolean {
  const dow = weekday(iso);
  if (dow === 0 || dow === 6 || holidayName(iso)) return false;
  return !events.some((e) => e.isSchulfrei && (e.persons.includes(kid) || e.persons.includes('family')));
}

/** Weekend mode: Saturday, Sunday, or both kids off school. */
export const isWeekendMode = (iso: string, events: CalendarEvent[] = []) =>
  KIDS.every((k) => !hasSchool(k, iso, events));

/** Bedtime: school night = school tomorrow. */
const BEDTIMES: Record<Kid, { school: string; free: string }> = {
  ellis: { school: '19:30', free: '20:30' },
  wren: { school: '20:30', free: '21:30' },
};
export function bedtime(kid: Kid, todayIso: string, tomorrowEvents: CalendarEvent[] = []): string {
  return hasSchool(kid, addDaysIso(todayIso, 1), tomorrowEvents) ? BEDTIMES[kid].school : BEDTIMES[kid].free;
}

/** Kit to bring, by weekday (1 = Mon). Wren: 8a timetable Spo Tue/Thu. Ellis: 3B Schwimmbus Wed. */
const KIT: Record<Kid, Record<number, { emoji: string; label: string }>> = {
  wren: { 1: { emoji: '🃏', label: 'Card games' }, 2: { emoji: '👟', label: 'Sport' }, 3: { emoji: '🏸', label: 'Badminton' }, 4: { emoji: '👟', label: 'Sport' } },
  ellis: { 1: { emoji: '👟', label: 'Sport' }, 3: { emoji: '🏊', label: 'Swimming' } },
};
export function kitFor(iso: string, events: CalendarEvent[] = []) {
  return KIDS.flatMap((kid) => {
    const k = KIT[kid][weekday(iso)];
    return k && hasSchool(kid, iso, events) ? [{ kid, ...k }] : [];
  });
}

/** What to wear: temperature at leaving time + rain chance for the day. */
export function wear(temp: number, rainPct: number): { emoji: string; label: string }[] {
  const out =
    temp <= 7 ? [{ emoji: '🧥', label: 'Warm coat' }, { emoji: '🧣', label: 'Scarf' }, { emoji: '🧤', label: 'Gloves' }]
    : temp <= 14 ? [{ emoji: '🧥', label: 'Jacket' }]
    : temp <= 21 ? [{ emoji: '👕', label: 'Long sleeves' }]
    : [{ emoji: '🩳', label: 'Shorts' }];
  if (rainPct >= 40) out.push({ emoji: '☔', label: 'Umbrella' });
  return out;
}

/** A BVG remark that means the U2 is actually disrupted (not a broken lift). */
const DISRUPTION = /störung|ausfall|fällt aus|ersatzverkehr|unterbroch|sperrung|pendelverkehr|disruption|cancel|verspät|delay/i;
const NOISE = /aufzug|fahrstuhl|elevator|rolltreppe|escalator|lift/i;
export function u2Disruption(
  deps: { line: { name: string }; delay: number | null; remarks: { type: string; text: string; summary?: string }[] }[],
): string | null {
  const u2 = deps.filter((d) => d.line.name === 'U2');
  for (const d of u2) {
    const r = d.remarks.find((x) => x.type === 'warning' && DISRUPTION.test(`${x.summary ?? ''} ${x.text}`) && !NOISE.test(`${x.summary ?? ''} ${x.text}`));
    if (r) return (r.summary || r.text).replace(/<[^>]+>/g, '');
  }
  const late = Math.max(0, ...u2.map((d) => d.delay ?? 0));
  return late >= 300 ? `U2 +${Math.round(late / 60)} Min` : null;
}

/** One line on the dial / in the week: an event, or a parent's evening meetings folded together. */
export interface DayItem { key: string; person: string; start: Date; end: Date; title: string; count: number }

const hmBerlin = (d: Date) => formatInTimeZone(d, 'Europe/Berlin', 'HH:mm');
const personOfEvent = (e: CalendarEvent) => (e.persons[0] ?? 'family').replace(/-work$/, '');

/**
 * Timed events of a day, with each parent's work meetings from 17:00 folded into one item:
 * "18:00 Meeting" for one, "18:00–21:00 · 3 meetings" for several (end = the last one's end).
 */
export function groupMeetings(events: CalendarEvent[]): DayItem[] {
  const out: DayItem[] = [];
  const meet: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    if (e.isAllDay) continue;
    const p = personOfEvent(e);
    const work = e.persons.some((x) => x.endsWith('-work')) && (p === 'papa' || p === 'daddy');
    if (work && hmBerlin(e.startTime) >= '17:00') (meet[p] ??= []).push(e);
    else out.push({ key: e.id + e.startTime.getTime(), person: p, start: e.startTime, end: e.endTime, title: `${hmBerlin(e.startTime)} ${e.summary}`, count: 1 });
  }
  for (const [p, list] of Object.entries(meet)) {
    list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const start = list[0].startTime;
    const end = new Date(Math.max(...list.map((e) => e.endTime.getTime())));
    out.push({
      key: `${p}-meetings-${start.getTime()}`, person: p, start, end, count: list.length,
      title: list.length === 1 ? `${hmBerlin(start)} Meeting` : `${hmBerlin(start)}–${hmBerlin(end)} · ${list.length} meetings`,
    });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}
