import { useRewards } from '../../hooks/useRewards';
import { canAfford } from '../../lib/points';
import { CALENDAR_FEEDS } from '../../lib/calendar/config';

interface RewardsPanelProps {
  /** Whose balances to show, e.g. ['wren', 'ellis'] or just the child on the kid view. */
  people: string[];
}

/**
 * Points balance + big redeem buttons per person. Renders nothing until the
 * rewards migration has run.
 */
export function RewardsPanel({ people }: RewardsPanelProps) {
  const { enabled, rewards, balanceOf, redeem, isRedeeming } = useRewards();
  if (!enabled) return null;

  return (
    <div className="flex flex-col gap-4 px-3 py-3" style={{ borderBottom: '1px solid var(--fd-card-border)' }}>
      {people.map((id) => {
        const p = CALENDAR_FEEDS.find((f) => f.id === id);
        const name = p?.name ?? id;
        const balance = balanceOf(id);
        return (
          <section key={id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold" style={{ color: 'var(--fd-text-1)' }}>
                {p?.emoji} {name}
              </h3>
              <span className="text-2xl font-extrabold" style={{ color: 'var(--fd-accent)', fontVariantNumeric: 'tabular-nums' }}>
                ⭐ {balance}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rewards.map((r) => {
                const affordable = canAfford(balance, r.cost);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={!affordable || isRedeeming}
                    onClick={() => {
                      if (window.confirm(`Spend ${r.cost} points on ${r.title} for ${name}?`)) redeem(r.id, id);
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 min-h-[60px] text-left disabled:opacity-35 active:scale-[0.97]"
                    style={{
                      background: 'var(--fd-card-bg)',
                      border: `2px solid ${affordable ? 'var(--fd-accent)' : 'var(--fd-card-border)'}`,
                      color: 'var(--fd-text-1)',
                    }}
                    aria-label={`Redeem ${r.title} for ${r.cost} points for ${name}`}
                  >
                    <span className="text-3xl shrink-0">{r.emoji}</span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold leading-tight">{r.title}</span>
                      <span className="text-sm" style={{ color: 'var(--fd-text-2)' }}>⭐ {r.cost}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
