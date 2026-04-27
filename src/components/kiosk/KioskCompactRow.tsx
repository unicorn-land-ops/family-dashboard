import { format } from 'date-fns';
import type { CalendarEvent } from '../../lib/calendar/types';
import { WeatherIcon } from '../weather/WeatherIcon';

const MAX_EVENTS = 3;

interface CompactDay {
  date: Date;
  dateStr: string;
  events: CalendarEvent[];
}

interface KioskCompactRowProps {
  days: CompactDay[];
  dailyWeather: Array<{
    high: number;
    low: number;
    weatherCode: number;
  } | null>;
}

function CompactEvent({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="truncate"
      style={{
        fontSize: 'clamp(0.78rem, 1vw, 1.05rem)',
        color: 'var(--fd-text-2)',
        lineHeight: 1.35,
      }}
      title={event.summary}
    >
      {event.summary}
    </div>
  );
}

export function KioskCompactRow({ days, dailyWeather }: KioskCompactRowProps) {
  return (
    <div className="kiosk-compact-grid">
      {days.map((day, i) => {
        const dayAbbrev = format(day.date, 'EEE');
        const weather = dailyWeather[i];
        const visibleEvents = day.events.slice(0, MAX_EVENTS);
        const extraCount = day.events.length - MAX_EVENTS;

        const monthDate = format(day.date, 'MMM d');

        return (
          <div key={day.dateStr} className="kiosk-compact-cell">
            {/* Header: day name + date on left, weather on right */}
            <div className="flex items-start justify-between">
              <div>
                <span
                  style={{
                    fontSize: 'clamp(1.05rem, 1.35vw, 1.4rem)',
                    fontWeight: 600,
                    color: 'var(--fd-text-1)',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {dayAbbrev}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(0.78rem, 0.95vw, 1rem)',
                    color: 'var(--fd-text-2)',
                    display: 'block',
                  }}
                >
                  {monthDate}
                </span>
              </div>
              {weather && (
                <div
                  className="flex items-center gap-0.5"
                  style={{
                    fontSize: 'clamp(0.85rem, 1.05vw, 1.1rem)',
                  }}
                >
                  <WeatherIcon
                    code={weather.weatherCode}
                    size="clamp(1rem, 1.2vw, 1.3rem)"
                    style={{ color: 'var(--fd-accent)' }}
                  />
                  <span className="tabular-nums font-medium" style={{ color: 'var(--fd-accent)' }}>
                    {Math.round(weather.high)}&deg;
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: 'var(--fd-text-2)', opacity: 0.6 }}
                  >
                    /{Math.round(weather.low)}&deg;
                  </span>
                </div>
              )}
            </div>

            {/* Events */}
            {visibleEvents.length > 0 ? (
              <div className="flex flex-col gap-px mt-0.5">
                {visibleEvents.map((event) => (
                  <CompactEvent key={event.id} event={event} />
                ))}
                {extraCount > 0 && (
                  <span
                    style={{
                      fontSize: 'clamp(0.72rem, 0.85vw, 0.9rem)',
                      color: 'var(--fd-text-2)',
                      opacity: 0.5,
                    }}
                  >
                    +{extraCount} more
                  </span>
                )}
              </div>
            ) : (
              <span
                style={{
                  fontSize: 'clamp(0.78rem, 0.95vw, 1rem)',
                  color: 'var(--fd-text-2)',
                  opacity: 0.35,
                  fontStyle: 'italic',
                }}
              >
                Free
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
