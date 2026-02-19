import { useMemo } from 'react';
import { getPrimaryTraveler } from '../lib/calendar/config';
import { useAutoTravelTarget } from './useAutoTravelTarget';
import type { TravelTarget } from './useTravelWeather';

export function useTravelTarget(): TravelTarget | null {
  const { data: autoTravelTarget } = useAutoTravelTarget();
  const manualTraveler = getPrimaryTraveler();

  const manualTravelTarget: TravelTarget | null = useMemo(() => {
    if (
      !manualTraveler ||
      !manualTraveler.travelTimezone ||
      typeof manualTraveler.travelLat !== 'number' ||
      typeof manualTraveler.travelLon !== 'number'
    ) {
      return null;
    }

    return {
      id: `manual-${manualTraveler.id}`,
      label: `${manualTraveler.emoji} ${manualTraveler.name}${manualTraveler.travelLocationName ? ` (${manualTraveler.travelLocationName})` : ''}`,
      timezone: manualTraveler.travelTimezone,
      latitude: manualTraveler.travelLat,
      longitude: manualTraveler.travelLon,
    };
  }, [manualTraveler]);

  return autoTravelTarget ?? manualTravelTarget;
}
