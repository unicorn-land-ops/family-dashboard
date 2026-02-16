import React from 'react';
import { useWeather } from '../../hooks/useWeather';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherInfo } from '../../lib/utils/weatherCodes';

export const CurrentWeather = React.memo(function CurrentWeather() {
  const { data, isLoading, isError } = useWeather();

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

  return (
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
  );
});
