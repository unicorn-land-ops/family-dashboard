import { useState } from 'react';
import { useInterval } from './useInterval';
import {
  formatBerlinTimeWithSeconds,
  formatBerlinDate,
  formatBerlinDateShort,
} from '../lib/utils/timeFormat';

/**
 * Clock hook providing Berlin timezone time and date strings.
 * Updates every second. Isolated state prevents re-render cascade.
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useInterval(() => {
    setNow(new Date());
  }, 1000);

  return {
    time: formatBerlinTimeWithSeconds(now),
    date: formatBerlinDate(now),
    dateShort: formatBerlinDateShort(now),
  };
}
