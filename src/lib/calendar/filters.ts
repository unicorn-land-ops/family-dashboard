import type { CalendarEvent } from './types';
import { CALENDAR_FEEDS } from './config';

/**
 * Returns true if this looks like a travel/conference event that should
 * always show, even from work calendars.
 */
function isTravelEvent(event: CalendarEvent): boolean {
  if (TRAVEL_EVENT_REGEX.test(event.summary)) return true;
  // "Label: Place" pattern (e.g. "health.tech: Basel, Switzerland")
  if (DESTINATION_LABEL_REGEX.test(event.summary)) return true;
  // Multi-day all-day events are typically conferences/trips
  if (event.isAllDay) {
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    if (durationMs > 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

/**
 * Returns true if the event is an all-day Schulfrei / No School day.
 */
function isSchulfrei(event: CalendarEvent): boolean {
  if (!event.isAllDay) return false;
  return /schulfrei|no school|kein unterricht/i.test(event.summary);
}

const TRAVEL_EVENT_REGEX = /\b(flight|fly|travel|trip|hotel|airport|layover|conference|quiltcon|vacation)\b/i;
const DESTINATION_LABEL_REGEX = /^[^:]{2,40}:\s*[A-Z][a-z]/;

/**
 * Apply calendar filters:
 * 1. Hide work calendar events before 6pm (travel & shared events always show)
 * 2. Flag Schulfrei/No School all-day events for highlighting
 *
 * @param showWork — true once wall-clock passes 18:00 Berlin time
 */
export function applyFilters(events: CalendarEvent[], showWork: boolean): CalendarEvent[] {
  const workCalendarIds = new Set(
    CALENDAR_FEEDS.filter((f) => f.isWorkCalendar).map((f) => f.id),
  );

  return events
    .filter((event) => {
      // Before 6pm: hide all work calendar solo events (keep travel & shared)
      if (
        !showWork &&
        workCalendarIds.size > 0 &&
        event.persons.length === 1 &&
        workCalendarIds.has(event.persons[0]) &&
        !isTravelEvent(event)
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
