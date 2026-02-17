import React from 'react';
import { useHoroscope } from '../../hooks/useHoroscope';
import type { ZodiacSign } from '../../lib/api/horoscope';

const ZODIAC_EMOJI: Record<ZodiacSign, string> = {
  capricorn: '\u2651',
  aquarius: '\u2652',
  sagittarius: '\u2650',
};

function HoroscopePanelInner() {
  const { data: horoscopes, isLoading, error } = useHoroscope();

  if (isLoading) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !horoscopes?.length) {
    return null;
  }

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" role="img" aria-label="Horoscopes">
          ✨
        </span>
        <h3 className="text-text-primary font-semibold text-[clamp(14px,1.2vw,18px)]">
          Daily Horoscopes
        </h3>
      </div>

      {/* Horoscope cards */}
      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide">
        {horoscopes.map((h) => {
          const sign = h.sign.toLowerCase() as ZodiacSign;
          const emoji = ZODIAC_EMOJI[sign] ?? '';

          return (
            <div
              key={h.sign}
              className="bg-white/5 rounded-lg p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{emoji}</span>
              </div>
              <p className="text-text-secondary text-[clamp(11px,0.9vw,13px)] leading-snug line-clamp-4">
                {h.horoscope}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const HoroscopePanel = React.memo(HoroscopePanelInner);
