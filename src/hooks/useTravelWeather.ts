import { useQuery } from '@tanstack/react-query';
import { fetchWeatherForLocation } from '../lib/api/openMeteo';

export interface TravelTarget {
  id: string;
  label: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export function useTravelWeather(target: TravelTarget | null) {
  const hasTravelLocation =
    target &&
    target.timezone &&
    typeof target.latitude === 'number' &&
    typeof target.longitude === 'number';

  return useQuery({
    queryKey: [
      'weather',
      'travel',
      target?.id,
      target?.latitude,
      target?.longitude,
      target?.timezone,
    ],
    queryFn: () =>
      fetchWeatherForLocation({
        latitude: target!.latitude,
        longitude: target!.longitude,
        timezone: target!.timezone,
      }),
    enabled: Boolean(hasTravelLocation),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
