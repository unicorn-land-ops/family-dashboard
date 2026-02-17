import { useQuery } from '@tanstack/react-query';
import { fetchHoroscopes } from '../lib/api/horoscope';
import { HOROSCOPE_REFRESH_MS } from '../lib/constants';

/**
 * React Query wrapper for daily horoscopes (3 family signs).
 * Stale after 24 hours, refetches every 24 hours.
 * gcTime matches staleTime so cached data persists if API goes down.
 */
export function useHoroscope() {
  return useQuery({
    queryKey: ['horoscope', 'daily'],
    queryFn: fetchHoroscopes,
    staleTime: HOROSCOPE_REFRESH_MS,
    gcTime: HOROSCOPE_REFRESH_MS,
    refetchInterval: HOROSCOPE_REFRESH_MS,
    retry: 2,
  });
}
