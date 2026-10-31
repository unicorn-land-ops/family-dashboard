const CALENDAR_BASE = 'https://family-voice.joshuahaynes.workers.dev/cal';
const KEY_STORE = 'fd-dash-key';

/** The read-only dashboard key. It is never in the bundle: it arrives once as ?key= (the kiosk
 *  carries it in its URL, since it runs incognito) and phones keep it in localStorage. */
export function dashboardKey(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('key');
  try {
    if (fromUrl) localStorage.setItem(KEY_STORE, fromUrl);
    return fromUrl ?? localStorage.getItem(KEY_STORE) ?? '';
  } catch {
    return fromUrl ?? '';
  }
}

export async function fetchCalendarFeed(feed: string): Promise<string> {
  const key = dashboardKey();
  if (!key) throw new Error('Dashboard key missing: open the dashboard once with its ?key= link.');

  const response = await fetch(`${CALENDAR_BASE}/${feed}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    throw new Error(`Calendar fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
