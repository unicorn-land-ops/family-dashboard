import { COUNTDOWN_EVENTS, getUpcomingCountdowns, eventRowToCountdown } from '../../lib/countdowns';
import { useEvents } from '../../hooks/useEvents';

/**
 * Compact, distance-readable "Coming Up" countdown row for the kiosk.
 * Merges the static COUNTDOWN_EVENTS with the user-managed Supabase events
 * (camps, trips, etc.) and shows the nearest few with days remaining.
 * Wraps rather than truncating so the family's camps aren't cut off.
 */
export function KioskCountdownRow() {
  const { events } = useEvents();
  const countdowns = getUpcomingCountdowns(
    [...COUNTDOWN_EVENTS, ...events.map(eventRowToCountdown)],
    5,
  );

  if (countdowns.length === 0) return null;

  return (
    <div
      className="card-glass"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(14px, 1.8vw, 30px)',
        padding: 'clamp(10px, 1vw, 18px) clamp(14px, 1.5vw, 24px)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(13px, 1vw, 17px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--fd-text-2)',
          flexShrink: 0,
        }}
      >
        Coming Up
      </span>

      {countdowns.map((event) => (
        <div key={event.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', minWidth: 0 }}>
          <span style={{ fontSize: 'clamp(20px, 1.8vw, 30px)', flexShrink: 0 }} role="img" aria-label={event.label}>
            {event.emoji}
          </span>
          <span
            style={{
              fontSize: 'clamp(20px, 1.8vw, 30px)',
              fontWeight: 800,
              color: 'var(--fd-accent)',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {event.daysRemaining === 0 ? 'TODAY' : `${event.daysRemaining}d`}
          </span>
          <span
            style={{
              fontSize: 'clamp(15px, 1.3vw, 22px)',
              color: 'var(--fd-text-1)',
              whiteSpace: 'nowrap',
            }}
          >
            {event.label}
          </span>
        </div>
      ))}
    </div>
  );
}
