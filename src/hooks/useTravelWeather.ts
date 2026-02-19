import { useQuery } from '@tanstack/react-query';
import { fetchWeatherForLocation } from '../lib/api/openMeteo';
import type { PersonConfig } from '../lib/calendar/types';

export function useTravelWeather(traveler: PersonConfig | null) {
  const hasTravelLocation =
    traveler &&
    traveler.travelTimezone &&
    typeof traveler.travelLat === 'number' &&
    typeof traveler.travelLon === 'number';

  return useQuery({
    queryKey: [
      'weather',
      'travel',
      traveler?.id,
      traveler?.travelLat,
      traveler?.travelLon,
      traveler?.travelTimezone,
    ],
    queryFn: () =>
      fetchWeatherForLocation({
        latitude: traveler!.travelLat!,
        longitude: traveler!.travelLon!,
        timezone: traveler!.travelTimezone!,
      }),
    enabled: Boolean(hasTravelLocation),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
