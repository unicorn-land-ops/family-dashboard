import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useWeather } from '../../hooks/useWeather';
import { useTravelWeather, type TravelTarget } from '../../hooks/useTravelWeather';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherInfo } from '../../lib/utils/weatherCodes';
import { useInterval } from '../../hooks/useInterval';
import { useState } from 'react';

interface CurrentWeatherProps {
  travelTarget?: TravelTarget | null;
  variant?: 'default' | 'kiosk';
}

function getTravelLocationLabel(target: TravelTarget): string {
  const fromParens = target.label.match(/\(([^)]+)\)/)?.[1]?.trim();
  if (fromParens) {
    return fromParens.split(',')[0]?.trim() || fromParens;
  }
  return target.timezone.split('/').pop()?.replace(/_/g, ' ') ?? 'Travel';
}

export const CurrentWeather = React.memo(function CurrentWeather({
  travelTarget = null,
  variant = 'default',
}: CurrentWeatherProps) {
  const { data, isLoading, isError } = useWeather();
  const { data: travelerWeather } = useTravelWeather(travelTarget);
  const [travelClock, setTravelClock] = useState(() => new Date());
  const isKiosk = variant === 'kiosk';

  useInterval(() => {
    setTravelClock(new Date());
  }, travelTarget?.timezone ? 60_000 : null);

  if (isLoading) {
    return (
      <span className="text-[clamp(0.75rem,1.5vw,1rem)]" style={{ color: 'var(--fd-text-2)' }}>
        Loading...
      </span>
    );
  }

  if (isError || !data) {
    return (
      <span className="text-[clamp(0.75rem,1.5vw,1rem)]" style={{ color: 'var(--fd-text-2)' }}>
        Weather unavailable
      </span>
    );
  }

  const temp = Math.round(data.current.temperature_2m);
  const { description } = getWeatherInfo(data.current.weather_code);
  const travelerTemp = travelerWeather ? Math.round(travelerWeather.current.temperature_2m) : null;
  const travelerCode = travelerWeather?.current.weather_code;
  const travelerTime =
    travelTarget?.timezone &&
    formatInTimeZone(travelClock, travelTarget.timezone, 'HH:mm');
  const travelerLocation = travelTarget ? getTravelLocationLabel(travelTarget) : null;
  const showTravelWeather =
    Boolean(travelerLocation) &&
    Boolean(travelerTime) &&
    travelerTemp !== null &&
    typeof travelerCode === 'number';

  return (
    <div className="flex flex-col items-end gap-[clamp(4px,0.7vw,8px)]">
      <div className="flex items-center gap-[clamp(4px,0.5vw,8px)]">
        <WeatherIcon
          code={data.current.weather_code}
          style={{ color: 'var(--fd-accent)' }}
          size={
            isKiosk
              ? 'clamp(3rem, 4.8vw, 5.5rem)'
              : 'clamp(1.5rem, 3vw, 3rem)'
          }
        />
        <div className="flex flex-col items-end leading-tight">
          <div className="flex items-baseline gap-[clamp(6px,0.8vw,12px)]">
            <span
              className="font-bold tabular-nums"
              style={{
                color: 'var(--fd-text-1)',
                fontSize: isKiosk
                  ? 'clamp(3rem, 5vw, 5.5rem)'
                  : 'clamp(1.5rem, 3vw, 3rem)',
              }}
            >
              {temp}&deg;C
            </span>
            {isKiosk && data.daily && (
              <span
                className="tabular-nums"
                style={{
                  fontSize: 'clamp(1.1rem, 1.6vw, 1.45rem)',
                  lineHeight: 1,
                }}
              >
                <span style={{ color: 'var(--fd-accent)' }}>
                  {Math.round(data.daily.temperature_2m_max[0])}&deg;
                </span>
                <span style={{ color: 'var(--fd-text-2)', opacity: 0.6 }}>
                  {' '}/{' '}{Math.round(data.daily.temperature_2m_min[0])}&deg;
                </span>
              </span>
            )}
          </div>
          <span
            style={{
              color: 'var(--fd-text-2)',
              fontSize: isKiosk
                ? 'clamp(1.15rem,1.7vw,1.5rem)'
                : 'clamp(0.6rem,1vw,0.85rem)',
            }}
          >
            {description}
          </span>
        </div>
      </div>

      {showTravelWeather && travelerLocation && typeof travelerCode === 'number' && (
        <div
          className="flex items-center gap-[clamp(4px,0.5vw,6px)] opacity-60"
          style={{ color: 'var(--fd-text-2)' }}
        >
          <WeatherIcon
            code={travelerCode}
            size={
              isKiosk
                ? 'clamp(1.3rem, 1.9vw, 1.9rem)'
                : 'clamp(0.8rem, 1.2vw, 1.1rem)'
            }
          />
          <span
            className="tabular-nums"
            style={{
              fontSize: isKiosk
                ? 'clamp(1.05rem, 1.5vw, 1.35rem)'
                : 'clamp(0.6rem, 0.9vw, 0.8rem)',
            }}
          >
            {travelerTemp!}&deg;C
          </span>
          <span
            className="uppercase tracking-[0.06em]"
            style={{
              fontSize: isKiosk
                ? 'clamp(0.85rem, 1.2vw, 1.15rem)'
                : 'clamp(0.45rem, 0.7vw, 0.65rem)',
            }}
          >
            {travelerLocation}
          </span>
        </div>
      )}
    </div>
  );
});
