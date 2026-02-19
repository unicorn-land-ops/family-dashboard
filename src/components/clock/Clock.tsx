import { useClock } from '../../hooks/useClock';
import { formatInTimeZone } from 'date-fns-tz';
import type { TravelTarget } from '../../hooks/useTravelWeather';

interface ClockProps {
  travelTarget?: TravelTarget | null;
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
export function Clock({ travelTarget = null }: ClockProps) {
  const { time } = useClock();
  const travelTime =
    travelTarget ? formatInTimeZone(new Date(), travelTarget.timezone, 'HH:mm') : null;
  const travelLocation = travelTarget ? getTravelLocationLabel(travelTarget) : null;

  return (
    <div className="flex items-end gap-[clamp(8px,1vw,18px)]">
      <div
        className="font-extralight tracking-tight text-text-primary leading-none tabular-nums"
        style={{ fontSize: 'clamp(2rem, 6vw, 6rem)' }}
      >
        {time}
      </div>
      {travelTime && travelLocation && (
        <div className="rounded-md border border-cyan-300/35 bg-cyan-300/12 px-[clamp(6px,0.9vw,12px)] py-[clamp(4px,0.5vw,8px)]">
          <div className="text-cyan-100/80 uppercase tracking-[0.08em] text-[clamp(0.45rem,0.8vw,0.68rem)] leading-none mb-1">
            {travelLocation}
          </div>
          <div
            className="font-medium text-cyan-50 leading-none tabular-nums"
            style={{ fontSize: 'clamp(1.5rem, 4.5vw, 4.5rem)' }}
          >
            {travelTime}
          </div>
        </div>
      )}
    </div>
  );
}
