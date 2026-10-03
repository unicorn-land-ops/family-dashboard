import { describe, it, expect } from 'vitest';
import { balanceOf, nextReward, progressTo, canAfford } from './points';

const rows = [
  { person: 'ellis', earned: 30, spent: 15 },
  { person: 'wren', earned: 12, spent: 0 },
  { person: 'papa', earned: 5, spent: 10 },
];

const rewards = [
  { title: 'Cinema night', cost: 50, emoji: '🎬', is_active: true },
  { title: 'Ice cream', cost: 15, emoji: '🍦', is_active: true },
  { title: 'Screen time', cost: 20, emoji: '📱', is_active: true },
  { title: 'Friday game', cost: 10, emoji: '🎮', is_active: true },
  { title: 'Retired', cost: 16, emoji: '❌', is_active: false },
];

describe('balanceOf', () => {
  it('is earned minus spent', () => {
    expect(balanceOf(rows, 'ellis')).toBe(15);
    expect(balanceOf(rows, 'wren')).toBe(12);
  });

  it('is 0 for someone with no completions or redemptions', () => {
    expect(balanceOf(rows, 'daddy')).toBe(0);
    expect(balanceOf([], 'ellis')).toBe(0);
  });

  it('can go negative (e.g. a reward was later made pricier)', () => {
    expect(balanceOf(rows, 'papa')).toBe(-5);
  });

  it('copes with numeric strings from PostgREST bigint sums', () => {
    expect(balanceOf([{ person: 'ellis', earned: '7' as unknown as number, spent: '2' as unknown as number }], 'ellis')).toBe(5);
  });
});

describe('nextReward', () => {
  it('picks the cheapest active reward still out of reach', () => {
    expect(nextReward(12, rewards)?.title).toBe('Ice cream');
    expect(nextReward(0, rewards)?.title).toBe('Friday game');
  });

  it('skips inactive rewards', () => {
    expect(nextReward(15, rewards)?.title).toBe('Screen time');
  });

  it('returns null when everything is affordable', () => {
    expect(nextReward(50, rewards)).toBeNull();
    expect(nextReward(5, [])).toBeNull();
  });
});

describe('progressTo / canAfford', () => {
  it('clamps progress to 0..1', () => {
    expect(progressTo(5, 10)).toBe(0.5);
    expect(progressTo(-3, 10)).toBe(0);
    expect(progressTo(30, 10)).toBe(1);
    expect(progressTo(3, 0)).toBe(1);
  });

  it('affords at exactly the cost', () => {
    expect(canAfford(15, 15)).toBe(true);
    expect(canAfford(14, 15)).toBe(false);
  });
});
