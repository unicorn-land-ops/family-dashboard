import IcalExpander from 'ical-expander';
import { startOfToday, addDays } from 'date-fns';
import type { PersonConfig, CalendarEvent } from './types';

export function parseICS(
  icsText: string,
  feed: PersonConfig,
): CalendarEvent[] {
  const expander = new IcalExpander({ ics: icsText, maxIterations: 1000 });
  const start = startOfToday();
  const end = addDays(start, 7);

  // Always use .between() with a 7-day window, NEVER .all() (infinite RRULE risk)
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

  return parsed;
}
