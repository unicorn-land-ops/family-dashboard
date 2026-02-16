import { useState, useEffect } from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

/**
 * Visual connection status indicator: colored dot + label.
 * Returns null when Supabase is disabled (no visual change to dashboard).
 */
export function ConnectionStatus() {
  const connectionStatus = useConnectionStatus();
  const { queueLength } = useOfflineQueue(connectionStatus);
  const [showLabel, setShowLabel] = useState(true);

  // Auto-hide label after 3 seconds when connected (reduce visual noise on kiosk)
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setTimeout(() => setShowLabel(false), 3000);
      return () => clearTimeout(timer);
    }
    // Show label for non-connected states
    setShowLabel(true);
  }, [connectionStatus]);

  // Don't render anything when Supabase is disabled
  if (connectionStatus === 'disabled') {
    return null;
  }

  const config = {
    connected: {
      dotClass: 'bg-green-500',
      label: 'Connected',
    },
    reconnecting: {
      dotClass: 'bg-yellow-500 animate-pulse',
      label: 'Reconnecting...',
    },
    offline: {
      dotClass: 'bg-red-500',
      label: queueLength > 0 ? `Offline (${queueLength} pending)` : 'Offline',
    },
  } as const;

  const { dotClass, label } = config[connectionStatus as keyof typeof config] ?? config.offline;

  return (
    <span className="flex items-center gap-1.5 text-xs text-text-secondary opacity-60">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
