import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../../lib/calendar/config';
import type { CalendarEvent } from '../../lib/calendar/types';

interface EventCardProps {
  event: CalendarEvent;
}

export const EventCard = React.memo(function EventCard({ event }: EventCardProps) {
  // Look up person configs for emoji badges and travel timezone
  const personConfigs = event.persons
    .map((id) => CALENDAR_FEEDS.find((f) => f.id === id))
    .filter(Boolean);

  // Find any traveler with a travelTimezone set
  const traveler = personConfigs.find((p) => p?.travelTimezone);

  const timeDisplay = !event.isAllDay
    ? formatInTimeZone(event.startTime, HOME_TIMEZONE, 'HH:mm')
    : null;

  const travelTimeDisplay =
    !event.isAllDay && traveler?.travelTimezone
      ? formatInTimeZone(event.startTime, traveler.travelTimezone, 'HH:mm')
      : null;

  // Short label for travel timezone (e.g., "America/New_York" -> "NYC")
  const travelLabel = traveler?.travelTimezone
    ? traveler.travelTimezone.split('/').pop()?.replace(/_/g, ' ') ?? ''
    : '';

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${
        event.isSchulfrei
          ? 'event-schulfrei'
          : 'bg-white/[0.03]'
      }`}
    >
      {/* Time column */}
      <div className="shrink-0 w-[clamp(40px,4vw,60px)] text-[clamp(11px,0.8vw,13px)] tabular-nums text-text-secondary">
        {timeDisplay && (
          <>
            <div>{timeDisplay}</div>
            {travelTimeDisplay && (
              <div className="text-[0.85em] opacity-70">
                {travelTimeDisplay} {travelLabel}
              </div>
            )}
          </>
        )}
        {event.isAllDay && (
          <div className="text-[0.85em] opacity-60">all day</div>
        )}
      </div>

      {/* Summary */}
      <div className="flex-1 min-w-0 text-[clamp(12px,0.9vw,15px)] leading-snug truncate">
        {event.summary}
      </div>

      {/* Person badges */}
      <div className="flex gap-0.5 shrink-0">
        {personConfigs.map(
          (p) =>
            p && (
              <span
                key={p.id}
                title={p.name}
                className="text-[clamp(12px,0.9vw,16px)]"
              >
                {p.emoji}
              </span>
            ),
        )}
      </div>
    </div>
  );
});
