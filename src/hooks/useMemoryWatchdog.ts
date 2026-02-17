import { useEffect } from 'react';

/** Chromium-only performance.memory API (non-standard) */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export function useMemoryWatchdog(
  thresholdPercent = 80,
  checkIntervalMs = 5 * 60_000
): void {
  useEffect(() => {
    const perf = performance as PerformanceWithMemory;

    // Safari and Firefox don't support performance.memory — no-op
    if (!perf.memory) {
      console.log('[MemoryWatchdog] performance.memory not available — skipping');
      return;
    }

    const intervalId = setInterval(() => {
      const { usedJSHeapSize, jsHeapSizeLimit } = perf.memory!;
      const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      console.info(
        `[MemoryWatchdog] Heap usage: ${usagePercent.toFixed(1)}% (${(usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB)`
      );

      if (usagePercent > thresholdPercent) {
        console.warn(
          `[MemoryWatchdog] Heap usage ${usagePercent.toFixed(1)}% exceeds ${thresholdPercent}% threshold — reloading`
        );
        window.location.reload();
      }
    }, checkIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [thresholdPercent, checkIntervalMs]);
}
