import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline' | 'disabled';

/**
 * Tracks the WebSocket connection state to Supabase realtime.
 * Returns 'disabled' when Supabase is not configured.
 * Handles mobile Safari background tab recovery via visibilitychange.
 */
export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>(
    supabaseEnabled ? 'reconnecting' : 'disabled',
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;

    const channel = supabase
      .channel('connection-monitor')
      .subscribe((channelStatus) => {
        switch (channelStatus) {
          case 'SUBSCRIBED':
            setStatus('connected');
            break;
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setStatus('offline');
            break;
          case 'CLOSED':
            setStatus('reconnecting');
            break;
        }
      });

    channelRef.current = channel;

    // Mobile Safari background tab recovery
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && supabase) {
        setStatus('reconnecting');
        supabase.realtime.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return status;
}
