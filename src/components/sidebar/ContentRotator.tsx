import React from 'react';
import type { ReactNode } from 'react';

interface ContentRotatorProps {
  activeIndex: number;
  children: ReactNode[];
}

/**
 * Memory-safe rotator that renders only the active panel.
 * This avoids keeping hidden panels (and their data trees) mounted on low-RAM kiosks.
 */
export function ContentRotator({ activeIndex, children }: ContentRotatorProps) {
  const activeChild = React.Children.toArray(children)[activeIndex] ?? null;

  return (
    <div className="relative flex-1 overflow-hidden transition-opacity duration-300 ease-in-out">
      <div key={activeIndex} className="absolute inset-0 flex flex-col">
        {activeChild}
      </div>
    </div>
  );
}
