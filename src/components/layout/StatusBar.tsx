import { useState, useEffect } from 'react';
import { TIMEZONE } from '../../lib/constants';

export function StatusBar() {
  const [lastRefresh] = useState(() =>
    new Date().toLocaleTimeString('de-DE', { timeZone: TIMEZONE })
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  return (
    <footer
      className="grid-area-status flex items-center justify-between px-[clamp(8px,1vw,16px)] text-text-secondary opacity-60"
      style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)' }}
    >
      <span>Last refresh: {lastRefresh}</span>
      <span
        className="transition-opacity duration-500"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        Family Dashboard
      </span>
    </footer>
  );
}
