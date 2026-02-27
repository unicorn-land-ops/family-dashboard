import { useChores } from '../../hooks/useChores';
import { isChoreCompleted } from '../../lib/choreSchedule';
import { supabaseEnabled } from '../../lib/supabase';
import { ChoreInput } from './ChoreInput';
import { ChoreList } from './ChoreList';

interface ChorePanelProps {
  variant?: 'full' | 'compact';
}

export function ChorePanel({ variant = 'full' }: ChorePanelProps) {
  const {
    chores,
    completions,
    completedCount,
    totalCount,
    addChore,
    completeChore,
    uncompleteChore,
    deactivateChore,
  } = useChores();

  // --- Compact variant (wall sidebar / kiosk) ---
  if (variant === 'compact') {
    const allDone = totalCount > 0 && completedCount === totalCount;
    const remaining = chores.filter(
      (c) => !isChoreCompleted(c, completions),
    );

    return (
      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-semibold"
            style={{
              fontSize: 'clamp(0.82rem, 1vw, 1rem)',
              color: 'var(--fd-text-2)',
            }}
          >
            Chores
          </h3>
          <span
            style={{
              fontSize: 'clamp(0.78rem, 0.9vw, 0.95rem)',
              color: 'var(--fd-text-2)',
            }}
          >
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--fd-card-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: 'var(--fd-accent)', width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}

        {allDone ? (
          <p
            className="text-center py-2"
            style={{
              color: 'var(--fd-text-2)',
              fontSize: 'clamp(0.82rem, 0.95vw, 1rem)',
            }}
          >
            ✓ All done
          </p>
        ) : (
          <ul className="flex flex-col gap-[clamp(4px,0.5vw,8px)]">
            {remaining.map((chore) => (
              <li
                key={chore.id}
                className="flex items-baseline gap-2"
                style={{
                  fontSize: 'clamp(0.85rem, 1vw, 1.05rem)',
                  color: 'var(--fd-text-1)',
                }}
              >
                <span style={{ color: 'var(--fd-text-2)', fontSize: '0.6em' }}>○</span>
                <span className="truncate">{chore.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // --- Full variant (mobile) ---

  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>
          Connect Supabase to use chore tracking
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fd-text-1)' }}>
          Chores
        </h2>
        <span className="text-sm" style={{ color: 'var(--fd-text-2)' }}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto">
        {chores.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--fd-text-2)', opacity: 0.5 }}>No chores yet</p>
        ) : (
          <ChoreList
            chores={chores}
            completions={completions}
            onComplete={completeChore}
            onUncomplete={uncompleteChore}
            onDeactivate={deactivateChore}
            showCompleted={true}
            showDelete={true}
          />
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--fd-bg-1) 80%, transparent)', borderTop: '1px solid var(--fd-card-border)' }}>
        <ChoreInput onAdd={addChore} />
      </div>
    </div>
  );
}
