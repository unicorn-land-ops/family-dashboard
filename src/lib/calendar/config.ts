import type { PersonConfig } from './types';

export const CALENDAR_FEEDS: PersonConfig[] = [
  {
    id: 'papa',
    name: 'Papa',
    emoji: '\u{1F951}',
    calendarUrl: import.meta.env.VITE_CAL_PAPA ?? '',
    isWorkCalendar: true,
  },
  {
    id: 'daddy',
    name: 'Daddy',
    emoji: '\u{1F36A}',
    calendarUrl: import.meta.env.VITE_CAL_DADDY ?? '',
  },
  {
    id: 'wren',
    name: 'Wren',
    emoji: '\u{1F338}',
    calendarUrl: import.meta.env.VITE_CAL_WREN ?? '',
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
