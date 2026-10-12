import { describe, it, expect } from 'vitest';
import { activeReminders, type Reminder } from './reminders';

const list: Reminder[] = [
  { text: 'stickers', date: '2026-10-13', flashFrom: '08:26', flashTo: '08:36' },
];

describe('activeReminders', () => {
  it('shows the evening before, not flashing', () => {
    expect(activeReminders(new Date('2026-10-12T19:00:00Z'), list)).toEqual([
      { ...list[0], flashing: false },
    ]);
  });

  it('flashes 08:26–08:35 Berlin (CEST = UTC+2), not at 08:36', () => {
    expect(activeReminders(new Date('2026-10-13T06:25:59Z'), list)[0].flashing).toBe(false);
    expect(activeReminders(new Date('2026-10-13T06:26:00Z'), list)[0].flashing).toBe(true);
    expect(activeReminders(new Date('2026-10-13T06:35:59Z'), list)[0].flashing).toBe(true);
    expect(activeReminders(new Date('2026-10-13T06:36:00Z'), list)[0].flashing).toBe(false);
  });

  it('drops it once the day is over in Berlin', () => {
    expect(activeReminders(new Date('2026-10-13T21:59:00Z'), list)).toHaveLength(1);
    expect(activeReminders(new Date('2026-10-13T22:00:00Z'), list)).toHaveLength(0);
  });
});
