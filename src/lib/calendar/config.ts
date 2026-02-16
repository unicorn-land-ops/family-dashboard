import type { PersonConfig } from './types';

export const CALENDAR_FEEDS: PersonConfig[] = [
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F468}',
    calendarUrl: import.meta.env.VITE_CAL_PAPA ?? '',
    isWorkCalendar: true,
  },
  {
    id: 'daddy',
    name: 'Daddy',
    emoji: '\u{1F468}\u{200D}\u{1F9B0}',
    calendarUrl: import.meta.env.VITE_CAL_DADDY ?? '',
  },
  {
    id: 'wren',
    name: 'Wren',
    emoji: '\u{1F985}',
    calendarUrl: import.meta.env.VITE_CAL_WREN ?? '',
  },
  {
    id: 'ellis',
    name: 'Ellis',
    emoji: '\u{1F31F}',
    calendarUrl: import.meta.env.VITE_CAL_ELLIS ?? '',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '\u{1F468}\u{200D}\u{1F468}\u{200D}\u{1F467}\u{200D}\u{1F466}',
    calendarUrl: import.meta.env.VITE_CAL_FAMILY ?? '',
  },
];

export const CORS_PROXY_URL: string = import.meta.env.VITE_CORS_PROXY_URL ?? '';

export const HOME_TIMEZONE = 'Europe/Berlin';
