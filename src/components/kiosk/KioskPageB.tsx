/**
 * KioskPageB.tsx — World Stuff rotating panel page
 *
 * Sections: Stars (horoscopes) + Transit + World (country-of-day)
 * Calls its own data hooks directly (same pattern as all other panels).
 */

import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useHoroscope } from '../../hooks/useHoroscope';
import { useTransit } from '../../hooks/useTransit';
import { useCountryOfDay } from '../../hooks/useCountryOfDay';
import type { ZodiacSign } from '../../lib/api/horoscope';
import type { Departure } from '../../lib/api/bvgTransit';

// --- Horoscope helpers (copied from HoroscopePanel — small pure functions) ---

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

function stripLeadingSign(text: string, sign: string): string {
  const pattern = new RegExp(`^(today,?\\s+)?${sign},?\\s*`, 'i');
  const stripped = text.replace(pattern, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function truncateToSentences(text: string, maxSentences = 2): string {
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const sentences = text.match(sentenceRegex) ?? [text];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

// --- Transit helpers (copied from TransitPanel — small pure functions) ---

function isSEV(departure: Departure): boolean {
  return (
    departure.line.product === 'bus' ||
    departure.remarks.some((r) => r.text?.includes('Ersatzverkehr'))
  );
}

function formatDelay(delaySec: number | null): string | null {
  if (delaySec === null || delaySec <= 0) return null;
  return `+${Math.round(delaySec / 60)} min`;
}

// --- PanelSection helper ---

function PanelSection({
  title,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="kiosk-panel-section">
      <div className="kiosk-panel-section-title">{title}</div>
      {isEmpty ? (
        <div className="kiosk-panel-empty">{emptyText}</div>
      ) : (
        children
      )}
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 1.5vw, 1.4rem)',
  color: 'var(--fd-text-1)',
};

const secondaryStyle: React.CSSProperties = {
  fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
  color: 'var(--fd-text-2)',
};

export function KioskPageB() {
  const { data: horoscopes, isLoading: horoscopeLoading } = useHoroscope();
  const { data: departures, isLoading: transitLoading } = useTransit();
  const { data: country, isLoading: countryLoading } = useCountryOfDay();

  const visibleHoroscopes = horoscopes?.slice(0, 3) ?? [];
  const visibleDepartures = departures?.slice(0, 4) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>

      {/* Stars — horoscopes */}
      <PanelSection
        title="Stars"
        isEmpty={!horoscopeLoading && visibleHoroscopes.length === 0}
        emptyText="No horoscopes today"
      >
        {horoscopeLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {visibleHoroscopes.map((h) => {
              const sign = h.sign.toLowerCase() as ZodiacSign;
              const emoji = ZODIAC_EMOJI[sign] ?? '';
              const label = ZODIAC_LABEL[sign] ?? h.sign;
              const fullText = stripLeadingSign(h.horoscope, h.sign);
              const summary = truncateToSentences(fullText, 2);

              return (
                <div key={h.sign}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.1rem' }}>
                    <span style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.2rem)' }}>{emoji}</span>
                    <span style={{ ...itemStyle, fontWeight: 500 }}>{label}</span>
                  </div>
                  <p style={{ ...secondaryStyle, lineHeight: 1.35, margin: 0 }}>
                    {summary}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>

      {/* Transit */}
      <PanelSection
        title="Transit"
        isEmpty={!transitLoading && visibleDepartures.length === 0}
        emptyText="No departures"
      >
        {transitLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {visibleDepartures.map((dep) => {
              const cancelled = dep.when === null;
              const sev = isSEV(dep);
              const delay = formatDelay(dep.delay);

              return (
                <div
                  key={dep.tripId}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'clamp(12px, 1.1vw, 15px)' }}
                >
                  {/* Line badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      borderRadius: '4px',
                      padding: '1px 5px',
                      minWidth: '2.2rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      background: sev ? 'rgba(59,130,246,0.2)' : 'rgba(234,179,8,0.2)',
                      color: sev ? '#93c5fd' : '#fde047',
                      flexShrink: 0,
                    }}
                  >
                    {sev ? '🚌 SEV' : dep.line.name}
                  </span>

                  {/* Direction */}
                  <span style={{ ...secondaryStyle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dep.direction}
                  </span>

                  {/* Time or Cancelled */}
                  {cancelled ? (
                    <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0 }}>
                      Cancelled
                    </span>
                  ) : (
                    <span style={{ ...itemStyle, fontFamily: 'monospace', flexShrink: 0 }}>
                      {formatInTimeZone(new Date(dep.when!), 'Europe/Berlin', 'HH:mm')}
                    </span>
                  )}

                  {/* Delay */}
                  {delay && !cancelled && (
                    <span style={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                      {delay}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>

      {/* World — country of day */}
      <PanelSection
        title="World"
        isEmpty={!countryLoading && !country}
        emptyText="Loading..."
      >
        {countryLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : country ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            {country.flags?.svg && (
              <img
                src={country.flags.svg}
                alt={country.flags.alt ?? `Flag of ${country.name.common}`}
                style={{ height: '2rem', width: 'auto', borderRadius: '2px', flexShrink: 0, objectFit: 'cover' }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
              <span style={{ ...itemStyle, fontWeight: 600 }}>{country.name.common}</span>
              {country.capital && (
                <span style={secondaryStyle}>{country.capital[0]}</span>
              )}
              {country.region && (
                <span style={secondaryStyle}>{country.region}</span>
              )}
            </div>
          </div>
        ) : null}
      </PanelSection>

    </div>
  );
}
