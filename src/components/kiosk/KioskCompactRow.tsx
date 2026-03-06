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

export function KioskCompactRow({ days, dailyWeather }: KioskCompactRowProps) {
  return (
    <div className="kiosk-compact-grid">
      {days.map((day, i) => {
        const dayTitle = format(day.date, 'EEE');
        const weather = dailyWeather[i];
        const eventCount = day.events.length;

        return (
          <div key={day.dateStr} className="kiosk-compact-cell">
            <span
              style={{
                fontSize: 'clamp(1.2rem, 1.5vw, 1.5rem)',
                fontWeight: 600,
                color: 'var(--fd-text-1)',
              }}
            >
              {dayTitle}
            </span>
            {weather && (
              <div
                className="flex items-center gap-1"
                style={{
                  fontSize: 'clamp(0.85rem, 1vw, 1.1rem)',
                  color: 'var(--fd-accent)',
                }}
              >
                <WeatherIcon
                  code={weather.weatherCode}
                  size="clamp(1.1rem, 1.3vw, 1.5rem)"
                />
                <span className="tabular-nums font-medium">
                  {Math.round(weather.high)}&deg;
                </span>
              </div>
            )}
            <span
              style={{
                fontSize: 'clamp(0.8rem, 0.95vw, 1rem)',
                color: 'var(--fd-text-2)',
                opacity: eventCount > 0 ? 0.8 : 0.4,
              }}
            >
              {eventCount === 0
                ? 'Free'
                : eventCount === 1
                  ? '1 event'
                  : `${eventCount} events`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
