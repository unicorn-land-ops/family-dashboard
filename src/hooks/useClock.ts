import { useState } from 'react';
import { useInterval } from './useInterval';
import {
  formatBerlinTime,
  formatBerlinDate,
  formatBerlinDateShort,
} from '../lib/utils/timeFormat';

/**
 * Clock hook providing Berlin timezone time and date strings.
 * Updates every second for responsive minute rollovers.
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useInterval(() => {
    setNow(new Date());
  }, 1000);

  return {
    time: formatBerlinTime(now),
    date: formatBerlinDate(now),
    dateShort: formatBerlinDateShort(now),
  };
}
