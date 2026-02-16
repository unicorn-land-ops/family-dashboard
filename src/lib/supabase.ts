import { createClient, type SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when both Supabase env vars are present and non-empty */
export const supabaseEnabled =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0;

/**
 * Supabase client singleton.
 * Returns null when env vars are missing — all downstream hooks should
 * check supabaseEnabled before attempting subscriptions or queries.
 */
function createSupabaseClient(): SupabaseClientType<Database> | null {
  if (!supabaseEnabled) return null;

  const client = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    realtime: {
      // Web Worker heartbeats for mobile Safari background tab resilience
      worker: true,
      heartbeatCallback: (status: string) => {
        if (status === 'disconnected') {
          client.realtime.connect();
        }
      },
    },
  });

  return client;
}

export const supabase = createSupabaseClient();

/** Re-export the Supabase client type for consumers that need to type-check */
export type SupabaseClient = SupabaseClientType<Database>;
