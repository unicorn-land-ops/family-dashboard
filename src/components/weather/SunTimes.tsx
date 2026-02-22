import React from 'react';
import { WiSunrise, WiSunset } from 'react-icons/wi';
import { useWeather } from '../../hooks/useWeather';

function formatSunTime(isoString: string): string {
  // Open-Meteo returns ISO 8601 like "2026-02-16T07:23"
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface SunTimesProps {
  variant?: 'default' | 'kiosk';
}

export const SunTimes = React.memo(function SunTimes({ variant = 'default' }: SunTimesProps) {
  const { data, isLoading, isError } = useWeather();
  const isKiosk = variant === 'kiosk';

  if (isLoading || isError || !data) {
    return null;
  }

  const sunrise = data.daily.sunrise[0];
  const sunset = data.daily.sunset[0];

  if (!sunrise || !sunset) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-[clamp(6px,1vw,12px)]"
      style={{
        fontSize: isKiosk
          ? 'clamp(0.82rem,1.18vw,1.02rem)'
          : 'clamp(0.65rem,1vw,0.85rem)',
      }}
    >
      <div className="flex items-center gap-0.5">
        <WiSunrise
          className="text-accent-gold"
          size={isKiosk ? 'clamp(1.2rem,1.8vw,1.9rem)' : 'clamp(1rem, 1.5vw, 1.5rem)'}
        />
        <span className="text-text-secondary tabular-nums">
          {formatSunTime(sunrise)}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <WiSunset
          className="text-accent-gold"
          size={isKiosk ? 'clamp(1.2rem,1.8vw,1.9rem)' : 'clamp(1rem, 1.5vw, 1.5rem)'}
        />
        <span className="text-text-secondary tabular-nums">
          {formatSunTime(sunset)}
        </span>
      </div>
    </div>
  );
});
