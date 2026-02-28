import { format, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../../lib/calendar/config';
import type { CalendarEvent } from '../../lib/calendar/types';
import type { WeatherResponse } from '../../lib/api/openMeteo';
import { WeatherIcon } from '../weather/WeatherIcon';

interface KioskTodayCardProps {
  day: {
    date: Date;
    dateStr: string;
    events: CalendarEvent[];
  };
  weather: WeatherResponse | null | undefined;
}

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

export function KioskTodayCard({ day, weather }: KioskTodayCardProps) {
  const today = isToday(day.date);
  const dayTitle = today ? 'Today' : format(day.date, 'EEEE');
  const dateLabel = format(day.date, 'MMMM d');
  const dailyWeather = weather?.daily
    ? {
        high: weather.daily.temperature_2m_max[0],
        low: weather.daily.temperature_2m_min[0],
        weatherCode: weather.daily.weather_code[0],
      }
    : null;

  return (
    <section className="kiosk-today-card">
      <header className="flex items-center justify-between mb-[clamp(8px,1vw,14px)]">
        <div>
          <h2
            className="font-bold leading-none"
            style={{
              fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
              color: 'var(--fd-accent)',
            }}
          >
            {dayTitle}
          </h2>
          <span
            className="block mt-1"
            style={{
              fontSize: 'clamp(0.9rem, 1.3vw, 1.15rem)',
              color: 'var(--fd-text-2)',
            }}
          >
            {dateLabel}
          </span>
        </div>
        {dailyWeather && (
          <div className="flex items-center gap-[clamp(6px,0.8vw,10px)]">
            <span style={{ color: 'var(--fd-accent)' }}>
              <WeatherIcon
                code={dailyWeather.weatherCode}
                size="clamp(1.6rem, 2vw, 2.2rem)"
              />
            </span>
            <span
              className="font-medium tabular-nums"
              style={{
                fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)',
                color: 'var(--fd-text-1)',
              }}
            >
              {Math.round(dailyWeather.high)}&deg; / {Math.round(dailyWeather.low)}&deg;
            </span>
          </div>
        )}
      </header>

      {day.events.length > 0 ? (
        <ul className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-[clamp(6px,0.8vw,10px)]">
          {day.events.map((event) => (
            <li
              key={`${event.id}-${event.startTime.toISOString()}`}
              className="kiosk-today-event-row"
            >
              <span
                className="tabular-nums whitespace-nowrap"
                style={{
                  fontSize: 'clamp(1.35rem, 1.9vw, 1.75rem)',
                  color: 'var(--fd-text-2)',
                }}
              >
                {getEventTimeLabel(event)}
              </span>
              <span
                style={{ fontSize: 'clamp(1.5rem, 2.0vw, 1.9rem)' }}
              >
                {getEventPeopleLabel(event)}
              </span>
              <span
                className="min-w-0 truncate"
                style={{
                  fontSize: 'clamp(1.5rem, 2.25vw, 2.1rem)',
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
            fontSize: 'clamp(0.95rem, 1.3vw, 1.2rem)',
            color: 'var(--fd-text-2)',
            opacity: 0.6,
          }}
        >
          No events today
        </p>
      )}
    </section>
  );
}
