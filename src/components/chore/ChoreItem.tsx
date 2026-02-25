import { useState } from 'react';
import { IoCheckmarkCircle, IoEllipseOutline, IoCloseCircleOutline } from 'react-icons/io5';
import type { Chore, ChoreCompletion } from '../../types/database';
import { isChoreCompleted, getCompletionInfo } from '../../lib/choreSchedule';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';

/** Family members eligible for chore completion (excludes 'family' feed). */
const PEOPLE = CALENDAR_FEEDS.filter((f) => f.id !== 'family');

const STORAGE_KEY = 'chore-default-person';

function getDefaultPerson(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDefaultPerson(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

function personLookup(id: string) {
  return CALENDAR_FEEDS.find((f) => f.id === id);
}

interface ChoreItemProps {
  chore: Chore;
  completions: ChoreCompletion[];
  onComplete: (choreId: string, completedBy: string) => void;
  onUncomplete: (completionId: string) => void;
  onDeactivate: (id: string) => void;
  showDelete?: boolean;
}

export function ChoreItem({
  chore,
  completions,
  onComplete,
  onUncomplete,
  onDeactivate,
  showDelete = false,
}: ChoreItemProps) {
  const completed = isChoreCompleted(chore, completions);
  const completionInfo = getCompletionInfo(chore, completions);
  const [showPicker, setShowPicker] = useState(false);

  const assigneePerson = chore.assigned_to ? personLookup(chore.assigned_to) : null;
  const completedByPerson = completionInfo ? personLookup(completionInfo.completed_by) : null;

  function handleTap() {
    if (completed && completionInfo) {
      onUncomplete(completionInfo.id);
      return;
    }

    const defaultPerson = getDefaultPerson();
    if (defaultPerson) {
      setDefaultPerson(defaultPerson);
      onComplete(chore.id, defaultPerson);
    } else {
      setShowPicker(true);
    }
  }

  function handlePickPerson(personId: string) {
    setDefaultPerson(personId);
    setShowPicker(false);
    onComplete(chore.id, personId);
  }

  const scheduleLabel = chore.schedule === 'daily' ? 'daily' : chore.schedule === 'weekly' ? 'weekly' : 'once';

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 min-h-[44px] px-3 py-2">
        {/* Completion toggle */}
        <button
          type="button"
          onClick={handleTap}
          className="flex items-center justify-center w-[44px] h-[44px] shrink-0"
          aria-label={completed ? 'Undo completion' : 'Complete chore'}
        >
          {completed ? (
            <IoCheckmarkCircle className="w-6 h-6 text-green-400" />
          ) : (
            <IoEllipseOutline className="w-6 h-6" style={{ color: 'var(--fd-text-2)' }} />
          )}
        </button>

        {/* Chore info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-base truncate ${completed ? 'line-through' : ''}`}
              style={{ color: completed ? 'var(--fd-text-2)' : 'var(--fd-text-1)' }}
            >
              {chore.title}
            </span>
            {assigneePerson && (
              <span className="text-sm shrink-0" title={assigneePerson.name}>
                {assigneePerson.emoji}
              </span>
            )}
            <span className="text-xs shrink-0" style={{ color: 'var(--fd-text-2)', opacity: 0.6 }}>{scheduleLabel}</span>
          </div>

          {completed && completedByPerson && (
            <span className="text-xs" style={{ color: 'var(--fd-text-2)' }}>
              Done by {completedByPerson.emoji} {completedByPerson.name}
            </span>
          )}
        </div>

        {/* Switch person link (when completed) */}
        {completed && !showPicker && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (completionInfo) onUncomplete(completionInfo.id);
            }}
            className="text-xs hover:opacity-80 shrink-0"
            style={{ color: 'var(--fd-text-2)' }}
          >
            undo
          </button>
        )}

        {/* Delete button (full variant only) */}
        {showDelete && (
          <button
            type="button"
            onClick={() => onDeactivate(chore.id)}
            className="flex items-center justify-center w-[44px] h-[44px] shrink-0 hover:text-red-400 transition-colors"
            style={{ color: 'var(--fd-card-border)' }}
            aria-label="Remove chore"
          >
            <IoCloseCircleOutline className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Person picker (shown when no default person) */}
      {showPicker && (
        <div className="flex gap-2 px-3 pb-2 pl-[56px]">
          {PEOPLE.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => handlePickPerson(person.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors hover:opacity-80"
              style={{ background: 'var(--fd-card-bg)', color: 'var(--fd-text-1)' }}
            >
              <span>{person.emoji}</span>
              <span className="text-xs">{person.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
