import React from 'react';
import { KioskPhotoFrame } from './KioskPhotoFrame';
import { KioskRotatingPanel } from './KioskRotatingPanel';

interface KioskBottomSectionProps {
  pageA: React.ReactNode;
  pageB: React.ReactNode;
}

export function KioskBottomSection({ pageA, pageB }: KioskBottomSectionProps) {
  return (
    <div className="kiosk-bottom-section">
      <KioskPhotoFrame />
      <KioskRotatingPanel pageA={pageA} pageB={pageB} />
    </div>
  );
}
