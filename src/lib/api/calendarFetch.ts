import { CORS_PROXY_URL } from '../calendar/config';

export async function fetchCalendarFeed(calendarUrl: string): Promise<string> {
  if (!CORS_PROXY_URL) {
    throw new Error(
      'VITE_CORS_PROXY_URL not configured. Set it in your .env file.',
    );
  }

  const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(calendarUrl)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(
      `Calendar fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}
