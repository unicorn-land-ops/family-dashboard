# Phase 11: Horoscope Fix & RLS Prep - Research

**Researched:** 2026-02-17
**Domain:** API integration (API Ninjas horoscope), Supabase RLS policies
**Confidence:** HIGH

## Summary

This phase has two independent work streams: (1) replacing the broken ohmanda.com horoscope scraper with API Ninjas horoscope API, and (2) configuring Supabase RLS policies on groceries and timers tables to allow anonymous CRUD access.

The horoscope integration requires routing requests through the existing Cloudflare Worker CORS proxy. API Ninjas requires an `X-Api-Key` header, which triggers CORS preflight requests. More importantly, embedding the API key in client-side JavaScript exposes it in browser DevTools. The correct approach is to extend the existing Cloudflare Worker to proxy horoscope requests with the API key stored as a Worker secret. This keeps the key server-side and solves CORS simultaneously.

The RLS work is straightforward SQL policy creation in the Supabase dashboard. The tables already exist and the dashboard already performs full CRUD via the anon key. RLS policies just need to be enabled and configured to explicitly allow these operations for the `anon` role, with row-count guardrails implemented as CHECK constraints or policy conditions.

**Primary recommendation:** Extend the existing Cloudflare Worker to proxy API Ninjas horoscope requests (API key as Worker secret), update the frontend to fetch from the proxy, and create RLS policies via Supabase SQL editor.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Show all 3 signs stacked (Capricorn, Aquarius, Sagittarius) -- no rotation/cycling
- Zodiac emoji only as heading per sign (e.g. capricorn-symbol aquarius-symbol sagittarius-symbol) -- no sign name, no person name
- Fetch horoscopes once daily -- cache for 24 hours
- API key managed as environment variable (same pattern as other API keys)
- When API is unreachable and no cached data: hide the horoscope panel entirely
- Full CRUD (SELECT, INSERT, UPDATE, DELETE) for anon role on groceries and timers tables
- Row count limits as basic guardrail (e.g. cap at 100 grocery items, 10 timers)
- Verify policies with actual test queries before marking complete
- No additional auth for now

### Claude's Discretion
- Horoscope text truncation/length per reading
- CORS proxy vs direct fetch decision
- Exact row count limits for RLS guardrails
- ErrorBoundary implementation details per panel

### Deferred Ideas (OUT OF SCOPE)
- Site-wide password protection (separate phase)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | Horoscopes display daily readings using a working API (replace broken ohmanda.com with API Ninjas) | API Ninjas endpoint documented, proxy pattern identified, caching strategy defined, frontend component already exists and needs minimal changes |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| API Ninjas Horoscope | v1 | Daily horoscope readings | User decision -- replaces broken ohmanda.com |
| Cloudflare Workers | current | CORS proxy + API key storage | Already deployed for calendar feeds, extend for horoscope |
| Supabase RLS | PostgreSQL native | Row-level security policies | Built into Supabase, no additional libraries needed |
| @tanstack/react-query | (already installed) | Data fetching + caching | Already used by useHoroscope hook |
| react-error-boundary | ^6.1.1 | Panel-level error boundaries | Already installed and used throughout App.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wrangler | (already available) | Deploy Cloudflare Workers | When updating the CORS proxy worker |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Worker proxy | Direct browser fetch to API Ninjas | Exposes API key in client JS, CORS likely blocked due to X-Api-Key header triggering preflight |
| Cloudflare Worker proxy | Separate horoscope worker | More infrastructure to manage vs extending existing worker |

**Installation:**
No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Changes

```
cloudflare-worker/
  cors-proxy.js          # MODIFY: add /horoscope route with API Ninjas proxy
  wrangler.toml          # MODIFY: add API_NINJAS_KEY secret binding

src/lib/api/
  horoscope.ts           # MODIFY: change endpoint from ohmanda.com to worker proxy

src/components/sidebar/
  HoroscopePanel.tsx     # MODIFY: update labels (emoji only, no names), handle hide-on-error

src/hooks/
  useHoroscope.ts        # MODIFY: change staleTime to 24h, update caching

src/lib/
  constants.ts           # MODIFY: update HOROSCOPE_REFRESH_MS to 24 hours

supabase/
  rls-policies.sql       # CREATE: SQL file documenting the RLS policies applied
```

### Pattern 1: Cloudflare Worker Route-Based Proxy
**What:** Extend the existing CORS proxy to handle multiple route types (calendar + horoscope)
**When to use:** When proxying different APIs through a single worker
**Example:**
```javascript
// cloudflare-worker/cors-proxy.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Route: /horoscope?sign=capricorn
    if (url.pathname === '/horoscope') {
      return handleHoroscope(url, env);
    }

    // Route: /?url=... (existing calendar proxy)
    return handleCalendarProxy(url);
  },
};

async function handleHoroscope(url, env) {
  const sign = url.searchParams.get('sign');
  if (!sign) {
    return jsonError('Missing "sign" query parameter', 400);
  }

  const response = await fetch(
    `https://api.api-ninjas.com/v1/horoscope?sign=${encodeURIComponent(sign)}`,
    { headers: { 'X-Api-Key': env.API_NINJAS_KEY } }
  );

  if (!response.ok) {
    return jsonError(`API Ninjas returned ${response.status}`, response.status);
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  });
}
```

### Pattern 2: Frontend Horoscope Fetch via Proxy
**What:** Update the horoscope API module to call the worker proxy instead of ohmanda.com
**Example:**
```typescript
// src/lib/api/horoscope.ts
import { CORS_PROXY_URL } from '../calendar/config';

const PROXY_BASE = CORS_PROXY_URL.replace(/\/$/, '');

export async function fetchHoroscopes(): Promise<HoroscopeData[]> {
  const results = await Promise.all(
    FAMILY_SIGNS.map(async (sign): Promise<HoroscopeData | null> => {
      try {
        const response = await fetch(`${PROXY_BASE}/horoscope?sign=${sign}`);
        if (!response.ok) return null;
        const data = await response.json();
        // API Ninjas returns: { date, zodiac, horoscope }
        return {
          sign: data.zodiac,
          date: data.date,
          horoscope: data.horoscope,
        };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is HoroscopeData => r !== null);
}
```

### Pattern 3: Supabase RLS with Row Count Guardrails
**What:** Enable RLS and create permissive policies for anon role with INSERT guardrails
**Example:**
```sql
-- Enable RLS on both tables
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

-- Groceries: full CRUD for anon
CREATE POLICY "anon_select_groceries" ON groceries
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_groceries" ON groceries
  FOR INSERT TO anon
  WITH CHECK (
    (SELECT count(*) FROM groceries) < 100
  );

CREATE POLICY "anon_update_groceries" ON groceries
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_groceries" ON groceries
  FOR DELETE TO anon USING (true);

-- Timers: full CRUD for anon
CREATE POLICY "anon_select_timers" ON timers
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_timers" ON timers
  FOR INSERT TO anon
  WITH CHECK (
    (SELECT count(*) FROM timers WHERE cancelled = false) < 10
  );

CREATE POLICY "anon_update_timers" ON timers
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_timers" ON timers
  FOR DELETE TO anon USING (true);
```

### Pattern 4: Hide Panel When No Data
**What:** Return null from HoroscopePanel when there's an error and no cached data, so it doesn't take up sidebar space
**Example:**
```typescript
// In HoroscopePanel.tsx
if (error || !horoscopes?.length) {
  return null; // Hide entirely per user decision
}
```

### Anti-Patterns to Avoid
- **Exposing API key in client-side code:** Never put `VITE_API_NINJAS_KEY` in `.env` -- the key must stay server-side in the Cloudflare Worker secret
- **Subquery in RLS without SECURITY DEFINER:** Row-count subqueries in RLS policies can be tricky. The `count(*)` subquery runs with the same role permissions, so the SELECT policy must be in place before the INSERT policy can count rows
- **Caching horoscopes in localStorage manually:** React Query already handles caching; use `staleTime` and `gcTime` instead of building custom cache logic

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS proxy | Custom Express server | Extend existing Cloudflare Worker | Already deployed, free tier (100K req/day), zero maintenance |
| Data caching | localStorage cache with timestamps | React Query staleTime + gcTime | Already integrated, handles refetch, stale data, and error states |
| Error boundaries | try/catch in render | react-error-boundary (already installed) | Already used in App.tsx with PanelFallback component |
| API key management | VITE_ env var in frontend | Cloudflare Worker secret (wrangler secret put) | API key never reaches the browser |

**Key insight:** The existing infrastructure (Cloudflare Worker, React Query, ErrorBoundary pattern) handles all the hard parts. This phase is about wiring, not building.

## Common Pitfalls

### Pitfall 1: RLS Blocks Existing Dashboard Operations
**What goes wrong:** Enabling RLS on a table with no policies blocks ALL access, including the dashboard's existing Supabase queries
**Why it happens:** RLS defaults to deny-all when enabled with no policies
**How to avoid:** Create ALL policies in a single transaction with RLS enablement, or create policies first then enable RLS
**Warning signs:** Dashboard groceries/timers suddenly show empty after RLS changes

### Pitfall 2: API Ninjas Response Shape Differs from ohmanda.com
**What goes wrong:** Frontend expects `{ sign, date, horoscope }` but API Ninjas returns `{ zodiac, date, horoscope }` (field is `zodiac` not `sign`)
**Why it happens:** Different API, different response schema
**How to avoid:** Map the response in the fetch function: `sign: data.zodiac`
**Warning signs:** Panel shows "undefined" for sign name

### Pitfall 3: Worker Secret Not Set
**What goes wrong:** Deployed worker returns 500 because `env.API_NINJAS_KEY` is undefined
**Why it happens:** `wrangler secret put` was not run after code deployment
**How to avoid:** Document the secret setup step; add fallback error message in worker
**Warning signs:** Worker returns 500 or API Ninjas returns 401/403

### Pitfall 4: RLS Row Count Policy Creates Deadlock or Race Condition
**What goes wrong:** The INSERT policy's `count(*)` subquery reads the table, but the SELECT policy may interfere
**Why it happens:** PostgreSQL evaluates policies for each row operation; subqueries in WITH CHECK execute within the same transaction context
**How to avoid:** Ensure the SELECT policy is permissive (USING true) so the count subquery works. Test with concurrent inserts
**Warning signs:** INSERT fails with permission denied even when under the row limit

### Pitfall 5: Horoscope Panel Shows in Rotation Even When Hidden
**What goes wrong:** ContentRotator cycles to the horoscope slot and shows a blank/empty space
**Why it happens:** The rotation system always includes `horoscopes` in ROTATION_PANELS regardless of data availability
**How to avoid:** HoroscopePanel already handles this by showing "Horoscopes unavailable" fallback; update to return null and ensure ContentRotator handles null children gracefully
**Warning signs:** Empty card-glass div appearing during rotation

## Code Examples

### API Ninjas Response Format
```json
// GET https://api.api-ninjas.com/v1/horoscope?sign=capricorn
// Header: X-Api-Key: <key>
{
  "date": "2026-02-17",
  "zodiac": "capricorn",
  "horoscope": "Today brings a wave of creative energy..."
}
```
Source: https://www.api-ninjas.com/api/horoscope

### Cloudflare Worker Secret Setup
```bash
cd cloudflare-worker
# Set the API key as a worker secret (not in wrangler.toml!)
npx wrangler secret put API_NINJAS_KEY
# Paste the key when prompted

# Deploy the updated worker
npx wrangler deploy
```

### Existing HoroscopePanel Label Update
```typescript
// Current: shows "Papa (Capricorn)" etc.
// New: emoji only as heading
// Remove SIGN_LABELS import, just use ZODIAC_EMOJI
{horoscopes.map((h) => {
  const sign = h.sign.toLowerCase() as ZodiacSign;
  const emoji = ZODIAC_EMOJI[sign] ?? '';
  return (
    <div key={h.sign} className="bg-white/5 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{emoji}</span>
      </div>
      <p className="text-text-secondary text-[clamp(11px,0.9vw,13px)] leading-snug line-clamp-4">
        {h.horoscope}
      </p>
    </div>
  );
})}
```

### RLS Verification Queries
```sql
-- Run these as anon role to verify policies work
-- In Supabase SQL editor, use: SET ROLE anon;

-- Test SELECT
SET ROLE anon;
SELECT * FROM groceries LIMIT 5;

-- Test INSERT
INSERT INTO groceries (name, checked) VALUES ('test-rls-item', false);

-- Test UPDATE
UPDATE groceries SET checked = true WHERE name = 'test-rls-item';

-- Test DELETE
DELETE FROM groceries WHERE name = 'test-rls-item';

-- Reset role
RESET ROLE;

-- Repeat for timers table
SET ROLE anon;
SELECT * FROM timers LIMIT 5;
INSERT INTO timers (label, duration_seconds, started_at) VALUES ('test-rls', 60, now());
UPDATE timers SET cancelled = true WHERE label = 'test-rls';
DELETE FROM timers WHERE label = 'test-rls';
RESET ROLE;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ohmanda.com scraper API | API Ninjas horoscope endpoint | Phase 11 | Reliable API with key auth vs. scraper that broke |
| No RLS on tables | RLS with anon CRUD policies | Phase 11 | Prepares for Siri/external writes in Phase 15 |
| 6-hour horoscope refresh | 24-hour refresh (daily content) | Phase 11 | Matches content update frequency, fewer API calls |

**Deprecated/outdated:**
- ohmanda.com horoscope API: Service appears down/unreliable, was a scraper-based service with no auth
- Current `SIGN_LABELS` showing person names: User wants emoji-only headings

## Open Questions

1. **Does API Ninjas actually block CORS from browsers?**
   - What we know: API requires X-Api-Key header which triggers CORS preflight; no CORS documentation found
   - What's unclear: Whether api.api-ninjas.com returns Access-Control-Allow-* headers
   - Recommendation: Use the Cloudflare Worker proxy regardless -- it's better for security (hides API key) and guaranteed to work. This is moot.

2. **RLS policy ordering with row-count subqueries**
   - What we know: PostgreSQL evaluates policies per-statement; subqueries in WITH CHECK run in the same transaction
   - What's unclear: Whether the count subquery honors other RLS policies (it should, since SELECT policy is permissive)
   - Recommendation: Create policies in correct order (SELECT first, then INSERT) and verify with test queries

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/api/horoscope.ts`, `src/hooks/useHoroscope.ts`, `src/components/sidebar/HoroscopePanel.tsx` -- current implementation
- Codebase inspection: `cloudflare-worker/cors-proxy.js` -- existing proxy architecture
- Codebase inspection: `src/lib/api/groceries.ts`, `src/lib/api/timers.ts` -- current CRUD operations
- API Ninjas official docs: https://www.api-ninjas.com/api/horoscope -- endpoint, params, response format

### Secondary (MEDIUM confidence)
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security -- policy syntax and patterns
- Cloudflare Workers secrets docs -- `wrangler secret put` for server-side env vars

### Tertiary (LOW confidence)
- API Ninjas CORS support: Could not confirm whether browser requests work; proxy approach recommended regardless

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, API Ninjas docs verified
- Architecture: HIGH -- extending existing patterns (Worker proxy, React Query hooks, ErrorBoundary)
- Pitfalls: HIGH -- identified from codebase analysis and known PostgreSQL RLS behavior
- RLS row-count guardrails: MEDIUM -- pattern is sound but needs testing for edge cases

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain, no fast-moving dependencies)
