import { formatInTimeZone } from 'date-fns-tz';

export const TIMEZONE = 'Europe/Berlin';

/** Returns time as HH:mm (e.g., "14:30") */
export function formatBerlinTime(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'HH:mm');
}

/** Returns time as HH:mm:ss (e.g., "14:30:45") */
export function formatBerlinTimeWithSeconds(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'HH:mm:ss');
}

/** Returns date in English long format (e.g., "Monday, February 16, 2026") */
export function formatBerlinDate(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'EEEE, MMMM d, yyyy');
}

/** Returns date in short format (e.g., "Mon, Feb 16") */
export function formatBerlinDateShort(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'EEE, MMM d');
}
