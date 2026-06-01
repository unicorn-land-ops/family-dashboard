import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '../lib/supabase';
import { fetchEvents, addEvent, removeEvent, type NewEventInput } from '../lib/api/events';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { EventRow } from '../types/database';

const QUERY_KEY = ['events'];

/**
 * User-managed countdown events (Supabase `events` table).
 * Mirrors useGroceries: react-query + realtime + optimistic add/remove.
 * Degrades to an empty list when Supabase is unconfigured or the table
 * does not exist yet, so the static countdowns keep rendering regardless.
 */
export function useEvents() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchEvents,
    enabled: supabaseEnabled,
    staleTime: 30_000,
  });

  useSupabaseRealtime({
    table: 'events',
    onPayload: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const add = useMutation({
    mutationFn: (input: NewEventInput) => addEvent(input),
    onMutate: async (input: NewEventInput) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<EventRow[]>(QUERY_KEY);
      const optimistic: EventRow = {
        id: crypto.randomUUID(),
        label: input.label,
        emoji: input.emoji,
        event_date: input.eventDate,
        added_by: input.addedBy ?? null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<EventRow[]>(QUERY_KEY, (old = []) =>
        [...old, optimistic].sort((a, b) => a.event_date.localeCompare(b.event_date)),
      );
      return { previous };
    },
    onError: (_err: unknown, _input: NewEventInput, context: { previous: EventRow[] | undefined } | undefined) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeEvent(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<EventRow[]>(QUERY_KEY);
      queryClient.setQueryData<EventRow[]>(QUERY_KEY, (old = []) => old.filter((e) => e.id !== id));
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous: EventRow[] | undefined } | undefined) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    addEvent: (input: NewEventInput) => add.mutate(input),
    removeEvent: (id: string) => remove.mutate(id),
  };
}
