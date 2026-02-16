interface RotationIndicatorProps {
  activeIndex: number;
  panelCount: number;
  labels: string[];
  onSelect: (index: number) => void;
}

/**
 * Dot-based indicator showing which panel is active.
 * Active dot is wider with gold accent; shows "Next: X" label.
 */
export function RotationIndicator({
  activeIndex,
  panelCount,
  labels,
  onSelect,
}: RotationIndicatorProps) {
  const nextIndex = (activeIndex + 1) % panelCount;
  const nextLabel = labels[nextIndex] ?? '';

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {/* Dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: panelCount }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              aria-label={labels[i]}
              onClick={() => onSelect(i)}
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-accent-gold w-6 h-2'
                  : 'bg-white/30 w-2 h-2 hover:bg-white/50'
              }`}
            />
          );
        })}
      </div>

      {/* Next label */}
      <span className="text-text-secondary text-[clamp(9px,0.7vw,11px)] tracking-wide">
        Next: {nextLabel}
      </span>
    </div>
  );
}
