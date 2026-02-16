const HOROSCOPE_BASE = 'https://ohmanda.com/api/horoscope';

export const FAMILY_SIGNS = ['capricorn', 'aquarius', 'sagittarius'] as const;

export type ZodiacSign = (typeof FAMILY_SIGNS)[number];

export const SIGN_LABELS: Record<ZodiacSign, string> = {
  capricorn: 'Papa (Capricorn)',
  aquarius: 'Daddy (Aquarius)',
  sagittarius: 'Wren (Sagittarius)',
};

export interface HoroscopeData {
  sign: string;
  date: string;
  horoscope: string;
}

export async function fetchHoroscopes(): Promise<HoroscopeData[]> {
  const results = await Promise.all(
    FAMILY_SIGNS.map(async (sign): Promise<HoroscopeData | null> => {
      try {
        const response = await fetch(`${HOROSCOPE_BASE}/${sign}`);

        if (!response.ok) {
          console.warn(`Horoscope API error for ${sign}: ${response.status}`);
          return null;
        }

        return (await response.json()) as HoroscopeData;
      } catch (error) {
        console.warn(`Failed to fetch horoscope for ${sign}:`, error);
        return null;
      }
    }),
  );

  return results.filter((r): r is HoroscopeData => r !== null);
}
