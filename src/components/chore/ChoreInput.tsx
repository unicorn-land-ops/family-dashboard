import { useState, type FormEvent } from 'react';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';

const PEOPLE = CALENDAR_FEEDS.filter((f) => f.id !== 'family');

const SCHEDULES: { value: 'daily' | 'weekly' | 'once'; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'once', label: 'Once' },
];

interface ChoreInputProps {
  onAdd: (title: string, assignedTo: string | null, schedule: 'daily' | 'weekly' | 'once') => void;
}

export function ChoreInput({ onAdd }: ChoreInputProps) {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'once'>('daily');

  const trimmed = title.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onAdd(trimmed, assignedTo, schedule);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
      {/* Title input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a chore..."
          autoComplete="off"
          enterKeyHint="done"
          className="min-h-[44px] flex-1 rounded-lg px-4 outline-none focus:ring-2"
          style={{ background: 'var(--fd-card-bg)', color: 'var(--fd-text-1)', borderColor: 'var(--fd-accent)' }}
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="min-h-[44px] w-[44px] rounded-lg font-bold disabled:opacity-30"
          style={{ background: 'var(--fd-accent)', color: 'var(--fd-bg-1)' }}
        >
          +
        </button>
      </div>

      {/* Person picker */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setAssignedTo(null)}
          className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
            assignedTo === null
              ? 'bg-[color-mix(in_srgb,var(--fd-accent)_30%,transparent)] text-[var(--fd-accent)]'
              : 'bg-[var(--fd-card-bg)] text-[var(--fd-text-2)] hover:opacity-80'
          }`}
        >
          Anyone
        </button>
        {PEOPLE.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => setAssignedTo(person.id)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              assignedTo === person.id
                ? 'bg-[color-mix(in_srgb,var(--fd-accent)_30%,transparent)] text-[var(--fd-accent)]'
                : 'bg-[var(--fd-card-bg)] text-[var(--fd-text-2)] hover:opacity-80'
            }`}
          >
            {person.emoji} {person.name}
          </button>
        ))}
      </div>

      {/* Schedule selector */}
      <div className="flex gap-1.5">
        {SCHEDULES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSchedule(s.value)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              schedule === s.value
                ? 'bg-[color-mix(in_srgb,var(--fd-accent)_30%,transparent)] text-[var(--fd-accent)]'
                : 'bg-[var(--fd-card-bg)] text-[var(--fd-text-2)] hover:opacity-80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </form>
  );
}
