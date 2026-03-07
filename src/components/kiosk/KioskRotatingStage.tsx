import React from 'react';
import { useStageRotation } from '../../hooks/useStageRotation';
import type { StageSlot } from '../../hooks/useStageRotation';

interface KioskRotatingStageProps {
  lifeSlot: React.ReactNode;
  worldSlot: React.ReactNode;
  cadenceMs?: number;
  onSlotChange?: (slot: StageSlot) => void;
}

const BORDER_COLORS: Record<StageSlot, string> = {
  life: 'var(--fd-accent)',
  world: 'var(--fd-accent-teal)',
};

export function KioskRotatingStage({
  lifeSlot,
  worldSlot,
  cadenceMs = 60000,
  onSlotChange,
}: KioskRotatingStageProps) {
  const { activeSlot, isTransitioning } = useStageRotation(cadenceMs);

  React.useEffect(() => {
    onSlotChange?.(activeSlot);
  }, [activeSlot, onSlotChange]);

  const slots: { key: StageSlot; content: React.ReactNode }[] = [
    { key: 'life', content: lifeSlot },
    { key: 'world', content: worldSlot },
  ];

  return (
    <div
      className="kiosk-stage-card"
      style={{
        borderTopColor: BORDER_COLORS[activeSlot],
        transition: 'border-top-color 800ms ease-in-out',
      }}
    >
      <div className="kiosk-stage">
        {slots.map(({ key, content }) => {
          const isActive = activeSlot === key && !isTransitioning;
          return (
            <div
              key={key}
              className="kiosk-stage-slot"
              style={{
                opacity: isActive ? 1 : 0,
                transition: 'opacity 800ms ease-in-out',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
