import React from 'react';
import type { ReactNode } from 'react';

interface ContentRotatorProps {
  activeIndex: number;
  children: ReactNode[];
}

/**
 * Container that keeps all children mounted and uses CSS opacity
 * crossfade to show the active panel. Keeping panels mounted
 * preserves React Query cache and prevents loading flashes.
 */
export function ContentRotator({ activeIndex, children }: ContentRotatorProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-500 ease-in-out flex flex-col"
          style={{
            opacity: index === activeIndex ? 1 : 0,
            pointerEvents: index === activeIndex ? 'auto' : 'none',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
