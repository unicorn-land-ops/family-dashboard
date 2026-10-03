import { describe, it, expect } from 'vitest';
import { bestMatch, normalize } from './match';

const chores = [
  { title: '🦷 Brush teeth' },
  { title: 'Spülmaschine ausräumen' },
  { title: 'Feed the cat' },
  { title: 'Make bed' },
  { title: 'Make bed and tidy room' },
];

const pick = (q: string) => bestMatch(q, chores)?.title ?? null;

describe('normalize', () => {
  it('lowercases, strips accents, ß and emoji', () => {
    expect(normalize('🦷 Brush TEETH!')).toBe('brush teeth');
    expect(normalize('Spülmaschine ausräumen')).toBe('spulmaschine ausraumen');
    expect(normalize('Straße')).toBe('strasse');
  });
});

describe('bestMatch', () => {
  it('matches case-insensitively and ignores emoji', () => {
    expect(pick('brush teeth')).toBe('🦷 Brush teeth');
  });

  it('matches startsWith / contains', () => {
    expect(pick('feed')).toBe('Feed the cat');
    expect(pick('cat')).toBe('Feed the cat');
  });

  it('matches German without umlauts (Siri dictation varies)', () => {
    expect(pick('spülmaschine')).toBe('Spülmaschine ausräumen');
    expect(pick('spulmaschine')).toBe('Spülmaschine ausräumen');
  });

  it('prefers the shorter title on ties', () => {
    expect(pick('make bed')).toBe('Make bed');
  });

  it('matches a sentence that contains the title', () => {
    expect(pick('I did make bed already')).toBe('Make bed');
  });

  it('matches by word overlap in any order', () => {
    expect(pick('teeth brushed')).toBe('🦷 Brush teeth');
  });

  it('returns null for nothing similar', () => {
    expect(pick('walk the dog')).toBe(null);
    expect(pick('')).toBe(null);
  });
});
