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
              ? 'clamp(2.2rem, 3.6vw, 4rem)'
              : 'clamp(1.5rem, 3vw, 3rem)'
          }
        />
        <div className="flex flex-col items-end leading-tight">
          <span
            className="font-bold tabular-nums"
            style={{
              color: 'var(--fd-text-1)',
              fontSize: isKiosk
                ? 'clamp(2.3rem, 3.8vw, 4.2rem)'
                : 'clamp(1.5rem, 3vw, 3rem)',
            }}
          >
            {temp}&deg;C
          </span>
          <span
            style={{
              color: 'var(--fd-text-2)',
              fontSize: isKiosk
                ? 'clamp(0.86rem,1.25vw,1.1rem)'
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
                ? 'clamp(1rem, 1.4vw, 1.4rem)'
                : 'clamp(0.8rem, 1.2vw, 1.1rem)'
            }
          />
          <span
            className="tabular-nums"
            style={{
              fontSize: isKiosk
                ? 'clamp(0.8rem, 1.1vw, 1rem)'
                : 'clamp(0.6rem, 0.9vw, 0.8rem)',
            }}
          >
            {travelerTemp!}&deg;C
          </span>
          <span
            className="uppercase tracking-[0.06em]"
            style={{
              fontSize: isKiosk
                ? 'clamp(0.65rem, 0.9vw, 0.85rem)'
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
