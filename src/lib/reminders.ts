import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from './utils/timeFormat';

export interface Reminder {
  text: string;
  /** Berlin date the reminder is for (YYYY-MM-DD). Shown until that day ends. */
  date: string;
  /** Optional Berlin HH:mm window in which it flashes, end exclusive. */
  flashFrom?: string;
  flashTo?: string;
}

// ponytail: static list, edit + push to add one. Move to a Supabase table if adding from the phone matters.
export const REMINDERS: Reminder[] = [
  { text: 'Wren: take Geldbeutel', date: '2026-10-14', flashFrom: '07:30', flashTo: '07:40' },
];

export function activeReminders(now: Date, list: Reminder[] = REMINDERS) {
  const today = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
  const time = formatInTimeZone(now, TIMEZONE, 'HH:mm');
  return list
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      ...r,
      flashing:
        r.date === today && !!r.flashFrom && !!r.flashTo && time >= r.flashFrom && time < r.flashTo,
    }));
}
