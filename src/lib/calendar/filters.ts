import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarEvent } from './types';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from './config';

/**
 * Returns true if the event starts before 18:00 in the home timezone.
 * All-day events are treated as "before evening" so they are filtered out
 * for Papa-only events.
 */
function isBeforeEvening(event: CalendarEvent): boolean {
  if (event.isAllDay) return true;
  const hour = Number(formatInTimeZone(event.startTime, HOME_TIMEZONE, 'H'));
  return hour < 18;
}

/**
 * Returns true if the event is an all-day Schulfrei / No School day.
 */
function isSchulfrei(event: CalendarEvent): boolean {
  if (!event.isAllDay) return false;
  return /schulfrei|no school|kein unterricht/i.test(event.summary);
}

const TRAVEL_EVENT_REGEX = /\b(flight|fly|travel|trip|hotel|airport|layover|conference|quiltcon|vacation)\b/i;

/**
 * Apply calendar filters:
 * 1. Remove Papa's solo work events that start before 18:00 (keep travel & shared events)
 * 2. Flag Schulfrei/No School all-day events for highlighting
 */
export function applyFilters(events: CalendarEvent[]): CalendarEvent[] {
  const papaFeed = CALENDAR_FEEDS.find((f) => f.isWorkCalendar);

  return events
    .filter((event) => {
      // Filter out Papa's work pre-18:00 events, but keep travel and shared events
      if (
        papaFeed &&
        event.persons.includes(papaFeed.id) &&
        event.persons.length === 1 &&
        isBeforeEvening(event) &&
        !TRAVEL_EVENT_REGEX.test(event.summary)
      ) {
        return false;
      }
      return true;
    })
    .map((event) => ({
      ...event,
      isSchulfrei: isSchulfrei(event),
    }));
}
