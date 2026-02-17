import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import {
  fetchChores,
  fetchRecentCompletions,
  addChore,
  completeChore,
  uncompleteChore,
  deactivateChore,
} from '../lib/api/chores';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { getChoreProgress } from '../lib/choreSchedule';
import type { Chore, ChoreCompletion } from '../types/database';

const CHORES_KEY = ['chores'];
const COMPLETIONS_KEY = ['chore-completions'];

export function useChores() {
  const queryClient = useQueryClient();

  // --- Queries ---

  const choresQuery = useQuery({
    queryKey: CHORES_KEY,
    queryFn: fetchChores,
    enabled: supabaseEnabled,
    staleTime: 30_000,
  });

  const completionsQuery = useQuery({
    queryKey: COMPLETIONS_KEY,
    queryFn: fetchRecentCompletions,
    enabled: supabaseEnabled,
    staleTime: 30_000,
  });

  // --- Realtime subscriptions ---

  useSupabaseRealtime({
    table: 'chores',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: CHORES_KEY });
    },
  });

  useSupabaseRealtime({
    table: 'chore_completions',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY });
    },
  });

  // --- Mutations ---

  const addChoreMutation = useMutation({
    mutationFn: ({ title, assignedTo, schedule }: { title: string; assignedTo: string | null; schedule: 'daily' | 'weekly' | 'once' }) =>
      addChore(title, assignedTo, schedule),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHORES_KEY });
    },
  });

  const completeChoreMutation = useMutation({
    mutationFn: ({ choreId, completedBy }: { choreId: string; completedBy: string }) =>
      completeChore(choreId, completedBy),
    onMutate: async ({ choreId, completedBy }: { choreId: string; completedBy: string }) => {
      await queryClient.cancelQueries({ queryKey: COMPLETIONS_KEY });
      const previous = queryClient.getQueryData<ChoreCompletion[]>(COMPLETIONS_KEY);

      const optimistic: ChoreCompletion = {
        id: crypto.randomUUID(),
        chore_id: choreId,
        completed_by: completedBy,
        completed_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ChoreCompletion[]>(COMPLETIONS_KEY, (old = []) => [optimistic, ...old]);

      return { previous };
    },
    onError: (_err: unknown, _vars: { choreId: string; completedBy: string }, context: { previous: ChoreCompletion[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(COMPLETIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY });
    },
  });

  const uncompleteChoreMutation = useMutation({
    mutationFn: (completionId: string) => uncompleteChore(completionId),
    onMutate: async (completionId: string) => {
      await queryClient.cancelQueries({ queryKey: COMPLETIONS_KEY });
      const previous = queryClient.getQueryData<ChoreCompletion[]>(COMPLETIONS_KEY);
      queryClient.setQueryData<ChoreCompletion[]>(COMPLETIONS_KEY, (old = []) =>
        old.filter((c) => c.id !== completionId),
      );
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous: ChoreCompletion[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(COMPLETIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY });
    },
  });

  const deactivateChoreMutation = useMutation({
    mutationFn: (id: string) => deactivateChore(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: CHORES_KEY });
      const previous = queryClient.getQueryData<Chore[]>(CHORES_KEY);
      queryClient.setQueryData<Chore[]>(CHORES_KEY, (old = []) =>
        old.filter((chore) => chore.id !== id),
      );
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous: Chore[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(CHORES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHORES_KEY });
    },
  });

  // --- Derived state ---

  const chores = choresQuery.data ?? [];
  const completions = completionsQuery.data ?? [];
  const { completed: completedCount, total: totalCount } = getChoreProgress(chores, completions);

  return {
    chores,
    completions,
    completedCount,
    totalCount,
    isLoading: choresQuery.isLoading || completionsQuery.isLoading,
    error: choresQuery.error || completionsQuery.error,
    addChore: (title: string, assignedTo: string | null, schedule: 'daily' | 'weekly' | 'once') =>
      addChoreMutation.mutate({ title, assignedTo, schedule }),
    completeChore: (choreId: string, completedBy: string) =>
      completeChoreMutation.mutate({ choreId, completedBy }),
    uncompleteChore: (completionId: string) =>
      uncompleteChoreMutation.mutate(completionId),
    deactivateChore: (id: string) =>
      deactivateChoreMutation.mutate(id),
  };
}
