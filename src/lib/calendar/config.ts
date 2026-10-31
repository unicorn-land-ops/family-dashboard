import type { PersonConfig } from './types';

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// `feed` names a calendar held by the family-voice worker (GET /cal/:feed). The secret iCal URLs
// used to be baked into this public bundle; they live in the worker's CAL_FEEDS secret since 31.10.2026.
export const CALENDAR_FEEDS: PersonConfig[] = [
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',
    feed: 'papa',
  },
  {
    id: 'papa-work',
    name: 'Papa',
    emoji: '\u{1F951}',
    feed: 'papa-work',
    isWorkCalendar: true,
  },
  {
    // Chore assignee only. VITE_CAL_DADDY is the shared "Culley.Haynes" calendar, where Papa's
    // trips live, so it's tagged Papa below (25.10.2026). ICS has no event creator to split it by.
    id: 'daddy',
    name: 'Daddy',
    emoji: '\u{1F36A}',
    feed: '',
  },
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',
    feed: 'culley-haynes',
    travelTimezone: import.meta.env.VITE_DADDY_TRAVEL_TIMEZONE || undefined,
    travelLocationName: import.meta.env.VITE_DADDY_TRAVEL_LOCATION || undefined,
    travelLat: parseOptionalNumber(import.meta.env.VITE_DADDY_TRAVEL_LAT),
    travelLon: parseOptionalNumber(import.meta.env.VITE_DADDY_TRAVEL_LON),
  },
  {
    id: 'daddy-work',
    name: 'Daddy',
    emoji: '\u{1F36A}',
    feed: 'daddy-work',
    isWorkCalendar: true,
  },
  {
    id: 'wren',
    name: 'Wren',
    emoji: '\u{1F338}',
    feed: 'wren',
  },
  {
    id: 'ellis',
    name: 'Ellis',
    emoji: '\u{1F96D}',
    feed: 'ellis',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '\u{1F3E0}',
    feed: 'family',
  },
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',
    feed: '', // TripIt: never configured
    isTravelCalendar: true,
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
