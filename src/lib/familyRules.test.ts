import { describe, it, expect } from 'vitest';
import { bedtime, hasSchool, isWeekendMode, kitFor, wear, u2Disruption, berlinPublicHolidays } from './familyRules';
import type { CalendarEvent } from './calendar/types';

const schulfrei = (kid: string, iso: string): CalendarEvent => ({
  id: iso, summary: 'Schulfrei', startTime: new Date(`${iso}T00:00`), endTime: new Date(`${iso}T23:59`),
  isAllDay: true, persons: [kid], isSchulfrei: true,
});

describe('bedtimes (school night = school tomorrow)', () => {
  it('Thursday is a school night', () => {
    expect(bedtime('ellis', '2026-10-15')).toBe('19:30');
    expect(bedtime('wren', '2026-10-15')).toBe('20:30');
  });
  it('Friday is not (Saturday off)', () => {
    expect(bedtime('ellis', '2026-11-06')).toBe('20:30');
    expect(bedtime('wren', '2026-11-06')).toBe('21:30');
  });
  it('Sunday is a school night outside Ferien', () => {
    expect(bedtime('ellis', '2026-11-08')).toBe('19:30');
  });
  it('Sunday 18.10 is not: Herbstferien start Monday', () => {
    expect(bedtime('ellis', '2026-10-18')).toBe('20:30');
  });
  it('last day of Herbstferien (Sat 31.10) → Sunday free; Sunday 01.11 → school Monday', () => {
    expect(bedtime('wren', '2026-10-31')).toBe('21:30');
    expect(bedtime('wren', '2026-11-01')).toBe('20:30');
  });
  it('the night before a public holiday is free (Sun 07.03.2027 → Mon 08.03 Frauentag)', () => {
    expect(bedtime('ellis', '2027-03-07')).toBe('20:30');
    expect(berlinPublicHolidays(2027).has('2027-03-08')).toBe(true);
  });
  it('a Schulfrei in one kid’s calendar only frees that kid', () => {
    const ev = [schulfrei('ellis', '2026-11-12')];
    expect(bedtime('ellis', '2026-11-11', ev)).toBe('20:30');
    expect(bedtime('wren', '2026-11-11', ev)).toBe('20:30');
  });
});

describe('weekend mode and kit', () => {
  it('both kids on Herbstferien = weekend mode; one kid schulfrei = not', () => {
    expect(isWeekendMode('2026-10-19')).toBe(true);
    expect(isWeekendMode('2026-11-12', [schulfrei('ellis', '2026-11-12')])).toBe(false);
    expect(isWeekendMode('2026-10-17')).toBe(true);
    expect(isWeekendMode('2026-10-15')).toBe(false);
  });
  it('kit days: Mon both, Wed badminton + swimming, Thu Wren sport, Fri nothing, none in Ferien', () => {
    expect(kitFor('2026-11-02').map((k) => k.emoji).join('')).toBe('🃏👟');
    expect(kitFor('2026-11-04').map((k) => k.label).join()).toBe('Badminton,Schwimmzeug');
    expect(kitFor('2026-10-15').map((k) => k.kid).join()).toBe('wren');
    expect(kitFor('2026-11-06')).toEqual([]);
    expect(kitFor('2026-10-21')).toEqual([]);
    expect(hasSchool('wren', '2026-10-03')).toBe(false);
  });
});

describe('wear', () => {
  it('7° is the coat line, rain ≥40% adds an umbrella', () => {
    expect(wear(7, 0).map((w) => w.emoji).join('')).toBe('🧥🧣🧤');
    expect(wear(8, 0)).toHaveLength(1);
    expect(wear(12, 40).at(-1)?.emoji).toBe('☔');
    expect(wear(25, 39).map((w) => w.emoji).join('')).toBe('🩳');
  });
});

describe('u2Disruption', () => {
  const dep = (remarks: { type: string; text: string; summary?: string }[], delay = 0, name = 'U2') => ({ line: { name }, delay, remarks });
  it('ignores lifts, flags real disruptions and 5+ min delays', () => {
    expect(u2Disruption([dep([{ type: 'warning', text: 'Aufzug außer Betrieb' }])])).toBeNull();
    expect(u2Disruption([dep([{ type: 'warning', summary: 'Störung', text: 'Ersatzverkehr mit Bus' }])])).toBe('Störung');
    expect(u2Disruption([dep([], 420)])).toBe('U2 +7 Min');
    expect(u2Disruption([dep([], 120)])).toBeNull();
  });
});
