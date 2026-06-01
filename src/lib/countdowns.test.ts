import { describe, it, expect } from 'vitest';
import {
  computeEaster,
  getUpcomingCountdowns,
  COUNTDOWN_EVENTS,
  type CountdownEvent,
} from './countdowns';

// ---------------------------------------------------------------------------
// computeEaster — Anonymous Gregorian algorithm (Meeus-Jones-Butcher)
// ---------------------------------------------------------------------------
describe('computeEaster', () => {
  it('returns April 20, 2025', () => {
    const easter = computeEaster(2025);
    expect(easter.getFullYear()).toBe(2025);
    expect(easter.getMonth()).toBe(3); // 0-indexed: 3 = April
    expect(easter.getDate()).toBe(20);
  });

  it('returns April 5, 2026', () => {
    const easter = computeEaster(2026);
    expect(easter.getFullYear()).toBe(2026);
    expect(easter.getMonth()).toBe(3); // April
    expect(easter.getDate()).toBe(5);
  });

  it('returns March 28, 2027', () => {
    const easter = computeEaster(2027);
    expect(easter.getFullYear()).toBe(2027);
    expect(easter.getMonth()).toBe(2); // 0-indexed: 2 = March
    expect(easter.getDate()).toBe(28);
  });

  it('returns a Date instance', () => {
    expect(computeEaster(2026)).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// getUpcomingCountdowns — filtering, sorting, limiting
// ---------------------------------------------------------------------------
describe('getUpcomingCountdowns', () => {
  // Fixed "today" for deterministic tests: 2026-03-01 (March 1, 2026)
  const TODAY = new Date('2026-03-01T12:00:00');

  const mockEvents: CountdownEvent[] = [
    { id: 'past-1', emoji: '🎉', label: 'Past Event', date: new Date('2026-02-01') },
    { id: 'today-1', emoji: '🎂', label: 'Same Day Event', date: new Date('2026-03-01') },
    { id: 'soon-1', emoji: '🐣', label: 'In 5 Days', date: new Date('2026-03-06') },
    { id: 'soon-2', emoji: '🌸', label: 'In 10 Days', date: new Date('2026-03-11') },
    { id: 'soon-3', emoji: '☀️', label: 'In 30 Days', date: new Date('2026-03-31') },
    { id: 'soon-4', emoji: '🎄', label: 'In 60 Days', date: new Date('2026-04-30') },
    { id: 'soon-5', emoji: '🎃', label: 'In 90 Days', date: new Date('2026-05-30') },
  ];

  it('excludes past events (daysRemaining < 0)', () => {
    const result = getUpcomingCountdowns(mockEvents, 10, TODAY);
    const ids = result.map((e) => e.id);
    expect(ids).not.toContain('past-1');
  });

  it('includes same-day events with daysRemaining = 0', () => {
    const result = getUpcomingCountdowns(mockEvents, 10, TODAY);
    const todayEvent = result.find((e) => e.id === 'today-1');
    expect(todayEvent).toBeDefined();
    expect(todayEvent?.daysRemaining).toBe(0);
  });

  it('returns events sorted ascending by daysRemaining', () => {
    const result = getUpcomingCountdowns(mockEvents, 10, TODAY);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].daysRemaining).toBeGreaterThanOrEqual(result[i - 1].daysRemaining);
    }
  });

  it('limits results to 4 by default', () => {
    const result = getUpcomingCountdowns(mockEvents, undefined, TODAY);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('limits results to the provided count', () => {
    const result = getUpcomingCountdowns(mockEvents, 2, TODAY);
    expect(result.length).toBe(2);
  });

  it('accepts count = 6 and returns up to 6 results', () => {
    const result = getUpcomingCountdowns(mockEvents, 6, TODAY);
    expect(result.length).toBe(6); // 1 today + 5 future = 6 (past excluded)
  });

  it('returns empty array when all events are past', () => {
    const allPast: CountdownEvent[] = [
      { id: 'p1', emoji: '🎉', label: 'Past 1', date: new Date('2025-01-01') },
      { id: 'p2', emoji: '🎉', label: 'Past 2', date: new Date('2025-06-15') },
    ];
    const result = getUpcomingCountdowns(allPast, 4, TODAY);
    expect(result).toHaveLength(0);
  });

  it('each result item has daysRemaining as a number', () => {
    const result = getUpcomingCountdowns(mockEvents, 4, TODAY);
    for (const event of result) {
      expect(typeof event.daysRemaining).toBe('number');
    }
  });

  it('neareast event is first in list', () => {
    const result = getUpcomingCountdowns(mockEvents, 4, TODAY);
    expect(result[0].daysRemaining).toBe(0); // today-1 is nearest
    expect(result[1].id).toBe('soon-1'); // 5 days
  });
});

// ---------------------------------------------------------------------------
// COUNTDOWN_EVENTS — shape and content validation
// ---------------------------------------------------------------------------
describe('COUNTDOWN_EVENTS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(COUNTDOWN_EVENTS)).toBe(true);
    expect(COUNTDOWN_EVENTS.length).toBeGreaterThan(0);
  });

  it('each event has required shape: id, emoji, label, date', () => {
    for (const event of COUNTDOWN_EVENTS) {
      expect(typeof event.id).toBe('string');
      expect(event.id.length).toBeGreaterThan(0);
      expect(typeof event.emoji).toBe('string');
      expect(typeof event.label).toBe('string');
      expect(event.date).toBeInstanceOf(Date);
    }
  });

  it('includes at least 2 Easter entries (current + next year)', () => {
    const easterEvents = COUNTDOWN_EVENTS.filter((e) => e.id.startsWith('easter-'));
    expect(easterEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('includes Berlin school holiday entries', () => {
    const berlinEvents = COUNTDOWN_EVENTS.filter((e) => e.id.startsWith('berlin-'));
    // Config currently carries the 2 forward-looking 2026 entries (Summer Break,
    // School Starts). Older/past breaks were trimmed; assertion matches reality.
    expect(berlinEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('includes Ellis camp countdowns', () => {
    const camps = COUNTDOWN_EVENTS.filter((e) => e.id.includes('camp'));
    expect(camps.length).toBeGreaterThanOrEqual(2);

    const horse = COUNTDOWN_EVENTS.find((e) => e.id === 'ellis-horse-camp-2026');
    expect(horse).toBeDefined();
    expect(horse?.date.getFullYear()).toBe(2026);
    expect(horse?.date.getMonth()).toBe(6); // 0-indexed: 6 = July
    expect(horse?.date.getDate()).toBe(18);

    const beach = COUNTDOWN_EVENTS.find((e) => e.id === 'ellis-beach-camp-2026');
    expect(beach).toBeDefined();
    expect(beach?.date.getFullYear()).toBe(2026);
    expect(beach?.date.getMonth()).toBe(6); // July
    expect(beach?.date.getDate()).toBe(13);
  });

  it('includes family birthdays', () => {
    const birthdayEvents = COUNTDOWN_EVENTS.filter((e) => e.id.includes('birthday'));
    expect(birthdayEvents.length).toBeGreaterThanOrEqual(4);
  });

  it('includes Halloween and Christmas as annual events', () => {
    const halloween = COUNTDOWN_EVENTS.find((e) => e.id.includes('halloween'));
    const christmas = COUNTDOWN_EVENTS.find((e) => e.id.includes('christmas'));
    expect(halloween).toBeDefined();
    expect(christmas).toBeDefined();
  });

  it('all event dates are valid Date instances (not Invalid Date)', () => {
    for (const event of COUNTDOWN_EVENTS) {
      expect(event.date.getTime()).not.toBeNaN();
    }
  });

  it('no two events share the same id', () => {
    const ids = COUNTDOWN_EVENTS.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
