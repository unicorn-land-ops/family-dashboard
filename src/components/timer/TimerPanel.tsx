import { useState } from 'react';
import { useTimers, getRemainingSeconds } from '../../hooks/useTimers';
import { useInterval } from '../../hooks/useInterval';
import { supabaseEnabled } from '../../lib/supabase';
import { TimerInput } from './TimerInput';
import { TimerCard } from './TimerCard';
import { TimerAlert, clearAlertedTimer } from './TimerAlert';

interface TimerPanelProps {
  variant?: 'full' | 'compact';
}

export function TimerPanel({ variant = 'full' }: TimerPanelProps) {
  const {
    timers,
    activeTimers,
    completedTimers,
    activeCount,
    addTimer,
    cancelTimer,
    dismissTimer,
  } = useTimers();

  // Single 1-second tick to drive all countdown re-renders
  const [, setTick] = useState(0);
  const hasTimers = timers.length > 0;
  useInterval(() => setTick((t) => t + 1), hasTimers ? 1000 : null);

  function handleDismiss(id: string) {
    dismissTimer(id);
    clearAlertedTimer(id);
  }

  // --- Compact variant (wall sidebar) ---
  if (variant === 'compact') {
    return (
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
          Timers ({activeCount})
        </h3>
        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {activeTimers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              remaining={getRemainingSeconds(timer)}
              onCancel={() => cancelTimer(timer.id)}
              onDismiss={() => handleDismiss(timer.id)}
              compact
            />
          ))}
          {completedTimers.map((timer) => (
            <TimerAlert
              key={timer.id}
              timer={timer}
              onDismiss={() => handleDismiss(timer.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Full variant (mobile) ---

  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-white/30 text-center py-8">
          Connect Supabase to use timers
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-semibold text-white">
          Timers ({activeCount})
        </h2>
      </div>

      {/* Timer list area */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {activeTimers.length === 0 && completedTimers.length === 0 ? (
          <p className="text-white/30 text-center py-8">No active timers</p>
        ) : (
          <>
            {activeTimers.map((timer) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                remaining={getRemainingSeconds(timer)}
                onCancel={() => cancelTimer(timer.id)}
                onDismiss={() => handleDismiss(timer.id)}
              />
            ))}
            {completedTimers.map((timer) => (
              <TimerAlert
                key={timer.id}
                timer={timer}
                onDismiss={() => handleDismiss(timer.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Sticky bottom: input */}
      <div className="sticky bottom-0 bg-bg-primary/80 backdrop-blur-sm border-t border-white/10">
        <TimerInput onAdd={addTimer} />
      </div>
    </div>
  );
}
