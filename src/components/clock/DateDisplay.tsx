import { useClock } from '../../hooks/useClock';

/**
 * Current date display component using Berlin timezone.
 * Shows English long format (e.g., "Monday, February 16, 2026").
 */
export function DateDisplay() {
  const { date } = useClock();

  return (
    <div
      className="font-normal text-text-secondary mt-1"
      style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}
    >
      {date}
    </div>
  );
}
