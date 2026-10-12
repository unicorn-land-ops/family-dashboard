import { useState } from 'react';
import { useInterval } from '../../hooks/useInterval';
import { activeReminders } from '../../lib/reminders';

export function KioskReminders() {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), 15_000);
  const reminders = activeReminders(now);

  return (
    <div className="card-glass p-4">
      <h3
        className="font-semibold mb-2"
        style={{ fontSize: 'clamp(0.82rem, 1vw, 1rem)', color: 'var(--fd-text-2)' }}
      >
        Reminders
      </h3>
      {reminders.length === 0 ? (
        <p
          className="text-center py-2"
          style={{ color: 'var(--fd-text-2)', opacity: 0.5, fontSize: 'clamp(0.8rem, 0.95vw, 1rem)' }}
        >
          Nothing to remember
        </p>
      ) : (
        <ul className="flex flex-col gap-[clamp(4px,0.5vw,8px)]">
          {reminders.map((r) => (
            <li
              key={r.date + r.text}
              className={`flex items-baseline gap-2 ${r.flashing ? 'timer-alert-pulse px-2 py-1' : ''}`}
              style={{
                fontSize: r.flashing ? 'clamp(1.1rem, 1.4vw, 1.5rem)' : 'clamp(0.85rem, 1vw, 1.05rem)',
                fontWeight: r.flashing ? 700 : undefined,
                color: 'var(--fd-text-1)',
              }}
            >
              <span style={{ color: 'var(--fd-accent)', fontSize: '0.5em', lineHeight: 1 }}>●</span>
              <span className="truncate">{r.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
