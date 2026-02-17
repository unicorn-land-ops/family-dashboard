import { formatInTimeZone } from 'date-fns-tz';

const COUNTRIES_URL =
  'https://restcountries.com/v3.1/all?fields=name,flags,capital,population,languages,region,currencies';

export interface CountryData {
  name: { common: string; official: string };
  flags: { svg: string; png: string; alt: string };
  capital: string[];
  population: number;
  languages: Record<string, string>;
  region: string;
  currencies: Record<string, { name: string; symbol: string }>;
}

/**
 * Pick a deterministic country for the current calendar day (Berlin timezone).
 * Uses YYYYMMDD as an integer seed, modulo the number of countries.
 */
export function pickCountryOfDay(countries: CountryData[]): CountryData {
  const berlinDate = formatInTimeZone(new Date(), 'Europe/Berlin', 'yyyyMMdd');
  const daySeed = parseInt(berlinDate, 10);
  return countries[daySeed % countries.length];
}

export interface UnsplashPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
  downloadLocationUrl: string;
}

export async function fetchCountryImage(
  countryName: string,
): Promise<UnsplashPhoto | null> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as
    | string
    | undefined;
  if (!accessKey) return null;

  const query = encodeURIComponent(`${countryName} landscape`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.results || data.results.length === 0) return null;

  const photo = data.results[0];

  // Fire download trigger (required by Unsplash API terms)
  fetch(photo.links.download_location, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  }).catch(() => {});

  return {
    url: photo.urls.small,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
    downloadLocationUrl: photo.links.download_location,
  };
}

export async function fetchCountryOfDay(): Promise<CountryData> {
  const response = await fetch(COUNTRIES_URL);

  if (!response.ok) {
    throw new Error(
      `REST Countries API error: ${response.status} ${response.statusText}`,
    );
  }

  const countries: CountryData[] = await response.json();
  return pickCountryOfDay(countries);
}
