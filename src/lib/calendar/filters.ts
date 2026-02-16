import { getDay, getHours } from 'date-fns';
import type { CalendarEvent } from './types';
import { CALENDAR_FEEDS } from './config';

/**
 * Returns true if the event falls within typical work hours:
 * weekday (Mon-Fri), not all-day, and starts between 9:00-17:00.
 */
function isWorkHoursEvent(event: CalendarEvent): boolean {
  if (event.isAllDay) return false;
  const day = getDay(event.startTime); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  const hour = getHours(event.startTime);
  return hour >= 9 && hour <= 17;
}

/**
 * Returns true if the event is an all-day Schulfrei / No School day.
 */
function isSchulfrei(event: CalendarEvent): boolean {
  if (!event.isAllDay) return false;
  return /schulfrei|no school|kein unterricht/i.test(event.summary);
}

/**
 * Apply calendar filters:
 * 1. Remove Papa's solo work-hours events (keep shared events)
 * 2. Flag Schulfrei/No School all-day events for highlighting
 */
export function applyFilters(events: CalendarEvent[]): CalendarEvent[] {
  const papaFeed = CALENDAR_FEEDS.find((f) => f.isWorkCalendar);

  return events
    .filter((event) => {
      // Filter out Papa's work-hours events, but only if Papa is the sole person
      if (
        papaFeed &&
        event.persons.includes(papaFeed.id) &&
        event.persons.length === 1 &&
        isWorkHoursEvent(event)
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
