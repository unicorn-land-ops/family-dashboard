import { format, isToday } from 'date-fns';
import { useWeather } from '../../hooks/useWeather';
import { WeatherBadge } from './WeatherBadge';
import { EventCard } from './EventCard';
import type { DaySchedule } from '../../lib/calendar/types';

interface DayRowProps {
  day: DaySchedule;
  dayIndex: number;
}

export function DayRow({ day, dayIndex }: DayRowProps) {
  const { data: weather } = useWeather();

  const today = isToday(day.date);
  const dayLabel = today ? 'Today' : format(day.date, 'EEEE');
  const dateLabel = format(day.date, 'MMM d');

  // Weather data for this day from the daily arrays
  const dailyWeather =
    weather?.daily && dayIndex < weather.daily.time.length
      ? {
          high: weather.daily.temperature_2m_max[dayIndex],
          low: weather.daily.temperature_2m_min[dayIndex],
          weatherCode: weather.daily.weather_code[dayIndex],
        }
      : null;

  return (
    <div className={`py-[clamp(6px,0.5vw,12px)] ${today ? 'day-today' : ''}`}>
      {/* Day header */}
      <div className="flex items-baseline justify-between gap-2 px-1 mb-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-[clamp(13px,1vw,16px)] font-semibold ${
              today ? 'text-accent-gold' : 'text-text-primary'
            }`}
          >
            {dayLabel}
          </span>
          <span className="text-[clamp(11px,0.8vw,13px)] text-text-secondary">
            {dateLabel}
          </span>
        </div>
        {dailyWeather && (
          <WeatherBadge
            high={dailyWeather.high}
            low={dailyWeather.low}
            weatherCode={dailyWeather.weatherCode}
          />
        )}
      </div>

      {/* Events */}
      {day.events.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {day.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="px-2 py-1 text-[clamp(11px,0.8vw,13px)] text-text-secondary opacity-50">
          No events
        </div>
      )}

      {/* Separator */}
      <div className="mt-[clamp(6px,0.5vw,12px)] border-b border-white/[0.06]" />
    </div>
  );
}
