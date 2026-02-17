import { useState, useEffect } from 'react';

export type SidebarMode = 'rotation' | 'priority';

export interface PriorityState {
  mode: SidebarMode;
  showTimers: boolean;
  rotationPaused: boolean;
}

/**
 * Derives sidebar display mode from timer state.
 * When timers are active, the sidebar switches to priority mode instantly.
 * When conditions clear, a 500ms debounce prevents flicker before
 * returning to "rotation" mode.
 */
export function usePriorityInterrupt(
  activeTimerCount: number,
  completedTimersCount: number,
): PriorityState {
  const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;
  const hasPriority = hasActiveTimers;

  const [debouncedMode, setDebouncedMode] = useState<SidebarMode>(
    hasPriority ? 'priority' : 'rotation',
  );

  useEffect(() => {
    if (hasPriority) {
      // Instant transition TO priority mode
      setDebouncedMode('priority');
      return;
    }

    // 500ms debounce when transitioning FROM priority TO rotation
    const timer = setTimeout(() => {
      setDebouncedMode('rotation');
    }, 500);

    return () => clearTimeout(timer);
  }, [hasPriority]);

  return {
    mode: debouncedMode,
    showTimers: hasActiveTimers,
    rotationPaused: debouncedMode === 'priority',
  };
}
