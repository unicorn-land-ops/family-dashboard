import { useState, type FormEvent } from 'react';
import { differenceInDays, startOfDay, format } from 'date-fns';
import { useEvents } from '../../hooks/useEvents';
import { supabaseEnabled } from '../../lib/supabase';

/** Relative label for an event date string ('YYYY-MM-DD'). */
function daysLabel(dateStr: string): string {
  const d = differenceInDays(startOfDay(new Date(dateStr)), startOfDay(new Date()));
  if (d === 0) return 'TODAY';
  if (d < 0) return `${Math.abs(d)}d ago`;
  return `in ${d}d`;
}

/**
 * Mobile view to add and delete user countdown events.
 * Built-in events (birthdays, holidays, camps) live in static config and
 * are not shown here — this panel manages the Supabase `events` table only.
 */
export function EventsPanel() {
  const { events, isLoading, addEvent, removeEvent } = useEvents();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [date, setDate] = useState('');

  const trimmedLabel = label.trim();
  const canAdd = trimmedLabel.length > 0 && date.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    addEvent({ label: trimmedLabel, emoji: emoji.trim() || '📅', eventDate: date });
    setLabel('');
    setEmoji('');
    setDate('');
  }

  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>
          Connect Supabase to manage events
        </p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fd-text-1)' }}>
          Events ({sorted.length})
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>
            No events yet. Add one below 👇
          </p>
        ) : (
          <ul>
            {sorted.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 px-3 py-2"
                style={{ borderBottom: '1px solid var(--fd-card-border)' }}
              >
                <span className="text-xl shrink-0" role="img" aria-label={ev.label}>
                  {ev.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--fd-text-1)' }}>
                    {ev.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--fd-text-2)' }}>
                    {format(new Date(ev.event_date), 'EEE, d MMM yyyy')} · {daysLabel(ev.event_date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvent(ev.id)}
                  aria-label={`Delete ${ev.label}`}
                  className="shrink-0 min-h-[44px] min-w-[44px] rounded-lg text-lg hover:opacity-80"
                  style={{ color: 'var(--fd-text-2)' }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add form */}
      <div
        className="sticky bottom-0 backdrop-blur-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--fd-bg-1) 80%, transparent)',
          borderTop: '1px solid var(--fd-card-border)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎉"
              aria-label="Emoji"
              maxLength={4}
              className="min-h-[44px] w-[56px] text-center rounded-lg outline-none focus:ring-2"
              style={{ background: 'var(--fd-card-bg)', color: 'var(--fd-text-1)' }}
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Event name…"
              autoComplete="off"
              className="min-h-[44px] flex-1 rounded-lg px-4 outline-none focus:ring-2"
              style={{ background: 'var(--fd-card-bg)', color: 'var(--fd-text-1)' }}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Date"
              className="min-h-[44px] flex-1 rounded-lg px-4 outline-none focus:ring-2"
              style={{ background: 'var(--fd-card-bg)', color: 'var(--fd-text-1)' }}
            />
            <button
              type="submit"
              disabled={!canAdd}
              className="min-h-[44px] px-5 rounded-lg font-bold disabled:opacity-30"
              style={{ background: 'var(--fd-accent)', color: 'var(--fd-bg-1)' }}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
