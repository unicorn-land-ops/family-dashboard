import { useState, useCallback } from 'react';
import { useInterval } from './useInterval';
import { ROTATION_INTERVAL_MS, ROTATION_PANELS } from '../lib/constants';

/**
 * State machine for cycling through sidebar content panels.
 * Advances automatically on a timer; supports manual navigation via goTo().
 */
export function useContentRotation() {
  const panelCount = ROTATION_PANELS.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useInterval(() => {
    setActiveIndex((prev) => (prev + 1) % panelCount);
  }, ROTATION_INTERVAL_MS);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % panelCount) + panelCount) % panelCount);
    },
    [panelCount],
  );

  return { activeIndex, goTo, panelCount, panels: ROTATION_PANELS };
}
