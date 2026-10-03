import { supabase } from '../supabase';
import type { PointsBalance, Reward } from '../../types/database';

export interface RewardsState {
  rewards: Reward[];
  balances: PointsBalance[];
}

// Postgres / PostgREST codes for "that table, view or column isn't there".
const MISSING_SCHEMA = new Set(['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205']);

/**
 * Rewards + per-person balances. Resolves to null when the rewards migration
 * hasn't been run yet, so callers can hide the rewards UI and keep chores working.
 */
export async function fetchRewardsState(): Promise<RewardsState | null> {
  if (!supabase) return null;
  const [rewards, balances] = await Promise.all([
    supabase.from('rewards').select('*').eq('is_active', true).order('cost', { ascending: true }),
    supabase.from('points_balances').select('*'),
  ]);
  for (const { error } of [rewards, balances]) {
    if (error && MISSING_SCHEMA.has(error.code)) return null;
    if (error) throw error;
  }
  return { rewards: rewards.data ?? [], balances: balances.data ?? [] };
}

export async function redeemReward(rewardId: string, redeemedBy: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('reward_redemptions')
    .insert({ reward_id: rewardId, redeemed_by: redeemedBy });
  if (error) throw error;
}
