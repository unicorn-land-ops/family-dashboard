const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

function buildQueryVariants(query: string): string[] {
  const normalized = query.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const variants: string[] = [normalized];
  const withoutParens = normalized
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (withoutParens && !variants.includes(withoutParens)) {
    variants.push(withoutParens);
  }

  const commaHead = withoutParens.split(',')[0]?.trim();
  if (commaHead && !variants.includes(commaHead)) {
    variants.push(commaHead);
  }

  const withoutStateCode = withoutParens
    .replace(/,\s*[A-Z]{2}\b/g, '')
    .replace(/\b(USA|US|United States)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (withoutStateCode && !variants.includes(withoutStateCode)) {
    variants.push(withoutStateCode);
  }

  return variants.filter((variant) => variant.length >= 2);
}

async function geocodeVariant(query: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
  }

  const data: GeocodingResponse = await response.json();
  return data.results ?? [];
}

export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  const variants = buildQueryVariants(query);
  if (variants.length === 0) return [];

  let lastError: Error | null = null;
  for (const variant of variants) {
    try {
      const results = await geocodeVariant(variant);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}
