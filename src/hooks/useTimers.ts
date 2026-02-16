import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import {
  fetchActiveTimers,
  createTimer,
  cancelTimer as cancelTimerApi,
  dismissTimer as dismissTimerApi,
} from '../lib/api/timers';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { Timer } from '../types/database';

const QUERY_KEY = ['timers'];

// --- Pure helper functions ---

export function getRemainingSeconds(timer: Timer): number {
  const endTime =
    new Date(timer.started_at).getTime() + timer.duration_seconds * 1000;
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function getTimerProgress(timer: Timer): number {
  if (timer.duration_seconds === 0) return 1;
  const remaining = getRemainingSeconds(timer);
  return 1 - remaining / timer.duration_seconds;
}

// --- Hook ---

export function useTimers() {
  const queryClient = useQueryClient();

  // Primary query: fetch active + recently completed timers
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveTimers,
    enabled: supabaseEnabled,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  // Realtime: invalidate cache when another device changes data
  useSupabaseRealtime({
    table: 'timers',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // --- Mutations ---

  const addTimerMutation = useMutation({
    mutationFn: ({ label, durationSeconds }: { label: string; durationSeconds: number }) =>
      createTimer(label, durationSeconds),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const cancelTimerMutation = useMutation({
    mutationFn: (id: string) => cancelTimerApi(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Timer[]>(QUERY_KEY);
      queryClient.setQueryData<Timer[]>(QUERY_KEY, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, cancelled: true } : t)),
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _id: string,
      context: { previous: Timer[] | undefined } | undefined,
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const dismissTimerMutation = useMutation({
    mutationFn: (id: string) => dismissTimerApi(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Timer[]>(QUERY_KEY);
      queryClient.setQueryData<Timer[]>(QUERY_KEY, (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _id: string,
      context: { previous: Timer[] | undefined } | undefined,
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // --- Computed lists ---

  const timers = query.data ?? [];
  const activeTimers = timers.filter(
    (t) => !t.cancelled && getRemainingSeconds(t) > 0,
  );
  const completedTimers = timers.filter(
    (t) => !t.cancelled && getRemainingSeconds(t) <= 0,
  );

  return {
    timers,
    activeTimers,
    completedTimers,
    activeCount: activeTimers.length,
    isLoading: query.isLoading,
    addTimer: (label: string, durationSeconds: number) =>
      addTimerMutation.mutate({ label, durationSeconds }),
    cancelTimer: (id: string) => cancelTimerMutation.mutate(id),
    dismissTimer: (id: string) => dismissTimerMutation.mutate(id),
  };
}
