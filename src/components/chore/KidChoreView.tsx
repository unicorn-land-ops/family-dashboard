import { useEffect, useRef, useState } from 'react';
import { useChores } from '../../hooks/useChores';
import { isChoreCompleted, getCompletionInfo, getChoreProgress } from '../../lib/choreSchedule';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';
import { supabaseEnabled } from '../../lib/supabase';
import type { Chore, ChoreCompletion } from '../../types/database';

// ────────────────────────────────────────────────────────────────────────────
// Wake Lock — keeps the screen on while the kid view is mounted.
// Gracefully degrades on browsers that don't support it (Amazon Silk).
// ────────────────────────────────────────────────────────────────────────────
function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let active = true;

    async function acquire() {
      try {
        lockRef.current = await (navigator as Navigator & { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        lockRef.current.addEventListener('release', () => {
          if (active) acquire();
        });
      } catch {
        // Permission denied or not supported — ignore
      }
    }

    acquire();

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') acquire();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lockRef.current?.release().catch(() => {/* ignore */});
    };
  }, []);
}

// ────────────────────────────────────────────────────────────────────────────
// Single chore button for the kid view
// ────────────────────────────────────────────────────────────────────────────
interface KidChoreButtonProps {
  chore: Chore;
  completions: ChoreCompletion[];
  childId: string;
  onComplete: (choreId: string, completedBy: string) => void;
  onUncomplete: (completionId: string) => void;
}

function KidChoreButton({ chore, completions, childId, onComplete, onUncomplete }: KidChoreButtonProps) {
  const completed = isChoreCompleted(chore, completions);
  const completionInfo = getCompletionInfo(chore, completions);
  const [justDone, setJustDone] = useState(false);

  function handleTap() {
    if (completed && completionInfo) {
      onUncomplete(completionInfo.id);
      setJustDone(false);
    } else {
      onComplete(chore.id, childId);
      setJustDone(true);
      // Reset the animation flag after it plays
      setTimeout(() => setJustDone(false), 600);
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className={[
        'w-full flex items-center gap-4 rounded-2xl px-5 transition-all duration-200 select-none',
        'active:scale-[0.97]',
        completed
          ? 'opacity-70'
          : 'hover:opacity-90',
        justDone ? 'scale-[0.97]' : '',
      ].join(' ')}
      style={{
        minHeight: '72px',
        background: completed
          ? 'color-mix(in srgb, var(--fd-accent) 15%, var(--fd-card-bg))'
          : 'var(--fd-card-bg)',
        border: `2px solid ${completed ? 'var(--fd-accent)' : 'var(--fd-card-border)'}`,
        boxShadow: completed ? '0 0 0 0px transparent' : '0 2px 8px rgba(0,0,0,0.25)',
      }}
      aria-pressed={completed}
      aria-label={`${chore.title} — ${completed ? 'done, tap to undo' : 'tap to complete'}`}
    >
      {/* Check circle */}
      <span
        className={[
          'flex items-center justify-center rounded-full shrink-0 transition-all duration-300 text-xl',
          completed ? 'scale-110' : '',
        ].join(' ')}
        style={{
          width: 48,
          height: 48,
          background: completed ? 'var(--fd-accent)' : 'color-mix(in srgb, var(--fd-text-2) 20%, transparent)',
          color: completed ? '#000' : 'var(--fd-text-2)',
        }}
      >
        {completed ? '✓' : '○'}
      </span>

      {/* Title */}
      <span
        className={`flex-1 text-left font-semibold text-xl leading-tight ${completed ? 'line-through' : ''}`}
        style={{ color: completed ? 'var(--fd-text-2)' : 'var(--fd-text-1)' }}
      >
        {chore.title}
      </span>

      {/* Schedule badge */}
      {chore.schedule !== 'daily' && (
        <span
          className="text-xs rounded-full px-2 py-0.5 shrink-0"
          style={{ background: 'var(--fd-card-border)', color: 'var(--fd-text-2)' }}
        >
          {chore.schedule}
        </span>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main kid view
// ────────────────────────────────────────────────────────────────────────────
interface KidChoreViewProps {
  childId: string;
}

export function KidChoreView({ childId }: KidChoreViewProps) {
  useWakeLock();

  const { chores, completions, completeChore, uncompleteChore, isLoading } = useChores();

  // Resolve child config from calendar feeds (first non-work, non-travel match)
  const childConfig = CALENDAR_FEEDS.find(
    (f) => f.id === childId && !('isWorkCalendar' in f && f.isWorkCalendar) && !('isTravelCalendar' in f && f.isTravelCalendar),
  );

  // Filter: assigned to this child OR assigned to no one (household chores for everyone)
  const myChores = chores.filter(
    (c) => c.assigned_to === childId || c.assigned_to === null,
  );

  const { completed: completedCount, total: totalCount } = getChoreProgress(myChores, completions);
  const allDone = totalCount > 0 && completedCount === totalCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!supabaseEnabled) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center" style={{ background: 'var(--fd-bg-1)' }}>
        <p style={{ color: 'var(--fd-text-2)' }}>Supabase not configured.</p>
      </div>
    );
  }

  const childName = childConfig?.name ?? childId;
  const childEmoji = childConfig?.emoji ?? '🧒';

  return (
    <div
      className="h-dvh w-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--fd-bg-1)', fontFamily: 'inherit' }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 flex flex-col items-center justify-center gap-2 pt-8 pb-4 px-6"
        style={{ borderBottom: '1px solid var(--fd-card-border)' }}
      >
        <div className="text-5xl">{childEmoji}</div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--fd-text-1)' }}>
          {childName}'s Chores
        </h1>

        {/* Progress indicator */}
        {totalCount > 0 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-1.5 mt-1">
            <p className="text-base font-medium" style={{ color: 'var(--fd-text-2)' }}>
              {completedCount} of {totalCount} done
            </p>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 10, background: 'var(--fd-card-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: allDone
                    ? '#4ade80' /* green-400 */
                    : 'var(--fd-accent)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Chore list ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl animate-pulse" style={{ color: 'var(--fd-text-2)' }}>Loading…</p>
          </div>
        ) : allDone ? (
          /* All done celebration */
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="text-7xl animate-bounce">🎉</div>
            <p className="text-3xl font-bold" style={{ color: 'var(--fd-text-1)' }}>
              All done!
            </p>
            <p className="text-xl" style={{ color: 'var(--fd-text-2)' }}>
              Amazing work, {childName}!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 max-w-2xl mx-auto w-full">
            {myChores.length === 0 ? (
              <p className="text-center py-12 text-xl" style={{ color: 'var(--fd-text-2)' }}>
                No chores right now 🎉
              </p>
            ) : (
              myChores.map((chore) => (
                <KidChoreButton
                  key={chore.id}
                  chore={chore}
                  completions={completions}
                  childId={childId}
                  onComplete={completeChore}
                  onUncomplete={uncompleteChore}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      {!allDone && totalCount > 0 && (
        <div
          className="shrink-0 text-center py-3"
          style={{ color: 'var(--fd-text-2)', fontSize: '0.85rem', borderTop: '1px solid var(--fd-card-border)', opacity: 0.6 }}
        >
          Tap a chore to mark it done
        </div>
      )}
    </div>
  );
}
