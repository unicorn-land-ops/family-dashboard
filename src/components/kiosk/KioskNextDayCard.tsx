import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../../lib/calendar/config';
import type { CalendarEvent } from '../../lib/calendar/types';
import { WeatherIcon } from '../weather/WeatherIcon';

interface KioskNextDayCardProps {
  day: {
    date: Date;
    dateStr: string;
    events: CalendarEvent[];
  };
  dailyWeather: {
    high: number;
    low: number;
    weatherCode: number;
  } | null;
}

const MAX_EVENTS = 4;

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return 'All day';
  return formatInTimeZone(event.startTime, HOME_TIMEZONE, 'HH:mm');
}

function getEventPeopleLabel(event: CalendarEvent): string {
  const emojis = event.persons
    .map((id) => CALENDAR_FEEDS.find((feed) => feed.id === id)?.emoji ?? '')
    .filter(Boolean)
    .join('');
  return emojis || '\u2022';
}

export function KioskNextDayCard({ day, dailyWeather }: KioskNextDayCardProps) {
  const dayTitle = format(day.date, 'EEEE');
  const dateLabel = format(day.date, 'MMM d');
  const visibleEvents = day.events.slice(0, MAX_EVENTS);
  const hiddenCount = Math.max(0, day.events.length - MAX_EVENTS);

  return (
    <section className="kiosk-next-day-card">
      <header className="flex items-start justify-between mb-[clamp(4px,0.6vw,8px)]">
        <div>
          <h3
            className="font-semibold leading-none"
            style={{
              fontSize: 'clamp(1.35rem, 2vw, 1.75rem)',
              color: 'var(--fd-text-1)',
            }}
          >
            {dayTitle}
          </h3>
          <span
            className="block mt-1"
            style={{
              fontSize: 'clamp(0.85rem, 1vw, 1.1rem)',
              color: 'var(--fd-text-2)',
            }}
          >
            {dateLabel}
          </span>
        </div>
        {dailyWeather && (
          <div
            className="flex items-center gap-1"
            style={{
              color: 'var(--fd-text-2)',
              fontSize: 'clamp(0.85rem, 1vw, 1.1rem)',
            }}
          >
            <WeatherIcon
              code={dailyWeather.weatherCode}
              className="kiosk-next-day-weather-icon"
              size="clamp(1.1rem, 1.3vw, 1.5rem)"
            />
            <span className="tabular-nums">
              {Math.round(dailyWeather.high)}&deg; / {Math.round(dailyWeather.low)}&deg;
            </span>
          </div>
        )}
      </header>

      {visibleEvents.length > 0 ? (
        <ul className="flex flex-col gap-[clamp(4px,0.5vw,6px)]">
          {visibleEvents.map((event) => (
            <li
              key={`${event.id}-${event.startTime.toISOString()}`}
              className="kiosk-next-event-row"
            >
              <span
                className="tabular-nums whitespace-nowrap"
                style={{
                  fontSize: 'clamp(1.2rem, 1.4vw, 1.55rem)',
                  color: 'var(--fd-text-2)',
                }}
              >
                {getEventTimeLabel(event)}
              </span>
              <span style={{ fontSize: 'clamp(1.3rem, 1.5vw, 1.65rem)' }}>
                {getEventPeopleLabel(event)}
              </span>
              <span
                className="min-w-0 truncate"
                style={{
                  fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
                  color: 'var(--fd-text-1)',
                }}
                title={event.summary}
              >
                {event.summary}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            fontSize: 'clamp(0.78rem, 0.9vw, 1rem)',
            color: 'var(--fd-text-2)',
            opacity: 0.5,
          }}
        >
          No events
        </p>
      )}

      {hiddenCount > 0 && (
        <p
          className="mt-auto pt-1"
          style={{
            fontSize: 'clamp(0.72rem, 0.82vw, 0.92rem)',
            color: 'var(--fd-accent)',
          }}
        >
          +{hiddenCount} more
        </p>
      )}
    </section>
  );
}
