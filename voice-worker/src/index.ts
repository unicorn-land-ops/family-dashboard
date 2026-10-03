// family-voice: Siri Shortcuts -> Supabase for groceries, chores and rewards.
//
//   POST /grocery {item, by?}     add to the shopping list
//   POST /chore   {kid, chore}    tick off the best-matching chore
//   POST /redeem  {kid, reward}   spend points on the best-matching reward
//   GET  /points?kid=             how many points, what's next
//
// Every request needs `Authorization: Bearer <VOICE_TOKEN>`.
// Replies are one speakable sentence (text/plain); add ?json=1 for JSON.

import { bestMatch } from './match';
import { balanceOf, nextReward } from '../../src/lib/points';
import { isChoreCompleted } from '../../src/lib/choreSchedule';
import type { Chore, ChoreCompletion } from '../../src/types/database';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  VOICE_TOKEN: string;
}

const PEOPLE = ['wren', 'ellis', 'papa', 'daddy'];

class SupabaseError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`Supabase ${status}: ${body}`);
    this.status = status;
  }
}

async function sb<T = unknown>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
  });
  if (!res.ok) throw new SupabaseError(res.status, await res.text());
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const insert = (env: Env, table: string, row: object) =>
  sb(env, table, { method: 'POST', body: JSON.stringify(row) });

/** Points balance, or null when the rewards migration hasn't been run. */
async function points(env: Env, kid: string): Promise<number | null> {
  try {
    const rows = await sb<{ person: string; earned: number; spent: number }[]>(
      env,
      `points_balances?person=eq.${encodeURIComponent(kid)}`,
    );
    return balanceOf(rows, kid);
  } catch (e) {
    if (e instanceof SupabaseError && e.status < 500) return null; // view missing
    throw e;
  }
}

async function rewards(env: Env) {
  try {
    return await sb<{ id: string; title: string; cost: number; emoji: string }[]>(
      env,
      'rewards?select=id,title,cost,emoji&is_active=eq.true&order=cost',
    );
  } catch (e) {
    if (e instanceof SupabaseError && e.status < 500) return null; // table missing
    throw e;
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

async function pointsSentence(env: Env, kid: string, balance: number): Promise<string> {
  const next = nextReward(balance, (await rewards(env)) ?? []);
  const has = `${cap(kid)} has ${balance} point${balance === 1 ? '' : 's'}.`;
  return next ? `${has} ${next.cost - balance} more for ${next.title}.` : has;
}

// ---------------------------------------------------------------------------

type Reply = { status: number; text: string; data?: Record<string, unknown> };
const ok = (text: string, data?: Record<string, unknown>): Reply => ({ status: 200, text, data });
const bad = (text: string, status = 400): Reply => ({ status, text });

function str(v: unknown, max = 120): string | null {
  return typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null;
}

function kidOf(v: unknown): string | null {
  const k = str(v)?.toLowerCase() ?? null;
  return k && PEOPLE.includes(k) ? k : null;
}

async function grocery(env: Env, body: Record<string, unknown>): Promise<Reply> {
  const item = str(body.item, 100);
  if (!item) return bad('What should I add?');
  const by = str(body.by, 30)?.toLowerCase() ?? 'siri';
  await insert(env, 'groceries', { name: item, checked: false, added_by: by });
  return ok(`Added ${item} to the list.`, { item });
}

async function chore(env: Env, body: Record<string, unknown>): Promise<Reply> {
  const kid = kidOf(body.kid);
  const said = str(body.chore);
  if (!kid) return bad(`I don't know who that is. Say Wren or Ellis.`);
  if (!said) return bad('Which chore?');

  const chores = await sb<Chore[]>(
    env,
    `chores?select=*&is_active=eq.true&or=(assigned_to.eq.${kid},assigned_to.is.null)`,
  );
  const match = bestMatch(said, chores);
  if (!match) return bad(`I couldn't find a chore like ${said} for ${cap(kid)}.`, 404);

  const recent = await sb<ChoreCompletion[]>(
    env,
    `chore_completions?select=*&chore_id=eq.${match.id}&order=completed_at.desc&limit=1`,
  );
  const already = isChoreCompleted(match, recent);
  if (!already) await insert(env, 'chore_completions', { chore_id: match.id, completed_by: kid });

  const balance = await points(env, kid);
  const lead = already ? `${match.title} was already done.` : `Done! ${match.title}.`;
  const tail = balance === null ? '' : ` ${cap(kid)} has ${balance} point${balance === 1 ? '' : 's'}.`;
  return ok(lead + tail, { kid, chore: match.title, already, points: balance });
}

async function redeem(env: Env, body: Record<string, unknown>): Promise<Reply> {
  const kid = kidOf(body.kid);
  const said = str(body.reward);
  if (!kid) return bad(`I don't know who that is. Say Wren or Ellis.`);
  if (!said) return bad('Which reward?');

  const list = await rewards(env);
  const balance = await points(env, kid);
  if (list === null || balance === null) return bad('Rewards are not set up yet.', 503);

  const match = bestMatch(said, list);
  if (!match) return bad(`I couldn't find a reward like ${said}.`, 404);
  if (balance < match.cost) {
    return ok(`${cap(kid)} needs ${match.cost - balance} more points for ${match.title}.`, {
      kid, reward: match.title, redeemed: false, points: balance,
    });
  }
  await insert(env, 'reward_redemptions', { reward_id: match.id, redeemed_by: kid });
  const left = balance - match.cost;
  return ok(`Enjoy ${match.title}! ${cap(kid)} has ${left} point${left === 1 ? '' : 's'} left.`, {
    kid, reward: match.title, redeemed: true, points: left,
  });
}

async function pointsRoute(env: Env, url: URL): Promise<Reply> {
  const kid = kidOf(url.searchParams.get('kid'));
  if (!kid) return bad(`I don't know who that is. Say Wren or Ellis.`);
  const balance = await points(env, kid);
  if (balance === null) return bad('Rewards are not set up yet.', 503);
  return ok(await pointsSentence(env, kid, balance), { kid, points: balance });
}

// ---------------------------------------------------------------------------

async function authorized(req: Request, env: Env): Promise<boolean> {
  if (!env.VOICE_TOKEN) return false; // never run open if the secret is missing
  const got = new TextEncoder().encode(req.headers.get('Authorization') ?? '');
  const want = new TextEncoder().encode(`Bearer ${env.VOICE_TOKEN}`);
  // timingSafeEqual is a Workers extension of SubtleCrypto.
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean };
  return got.byteLength === want.byteLength && subtle.timingSafeEqual(got, want);
}

async function route(req: Request, env: Env, url: URL): Promise<Reply> {
  if (!(await authorized(req, env))) return bad('Unauthorized', 401);
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return bad('Supabase is not configured.', 500);

  const key = `${req.method} ${url.pathname.replace(/\/+$/, '')}`;
  if (key === 'GET /points') return pointsRoute(env, url);

  const handler = { 'POST /grocery': grocery, 'POST /chore': chore, 'POST /redeem': redeem }[key];
  if (!handler) return bad('Not found', 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad('Send a JSON body.');
  }
  if (!body || typeof body !== 'object') return bad('Send a JSON body.');
  return handler(env, body as Record<string, unknown>);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    let reply: Reply;
    try {
      reply = await route(req, env, url);
    } catch (e) {
      console.error(e);
      reply = bad("Sorry, the family dashboard isn't answering.", 502);
    }
    if (url.searchParams.get('json') === '1') {
      return Response.json({ ok: reply.status < 300, text: reply.text, ...reply.data }, { status: reply.status });
    }
    return new Response(reply.text, {
      status: reply.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
