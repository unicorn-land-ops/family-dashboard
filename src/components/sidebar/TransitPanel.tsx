import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useTransit } from '../../hooks/useTransit';
import type { Departure } from '../../lib/api/bvgTransit';

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

function TransitPanelInner() {
  const { data: departures, isLoading, error } = useTransit();

  if (isLoading) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-36 rounded bg-white/10 animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex items-center justify-center">
        <span className="text-text-secondary text-sm">
          Transit data unavailable
        </span>
      </div>
    );
  }

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" role="img" aria-label="U-Bahn">
          🚇
        </span>
        <h3 className="text-text-primary font-semibold text-[clamp(14px,1.2vw,18px)]">
          Senefelderplatz
        </h3>
      </div>

      {/* Departure list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
        {departures?.map((dep) => {
          const cancelled = dep.when === null;
          const sev = isSEV(dep);
          const delay = formatDelay(dep.delay);

          return (
            <div
              key={dep.tripId}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[clamp(12px,1vw,15px)] ${
                cancelled ? 'departure-cancelled' : ''
              } ${sev ? 'departure-sev' : ''}`}
            >
              {/* Line badge */}
              <span
                className={`inline-flex items-center justify-center font-bold rounded px-1.5 py-0.5 min-w-[2.5rem] text-center text-xs ${
                  sev
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}
              >
                {sev ? '🚌 ' : ''}
                {sev ? 'SEV' : dep.line.name}
              </span>

              {/* Direction */}
              <span className="text-text-secondary truncate flex-1">
                {dep.direction}
              </span>

              {/* Time or Cancelled */}
              {cancelled ? (
                <span className="text-red-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-red-500/15">
                  Cancelled
                </span>
              ) : (
                <span className="text-text-primary font-mono tabular-nums whitespace-nowrap">
                  {formatInTimeZone(
                    new Date(dep.when!),
                    'Europe/Berlin',
                    'HH:mm',
                  )}
                </span>
              )}

              {/* Delay badge */}
              {delay && !cancelled && (
                <span className="text-orange-400 text-xs font-semibold whitespace-nowrap">
                  {delay}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TransitPanel = React.memo(TransitPanelInner);
