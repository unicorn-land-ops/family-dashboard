import React, { useRef, useEffect, useMemo } from 'react';
import { useNewsTicker } from '../../hooks/useNewsTicker';
import { TICKER_SPEED_PX_PER_S } from '../../lib/news/config';
import { type NewsHeadline } from '../../lib/news/types';

function renderHeadlines(headlines: NewsHeadline[]) {
  return headlines.map((h, index) => (
    <React.Fragment key={index}>
      <span className="ticker-source-label">{h.source}:</span>
      {h.title}
      <span className="ticker-separator">·</span>
    </React.Fragment>
  ));
}

export function KioskNewsTicker() {
  const { headlines, loading } = useNewsTicker();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tickerText = useMemo(
    () => headlines.map((h) => `${h.source}: ${h.title}`).join(' · '),
    [headlines]
  );

  // Recalculate animation duration when headlines change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || headlines.length === 0) return;

    // Wait for DOM to measure scrollWidth after render
    const frame = requestAnimationFrame(() => {
      const halfWidth = wrapper.scrollWidth / 2;
      const duration = halfWidth / TICKER_SPEED_PX_PER_S;
      wrapper.style.setProperty('--ticker-duration', `${duration}s`);

      // Restart animation smoothly
      wrapper.style.animation = 'none';
      void wrapper.offsetHeight; // force reflow
      wrapper.style.animation = '';
    });

    return () => cancelAnimationFrame(frame);
  }, [tickerText, headlines.length]);

  // Don't render while loading first batch or when no headlines
  if (loading || headlines.length === 0) return null;

  return (
    <div ref={containerRef} className="ticker-container">
      <div ref={wrapperRef} className="ticker-wrapper">
        <span className="ticker-content">{renderHeadlines(headlines)}</span>
        <span className="ticker-content" aria-hidden="true">{renderHeadlines(headlines)}</span>
      </div>
    </div>
  );
}
