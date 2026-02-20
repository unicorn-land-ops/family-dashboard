import IcalExpander from 'ical-expander';
import { startOfToday, addDays } from 'date-fns';
import type { PersonConfig, CalendarEvent } from './types';

const VEVENT_BLOCK_REGEX = /BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g;
const DTSTART_REGEX = /(?:^|\n)DTSTART[^:]*:([^\r\n]+)/;
const RRULE_REGEX = /(?:^|\n)RRULE:/;
const MAX_EXPANDER_ITERATIONS = 300;
const TRIM_LOOKBACK_DAYS = 90;
const MAX_ONE_OFF_EVENTS = 1200;
const PARSE_CACHE_LIMIT = 24;

const parseCache = new Map<string, CalendarEvent[]>();

interface EventBlock {
  index: number;
  block: string;
  startMs: number | null;
}

function parseICalDateValue(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }

  const utcDateTimeMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (utcDateTimeMatch) {
    const [, y, m, d, hh, mm, ss] = utcDateTimeMatch;
    return Date.UTC(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss),
    );
  }

  const localDateTimeMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (localDateTimeMatch) {
    const [, y, m, d, hh, mm, ss] = localDateTimeMatch;
    // Treat floating local datetime as UTC for coarse "old vs recent" trimming.
    return Date.UTC(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss),
    );
  }

  return null;
}

function getEventStartMs(block: string): number | null {
  const startMatch = block.match(DTSTART_REGEX);
  if (!startMatch?.[1]) return null;
  return parseICalDateValue(startMatch[1]);
}

function trimLargeCalendar(icsText: string): string {
  const matches = Array.from(icsText.matchAll(VEVENT_BLOCK_REGEX));
  if (matches.length === 0) return icsText;

  const firstStart = matches[0].index ?? 0;
  const lastMatch = matches[matches.length - 1];
  const lastEnd = (lastMatch.index ?? 0) + lastMatch[0].length;

  const prefix = icsText.slice(0, firstStart);
  const suffix = icsText.slice(lastEnd);
  const cutoffMs = addDays(startOfToday(), -TRIM_LOOKBACK_DAYS).getTime();

  const recurringBlocks: EventBlock[] = [];
  const oneOffBlocks: EventBlock[] = [];

  for (const match of matches) {
    const block = match[0];
    const index = match.index ?? 0;
    const startMs = getEventStartMs(block);

    if (RRULE_REGEX.test(block)) {
      recurringBlocks.push({ index, block, startMs });
      continue;
    }

    if (startMs === null || startMs >= cutoffMs) {
      oneOffBlocks.push({ index, block, startMs });
    }
  }

  const selectedOneOffs =
    oneOffBlocks.length <= MAX_ONE_OFF_EVENTS
      ? oneOffBlocks
      : [...oneOffBlocks]
          .sort((a, b) => (b.startMs ?? Number.MAX_SAFE_INTEGER) - (a.startMs ?? Number.MAX_SAFE_INTEGER))
          .slice(0, MAX_ONE_OFF_EVENTS);

  const selectedOneOffIndexes = new Set(selectedOneOffs.map((block) => block.index));
  const preservedOneOffs = oneOffBlocks.filter((block) => selectedOneOffIndexes.has(block.index));

  const selectedBlocks = [...recurringBlocks, ...preservedOneOffs]
    .sort((a, b) => a.index - b.index)
    .map((event) => event.block);

  if (selectedBlocks.length === matches.length) {
    return icsText;
  }

  return `${prefix}${selectedBlocks.join('')}${suffix}`;
}

function makeCacheKey(feed: PersonConfig, icsText: string): string {
  const head = icsText.slice(0, 120);
  const tail = icsText.slice(-120);
  return `${feed.id}|${icsText.length}|${head}|${tail}`;
}

function setParseCache(cacheKey: string, events: CalendarEvent[]): void {
  if (parseCache.has(cacheKey)) {
    parseCache.delete(cacheKey);
  }
  parseCache.set(cacheKey, events);
  if (parseCache.size > PARSE_CACHE_LIMIT) {
    const oldestKey = parseCache.keys().next().value;
    if (oldestKey) {
      parseCache.delete(oldestKey);
    }
  }
}

export function parseICS(
  icsText: string,
  feed: PersonConfig,
): CalendarEvent[] {
  const cacheKey = makeCacheKey(feed, icsText);
  const cached = parseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const trimmedICS = trimLargeCalendar(icsText);
  const expander = new IcalExpander({
    ics: trimmedICS,
    maxIterations: MAX_EXPANDER_ITERATIONS,
  });
  // Include a short lookback window so ongoing multi-day trips still appear.
  const start = addDays(startOfToday(), -14);
  const end = addDays(startOfToday(), 7);

  // Always use .between() with a bounded window, NEVER .all() (infinite RRULE risk)
  const { events, occurrences } = expander.between(start, end);

  const parsed: CalendarEvent[] = [];

  // Single (non-recurring) events in the window
  for (const event of events) {
    parsed.push({
      id: event.uid,
      summary: event.summary,
      startTime: event.startDate.toJSDate(),
      endTime: event.endDate.toJSDate(),
      isAllDay: event.startDate.isDate,
      persons: [feed.id],
      location: event.location || undefined,
    });
  }

  // Recurring event occurrences in the window
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

  setParseCache(cacheKey, parsed);
  return parsed;
}
