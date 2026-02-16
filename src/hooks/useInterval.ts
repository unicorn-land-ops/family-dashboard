import { useEffect, useRef } from 'react';

/**
 * Dan Abramov's useInterval hook.
 * Stores the latest callback in a ref to avoid stale closures.
 * Pass `null` for delay to pause the interval.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
