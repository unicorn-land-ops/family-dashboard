import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { HOME_TIMEZONE } from '../../lib/calendar/config';
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

const MAX_EVENTS_COMPACT = 2;

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return 'All day';
  return formatInTimeZone(event.startTime, HOME_TIMEZONE, 'HH:mm');
}

export function KioskCompactRow({ days, dailyWeather }: KioskCompactRowProps) {
  return (
    <div className="kiosk-compact-grid">
      {days.map((day, i) => {
        const dayTitle = format(day.date, 'EEE');
        const weather = dailyWeather[i];
        const visibleEvents = day.events.slice(0, MAX_EVENTS_COMPACT);
        const hiddenCount = Math.max(0, day.events.length - MAX_EVENTS_COMPACT);
        const hasEvents = day.events.length > 0;

        return (
          <section
            key={day.dateStr}
            className={`kiosk-compact-card${hasEvents ? '' : ' kiosk-compact-card--empty'}`}
          >
            <header className="mb-1">
              <div className="flex items-center justify-between">
                <h4
                  className="font-semibold leading-none"
                  style={{
                    fontSize: 'clamp(1.33rem, 1.68vw, 1.68rem)',
                    color: 'var(--fd-text-1)',
                  }}
                >
                  {dayTitle}
                </h4>
                {weather && (
                  <div
                    className="flex items-center gap-0.5"
                    style={{
                      fontSize: 'clamp(0.75rem, 0.85vw, 0.95rem)',
                      color: 'var(--fd-text-2)',
                    }}
                  >
                    <WeatherIcon
                      code={weather.weatherCode}
                      className="text-[var(--fd-accent)]"
                      size="clamp(1rem, 1.1vw, 1.3rem)"
                    />
                    <span className="tabular-nums">
                      {Math.round(weather.high)}&deg;
                    </span>
                  </div>
                )}
              </div>
            </header>

            {visibleEvents.length > 0 ? (
              <ul className="flex flex-col gap-[clamp(3px,0.4vw,6px)]">
                {visibleEvents.map((event) => (
                  <li
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    className="flex items-baseline gap-[clamp(4px,0.4vw,6px)] min-w-0"
                  >
                    <span
                      className="tabular-nums whitespace-nowrap shrink-0"
                      style={{
                        fontSize: 'clamp(1.08rem, 1.23vw, 1.35rem)',
                        color: 'var(--fd-accent)',
                      }}
                    >
                      {getEventTimeLabel(event)}
                    </span>
                    <span
                      className="truncate min-w-0"
                      style={{
                        fontSize: 'clamp(1.17rem, 1.32vw, 1.43rem)',
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
                  fontSize: 'clamp(0.78rem, 0.88vw, 0.95rem)',
                  color: 'var(--fd-text-2)',
                  opacity: 0.35,
                }}
              >
                Free
              </p>
            )}

            {hiddenCount > 0 && (
              <p
                className="mt-auto"
                style={{
                  fontSize: 'clamp(0.7rem, 0.78vw, 0.88rem)',
                  color: 'var(--fd-accent)',
                }}
              >
                +{hiddenCount} more
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
