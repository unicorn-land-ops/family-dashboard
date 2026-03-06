import React from 'react';
import { useStageRotation } from '../../hooks/useStageRotation';
import type { StageSlot } from '../../hooks/useStageRotation';

interface KioskRotatingStageProps {
  photoSlot: React.ReactNode;
  lifeSlot: React.ReactNode;
  worldSlot: React.ReactNode;
  cadenceMs?: number;
  onSlotChange?: (slot: StageSlot) => void;
}

export function KioskRotatingStage({
  photoSlot,
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
    { key: 'photo', content: photoSlot },
    { key: 'life', content: lifeSlot },
    { key: 'world', content: worldSlot },
  ];

  return (
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
  );
}
