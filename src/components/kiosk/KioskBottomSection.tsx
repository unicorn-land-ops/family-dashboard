import React from 'react';
import { KioskRotatingPanel } from './KioskRotatingPanel';

interface KioskBottomSectionProps {
  pageA: React.ReactNode;
  pageB: React.ReactNode;
}

export function KioskBottomSection({ pageA, pageB }: KioskBottomSectionProps) {
  return (
    <div className="kiosk-bottom-section">
      {/* Left column — photo frame placeholder (Phase 4 replaces this) */}
      <div className="kiosk-photo-placeholder" />

      {/* Right column — rotating panel */}
      <KioskRotatingPanel pageA={pageA} pageB={pageB} />
    </div>
  );
}
