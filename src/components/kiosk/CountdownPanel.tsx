/**
 * CountdownPanel.tsx — Kiosk component: next 4 upcoming family countdown events
 *
 * Renders: emoji + label + days remaining (or "TODAY") for the 4 nearest events.
 * Data source: COUNTDOWN_EVENTS static config in src/lib/countdowns.ts
 *
 * Used as the first panel in the default dashboard's sidebar rotation
 * (see App.tsx). The kiosk view renders its own inline countdown in KioskPageA.
 */

import React from 'react';
import { COUNTDOWN_EVENTS, getUpcomingCountdowns, eventRowToCountdown } from '../../lib/countdowns';
import { useEvents } from '../../hooks/useEvents';

export const CountdownPanel = React.memo(function CountdownPanel() {
  const { events } = useEvents();
  const countdowns = getUpcomingCountdowns([
    ...COUNTDOWN_EVENTS,
    ...events.map(eventRowToCountdown),
  ]);

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col gap-2">
      <h3
        className="font-semibold text-[clamp(11px,0.9vw,14px)] uppercase tracking-wider mb-1"
        style={{ color: 'var(--fd-text-2)' }}
      >
        Coming Up
      </h3>

      {countdowns.map((event) => (
        <div key={event.id} className="flex items-center gap-3">
          {/* Emoji */}
          <span
            className="text-[clamp(1.2rem,1.5vw,1.8rem)] shrink-0"
            role="img"
            aria-label={event.label}
          >
            {event.emoji}
          </span>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p
              className="font-medium leading-tight truncate"
              style={{
                fontSize: 'clamp(0.95rem,1.2vw,1.4rem)',
                color: 'var(--fd-text-1)',
              }}
            >
              {event.label}
            </p>
          </div>

          {/* Days remaining */}
          <div className="text-right shrink-0">
            <p
              className="font-bold tabular-nums"
              style={{
                fontSize: 'clamp(1.1rem,1.4vw,1.6rem)',
                color: 'var(--fd-accent)',
              }}
            >
              {event.daysRemaining === 0 ? 'TODAY' : `${event.daysRemaining}d`}
            </p>
          </div>
        </div>
      ))}

      {countdowns.length === 0 && (
        <p
          style={{
            color: 'var(--fd-text-2)',
            fontSize: 'clamp(0.85rem,1.0vw,1.1rem)',
          }}
        >
          Nothing upcoming
        </p>
      )}
    </div>
  );
});
