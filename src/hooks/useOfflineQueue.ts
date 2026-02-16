import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import type { ConnectionState } from './useConnectionStatus';

export interface QueuedMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = 'family_dashboard_offline_queue';

/** Read the current queue from localStorage */
export function getQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/** Append a mutation to the offline queue */
export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
  const queue = getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

/**
 * Flush all queued mutations against the Supabase client.
 * Failed items remain in the queue for retry.
 * No-ops when Supabase is not configured.
 */
export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  if (!supabaseEnabled || !supabase) {
    return { flushed: 0, failed: 0 };
  }

  const queue = getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  const failed: QueuedMutation[] = [];
  let flushed = 0;

  for (const mutation of queue) {
    try {
      let error: unknown = null;

      // Use type assertions for dynamic table operations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;

      switch (mutation.operation) {
        case 'insert': {
          const result = await client.from(mutation.table).insert(mutation.data);
          error = result.error;
          break;
        }
        case 'update': {
          const { id, ...rest } = mutation.data;
          const result = await client
            .from(mutation.table)
            .update(rest)
            .eq('id', id as string);
          error = result.error;
          break;
        }
        case 'delete': {
          const result = await client
            .from(mutation.table)
            .delete()
            .eq('id', mutation.data.id as string);
          error = result.error;
          break;
        }
      }

      if (error) {
        console.warn(`[OfflineQueue] Failed to flush mutation ${mutation.id}:`, error);
        failed.push(mutation);
      } else {
        flushed++;
      }
    } catch (err) {
      console.warn(`[OfflineQueue] Error flushing mutation ${mutation.id}:`, err);
      failed.push(mutation);
    }
  }

  // Keep only failed items in queue
  saveQueue(failed);

  return { flushed, failed: failed.length };
}

/**
 * Hook that auto-flushes the offline queue when connection status
 * transitions to 'connected'. Returns current queue length.
 */
export function useOfflineQueue(connectionStatus: ConnectionState): { queueLength: number } {
  const [queueLength, setQueueLength] = useState(() => getQueue().length);
  const prevStatusRef = useRef<ConnectionState>(connectionStatus);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = connectionStatus;

    // Flush when transitioning TO connected
    if (connectionStatus === 'connected' && prevStatus !== 'connected') {
      flushQueue().then((result) => {
        if (result.flushed > 0 || result.failed > 0) {
          console.log(
            `[OfflineQueue] Flushed: ${result.flushed}, Failed: ${result.failed}`,
          );
        }
        setQueueLength(getQueue().length);
      });
    }
  }, [connectionStatus]);

  // Also update queue length when enqueue may have been called externally
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(getQueue().length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return { queueLength };
}
