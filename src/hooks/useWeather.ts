import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '../lib/api/openMeteo';

/**
 * React Query wrapper for Open-Meteo weather data.
 * Stale after 5 minutes, refetches every 15 minutes.
 */
export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'berlin'],
    queryFn: fetchWeather,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}
