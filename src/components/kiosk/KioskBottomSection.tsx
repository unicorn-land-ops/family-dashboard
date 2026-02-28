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
      {/* Left column — family photo frame */}
      <KioskPhotoFrame />

      {/* Right column — rotating panel */}
      <KioskRotatingPanel pageA={pageA} pageB={pageB} />
    </div>
  );
}
