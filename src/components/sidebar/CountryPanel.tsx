import React from 'react';
import { useCountryOfDay, useCountryImage } from '../../hooks/useCountryOfDay';

const numberFmt = new Intl.NumberFormat();

function UnsplashAttribution({
  photographer,
  photographerUrl,
}: {
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}) {
  return (
    <p className="text-[clamp(8px,0.6vw,10px)] text-text-secondary mt-1">
      Photo by{' '}
      <a
        href={`${photographerUrl}?utm_source=family_dashboard&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {photographer}
      </a>{' '}
      on{' '}
      <a
        href="https://unsplash.com/?utm_source=family_dashboard&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Unsplash
      </a>
    </p>
  );
}

function CountryPanelInner() {
  const { data: country, isLoading, error } = useCountryOfDay();
  const { data: countryImage } = useCountryImage(country?.name.common);

  if (isLoading) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-44 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-16 rounded bg-white/10 animate-pulse" />
        <div className="h-24 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex items-center justify-center">
        <span className="text-text-secondary text-sm">
          Country unavailable
        </span>
      </div>
    );
  }

  const languages = country.languages
    ? Object.values(country.languages).join(', ')
    : 'N/A';

  const currencyEntry = country.currencies
    ? Object.values(country.currencies)[0]
    : null;
  const currency = currencyEntry
    ? `${currencyEntry.name} (${currencyEntry.symbol})`
    : 'N/A';

  const showOfficial =
    country.name.official !== country.name.common;

  return (
    <div className="card-glass p-[clamp(12px,1.5vw,24px)] flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" role="img" aria-label="Globe">
          🌍
        </span>
        <h3 className="text-text-primary font-semibold text-[clamp(14px,1.2vw,18px)]">
          Country of the Day
        </h3>
      </div>

      {/* Flag + name */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={country.flags.svg}
          alt={country.flags.alt || `Flag of ${country.name.common}`}
          className="h-16 w-auto rounded shadow-md object-contain"
        />
        <div>
          <p className="text-text-primary font-bold text-[clamp(16px,1.4vw,22px)] leading-tight">
            {country.name.common}
          </p>
          {showOfficial && (
            <p className="text-text-secondary text-[clamp(10px,0.8vw,12px)] leading-tight mt-0.5">
              {country.name.official}
            </p>
          )}
        </div>
      </div>

      {/* Country landscape photo */}
      {countryImage && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={countryImage.url}
            alt={`Landscape of ${country.name.common}`}
            className="w-full h-auto rounded-lg object-cover"
            style={{ maxHeight: 'clamp(100px, 12vw, 180px)' }}
            loading="eager"
          />
          <UnsplashAttribution
            photographer={countryImage.photographer}
            photographerUrl={countryImage.photographerUrl}
            unsplashUrl={countryImage.unsplashUrl}
          />
        </div>
      )}

      {/* Facts grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[clamp(11px,0.9vw,13px)]">
        <Fact label="Capital" value={country.capital?.join(', ') || 'N/A'} />
        <Fact label="Population" value={numberFmt.format(country.population)} />
        <Fact label="Region" value={country.region} />
        <Fact label="Languages" value={languages} />
        <Fact label="Currency" value={currency} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-secondary text-[clamp(9px,0.7vw,11px)] uppercase tracking-wider">
        {label}
      </span>
      <p className="text-text-primary leading-snug">{value}</p>
    </div>
  );
}

export const CountryPanel = React.memo(CountryPanelInner);
