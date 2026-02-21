import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import {
  fetchGroceries,
  addGrocery,
  toggleGrocery,
  removeGrocery,
  clearCheckedGroceries,
} from '../lib/api/groceries';
import { toPreferredGroceryName } from '../lib/grocery/preferences';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { Grocery } from '../types/database';

const QUERY_KEY = ['groceries'];

export function useGroceries() {
  const queryClient = useQueryClient();

  // Primary query: fetch all grocery items
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchGroceries,
    enabled: supabaseEnabled,
    staleTime: 30_000,
  });

  // Realtime: invalidate cache when another device changes data
  useSupabaseRealtime({
    table: 'groceries',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // --- Mutations with optimistic updates ---

  const addItem = useMutation({
    mutationFn: (name: string) => addGrocery(name),
    onMutate: async (rawName: string) => {
      const name = toPreferredGroceryName(rawName);
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);

      const optimistic: Grocery = {
        id: crypto.randomUUID(),
        name,
        checked: false,
        added_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) => [optimistic, ...old]);

      return { previous };
    },
    onError: (_err: unknown, _name: string, context: { previous: Grocery[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const toggleItem = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => toggleGrocery(id, checked),
    onMutate: async ({ id, checked }: { id: string; checked: boolean }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);
      queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, checked } : item)),
      );
      return { previous };
    },
    onError: (_err: unknown, _vars: { id: string; checked: boolean }, context: { previous: Grocery[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => removeGrocery(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);
      queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) =>
        old.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous: Grocery[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const clearChecked = useMutation({
    mutationFn: () => clearCheckedGroceries(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Grocery[]>(QUERY_KEY);
      queryClient.setQueryData<Grocery[]>(QUERY_KEY, (old = []) =>
        old.filter((item) => !item.checked),
      );
      return { previous };
    },
    onError: (_err: unknown, _vars: void, context: { previous: Grocery[] | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addItem: (name: string) => addItem.mutate(toPreferredGroceryName(name)),
    toggleItem: (id: string, checked: boolean) => toggleItem.mutate({ id, checked }),
    removeItem: (id: string) => removeItemMutation.mutate(id),
    clearChecked: () => clearChecked.mutate(),
    uncheckedCount: (query.data ?? []).filter((g) => !g.checked).length,
  };
}
