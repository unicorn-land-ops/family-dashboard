import { format } from 'date-fns';
import type { CalendarEvent } from '../../lib/calendar/types';
import { WeatherIcon } from '../weather/WeatherIcon';

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

const MAX_EVENTS_COMPACT = 3;

export function KioskCompactRow({ days, dailyWeather }: KioskCompactRowProps) {
  return (
    <div className="kiosk-compact-grid">
      {days.map((day, i) => {
        const dayTitle = format(day.date, 'EEE');
        const weather = dailyWeather[i];
        const visibleEvents = day.events.slice(0, MAX_EVENTS_COMPACT);
        const hiddenCount = Math.max(0, day.events.length - MAX_EVENTS_COMPACT);

        return (
          <section key={day.dateStr} className="kiosk-compact-card">
            <header className="mb-1">
              <div className="flex items-center justify-between">
                <h4
                  className="font-semibold leading-none"
                  style={{
                    fontSize: 'clamp(0.9rem, 1.1vw, 1.15rem)',
                    color: 'var(--fd-text-1)',
                  }}
                >
                  {dayTitle}
                </h4>
                {weather && (
                  <div
                    className="flex items-center gap-0.5"
                    style={{
                      fontSize: 'clamp(0.68rem, 0.75vw, 0.85rem)',
                      color: 'var(--fd-text-2)',
                    }}
                  >
                    <WeatherIcon
                      code={weather.weatherCode}
                      className="text-[var(--fd-accent)]"
                      size="clamp(0.9rem, 1vw, 1.2rem)"
                    />
                    <span className="tabular-nums">
                      {Math.round(weather.high)}&deg;
                    </span>
                  </div>
                )}
              </div>
            </header>

            {visibleEvents.length > 0 ? (
              <ul className="flex flex-col gap-[clamp(2px,0.3vw,4px)]">
                {visibleEvents.map((event) => (
                  <li
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    className="truncate"
                    style={{
                      fontSize: 'clamp(0.75rem, 0.9vw, 0.95rem)',
                      color: 'var(--fd-text-1)',
                      opacity: 0.85,
                    }}
                    title={event.summary}
                  >
                    {event.summary}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  fontSize: 'clamp(0.72rem, 0.82vw, 0.9rem)',
                  color: 'var(--fd-text-2)',
                  opacity: 0.4,
                }}
              >
                Free
              </p>
            )}

            {hiddenCount > 0 && (
              <p
                className="mt-auto"
                style={{
                  fontSize: 'clamp(0.66rem, 0.72vw, 0.82rem)',
                  color: 'var(--fd-accent)',
                }}
              >
                +{hiddenCount}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
