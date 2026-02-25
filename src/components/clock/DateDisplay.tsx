import { useClock } from '../../hooks/useClock';

/**
 * Current date display component using Berlin timezone.
 * Shows English long format (e.g., "Monday, February 16, 2026").
 */
interface DateDisplayProps {
  variant?: 'default' | 'kiosk';
}

export function DateDisplay({ variant = 'default' }: DateDisplayProps) {
  const { date } = useClock();
  const isKiosk = variant === 'kiosk';

  return (
    <div
      className="font-normal mt-1"
      style={{
        color: 'var(--fd-text-2)',
        fontSize: isKiosk
          ? 'clamp(1.2rem, 1.8vw, 1.8rem)'
          : 'clamp(0.875rem, 1.2vw, 1.25rem)',
      }}
    >
      {date}
    </div>
  );
}
