import { useState, useCallback } from 'react';
import { useInterval } from './useInterval';

export type StageSlot = 'photo' | 'life' | 'world';

const STAGES: StageSlot[] = ['photo', 'life', 'world'];

/**
 * Cycles through 3 stage slots on a timer.
 * Returns the active slot and a transitioning flag for crossfade.
 */
export function useStageRotation(cadenceMs: number = 60000) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const advance = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % STAGES.length);
      setIsTransitioning(false);
    }, 800);
  }, []);

  useInterval(advance, cadenceMs);

  return {
    activeSlot: STAGES[index],
    stageIndex: index,
    isTransitioning,
  };
}
