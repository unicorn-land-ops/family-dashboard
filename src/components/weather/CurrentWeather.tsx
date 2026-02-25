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
      <div className="flex items-end gap-[clamp(8px,1vw,16px)]">
        {showTravelWeather && travelerLocation && travelerTime && typeof travelerCode === 'number' && (
          <div className="rounded-md border border-cyan-300/35 bg-cyan-300/12 px-[clamp(6px,0.9vw,12px)] py-[clamp(5px,0.6vw,9px)]">
            <div className="flex items-center gap-[clamp(3px,0.5vw,7px)]">
              <WeatherIcon
                code={travelerCode}
                className="text-cyan-100"
                size={
                  isKiosk
                    ? 'clamp(1.7rem, 2.6vw, 3rem)'
                    : 'clamp(1.2rem, 2.1vw, 2.1rem)'
                }
              />
              <div className="flex flex-col items-end leading-tight">
                <span
                  className="font-semibold tabular-nums text-cyan-50"
                  style={{
                    fontSize: isKiosk
                      ? 'clamp(1.7rem, 2.8vw, 3rem)'
                      : 'clamp(1.15rem, 2.25vw, 2.25rem)',
                  }}
                >
                  {travelerTemp!}&deg;C
                </span>
                <span
                  className="tabular-nums text-cyan-100/90"
                  style={{
                    fontSize: isKiosk
                      ? 'clamp(0.72rem,1vw,0.92rem)'
                      : 'clamp(0.5rem,0.78vw,0.7rem)',
                  }}
                >
                  {travelerTime}
                </span>
              </div>
            </div>
            <div
              className="text-cyan-100/80 uppercase tracking-[0.08em] mt-1 text-right"
              style={{
                fontSize: isKiosk
                  ? 'clamp(0.66rem,0.95vw,0.9rem)'
                  : 'clamp(0.45rem,0.75vw,0.66rem)',
              }}
            >
              {travelerLocation}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
});
