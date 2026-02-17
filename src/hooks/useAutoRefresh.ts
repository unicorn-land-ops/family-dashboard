import { useEffect } from 'react';
import { RELOAD_HOUR, TIMEZONE } from '../lib/constants';

function getNextReloadMs(): number {
  const now = new Date();
  // Get current Berlin time by parsing the locale string
  const berlinStr = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  const berlinNow = new Date(berlinStr);

  const next = new Date(berlinNow);
  next.setHours(RELOAD_HOUR, 0, 0, 0);
  if (next <= berlinNow) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - berlinNow.getTime();
}

export function useAutoRefresh(): void {
  useEffect(() => {
    const msUntilReload = getNextReloadMs();
    const hoursUntil = (msUntilReload / (1000 * 60 * 60)).toFixed(1);

    console.log(
      `[AutoRefresh] Scheduled reload in ${hoursUntil} hours (${RELOAD_HOUR}:00 ${TIMEZONE})`
    );

    // Primary timer: setTimeout to exact 3am
    const timerId = setTimeout(() => {
      console.log('[AutoRefresh] Reloading to prevent memory leaks');
      window.location.reload();
    }, msUntilReload);

    // Backup timer: check every 15 minutes in case setTimeout drifted or was throttled
    const backupId = setInterval(() => {
      const nowStr = new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
      const berlinNow = new Date(nowStr);
      const hour = berlinNow.getHours();
      const minute = berlinNow.getMinutes();

      if (hour === RELOAD_HOUR && minute < 15) {
        console.log('[AutoRefresh] Backup check triggered reload');
        window.location.reload();
      }
    }, 15 * 60_000);

    // Visibility change listener for future data refresh triggers
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AutoRefresh] Page became visible');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timerId);
      clearInterval(backupId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
