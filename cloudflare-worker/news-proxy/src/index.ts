/**
 * Family Dashboard — News RSS Proxy Worker
 *
 * Fetches RSS feeds from BBC World News, DW English, Tagesschau, Hacker News,
 * and TechCrunch. Parses XML, normalizes to a flat JSON array, and caches
 * responses for 15 minutes via Cloudflare Cache API.
 *
 * Route:  GET /  → { headlines: [{ source, title }] }
 *
 * Deploy:  cd cloudflare-worker/news-proxy && npm run deploy
 * Free tier: 100,000 requests/day (more than enough for a family kiosk)
 */

import { XMLParser } from 'fast-xml-parser';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_KEY = new Request('https://family-news-proxy/headlines');
const CACHE_TTL = 900; // 15 minutes in seconds

interface Headline {
  source: string;
  title: string;
}

interface FeedSource {
  url: string;
  label: string;
}

const FEEDS: FeedSource[] = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', label: 'BBC' },
  { url: 'https://rss.dw.com/rdf/rss-en-top', label: 'DW' },
  { url: 'https://www.tagesschau.de/xml/rss2/', label: 'Tagesschau' },
  { url: 'https://news.ycombinator.com/rss', label: 'HN' },
  { url: 'https://techcrunch.com/feed/', label: 'TechCrunch' },
];

const MAX_ITEMS_PER_FEED = 8;

function extractTitle(item: Record<string, unknown>): string {
  const raw = item['title'];
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const text = obj['#text'];
    if (text !== undefined) return String(text);
    return '';
  }
  return String(raw);
}

function parseItems(data: Record<string, unknown>): Array<Record<string, unknown>> {
  // RSS 2.0: data.rss.channel.item (BBC, HN, TechCrunch, Tagesschau)
  if (data['rss']) {
    const rss = data['rss'] as Record<string, unknown>;
    const channel = rss['channel'] as Record<string, unknown> | undefined;
    if (channel) {
      const items = channel['item'];
      if (!items) return [];
      return Array.isArray(items) ? items as Array<Record<string, unknown>> : [items as Record<string, unknown>];
    }
  }

  // RDF: data['rdf:RDF'].item (DW)
  if (data['rdf:RDF']) {
    const rdf = data['rdf:RDF'] as Record<string, unknown>;
    const items = rdf['item'];
    if (!items) return [];
    return Array.isArray(items) ? items as Array<Record<string, unknown>> : [items as Record<string, unknown>];
  }

  // Atom: data.feed.entry
  if (data['feed']) {
    const feed = data['feed'] as Record<string, unknown>;
    const entries = feed['entry'];
    if (!entries) return [];
    return Array.isArray(entries) ? entries as Array<Record<string, unknown>> : [entries as Record<string, unknown>];
  }

  return [];
}

async function fetchFeed(source: FeedSource): Promise<Headline[]> {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'FamilyDashboard/1.0 (RSS aggregator)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${source.url}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml) as Record<string, unknown>;

  const items = parseItems(data);

  return items
    .slice(0, MAX_ITEMS_PER_FEED)
    .map((item) => ({
      source: source.label,
      title: extractTitle(item).replace(/<[^>]+>/g, '').trim(),
    }))
    .filter((h) => h.title.length > 0);
}

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only serve GET /
    const url = new URL(request.url);
    if (url.pathname !== '/') {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // Check cache
    const cache = caches.default;
    const cached = await cache.match(CACHE_KEY);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)));

    const headlines: Headline[] = [];
    const failures: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        headlines.push(...result.value);
      } else {
        const source = FEEDS[i];
        console.error(`Feed failed [${source.label}]: ${result.reason}`);
        failures.push(source.label);
      }
    }

    // All feeds failed
    if (headlines.length === 0) {
      return jsonResponse(
        { headlines: [], error: 'All feeds unavailable', failures },
        503,
        { 'Cache-Control': 'no-store' }
      );
    }

    // Build and cache successful response
    const body = JSON.stringify({
      headlines,
      ...(failures.length > 0 ? { partial: true, failures } : {}),
    });

    const cacheResponse = new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_TTL}`,
      },
    });

    ctx.waitUntil(cache.put(CACHE_KEY, cacheResponse.clone()));

    return cacheResponse;
  },
};
