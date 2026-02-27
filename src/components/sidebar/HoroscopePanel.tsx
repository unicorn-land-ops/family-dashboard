import React from 'react';
import { useHoroscope } from '../../hooks/useHoroscope';
import type { ZodiacSign } from '../../lib/api/horoscope';

const ZODIAC_EMOJI: Record<ZodiacSign, string> = {
  capricorn: '♑',
  aquarius: '♒',
  sagittarius: '♐',
};

const ZODIAC_LABEL: Record<ZodiacSign, string> = {
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  sagittarius: 'Sagittarius',
};

/** Strip leading "Today, Capricorn, " / "Aquarius, " etc. from API text */
function stripLeadingSign(text: string, sign: string): string {
  const pattern = new RegExp(
    `^(today,?\\s+)?${sign},?\\s*`,
    'i',
  );
  const stripped = text.replace(pattern, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/** Extract the first sentence from a horoscope text */
function firstSentence(text: string): string {
  // Match up to the first period followed by a space or end of string
  const match = text.match(/^(.+?\.)\s/);
  return match ? match[1] : text;
}

function HoroscopePanelInner() {
  const { data: horoscopes, isLoading, error } = useHoroscope();

  if (isLoading) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-[var(--fd-card-border)] animate-pulse" />
          <div className="h-5 w-40 rounded bg-[var(--fd-card-border)] animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-[var(--fd-card-border)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !horoscopes?.length) {
    return null;
  }

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" role="img" aria-label="Horoscopes">
          ✨
        </span>
        <h3 className="font-semibold text-[clamp(14px,1.2vw,18px)]" style={{ color: 'var(--fd-text-1)' }}>
          Daily Horoscopes
        </h3>
      </div>

      {/* One-line horoscope per sign */}
      <div className="flex flex-col gap-[clamp(8px,1vw,14px)]">
        {horoscopes.map((h) => {
          const sign = h.sign.toLowerCase() as ZodiacSign;
          const emoji = ZODIAC_EMOJI[sign] ?? '';
          const label = ZODIAC_LABEL[sign] ?? h.sign;
          const fullText = stripLeadingSign(h.horoscope, h.sign);
          const summary = firstSentence(fullText);

          return (
            <div key={h.sign}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  style={{ fontSize: 'clamp(1rem, 1.2vw, 1.3rem)' }}
                >
                  {emoji}
                </span>
                <span
                  className="font-medium"
                  style={{
                    fontSize: 'clamp(0.85rem, 1vw, 1.05rem)',
                    color: 'var(--fd-text-1)',
                  }}
                >
                  {label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'clamp(0.82rem, 0.95vw, 1rem)',
                  color: 'var(--fd-text-2)',
                  lineHeight: 1.4,
                }}
              >
                {summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const HoroscopePanel = React.memo(HoroscopePanelInner);
