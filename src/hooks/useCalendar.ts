import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CALENDAR_FEEDS } from '../lib/calendar/config';
import { fetchCalendarFeed } from '../lib/api/calendarFetch';
import { parseICS } from '../lib/calendar/parser';
import { deduplicateEvents } from '../lib/calendar/dedup';
import { applyFilters } from '../lib/calendar/filters';
import type { DaySchedule, CalendarEvent } from '../lib/calendar/types';
import { startOfToday, addDays, format, isSameDay } from 'date-fns';

export function useCalendar() {
  const queries = useQueries({
    queries: CALENDAR_FEEDS.map((feed) => ({
      queryKey: ['calendar', feed.id],
      queryFn: () => fetchCalendarFeed(feed.calendarUrl),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 15 * 60 * 1000,
      retry: 3,
      enabled: !!feed.calendarUrl,
    })),
  });

  const days = useMemo<DaySchedule[]>(() => {
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
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          events: [],
        };
      });
    }

    // Pipeline: dedup -> filter
    const deduped = deduplicateEvents(allEvents);
    const filtered = applyFilters(deduped);

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

    return daySchedules;
  }, [queries]);

  const isLoading = queries.some((q) => q.isLoading) && !queries.some((q) => q.data);
  const isError = queries.some((q) => q.isError);
  const errors = queries
    .filter((q) => q.error)
    .map((q) => q.error as Error);

  return { days, isLoading, isError, errors };
}
