import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index';

const env = { SUPABASE_URL: 'https://sb.test', SUPABASE_ANON_KEY: 'anon', VOICE_TOKEN: 'secret' };

// Fake PostgREST: answers by path prefix, records inserts.
let inserts: { table: string; body: unknown }[] = [];
function fakeSupabase(routes: Record<string, unknown>) {
  inserts = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace('https://sb.test/rest/v1/', '');
    if (init?.method === 'POST') {
      inserts.push({ table: path, body: JSON.parse(String(init.body)) });
      return new Response(null, { status: 201 });
    }
    const key = Object.keys(routes).find((k) => path.startsWith(k));
    if (!key) return new Response('{"code":"PGRST205"}', { status: 404 });
    return Response.json(routes[key]);
  }));
}

// Node lacks the Workers-only crypto.subtle.timingSafeEqual.
beforeEach(() => {
  const subtle = crypto.subtle as unknown as Record<string, unknown>;
  subtle.timingSafeEqual ??= (a: Uint8Array, b: Uint8Array) => a.every((x, i) => x === b[i]);
});

const call = (path: string, body?: object, token = 'secret') =>
  worker.fetch(
    new Request(`https://voice.test${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );

describe('family-voice worker', () => {
  it('rejects a wrong or missing token', async () => {
    fakeSupabase({});
    expect((await call('/points?kid=ellis', undefined, 'nope')).status).toBe(401);
    expect((await worker.fetch(new Request('https://voice.test/points?kid=ellis'), env)).status).toBe(401);
  });

  it('adds a grocery', async () => {
    fakeSupabase({});
    const res = await call('/grocery', { item: 'Milch' });
    expect(await res.text()).toBe('Added Milch to the list.');
    expect(inserts).toEqual([{ table: 'groceries', body: { name: 'Milch', checked: false, added_by: 'siri' } }]);
  });

  it('completes a fuzzy-matched chore and speaks the balance', async () => {
    fakeSupabase({
      'chores?': [{ id: 'c1', title: 'Brush teeth', schedule: 'daily', assigned_to: 'ellis', is_active: true, created_at: '' }],
      'chore_completions?': [],
      'points_balances?': [{ person: 'ellis', earned: 24, spent: 1 }],
    });
    const res = await call('/chore', { kid: 'Ellis', chore: 'teeth' });
    expect(await res.text()).toBe('Done! Brush teeth. Ellis has 23 points.');
    expect(inserts).toEqual([{ table: 'chore_completions', body: { chore_id: 'c1', completed_by: 'ellis' } }]);
  });

  it('still completes chores when the rewards migration is missing', async () => {
    fakeSupabase({
      'chores?': [{ id: 'c1', title: 'Brush teeth', schedule: 'daily' }],
      'chore_completions?': [],
    });
    const res = await call('/chore', { kid: 'ellis', chore: 'brush' });
    expect(await res.text()).toBe('Done! Brush teeth.');
  });

  it('refuses to redeem without enough points, JSON on request', async () => {
    fakeSupabase({
      'rewards?': [{ id: 'r1', title: 'Ice cream', cost: 15, emoji: '🍦' }],
      'points_balances?': [{ person: 'wren', earned: 10, spent: 0 }],
    });
    const res = await call('/redeem?json=1', { kid: 'wren', reward: 'ice' });
    expect(await res.json()).toMatchObject({ ok: true, redeemed: false, text: 'Wren needs 5 more points for Ice cream.' });
    expect(inserts).toEqual([]);
  });
});
