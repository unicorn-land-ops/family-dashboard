import { useState, useEffect } from 'react';
import { useWeather } from './useWeather';

export type TimePhase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';

function parseISOToMinutes(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

function computePhase(nowMinutes: number, sunriseMin: number, sunsetMin: number): TimePhase {
  const dawnStart = sunriseMin - 60;
  const dawnEnd = sunriseMin + 30;
  const goldenStart = sunsetMin - 90;
  const duskEnd = sunsetMin + 90;

  if (nowMinutes >= dawnStart && nowMinutes < dawnEnd) return 'dawn';
  if (nowMinutes >= dawnEnd && nowMinutes < goldenStart) return 'day';
  if (nowMinutes >= goldenStart && nowMinutes < sunsetMin) return 'golden';
  if (nowMinutes >= sunsetMin && nowMinutes < duskEnd) return 'dusk';
  return 'night';
}

export function useTimeOfDay(): TimePhase {
  const { data: weather } = useWeather();

  const getPhase = (): TimePhase => {
    if (!weather?.daily?.sunrise?.[0] || !weather?.daily?.sunset?.[0]) {
      const hour = new Date().getHours();
      return hour >= 7 && hour < 17 ? 'day' : 'night';
    }
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMin = parseISOToMinutes(weather.daily.sunrise[0]);
    const sunsetMin = parseISOToMinutes(weather.daily.sunset[0]);
    return computePhase(nowMinutes, sunriseMin, sunsetMin);
  };

  const [phase, setPhase] = useState<TimePhase>(getPhase);

  useEffect(() => {
    setPhase(getPhase());

    const id = setInterval(() => {
      setPhase(getPhase());
    }, 60_000);

    return () => clearInterval(id);
  }, [weather?.daily?.sunrise?.[0], weather?.daily?.sunset?.[0]]);

  return phase;
}
