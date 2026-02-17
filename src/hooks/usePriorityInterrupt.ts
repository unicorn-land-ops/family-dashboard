import { useState, useEffect } from 'react';

export type SidebarMode = 'rotation' | 'priority';

export interface PriorityState {
  mode: SidebarMode;
  showTimers: boolean;
  showGroceries: boolean;
  rotationPaused: boolean;
}

/**
 * Derives sidebar display mode from timer and grocery state.
 *
 * When timers are active or the grocery list has unchecked items,
 * the sidebar switches to "priority" mode instantly.
 * When conditions clear, a 500ms debounce prevents flicker before
 * returning to "rotation" mode.
 */
export function usePriorityInterrupt(
  activeTimerCount: number,
  completedTimersCount: number,
  uncheckedGroceryCount: number,
): PriorityState {
  const hasActiveTimers = activeTimerCount > 0 || completedTimersCount > 0;
  const hasGroceries = uncheckedGroceryCount > 0;
  const hasPriority = hasActiveTimers || hasGroceries;

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
    showGroceries: hasGroceries,
    rotationPaused: debouncedMode === 'priority',
  };
}
