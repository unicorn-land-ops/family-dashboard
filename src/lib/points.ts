// Points + rewards maths. No imports on purpose: voice-worker/ imports this too.
//
// The balance itself is summed in SQL (points_balances view) because PostgREST
// caps responses at 1000 rows. This module turns those totals into what the
// UI and the voice replies say.

export interface BalanceRow {
  person: string;
  earned: number;
  spent: number;
  balance?: number;
}

export interface RewardLike {
  title: string;
  cost: number;
  emoji?: string;
  is_active?: boolean;
}

/** Balance = earned − spent. A person with no row has 0. */
export function balanceOf(rows: BalanceRow[], person: string): number {
  const row = rows.find((r) => r.person === person);
  if (!row) return 0;
  return (Number(row.earned) || 0) - (Number(row.spent) || 0);
}

/**
 * The cheapest active reward the person can't afford yet, or null when they
 * can afford every reward (or there are none).
 */
export function nextReward<R extends RewardLike>(balance: number, rewards: R[]): R | null {
  const ahead = rewards
    .filter((r) => r.is_active !== false && r.cost > balance)
    .sort((a, b) => a.cost - b.cost);
  return ahead[0] ?? null;
}

/** 0..1 progress toward a reward. */
export function progressTo(balance: number, cost: number): number {
  if (cost <= 0) return 1;
  return Math.max(0, Math.min(1, balance / cost));
}

export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}
