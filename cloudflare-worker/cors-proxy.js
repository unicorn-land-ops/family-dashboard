/**
 * Family Dashboard — CORS Proxy for Google Calendar ICS Feeds
 *
 * Google Calendar iCal feeds do not include CORS headers, so browser-side
 * fetch fails. This lightweight Cloudflare Worker proxies requests and adds
 * the necessary Access-Control-Allow-Origin headers.
 *
 * Deploy:  cd cloudflare-worker && npx wrangler deploy
 * Free tier: 100,000 requests/day (more than enough for a family dashboard)
 *
 * Security: Only proxies URLs starting with https://calendar.google.com/
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    // Require url parameter
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing "url" query parameter' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Security: only allow Google Calendar URLs
    if (!targetUrl.startsWith('https://calendar.google.com/')) {
      return new Response(
        JSON.stringify({ error: 'Only Google Calendar URLs are allowed' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const response = await fetch(targetUrl);

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream returned ${response.status}` }),
          { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar', detail: err.message }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  },
};
