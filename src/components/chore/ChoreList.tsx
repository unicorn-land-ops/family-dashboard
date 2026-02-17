import type { Chore, ChoreCompletion } from '../../types/database';
import { groupByAssignee, isChoreCompleted } from '../../lib/choreSchedule';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';
import { ChoreItem } from './ChoreItem';

/** Sort order for assignee groups: kids first, then adults, then unassigned. */
const GROUP_ORDER: string[] = ['wren', 'ellis', 'papa', 'daddy', 'unassigned'];

function personLookup(id: string) {
  return CALENDAR_FEEDS.find((f) => f.id === id);
}

interface ChoreListProps {
  chores: Chore[];
  completions: ChoreCompletion[];
  onComplete: (choreId: string, completedBy: string) => void;
  onUncomplete: (completionId: string) => void;
  onDeactivate: (id: string) => void;
  showCompleted?: boolean;
  showDelete?: boolean;
}

export function ChoreList({
  chores,
  completions,
  onComplete,
  onUncomplete,
  onDeactivate,
  showCompleted = true,
  showDelete = false,
}: ChoreListProps) {
  const grouped = groupByAssignee(chores);

  // Sort groups by defined order, unknown keys go to end
  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="overflow-y-auto scrollbar-hide">
      {sortedKeys.map((key) => {
        let groupChores = grouped.get(key) ?? [];

        // In compact mode, filter out completed chores
        if (!showCompleted) {
          groupChores = groupChores.filter(
            (chore) => !isChoreCompleted(chore, completions),
          );
        }

        // Hide empty groups
        if (groupChores.length === 0) return null;

        const person = key === 'unassigned' ? null : personLookup(key);
        const headerLabel = person ? `${person.emoji} ${person.name}` : 'Household';

        return (
          <div key={key} className="mb-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-3 py-1">
              {headerLabel}
            </h4>
            {groupChores.map((chore) => (
              <ChoreItem
                key={chore.id}
                chore={chore}
                completions={completions}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
                onDeactivate={onDeactivate}
                showDelete={showDelete}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
