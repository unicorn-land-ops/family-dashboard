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
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Chores
          </h3>
          <span className="text-sm text-white/40">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-accent-gold rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}

        {allDone ? (
          <div className="text-center py-3">
            <span className="text-green-400 text-lg">&#10003;</span>
            <p className="text-sm text-white/50 mt-1">All done!</p>
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
        <p className="text-white/30 text-center py-8">
          Connect Supabase to use chore tracking
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold text-white">
          Chores
        </h2>
        <span className="text-sm text-white/40">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto">
        {chores.length === 0 ? (
          <p className="text-white/30 text-center py-8">No chores yet</p>
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
      <div className="sticky bottom-0 bg-bg-primary/80 backdrop-blur-sm border-t border-white/10">
        <ChoreInput onAdd={addChore} />
      </div>
    </div>
  );
}
