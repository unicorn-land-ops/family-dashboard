import { useState, useEffect } from 'react';
import { TIMEZONE } from '../../lib/constants';
import { ConnectionStatus } from './ConnectionStatus';

interface StatusBarProps {
  variant?: 'default' | 'kiosk';
}

export function StatusBar({ variant = 'default' }: StatusBarProps) {
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
      className={`grid-area-status flex items-center justify-between px-[clamp(8px,1vw,16px)] opacity-60 ${
        variant === 'kiosk' ? 'kiosk-status' : ''
      }`}
      style={{
        color: 'var(--fd-text-2)',
        fontSize:
          variant === 'kiosk'
            ? 'clamp(0.86rem,1.05vw,1rem)'
            : 'clamp(0.65rem, 0.8vw, 0.85rem)',
      }}
    >
      <span>Last refresh: {lastRefresh}</span>
      <ConnectionStatus />
      <span
        className="transition-opacity duration-500"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        Family Dashboard
      </span>
    </footer>
  );
}
