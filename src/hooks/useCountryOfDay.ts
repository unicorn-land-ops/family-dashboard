import { useQuery } from '@tanstack/react-query';
import { fetchCountryOfDay, fetchCountryImage } from '../lib/api/countryOfDay';
import { COUNTRY_REFRESH_MS } from '../lib/constants';

/**
 * React Query wrapper for Country of the Day.
 * Stale after 24 hours, refetches every 24 hours.
 */
export function useCountryOfDay() {
  return useQuery({
    queryKey: ['country', 'daily'],
    queryFn: fetchCountryOfDay,
    staleTime: COUNTRY_REFRESH_MS,
    refetchInterval: COUNTRY_REFRESH_MS,
    retry: 2,
  });
}

export function useCountryImage(countryName: string | undefined) {
  return useQuery({
    queryKey: ['country-image', countryName],
    queryFn: () => fetchCountryImage(countryName!),
    enabled: !!countryName,
    staleTime: COUNTRY_REFRESH_MS,
    refetchInterval: false,
    retry: 1,
  });
}
