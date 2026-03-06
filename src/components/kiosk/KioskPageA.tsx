/**
 * KioskPageA.tsx — Life Stuff rotating panel page
 *
 * Sections: Coming Up (countdowns) + Groceries + Chores
 * Calls its own data hooks directly (same pattern as all other panels).
 */

import React from 'react';
import { COUNTDOWN_EVENTS, getUpcomingCountdowns } from '../../lib/countdowns';
import { useGroceries } from '../../hooks/useGroceries';
import { useChores } from '../../hooks/useChores';
import { isChoreCompleted } from '../../lib/choreSchedule';

function PanelSection({
  title,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="kiosk-panel-section">
      <div className="kiosk-panel-section-title">{title}</div>
      {isEmpty ? (
        <div className="kiosk-panel-empty">{emptyText}</div>
      ) : (
        children
      )}
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 1.5vw, 1.4rem)',
  color: 'var(--fd-text-1)',
};

const secondaryStyle: React.CSSProperties = {
  fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
  color: 'var(--fd-text-2)',
};

export function KioskPageA() {
  const countdowns = getUpcomingCountdowns(COUNTDOWN_EVENTS);
  const { items, isLoading: groceriesLoading, uncheckedCount } = useGroceries();
  const { chores, completions, completedCount, totalCount, isLoading: choresLoading } = useChores();

  const uncheckedItems = items.filter((i) => !i.checked);
  const remainingChores = chores.filter((c) => !isChoreCompleted(c, completions));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>

      {/* Coming Up — countdowns */}
      <PanelSection
        title="Coming Up"
        isEmpty={countdowns.length === 0}
        emptyText="Nothing coming up"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {countdowns.map((event) => (
            <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.6rem)', flexShrink: 0 }} role="img" aria-label={event.label}>
                {event.emoji}
              </span>
              <span style={{ ...itemStyle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.label}
              </span>
              <span style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.4rem)', color: 'var(--fd-accent)', fontWeight: 700, flexShrink: 0 }}>
                {event.daysRemaining === 0 ? 'TODAY' : `${event.daysRemaining}d`}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      {/* Groceries */}
      <PanelSection
        title={`Groceries${uncheckedCount > 0 ? ` (${uncheckedCount})` : ''}`}
        isEmpty={!groceriesLoading && uncheckedItems.length === 0}
        emptyText="Nothing needed"
      >
        {groceriesLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {uncheckedItems.slice(0, 6).map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--fd-accent)', fontSize: '0.5rem', flexShrink: 0 }}>●</span>
                <span style={itemStyle}>{item.name}</span>
              </div>
            ))}
            {uncheckedItems.length > 6 && (
              <div style={secondaryStyle}>+{uncheckedItems.length - 6} more</div>
            )}
          </div>
        )}
      </PanelSection>

      {/* Chores */}
      <PanelSection
        title={`Chores (${completedCount}/${totalCount})`}
        isEmpty={!choresLoading && remainingChores.length === 0}
        emptyText="All done"
      >
        {choresLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {remainingChores.slice(0, 5).map((chore) => (
              <div key={chore.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--fd-text-2)', fontSize: '0.75rem', flexShrink: 0 }}>○</span>
                <span style={itemStyle}>{chore.title}</span>
              </div>
            ))}
            {remainingChores.length > 5 && (
              <div style={secondaryStyle}>+{remainingChores.length - 5} more</div>
            )}
          </div>
        )}
      </PanelSection>

    </div>
  );
}
