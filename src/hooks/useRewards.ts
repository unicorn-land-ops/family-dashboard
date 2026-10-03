import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import { fetchRewardsState, redeemReward } from '../lib/api/rewards';
import { balanceOf } from '../lib/points';

// Nested under useChores' ['chore-completions'] key on purpose: every
// completion insert/delete/realtime event already invalidates that prefix,
// so balances refresh with no extra realtime channel.
const REWARDS_KEY = ['chore-completions', 'rewards'];

export function useRewards() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: REWARDS_KEY,
    queryFn: fetchRewardsState,
    enabled: supabaseEnabled,
    staleTime: 30_000,
    // Picks up redemptions made by voice / another phone.
    // ponytail: polling, add a reward_redemptions realtime channel if 60s feels slow.
    refetchInterval: 60_000,
  });

  const redeem = useMutation({
    mutationFn: ({ rewardId, person }: { rewardId: string; person: string }) =>
      redeemReward(rewardId, person),
    onSettled: () => queryClient.invalidateQueries({ queryKey: REWARDS_KEY }),
  });

  const state = query.data ?? null;

  return {
    /** False until the rewards migration has run (or while loading). */
    enabled: state !== null,
    rewards: state?.rewards ?? [],
    balanceOf: (person: string) => balanceOf(state?.balances ?? [], person),
    redeem: (rewardId: string, person: string) => redeem.mutate({ rewardId, person }),
    isRedeeming: redeem.isPending,
  };
}
