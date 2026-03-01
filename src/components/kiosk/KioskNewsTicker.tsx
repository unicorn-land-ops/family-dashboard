import { useState, useEffect, useCallback } from 'react';
import { useNewsTicker } from '../../hooks/useNewsTicker';

const HEADLINE_DURATION_MS = 8000;
const SLIDE_DURATION_MS = 400;

export function KioskNewsTicker() {
  const { headlines, loading } = useNewsTicker();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const advance = useCallback(() => {
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
      setIsSliding(false);
    }, SLIDE_DURATION_MS);
  }, [headlines.length]);

  useEffect(() => {
    if (headlines.length < 2) return;
    const timer = setInterval(advance, HEADLINE_DURATION_MS);
    return () => clearInterval(timer);
  }, [advance, headlines.length]);

  // Reset index when headlines refresh (avoid stale index)
  useEffect(() => {
    setCurrentIndex(0);
  }, [headlines]);

  if (loading || headlines.length === 0) return null;

  const current = headlines[currentIndex % headlines.length];
  const next = headlines[(currentIndex + 1) % headlines.length];

  return (
    <div className="ticker-container">
      <div className="ticker-carousel" aria-live="polite" aria-atomic="true">
        <div
          className="ticker-slide"
          style={{
            transform: isSliding ? 'translateY(-100%)' : 'translateY(0)',
            transition: isSliding
              ? `transform ${SLIDE_DURATION_MS}ms ease-out`
              : 'none',
          }}
        >
          <span className="ticker-source-label">{current.source}:</span>
          {current.title}
        </div>
        <div
          className="ticker-slide"
          aria-hidden="true"
          style={{
            transform: isSliding ? 'translateY(-100%)' : 'translateY(0)',
            transition: isSliding
              ? `transform ${SLIDE_DURATION_MS}ms ease-out`
              : 'none',
          }}
        >
          <span className="ticker-source-label">{next.source}:</span>
          {next.title}
        </div>
      </div>
    </div>
  );
}
