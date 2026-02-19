import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useWeather } from '../../hooks/useWeather';
import { useTravelWeather, type TravelTarget } from '../../hooks/useTravelWeather';
import { useAutoTravelTarget } from '../../hooks/useAutoTravelTarget';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherInfo } from '../../lib/utils/weatherCodes';
import { getPrimaryTraveler } from '../../lib/calendar/config';
import { useInterval } from '../../hooks/useInterval';
import { useState } from 'react';

export const CurrentWeather = React.memo(function CurrentWeather() {
  const { data, isLoading, isError } = useWeather();
  const { data: autoTravelTarget } = useAutoTravelTarget();
  const manualTraveler = getPrimaryTraveler();
  const manualTravelTarget: TravelTarget | null =
    manualTraveler &&
    manualTraveler.travelTimezone &&
    typeof manualTraveler.travelLat === 'number' &&
    typeof manualTraveler.travelLon === 'number'
      ? {
          id: `manual-${manualTraveler.id}`,
          label: `${manualTraveler.emoji} ${manualTraveler.name}${manualTraveler.travelLocationName ? ` (${manualTraveler.travelLocationName})` : ''}`,
          timezone: manualTraveler.travelTimezone,
          latitude: manualTraveler.travelLat,
          longitude: manualTraveler.travelLon,
        }
      : null;
  const travelTarget = autoTravelTarget ?? manualTravelTarget;
  const { data: travelerWeather } = useTravelWeather(travelTarget);
  const [travelClock, setTravelClock] = useState(() => new Date());

  useInterval(() => {
    setTravelClock(new Date());
  }, travelTarget?.timezone ? 60_000 : null);

  if (isLoading) {
    return (
      <span className="text-text-secondary text-[clamp(0.75rem,1.5vw,1rem)]">
        Loading...
      </span>
    );
  }

  if (isError || !data) {
    return (
      <span className="text-text-secondary text-[clamp(0.75rem,1.5vw,1rem)]">
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
  const travelerLabel = travelTarget?.label ?? null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-[clamp(4px,0.5vw,8px)]">
        <WeatherIcon
          code={data.current.weather_code}
          className="text-accent-gold"
          size="clamp(1.5rem, 3vw, 3rem)"
        />
        <div className="flex flex-col items-end leading-tight">
          <span
            className="font-bold tabular-nums text-text-primary"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }}
          >
            {temp}&deg;C
          </span>
          <span className="text-text-secondary text-[clamp(0.6rem,1vw,0.85rem)]">
            {description}
          </span>
        </div>
      </div>

      {travelerLabel && travelerTime && travelerTemp !== null && typeof travelerCode === 'number' && (
        <div className="flex items-center gap-2 text-text-secondary text-[clamp(0.58rem,0.9vw,0.78rem)]">
          <span>{travelerLabel}</span>
          <span className="tabular-nums">{travelerTime}</span>
          <span className="tabular-nums">{travelerTemp}&deg;C</span>
          <WeatherIcon code={travelerCode} className="text-accent-gold" size="1.1em" />
        </div>
      )}
    </div>
  );
});
