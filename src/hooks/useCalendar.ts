import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../lib/calendar/config';
import { fetchCalendarFeed } from '../lib/api/calendarFetch';
import { parseICS } from '../lib/calendar/parser';
import { deduplicateEvents } from '../lib/calendar/dedup';
import { applyFilters } from '../lib/calendar/filters';
import type { DaySchedule, CalendarEvent } from '../lib/calendar/types';
import { startOfToday, addDays, format, isSameDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

/** Work calendar cutoff hour in home timezone */
const WORK_CUTOFF_HOUR = 18;

export function useCalendar() {
  // Flip once at exactly 6pm Berlin time — no polling needed
  const [pastCutoff, setPastCutoff] = useState(() => new Date() >= getTodayCutoff());

  useEffect(() => {
    if (pastCutoff) return; // already past 6pm, nothing to wait for
    const cutoff = getTodayCutoff();
    const ms = cutoff.getTime() - Date.now();
    if (ms <= 0) { setPastCutoff(true); return; }
    const timer = setTimeout(() => setPastCutoff(true), ms);
    return () => clearTimeout(timer);
  }, [pastCutoff]);
  const queries = useQueries({
    queries: CALENDAR_FEEDS.map((feed, index) => ({
      queryKey: ['calendar', feed.id, index],
      queryFn: () => fetchCalendarFeed(feed.calendarUrl),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 15 * 60 * 1000,
      retry: 3,
      enabled: !!feed.calendarUrl,
    })),
  });

  // Stable signature so expensive parsing/memoization only reruns when query data changes.
  const queryDataSignature = queries
    .map((query, index) => {
      const feedId = CALENDAR_FEEDS[index]?.id ?? `feed-${index}`;
      const updatedAt = query.dataUpdatedAt ?? 0;
      const size = query.data?.length ?? 0;
      return `${feedId}:${updatedAt}:${size}`;
    })
    .join('|');

  const { days, rawEvents } = useMemo<{
    days: DaySchedule[];
    rawEvents: CalendarEvent[];
  }>(() => {
    // Collect all parsed events from successful queries
    const allEvents: CalendarEvent[] = [];

    queries.forEach((query, index) => {
      if (query.data) {
        const feed = CALENDAR_FEEDS[index];
        const parsed = parseICS(query.data, feed);
        allEvents.push(...parsed);
      }
    });

    if (allEvents.length === 0) {
      // Return empty 7-day structure
      const today = startOfToday();
      const emptyDays = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          events: [],
        };
      });
      return { days: emptyDays, rawEvents: [] };
    }

    // Pipeline: dedup -> filter
    const deduped = deduplicateEvents(allEvents);
    const filtered = applyFilters(deduped, pastCutoff);

    // Group by day: 7 days starting from today
    const today = startOfToday();
    const daySchedules: DaySchedule[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const nextDay = addDays(date, 1);

      const dayEvents = filtered.filter((event) => {
        if (event.isAllDay) {
          // All-day event spans the day if its range overlaps
          return (
            event.startTime < nextDay && event.endTime > date
          );
        }
        return isSameDay(event.startTime, date);
      });

      // Sort: all-day events first, then by startTime ascending
      dayEvents.sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      });

      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        events: dayEvents,
      };
    });

    return { days: daySchedules, rawEvents: deduped };
  }, [queryDataSignature, pastCutoff]);

  const isLoading = queries.some((q) => q.isLoading) && !queries.some((q) => q.data);
  const isError = queries.some((q) => q.isError);
  const errors = queries
    .filter((q) => q.error)
    .map((q) => q.error as Error);

  return { days, rawEvents, isLoading, isError, errors };
}

/** Returns today's 18:00 in the home timezone as a UTC Date. */
function getTodayCutoff(): Date {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  // Create 18:00 in Berlin, convert to UTC
  return fromZonedTime(new Date(year, month, day, WORK_CUTOFF_HOUR, 0, 0), HOME_TIMEZONE);
}
