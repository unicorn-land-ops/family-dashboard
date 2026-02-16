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
