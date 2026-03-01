import React, { useState, useCallback } from 'react';
import { KioskPhotoFrame, type PhotoOrientation } from './KioskPhotoFrame';
import { KioskRotatingPanel } from './KioskRotatingPanel';

interface KioskBottomSectionProps {
  pageA: React.ReactNode;
  pageB: React.ReactNode;
}

export function KioskBottomSection({ pageA, pageB }: KioskBottomSectionProps) {
  const [orientation, setOrientation] = useState<PhotoOrientation>('portrait');

  const handleOrientationChange = useCallback((o: PhotoOrientation) => {
    setOrientation(o);
  }, []);

  return (
    <div className="kiosk-bottom-section" data-orientation={orientation}>
      <KioskPhotoFrame onOrientationChange={handleOrientationChange} />
      <KioskRotatingPanel pageA={pageA} pageB={pageB} />
    </div>
  );
}
