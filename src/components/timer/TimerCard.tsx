import { formatCountdown, getTimerProgress } from '../../hooks/useTimers';
import type { Timer } from '../../types/database';

interface TimerCardProps {
  timer: Timer;
  remaining: number;
  onCancel: () => void;
  onDismiss: () => void;
  compact?: boolean;
}

export function TimerCard({
  timer,
  remaining,
  onCancel,
  onDismiss,
  compact = false,
}: TimerCardProps) {
  const isDone = remaining <= 0;
  const progress = getTimerProgress(timer);

  return (
    <div
      className={`card-glass p-4 mb-3 ${isDone ? 'timer-alert-pulse' : ''}`}
    >
      {/* Top row: label + cancel */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--fd-text-2)' }}>
          {timer.label}
        </span>
        {!isDone && (
          <button
            type="button"
            onClick={onCancel}
            className="text-lg leading-none ml-2 hover:opacity-80"
            style={{ color: 'var(--fd-text-2)' }}
            aria-label="Cancel timer"
          >
            &times;
          </button>
        )}
        {isDone && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium ml-2"
            style={{ color: 'var(--fd-accent)' }}
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Center: countdown */}
      <div
        className={`text-center font-mono ${compact ? 'text-2xl' : 'text-4xl'}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {isDone ? (
          <span className="font-bold" style={{ color: 'var(--fd-accent)' }}>Done!</span>
        ) : (
          <span style={{ color: 'var(--fd-text-1)' }}>{formatCountdown(remaining)}</span>
        )}
      </div>

      {/* Bottom: progress bar */}
      <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'var(--fd-card-border)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{ backgroundColor: 'var(--fd-accent)', width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
