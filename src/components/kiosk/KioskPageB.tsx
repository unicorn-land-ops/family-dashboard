/**
 * KioskPageB.tsx — World Stuff rotating panel page
 *
 * 3-column horizontal layout: Stars | Transit | Country
 */

import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useHoroscope } from '../../hooks/useHoroscope';
import { useTransit } from '../../hooks/useTransit';
import { useCountryOfDay } from '../../hooks/useCountryOfDay';
import type { ZodiacSign } from '../../lib/api/horoscope';
import type { Departure } from '../../lib/api/bvgTransit';

const ZODIAC_EMOJI: Record<ZodiacSign, string> = {
  capricorn: '\u2651',
  aquarius: '\u2652',
  sagittarius: '\u2650',
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

function truncateToSentences(text: string, maxSentences = 1): string {
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const sentences = text.match(sentenceRegex) ?? [text];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

function isSEV(departure: Departure): boolean {
  return (
    departure.line.product === 'bus' ||
    departure.remarks.some((r) => r.text?.includes('Ersatzverkehr'))
  );
}

function formatDelay(delaySec: number | null): string | null {
  if (delaySec === null || delaySec <= 0) return null;
  return `+${Math.round(delaySec / 60)}`;
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 1.3vw, 20px)',
  fontWeight: 700,
  color: 'var(--fd-text-1)',
  marginBottom: 'clamp(4px, 0.4vw, 8px)',
};

const itemStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 1.3vw, 20px)',
  color: 'var(--fd-text-1)',
  lineHeight: 1.4,
};

const secondaryStyle: React.CSSProperties = {
  fontSize: 'clamp(12px, 1.1vw, 16px)',
  color: 'var(--fd-text-2)',
};

export function KioskPageB() {
  const { data: horoscopes, isLoading: horoscopeLoading } = useHoroscope();
  const { data: departures, isLoading: transitLoading } = useTransit();
  const { data: country, isLoading: countryLoading } = useCountryOfDay();

  const visibleHoroscopes = horoscopes?.slice(0, 3) ?? [];
  const visibleDepartures = departures?.slice(0, 4) ?? [];

  return (
    <div className="kiosk-stage-columns">
      {/* Column 1: Stars */}
      <div className="kiosk-stage-column">
        <div style={titleStyle}>Stars</div>
        {horoscopeLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : visibleHoroscopes.length === 0 ? (
          <div style={secondaryStyle}>No horoscopes today</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 0.5vw, 10px)' }}>
            {visibleHoroscopes.map((h) => {
              const sign = h.sign.toLowerCase() as ZodiacSign;
              const emoji = ZODIAC_EMOJI[sign] ?? '';
              const label = ZODIAC_LABEL[sign] ?? h.sign;
              const fullText = stripLeadingSign(h.horoscope, h.sign);
              const summary = truncateToSentences(fullText, 1);

              return (
                <div key={h.sign}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2px' }}>
                    <span style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>{emoji}</span>
                    <span style={{ ...itemStyle, fontWeight: 600, color: 'var(--fd-accent)' }}>{label}</span>
                  </div>
                  <p style={{ ...secondaryStyle, lineHeight: 1.35, margin: 0 }}>{summary}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Column 2: Transit */}
      <div className="kiosk-stage-column">
        <div style={titleStyle}>Senefelderplatz</div>
        {transitLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : visibleDepartures.length === 0 ? (
          <div style={secondaryStyle}>No departures</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 0.3vw, 6px)' }}>
            {visibleDepartures.map((dep) => {
              const cancelled = dep.when === null;
              const sev = isSEV(dep);
              const delay = formatDelay(dep.delay);

              return (
                <div key={dep.tripId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      borderRadius: '5px',
                      padding: '1px 6px',
                      minWidth: '2.4rem',
                      textAlign: 'center',
                      fontSize: 'clamp(11px, 1vw, 15px)',
                      background: sev ? '#D4483A' : '#1A5276',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {sev ? 'SEV' : dep.line.name}
                  </span>
                  <span style={{ ...secondaryStyle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dep.direction}
                  </span>
                  {cancelled ? (
                    <span style={{ color: '#f87171', fontWeight: 600, fontSize: 'clamp(11px, 1vw, 14px)', flexShrink: 0 }}>
                      Cancelled
                    </span>
                  ) : (
                    <span style={{ ...itemStyle, fontWeight: 600, color: 'var(--fd-accent)', flexShrink: 0 }}>
                      {formatInTimeZone(new Date(dep.when!), 'Europe/Berlin', 'HH:mm')}
                    </span>
                  )}
                  {delay && !cancelled && (
                    <span style={{ color: '#C4483A', fontSize: 'clamp(10px, 0.9vw, 13px)', fontWeight: 600, flexShrink: 0 }}>
                      {delay}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Column 3: Country of the Day */}
      <div className="kiosk-stage-column">
        <div style={titleStyle}>Country of the Day</div>
        {countryLoading ? (
          <div style={secondaryStyle}>Loading...</div>
        ) : country ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
            {country.flags?.svg && (
              <img
                src={country.flags.svg}
                alt={country.flags.alt ?? `Flag of ${country.name.common}`}
                style={{ width: '100%', maxHeight: 'clamp(40px, 5vw, 80px)', objectFit: 'contain', objectPosition: 'left', borderRadius: '4px', flexShrink: 0 }}
              />
            )}
            <div>
              <div style={{ ...itemStyle, fontWeight: 700 }}>{country.name.common}</div>
              {country.capital && (
                <div style={secondaryStyle}>{country.capital[0]}{country.region ? ` \u00B7 ${country.region}` : ''}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={secondaryStyle}>No data</div>
        )}
      </div>
    </div>
  );
}
