import { useState, useEffect } from 'react';
import { TIMEZONE, CLOCK_INTERVAL_MS } from '../../lib/constants';

function getFormattedTime(): string {
  return new Date().toLocaleTimeString('de-DE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('de-DE', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function Header() {
  const [time, setTime] = useState(getFormattedTime);
  const [date, setDate] = useState(getFormattedDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getFormattedTime());
      setDate(getFormattedDate());
    }, CLOCK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="grid-area-header flex items-center justify-between px-[clamp(8px,1vw,16px)]">
      <div>
        <div
          className="font-extralight tracking-tight text-text-primary leading-none"
          style={{ fontSize: 'clamp(2rem, 6vw, 6rem)' }}
        >
          {time}
        </div>
        <div
          className="font-normal text-text-secondary mt-1"
          style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}
        >
          {date}
        </div>
      </div>
    </header>
  );
}
