import { useChores } from '../../hooks/useChores';
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

  // --- Compact variant (wall sidebar) ---
  if (variant === 'compact') {
    const allDone = totalCount > 0 && completedCount === totalCount;

    return (
      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--fd-text-2)' }}>
            Chores
          </h3>
          <span className="text-sm" style={{ color: 'var(--fd-text-2)' }}>
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
          <div className="text-center py-3">
            <span className="text-green-400 text-lg">&#10003;</span>
            <p className="text-sm mt-1" style={{ color: 'var(--fd-text-2)' }}>All done!</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
            <ChoreList
              chores={chores}
              completions={completions}
              onComplete={completeChore}
              onUncomplete={uncompleteChore}
              onDeactivate={deactivateChore}
              showCompleted={false}
            />
          </div>
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
