import React from 'react';
import { WeatherIcon } from '../weather/WeatherIcon';

interface WeatherBadgeProps {
  high: number;
  low: number;
  weatherCode: number;
}

export const WeatherBadge = React.memo(function WeatherBadge({
  high,
  low,
  weatherCode,
}: WeatherBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-text-secondary text-[clamp(11px,0.8vw,14px)]">
      <WeatherIcon code={weatherCode} size="1.2em" />
      <span>
        {Math.round(high)}&deg;/{Math.round(low)}&deg;
      </span>
    </div>
  );
});
