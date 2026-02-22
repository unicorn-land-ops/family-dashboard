import { format, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useCalendar } from '../../hooks/useCalendar';
import { useWeather } from '../../hooks/useWeather';
import { CALENDAR_FEEDS, HOME_TIMEZONE } from '../../lib/calendar/config';
import type { CalendarEvent } from '../../lib/calendar/types';
import { WeatherIcon } from '../weather/WeatherIcon';

const MAX_EVENTS_PER_DAY = 4;

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return 'All day';
  return formatInTimeZone(event.startTime, HOME_TIMEZONE, 'HH:mm');
}

function getEventPeopleLabel(event: CalendarEvent): string {
  const emojis = event.persons
    .map((id) => CALENDAR_FEEDS.find((feed) => feed.id === id)?.emoji ?? '')
    .filter(Boolean)
    .join('');

  return emojis || '•';
}

export function KioskWeekGrid() {
  const { days, isLoading, isError, errors } = useCalendar();
  const { data: weather } = useWeather();

  if (isLoading) {
    return (
      <div className="card-glass h-full p-[clamp(12px,1.5vw,24px)] flex-1 overflow-hidden">
        <div className="kiosk-week-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="kiosk-day-card animate-pulse">
              <div className="h-5 w-20 rounded bg-white/10 mb-3" />
              <div className="h-4 w-14 rounded bg-white/10 mb-4" />
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="h-10 rounded bg-white/[0.06] mb-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && days.every((day) => day.events.length === 0)) {
    return (
      <div className="card-glass h-full p-[clamp(12px,1.5vw,24px)] flex-1 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="text-[clamp(1.1rem,1.8vw,1.6rem)] mb-2">Calendar unavailable</p>
          <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] opacity-70">
            {errors.length > 0 && errors[0]?.message?.includes('CORS_PROXY_URL')
              ? 'CORS proxy not configured. Set VITE_CORS_PROXY_URL in .env'
              : 'Unable to load calendar feeds. Will retry automatically.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass h-full p-[clamp(12px,1.5vw,24px)] flex-1 overflow-hidden">
      <div className="kiosk-week-grid">
        {days.map((day, dayIndex) => {
          const today = isToday(day.date);
          const dayTitle = today ? 'Today' : format(day.date, 'EEE');
          const dateLabel = format(day.date, 'MMM d');
          const visibleEvents = day.events.slice(0, MAX_EVENTS_PER_DAY);
          const hiddenCount = Math.max(0, day.events.length - visibleEvents.length);
          const dailyWeather =
            weather?.daily && dayIndex < weather.daily.time.length
              ? {
                  high: weather.daily.temperature_2m_max[dayIndex],
                  low: weather.daily.temperature_2m_min[dayIndex],
                  weatherCode: weather.daily.weather_code[dayIndex],
                }
              : null;

          return (
            <section
              key={day.dateStr}
              className={`kiosk-day-card ${today ? 'kiosk-day-card-today' : ''}`}
            >
              <header className="mb-2">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`kiosk-day-title ${today ? 'text-accent-gold' : 'text-text-primary'}`}
                  >
                    {dayTitle}
                  </h3>
                  <span className="kiosk-day-date">{dateLabel}</span>
                </div>
                {dailyWeather && (
                  <div className="kiosk-day-weather">
                    <WeatherIcon
                      code={dailyWeather.weatherCode}
                      className="text-accent-gold"
                      size="clamp(1.1rem,1.2vw,1.4rem)"
                    />
                    <span>
                      {Math.round(dailyWeather.high)}&deg; / {Math.round(dailyWeather.low)}&deg;
                    </span>
                  </div>
                )}
              </header>

              {visibleEvents.length > 0 ? (
                <ul className="kiosk-day-events">
                  {visibleEvents.map((event) => (
                    <li key={`${event.id}-${event.startTime.toISOString()}`} className="kiosk-event-row">
                      <span className="kiosk-event-time">{getEventTimeLabel(event)}</span>
                      <span className="kiosk-event-people">{getEventPeopleLabel(event)}</span>
                      <span className="kiosk-event-summary" title={event.summary}>
                        {event.summary}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="kiosk-empty-day">No events</p>
              )}

              {hiddenCount > 0 && <p className="kiosk-overflow">+{hiddenCount} more</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
