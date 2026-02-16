import { useClock } from '../../hooks/useClock';

/**
 * Real-time clock display component.
 * Self-contained — only re-renders when its own time state changes.
 */
export function Clock() {
  const { time } = useClock();

  return (
    <div
      className="font-extralight tracking-tight text-text-primary leading-none tabular-nums"
      style={{ fontSize: 'clamp(2rem, 6vw, 6rem)' }}
    >
      {time}
    </div>
  );
}
