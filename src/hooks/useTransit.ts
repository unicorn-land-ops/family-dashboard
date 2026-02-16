import { useQuery } from '@tanstack/react-query';
import { fetchDepartures } from '../lib/api/bvgTransit';
import { TRANSIT_STALE_MS, TRANSIT_REFRESH_MS } from '../lib/constants';

/**
 * React Query wrapper for BVG departure data at Senefelderplatz.
 * Stale after 30 seconds, refetches every 60 seconds.
 */
export function useTransit() {
  return useQuery({
    queryKey: ['transit', 'senefelderplatz'],
    queryFn: fetchDepartures,
    staleTime: TRANSIT_STALE_MS,
    refetchInterval: TRANSIT_REFRESH_MS,
    retry: 2,
  });
}
