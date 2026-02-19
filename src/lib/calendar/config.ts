import type { PersonConfig } from './types';

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const CALENDAR_FEEDS: PersonConfig[] = [
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',
    // Temporary swap: existing env values are reversed in deployment secrets.
    calendarUrl: import.meta.env.VITE_CAL_WREN ?? '',
    isWorkCalendar: true,
  },
  {
    id: 'daddy',
    name: 'Daddy',
    emoji: '\u{1F36A}',
    calendarUrl: import.meta.env.VITE_CAL_DADDY ?? '',
    travelTimezone: import.meta.env.VITE_DADDY_TRAVEL_TIMEZONE || undefined,
    travelLocationName: import.meta.env.VITE_DADDY_TRAVEL_LOCATION || undefined,
    travelLat: parseOptionalNumber(import.meta.env.VITE_DADDY_TRAVEL_LAT),
    travelLon: parseOptionalNumber(import.meta.env.VITE_DADDY_TRAVEL_LON),
  },
  {
    id: 'wren',
    name: 'Wren',
    emoji: '\u{1F338}',
    // Temporary swap: existing env values are reversed in deployment secrets.
    calendarUrl: import.meta.env.VITE_CAL_PAPA ?? '',
  },
  {
    id: 'ellis',
    name: 'Ellis',
    emoji: '\u{1F96D}',
    calendarUrl: import.meta.env.VITE_CAL_ELLIS ?? '',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '\u{1F3E0}',
    calendarUrl: import.meta.env.VITE_CAL_FAMILY ?? '',
  },
];

export const CORS_PROXY_URL: string = import.meta.env.VITE_CORS_PROXY_URL ?? '';

export const HOME_TIMEZONE = 'Europe/Berlin';

export function getPrimaryTraveler(): PersonConfig | null {
  return (
    CALENDAR_FEEDS.find(
      (feed) =>
        Boolean(
          feed.travelTimezone &&
            feed.travelLocationName &&
            typeof feed.travelLat === 'number' &&
            typeof feed.travelLon === 'number',
        ),
    ) ?? null
  );
}
