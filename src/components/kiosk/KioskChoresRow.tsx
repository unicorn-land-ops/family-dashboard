import { useChores } from '../../hooks/useChores';
import { useRewards } from '../../hooks/useRewards';
import { isChoreCompleted } from '../../lib/choreSchedule';
import { nextReward, progressTo } from '../../lib/points';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';
import type { Chore, ChoreCompletion, Reward } from '../../types/database';

/** Max chores shown per kid, so the row has a fixed-ish height on the portrait grid. */
const MAX_CHORES = 4;
const DONE_GREEN = '#4ade80';

function person(id: string) {
  return CALENDAR_FEEDS.find((f) => f.id === id);
}

interface KidProps {
  kid: string;
  chores: Chore[];
  completions: ChoreCompletion[];
  onComplete: (choreId: string, kid: string) => void;
  rewardsEnabled: boolean;
  balance: number;
  rewards: Reward[];
}

/** Thick, static progress bar toward the next reward (no animation: Pi kiosk). */
function RewardBar({ balance, reward, height }: { balance: number; reward: Reward; height: number }) {
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ height, background: 'var(--fd-compact-bg)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${progressTo(balance, reward.cost) * 100}%`, background: 'var(--fd-accent)' }}
      />
    </div>
  );
}

/** Wren (13): names, points, "n to go" for the next reward, open chores as a list. */
function WrenColumn({ kid, chores, completions, onComplete, rewardsEnabled, balance, rewards }: KidProps) {
  const p = person(kid);
  const open = chores.filter((c) => !isChoreCompleted(c, completions));
  const next = rewardsEnabled ? nextReward(balance, rewards) : null;

  return (
    <div className="card-glass flex flex-col gap-3 p-[clamp(12px,1.4vw,22px)] min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold truncate" style={{ fontSize: 'clamp(22px,2.4vw,36px)', color: 'var(--fd-text-1)' }}>
          {p?.emoji} {p?.name ?? kid}
        </span>
        {rewardsEnabled && (
          <span className="font-extrabold shrink-0" style={{ fontSize: 'clamp(26px,2.8vw,42px)', color: 'var(--fd-accent)', fontVariantNumeric: 'tabular-nums' }}>
            ⭐ {balance}
          </span>
        )}
      </div>

      {next && (
        <div className="flex items-center gap-2" style={{ fontSize: 'clamp(16px,1.6vw,24px)', color: 'var(--fd-text-2)' }}>
          <span>{next.emoji}</span>
          <RewardBar balance={balance} reward={next} height={12} />
          <span className="shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{next.cost - balance} to go</span>
        </div>
      )}

      {open.length === 0 ? (
        <p className="font-semibold" style={{ fontSize: 'clamp(20px,2vw,30px)', color: DONE_GREEN }}>✓ All done</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {open.slice(0, MAX_CHORES).map((chore) => (
            <li key={chore.id}>
              <button
                type="button"
                onClick={() => onComplete(chore.id, kid)}
                className="w-full flex items-center gap-3 text-left min-h-[48px]"
                style={{ fontSize: 'clamp(19px,1.9vw,28px)', color: 'var(--fd-text-1)' }}
                aria-label={`Mark ${chore.title} done`}
              >
                <span style={{ color: 'var(--fd-text-2)' }}>○</span>
                <span className="truncate">{chore.title}</span>
              </button>
            </li>
          ))}
          {open.length > MAX_CHORES && (
            <li style={{ fontSize: 'clamp(16px,1.5vw,22px)', color: 'var(--fd-text-2)' }}>+{open.length - MAX_CHORES} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Ellis (9, FASD): simplest possible. Big emoji, big star count, a fat bar
 * under the next reward's emoji, and big tick tiles. No small text.
 */
function EllisColumn({ kid, chores, completions, onComplete, rewardsEnabled, balance, rewards }: KidProps) {
  const p = person(kid);
  const next = rewardsEnabled ? nextReward(balance, rewards) : null;
  // Done chores stay visible with a big green tick: that's the reward for tapping.
  const shown = chores.slice(0, MAX_CHORES);
  const allDone = chores.length > 0 && chores.every((c) => isChoreCompleted(c, completions));
  const big = 'clamp(36px,4vw,60px)';

  return (
    <div className="card-glass flex flex-col gap-3 p-[clamp(12px,1.4vw,22px)] min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: big, lineHeight: 1 }} role="img" aria-label={p?.name ?? kid}>{p?.emoji ?? '🧒'}</span>
        {rewardsEnabled && (
          <span className="font-extrabold" style={{ fontSize: big, lineHeight: 1, color: 'var(--fd-accent)', fontVariantNumeric: 'tabular-nums' }}>
            ⭐ {balance}
          </span>
        )}
      </div>

      {next && (
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 'clamp(30px,3.2vw,48px)', lineHeight: 1 }} role="img" aria-label={next.title}>{next.emoji}</span>
          <RewardBar balance={balance} reward={next} height={20} />
        </div>
      )}

      {allDone ? (
        <div className="flex items-center justify-center gap-3 font-extrabold" style={{ fontSize: big, color: DONE_GREEN }}>
          ✓ 🎉
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((chore) => {
            const done = isChoreCompleted(chore, completions);
            return (
              <li key={chore.id}>
                <button
                  type="button"
                  onClick={() => !done && onComplete(chore.id, kid)}
                  className="w-full flex items-center gap-3 text-left rounded-2xl px-3 min-h-[64px]"
                  style={{
                    background: done ? 'color-mix(in srgb, #4ade80 14%, var(--fd-compact-bg))' : 'var(--fd-compact-bg)',
                    color: 'var(--fd-text-1)',
                  }}
                  aria-pressed={done}
                  aria-label={`${chore.title}${done ? ', done' : ''}`}
                >
                  <span
                    className="flex items-center justify-center rounded-full shrink-0 font-black"
                    style={{
                      width: 52,
                      height: 52,
                      fontSize: 32,
                      background: done ? DONE_GREEN : 'transparent',
                      border: done ? 'none' : '4px solid var(--fd-text-2)',
                      color: '#000',
                    }}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span className="truncate font-bold" style={{ fontSize: 'clamp(24px,2.4vw,36px)', opacity: done ? 0.6 : 1 }}>
                    {chore.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Kiosk "Chores & points" row: Wren and Ellis side by side.
 * Read-only until a touchscreen arrives; the chores are already buttons so a
 * tap will complete them then. Rewards bits hide until the migration has run.
 */
export function KioskChoresRow() {
  const { chores, completions, completeChore } = useChores();
  const { enabled, rewards, balanceOf } = useRewards();

  const props = (kid: string): KidProps => ({
    kid,
    chores: chores.filter((c) => c.assigned_to === kid),
    completions,
    onComplete: completeChore,
    rewardsEnabled: enabled,
    balance: balanceOf(kid),
    rewards,
  });

  return (
    <div className="grid grid-cols-2 gap-[clamp(10px,1vw,16px)]">
      <WrenColumn {...props('wren')} />
      <EllisColumn {...props('ellis')} />
    </div>
  );
}
