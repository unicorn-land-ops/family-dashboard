import { useEffect, useRef } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSubscriptionOptions {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPayload: (payload: any) => void;
}

/**
 * Generic hook that subscribes to postgres_changes on a specified table.
 * No-ops gracefully when Supabase is not configured.
 */
export function useSupabaseRealtime({
  table,
  event = '*',
  schema = 'public',
  filter,
  onPayload,
}: RealtimeSubscriptionOptions): void {
  // Stable reference for onPayload to avoid re-subscribing on callback identity change
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;

    const client = supabase; // narrowed non-null reference for cleanup
    const channelName = `${table}-changes-${event}${filter ? `-${filter}` : ''}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterConfig: any = {
      event,
      schema,
      table,
    };
    if (filter) {
      filterConfig.filter = filter;
    }

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        filterConfig,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          onPayloadRef.current(payload);
        },
      )
      .subscribe((status) => {
        console.log(`[useSupabaseRealtime] ${channelName}: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        // Use removeChannel (not just unsubscribe) to fully clean up
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, schema, filter]);
}
