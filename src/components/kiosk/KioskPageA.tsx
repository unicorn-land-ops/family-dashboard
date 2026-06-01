/**
 * KioskPageA.tsx — Life Stuff rotating panel page
 *
 * 3-column horizontal layout: Coming Up | Groceries | Chores
 */

import React from 'react';
import { COUNTDOWN_EVENTS, getUpcomingCountdowns, eventRowToCountdown } from '../../lib/countdowns';
import { useGroceries } from '../../hooks/useGroceries';
import { useChores } from '../../hooks/useChores';
import { useEvents } from '../../hooks/useEvents';
import { isChoreCompleted } from '../../lib/choreSchedule';

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 1.3vw, 20px)',
  fontWeight: 700,
  color: 'var(--fd-text-1)',
  marginBottom: 'clamp(4px, 0.4vw, 8px)',
};

const itemStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 1.3vw, 20px)',
  color: 'var(--fd-text-1)',
  lineHeight: 1.4,
};

const secondaryStyle: React.CSSProperties = {
  fontSize: 'clamp(12px, 1.1vw, 16px)',
  color: 'var(--fd-text-2)',
};

const badgeStyle = (bg: string): React.CSSProperties => ({
  fontSize: 'clamp(10px, 0.8vw, 14px)',
  fontWeight: 700,
  color: '#fff',
  background: bg,
  borderRadius: '10px',
  padding: '1px 8px',
  marginLeft: '6px',
});

export function KioskPageA() {
  const { events } = useEvents();
  const countdowns = getUpcomingCountdowns([
    ...COUNTDOWN_EVENTS,
    ...events.map(eventRowToCountdown),
  ]);
  const { items, isLoading: groceriesLoading, uncheckedCount } = useGroceries();
  const { chores, completions, completedCount, totalCount, isLoading: choresLoading } = useChores();

  const uncheckedItems = items.filter((i) => !i.checked);
  const remainingChores = chores.filter((c) => !isChoreCompleted(c, completions));

  return (
    <div className="kiosk-stage-columns">
      {/* Column 1: Coming Up */}
      <div className="kiosk-stage-column">
        <div style={titleStyle}>Coming Up</div>
        {countdowns.length === 0 ? (
          <div style={secondaryStyle}>Nothing coming up</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.4vw, 8px)' }}>
            {countdowns.map((event) => (
              <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: 'clamp(14px, 1.3vw, 20px)', flexShrink: 0 }}>{event.emoji}</span>
                <span style={{ ...itemStyle, fontWeight: 700, color: 'var(--fd-accent)', flexShrink: 0 }}>
                  {event.daysRemaining === 0 ? 'TODAY' : `${event.daysRemaining}d`}
                </span>
                <span style={{ ...secondaryStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column 2: Groceries */}
      <div className="kiosk-stage-column">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={titleStyle}>Groceries</span>
          {uncheckedCount > 0 && <span style={badgeStyle('var(--fd-accent)')}>{uncheckedCount}</span>}
        </div>
        {groceriesLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : uncheckedItems.length === 0 ? (
          <div style={secondaryStyle}>Nothing needed</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.2vw, 4px)' }}>
            {uncheckedItems.slice(0, 6).map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: 'var(--fd-accent)', fontSize: '0.4rem', flexShrink: 0 }}>&#9679;</span>
                <span style={itemStyle}>{item.name}</span>
              </div>
            ))}
            {uncheckedItems.length > 6 && (
              <div style={{ ...secondaryStyle, fontStyle: 'italic' }}>+{uncheckedItems.length - 6} more</div>
            )}
          </div>
        )}
      </div>

      {/* Column 3: Chores */}
      <div className="kiosk-stage-column">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={titleStyle}>Chores</span>
          <span style={badgeStyle('var(--fd-accent-teal)')}>{completedCount}/{totalCount}</span>
        </div>
        {choresLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : remainingChores.length === 0 ? (
          <div style={secondaryStyle}>All done</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.2vw, 4px)' }}>
            {remainingChores.slice(0, 5).map((chore) => (
              <div key={chore.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: 'var(--fd-text-2)', fontSize: '0.6rem', flexShrink: 0 }}>&#9675;</span>
                <span style={itemStyle}>{chore.title}</span>
              </div>
            ))}
            {remainingChores.length > 5 && (
              <div style={{ ...secondaryStyle, fontStyle: 'italic' }}>+{remainingChores.length - 5} more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
