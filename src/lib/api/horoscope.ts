import { CORS_PROXY_URL } from '../calendar/config';

const PROXY_BASE = CORS_PROXY_URL.replace(/\/$/, '');

export const FAMILY_SIGNS = ['capricorn', 'aquarius', 'sagittarius'] as const;

export type ZodiacSign = (typeof FAMILY_SIGNS)[number];

export interface HoroscopeData {
  sign: string;
  date: string;
  horoscope: string;
}

export async function fetchHoroscopes(): Promise<HoroscopeData[]> {
  const results = await Promise.all(
    FAMILY_SIGNS.map(async (sign): Promise<HoroscopeData | null> => {
      try {
        const response = await fetch(`${PROXY_BASE}/horoscope?sign=${sign}`);

        if (!response.ok) {
          console.warn(`Horoscope API error for ${sign}: ${response.status}`);
          return null;
        }

        const data = await response.json();
        // API Ninjas returns { date, zodiac, horoscope } — map zodiac to sign
        return {
          sign: data.zodiac,
          date: data.date,
          horoscope: data.horoscope,
        };
      } catch (error) {
        console.warn(`Failed to fetch horoscope for ${sign}:`, error);
        return null;
      }
    }),
  );

  return results.filter((r): r is HoroscopeData => r !== null);
}
