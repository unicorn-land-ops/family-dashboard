import React from 'react';
import { usePageRotation } from '../../hooks/usePageRotation';

interface KioskRotatingPanelProps {
  pageA: React.ReactNode;
  pageB: React.ReactNode;
}

export function KioskRotatingPanel({ pageA, pageB }: KioskRotatingPanelProps) {
  const { activePage } = usePageRotation(25000); // 25s crossfade interval

  return (
    <div className="kiosk-rotating-panel">
      <div
        className="kiosk-rotating-page"
        style={{
          opacity: activePage === 'A' ? 1 : 0,
          transition: 'opacity 800ms ease-in-out',
          pointerEvents: activePage === 'A' ? 'auto' : 'none',
        }}
      >
        {pageA}
      </div>
      <div
        className="kiosk-rotating-page"
        style={{
          opacity: activePage === 'B' ? 1 : 0,
          transition: 'opacity 800ms ease-in-out',
          pointerEvents: activePage === 'B' ? 'auto' : 'none',
        }}
      >
        {pageB}
      </div>
    </div>
  );
}
