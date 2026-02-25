import { useEffect } from 'react';
import { playTimerAlert } from '../../lib/sounds';
import type { Timer } from '../../types/database';

// Track which timers have already triggered an alert sound
// Module-level to persist across re-renders but reset on page reload
const alertedTimerIds = new Set<string>();

export function clearAlertedTimer(id: string) {
  alertedTimerIds.delete(id);
}

interface TimerAlertProps {
  timer: Timer;
  onDismiss: () => void;
}

export function TimerAlert({ timer, onDismiss }: TimerAlertProps) {
  useEffect(() => {
    if (!alertedTimerIds.has(timer.id)) {
      alertedTimerIds.add(timer.id);
      playTimerAlert();
    }
  }, [timer.id]);

  return (
    <div className="timer-alert-pulse p-4 mb-3">
      <div className="text-center space-y-3">
        <p className="text-sm font-medium" style={{ color: 'var(--fd-text-2)' }}>{timer.label}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--fd-accent)' }}>Time's up!</p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full min-h-[48px] rounded-lg font-bold text-lg transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: 'var(--fd-accent)', color: 'var(--fd-bg)' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
