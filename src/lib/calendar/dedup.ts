import type { CalendarEvent } from './types';

function eventKey(event: CalendarEvent): string {
  const summary = event.summary.trim().toLowerCase();
  const start = event.startTime.toISOString();
  const end = event.endTime.toISOString();
  return `${summary}|${start}|${end}`;
}

export function deduplicateEvents(
  events: CalendarEvent[],
): CalendarEvent[] {
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
