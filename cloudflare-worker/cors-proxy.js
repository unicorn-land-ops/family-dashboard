/**
 * Family Dashboard — CORS Proxy for Google Calendar ICS Feeds & Horoscope API
 *
 * Routes:
 *   /?url=<google-calendar-ics-url>  — Proxies Google Calendar iCal feeds (CORS)
 *   /horoscope?sign=<zodiac-sign>    — Proxies API Ninjas horoscope endpoint (key server-side)
 *
 * Deploy:  cd cloudflare-worker && npx wrangler deploy
 * Secrets: npx wrangler secret put API_NINJAS_KEY
 * Free tier: 100,000 requests/day (more than enough for a family dashboard)
 *
 * Security: Calendar proxy only allows https://calendar.google.com/ URLs.
 *           Horoscope proxy keeps the API Ninjas key server-side.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function jsonError(message, status) {
  return jsonResponse({ error: message }, status);
}

async function handleHoroscope(url, env) {
  const sign = url.searchParams.get('sign');
  if (!sign) {
    return jsonError('Missing "sign" query parameter', 400);
  }

  if (!env.API_NINJAS_KEY) {
    return jsonError('API_NINJAS_KEY secret is not configured', 500);
  }

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/horoscope?sign=${encodeURIComponent(sign)}`,
      { headers: { 'X-Api-Key': env.API_NINJAS_KEY } }
    );

    if (!response.ok) {
      return jsonError(`API Ninjas returned ${response.status}`, response.status);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return jsonError(`Failed to fetch horoscope: ${err.message}`, 502);
  }
}

async function handleCalendarProxy(url) {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return jsonError('Missing "url" query parameter', 400);
  }

  if (!targetUrl.startsWith('https://calendar.google.com/')) {
    return jsonError('Only Google Calendar URLs are allowed', 403);
  }

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return jsonError(`Upstream returned ${response.status}`, response.status);
    }

    const body = await response.text();

    return new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return jsonError(`Failed to fetch calendar: ${err.message}`, 502);
  }
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Route: /horoscope?sign=capricorn
    if (url.pathname === '/horoscope') {
      return handleHoroscope(url, env);
    }

    // Route: /?url=... (existing calendar proxy)
    return handleCalendarProxy(url);
  },
};
