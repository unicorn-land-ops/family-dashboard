import { useClock } from '../../hooks/useClock';
import { formatInTimeZone } from 'date-fns-tz';
import type { TravelTarget } from '../../hooks/useTravelWeather';

interface ClockProps {
  travelTarget?: TravelTarget | null;
  variant?: 'default' | 'kiosk';
}

function getTravelLocationLabel(target: TravelTarget): string {
  const fromParens = target.label.match(/\(([^)]+)\)/)?.[1]?.trim();
  if (fromParens) {
    return fromParens.split(',')[0]?.trim() || fromParens;
  }
  return target.timezone.split('/').pop()?.replace(/_/g, ' ') ?? 'Travel';
}

/**
 * Real-time clock display component.
 * Self-contained — only re-renders when its own time state changes.
 */
export function Clock({ travelTarget = null, variant = 'default' }: ClockProps) {
  const { time } = useClock();
  const travelTime =
    travelTarget ? formatInTimeZone(new Date(), travelTarget.timezone, 'HH:mm') : null;
  const travelLocation = travelTarget ? getTravelLocationLabel(travelTarget) : null;
  const isKiosk = variant === 'kiosk';

  return (
    <div className="flex flex-col">
      <div
        className="font-light tracking-tight leading-none tabular-nums clock-shimmer"
        style={{
          fontSize: isKiosk
            ? 'clamp(4rem, 12vw, 11rem)'
            : 'clamp(2rem, 6vw, 6rem)',
        }}
      >
        {time}
      </div>
      {travelTime && travelLocation && (
        <div
          className="flex items-baseline gap-[clamp(4px,0.5vw,8px)] mt-1 opacity-60"
          style={{ color: 'var(--fd-text-2)' }}
        >
          <span
            className="uppercase tracking-[0.08em]"
            style={{
              fontSize: isKiosk
                ? 'clamp(0.7rem,1vw,0.95rem)'
                : 'clamp(0.5rem,0.8vw,0.7rem)',
            }}
          >
            {travelLocation}
          </span>
          <span
            className="font-medium tabular-nums"
            style={{
              fontSize: isKiosk
                ? 'clamp(0.9rem,1.3vw,1.2rem)'
                : 'clamp(0.65rem,1vw,0.9rem)',
            }}
          >
            {travelTime}
          </span>
        </div>
      )}
    </div>
  );
}
