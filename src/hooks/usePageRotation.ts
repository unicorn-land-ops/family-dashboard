import { useState } from 'react';
import { useInterval } from './useInterval';

/**
 * Toggles between Page A and Page B on a timer.
 * Uses functional update form to avoid stale closure pitfall.
 */
export function usePageRotation(intervalMs: number = 25000) {
  const [activePage, setActivePage] = useState<'A' | 'B'>('A');

  useInterval(() => {
    setActivePage(prev => (prev === 'A' ? 'B' : 'A'));
  }, intervalMs);

  return { activePage };
}
