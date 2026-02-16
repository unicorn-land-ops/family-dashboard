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
        <span className="text-sm font-medium text-white/70 truncate">
          {timer.label}
        </span>
        {!isDone && (
          <button
            type="button"
            onClick={onCancel}
            className="text-white/30 hover:text-white/60 text-lg leading-none ml-2"
            aria-label="Cancel timer"
          >
            &times;
          </button>
        )}
        {isDone && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium text-accent-gold hover:text-accent-gold/80 ml-2"
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
          <span className="text-accent-gold font-bold">Done!</span>
        ) : (
          <span className="text-white">{formatCountdown(remaining)}</span>
        )}
      </div>

      {/* Bottom: progress bar */}
      <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-accent-gold rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
