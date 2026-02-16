# Phase 5: Real-Time Infrastructure - Research

**Researched:** 2026-02-16
**Domain:** Supabase Realtime (WebSocket), PostgreSQL, offline resilience
**Confidence:** HIGH

## Summary

Phase 5 establishes the shared state infrastructure that enables Phases 6-9 (grocery list, timers, chores, priority interrupts). The core technology is Supabase -- a hosted PostgreSQL database with built-in Realtime (WebSocket) subscriptions. The free tier provides 500 MB storage, 200 concurrent connections, and 2 million realtime messages/month, which is vastly more than a family of four will ever use.

The key architectural decision is to use Supabase's `postgres_changes` channel type, which listens to PostgreSQL's WAL (write-ahead log) and pushes INSERT/UPDATE/DELETE events to subscribed clients over WebSocket. This is simpler than the Broadcast approach and perfectly suited for low-traffic family use. For offline resilience, Supabase has no built-in offline queue, so we build a lightweight localStorage-backed queue that replays mutations on reconnect.

**Primary recommendation:** Use `@supabase/supabase-js` v2.x with `postgres_changes` subscriptions, a custom React hook for connection status, Web Worker heartbeats for background tab resilience, and a simple localStorage mutation queue for offline writes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95 | Supabase client (DB + Realtime) | Official client, includes realtime-js, postgrest-js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.90 (existing) | Server state caching | Already in project; use for initial data fetches |

No additional libraries needed. The Supabase JS client includes everything for database queries, realtime subscriptions, and connection management.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase postgres_changes | Supabase Broadcast | Broadcast scales better but requires triggers + RLS on realtime.messages table; overkill for family app |
| Custom offline queue | PowerSync / RxDB | Full offline-first frameworks; massive overkill for simple write queue |
| Supabase | Firebase Realtime DB | Firebase works but Supabase gives full PostgreSQL with SQL, better for structured data like chores/timers |

**Installation:**
```bash
npm install @supabase/supabase-js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── supabase.ts           # Supabase client singleton
├── hooks/
│   ├── useSupabaseRealtime.ts # Generic realtime subscription hook
│   ├── useConnectionStatus.ts # Connection status tracking
│   └── useOfflineQueue.ts     # Offline mutation queue
├── components/
│   └── ConnectionStatus.tsx   # Visual connection indicator
└── types/
    └── database.ts            # Supabase table types
```

### Pattern 1: Supabase Client Singleton
**What:** Single Supabase client instance shared across the app
**When to use:** Always -- create once, import everywhere
**Example:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    worker: true, // Web Worker heartbeats for background tab resilience
    heartbeatCallback: (status) => {
      if (status === 'disconnected') {
        supabase.realtime.connect();
      }
    },
  },
});
```
Source: [Supabase Realtime Silent Disconnections Guide](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794)

### Pattern 2: Realtime Subscription Hook
**What:** React hook that subscribes to postgres_changes for a table and cleans up on unmount
**When to use:** Every component that needs live data
**Example:**
```typescript
// src/hooks/useSupabaseRealtime.ts
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: string;
  event?: PostgresChangeEvent;
  schema?: string;
  filter?: string;
  onPayload: (payload: any) => void;
}

export function useSupabaseRealtime({
  table,
  event = '*',
  schema = 'public',
  filter,
  onPayload,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event, schema, table, ...(filter ? { filter } : {}) },
        onPayload
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime error on ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, schema, filter]); // onPayload intentionally excluded -- use ref or useCallback
}
```
Source: [Supabase Postgres Changes Docs](https://supabase.com/docs/guides/realtime/postgres-changes)

### Pattern 3: Connection Status Hook
**What:** Tracks WebSocket connection state for UI indicator
**When to use:** Connection status component
**Example:**
```typescript
// src/hooks/useConnectionStatus.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type ConnectionState = 'connected' | 'reconnecting' | 'offline';

export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>('reconnecting');

  useEffect(() => {
    // Track via channel subscription status
    const channel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('offline');
        else if (status === 'CLOSED') setStatus('reconnecting');
      });

    // Also listen to visibilitychange for mobile Safari
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setStatus('reconnecting');
        // Force reconnect on tab becoming visible
        supabase.realtime.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return status;
}
```

### Pattern 4: Offline Mutation Queue
**What:** Queue writes in localStorage when offline, replay on reconnect
**When to use:** Any mutation (insert, update, delete) that should survive offline periods
**Example:**
```typescript
// src/hooks/useOfflineQueue.ts
interface QueuedMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = 'supabase_offline_queue';

function getQueue(): QueuedMutation[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
  const queue = getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export async function flushQueue(supabase: SupabaseClient): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const failed: QueuedMutation[] = [];
  for (const mutation of queue) {
    try {
      if (mutation.operation === 'insert') {
        await supabase.from(mutation.table).insert(mutation.data);
      } else if (mutation.operation === 'update') {
        const { id, ...rest } = mutation.data;
        await supabase.from(mutation.table).update(rest).eq('id', id);
      } else if (mutation.operation === 'delete') {
        await supabase.from(mutation.table).delete().eq('id', mutation.data.id);
      }
    } catch {
      failed.push(mutation);
    }
  }
  saveQueue(failed);
}
```

### Anti-Patterns to Avoid
- **Creating multiple Supabase clients:** Always use one singleton. Multiple clients mean multiple WebSocket connections, hitting connection limits.
- **Subscribing inside render:** Channel subscriptions MUST be inside useEffect with cleanup. Subscribing during render causes memory leaks.
- **Not using `supabase.removeChannel()`:** Calling `channel.unsubscribe()` alone is insufficient. Use `supabase.removeChannel(channel)` in cleanup to fully remove the channel from the client.
- **Listening to all tables with `schema: 'public'` without a table filter:** This subscribes to ALL changes on ALL tables, consuming unnecessary bandwidth.

## Database Schema Design

### Tables for Phases 6-9

```sql
-- Grocery items (Phase 6)
create table groceries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  checked boolean default false,
  added_by text, -- 'papa', 'daddy', etc. (no auth, just a label)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Timers (Phase 7)
create table timers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  duration_seconds integer not null,
  started_at timestamptz not null default now(),
  cancelled boolean default false,
  created_by text,
  created_at timestamptz default now()
);

-- Chore definitions (Phase 9)
create table chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to text, -- 'wren', 'ellis', 'papa', 'daddy'
  schedule text not null default 'daily', -- 'daily', 'weekly', 'once'
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Chore completions (Phase 9)
create table chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid references chores(id) on delete cascade,
  completed_by text not null,
  completed_at timestamptz default now()
);

-- Enable realtime on all tables
alter publication supabase_realtime add table groceries;
alter publication supabase_realtime add table timers;
alter publication supabase_realtime add table chores;
alter publication supabase_realtime add table chore_completions;
```

### RLS Policy (Simple Open Access)

Since the project has no authentication (family-only home network, per PROJECT.md "Out of Scope: User authentication"), use the anon key with permissive RLS:

```sql
-- Enable RLS on all tables
alter table groceries enable row level security;
alter table timers enable row level security;
alter table chores enable row level security;
alter table chore_completions enable row level security;

-- Allow all operations via anon key
create policy "Allow all" on groceries for all using (true) with check (true);
create policy "Allow all" on timers for all using (true) with check (true);
create policy "Allow all" on chores for all using (true) with check (true);
create policy "Allow all" on chore_completions for all using (true) with check (true);
```

**Important:** RLS MUST be enabled even with permissive policies. Tables with RLS disabled are accessible only via the service_role key (not the anon key used by the browser client). The anon key + RLS + permissive policy is the correct pattern for public read/write access.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection management | Custom WebSocket client | Supabase Realtime (built into supabase-js) | Handles reconnection, heartbeats, multiplexing |
| Database API | REST API + Express server | Supabase PostgREST (auto-generated from schema) | Zero backend code, instant CRUD API |
| Realtime pub/sub | Custom pub/sub with WebSocket | Supabase postgres_changes | Wired into PostgreSQL WAL, zero custom server code |
| Type generation | Manual TypeScript types | `supabase gen types typescript` | Auto-generates from your schema, stays in sync |

**Key insight:** Supabase eliminates the entire backend. No server code, no WebSocket server, no REST API. The client talks directly to Supabase's hosted services. This is critical for a GitHub Pages static site.

## Common Pitfalls

### Pitfall 1: React Strict Mode Double Subscription
**What goes wrong:** In development, React 18+ Strict Mode fires useEffect twice, creating duplicate subscriptions that immediately close.
**Why it happens:** React intentionally double-invokes effects to catch cleanup bugs.
**How to avoid:** Use `supabase.removeChannel(channel)` in cleanup (not just `unsubscribe()`). The second mount creates a fresh channel. Do NOT use refs to prevent the second subscription -- let React's lifecycle work naturally.
**Warning signs:** Console shows `SUBSCRIBED` then immediately `CLOSED`.

### Pitfall 2: Mobile Safari Background Tab WebSocket Death
**What goes wrong:** Safari suspends JavaScript timers in background tabs, preventing heartbeat signals. Server assumes client disconnected and drops the WebSocket silently.
**Why it happens:** iOS/Safari aggressively throttles background tabs to save battery.
**How to avoid:** Two defenses: (1) `worker: true` in realtime config offloads heartbeats to a Web Worker (less susceptible to throttling), (2) `heartbeatCallback` with reconnect logic. Additionally, listen to `visibilitychange` to force reconnect when tab becomes visible.
**Warning signs:** Data stops updating after phone lock/unlock or tab switch.

### Pitfall 3: Supabase Free Tier Project Pausing
**What goes wrong:** Free tier projects with no API requests for 7 days are paused automatically. The dashboard goes offline.
**Why it happens:** Supabase pauses inactive free-tier projects to conserve resources.
**How to avoid:** The wall-mounted Pi sends requests constantly (realtime heartbeats count), so this should not be an issue in practice. As a safety net, the existing auto-refresh mechanism (from Phase 1) generates periodic requests.
**Warning signs:** Dashboard shows "offline" for extended periods despite working internet.

### Pitfall 4: Missing Realtime Publication
**What goes wrong:** Subscriptions connect but never receive events.
**Why it happens:** Tables must be explicitly added to the `supabase_realtime` publication. New tables are NOT included by default.
**How to avoid:** Run `alter publication supabase_realtime add table <name>;` for every table that needs realtime.
**Warning signs:** Inserts/updates succeed but subscription callbacks never fire.

### Pitfall 5: Environment Variable Exposure
**What goes wrong:** Supabase URL and anon key committed to git or exposed in bundle.
**Why it happens:** Vite inlines `VITE_*` env vars into the build output.
**How to avoid:** The anon key is DESIGNED to be public (it's rate-limited and RLS-protected). This is fine for a family dashboard. Never expose the service_role key. Use `.env.local` (gitignored) for local dev, and set vars in GitHub Pages deployment.
**Warning signs:** Service role key in client code.

## Code Examples

### Supabase Client Initialization
```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    realtime: {
      worker: true,
      heartbeatCallback: (status) => {
        if (status === 'disconnected') {
          supabase.realtime.connect();
        }
      },
    },
  }
);
```

### Subscribe to Table Changes
```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
const channel = supabase
  .channel('groceries-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'groceries' },
    (payload) => {
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: the new row (INSERT/UPDATE)
      // payload.old: the old row (UPDATE/DELETE) -- requires replica identity full
      console.log('Change:', payload.eventType, payload.new);
    }
  )
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') console.log('Listening to groceries');
    if (status === 'CHANNEL_ERROR') console.error('Channel error:', err);
    if (status === 'TIMED_OUT') console.warn('Subscription timed out');
  });

// Cleanup
supabase.removeChannel(channel);
```

### Insert with Offline Fallback
```typescript
async function addGroceryItem(name: string): Promise<void> {
  const item = { name, checked: false, added_by: 'papa' };
  const { error } = await supabase.from('groceries').insert(item);
  if (error) {
    // Network error -- queue for later
    enqueue({ table: 'groceries', operation: 'insert', data: item });
  }
}
```

### Connection Status Component
```tsx
// src/components/ConnectionStatus.tsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const STATUS_CONFIG = {
  connected: { color: 'bg-green-500', label: 'Connected' },
  reconnecting: { color: 'bg-yellow-500', label: 'Reconnecting...' },
  offline: { color: 'bg-red-500', label: 'Offline' },
} as const;

export function ConnectionStatus() {
  const status = useConnectionStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 text-xs opacity-60">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| supabase-js v1 `subscribe()` | v2 `channel().on().subscribe()` | 2022 (v2 release) | Completely different API; channel-based |
| No background tab handling | `worker: true` + `heartbeatCallback` | 2024-2025 | Official solution for mobile Safari background tabs |
| Postgres Changes only | Broadcast recommended for scale | 2024-2025 | postgres_changes still works fine for low-traffic apps |

**Deprecated/outdated:**
- supabase-js v1 API: Completely different subscription model. All v1 examples are irrelevant.
- `channel.unsubscribe()` alone: Use `supabase.removeChannel(channel)` for full cleanup.

## Open Questions

1. **Supabase project setup (manual step)**
   - What we know: User needs to create a Supabase project and get URL + anon key
   - What's unclear: Whether user already has a Supabase account
   - Recommendation: Plan should include a human checkpoint for Supabase project creation, similar to the Cloudflare Worker checkpoint in Phase 3

2. **Type generation workflow**
   - What we know: `supabase gen types typescript` generates types from live schema
   - What's unclear: Whether to use CLI-generated types or hand-write them for this simple schema
   - Recommendation: Hand-write types for Phase 5 (only 4 tables, simple structure). Consider CLI generation if schema grows.

3. **Conflict resolution for simultaneous edits**
   - What we know: Two family members could edit the grocery list simultaneously
   - What's unclear: Whether last-write-wins is sufficient or if we need optimistic concurrency
   - Recommendation: Last-write-wins is fine for a family of four. The operations are simple (add item, check item, delete item) and conflicts are unlikely to cause data loss.

## Sources

### Primary (HIGH confidence)
- [Supabase Postgres Changes Docs](https://supabase.com/docs/guides/realtime/postgres-changes) - subscription API, filter operators, unsubscribe
- [Supabase Realtime Concepts](https://supabase.com/docs/guides/realtime/concepts) - channels, topics, connection model
- [Supabase Silent Disconnections Guide](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) - worker: true, heartbeatCallback, visibilitychange
- [Supabase Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing) - free tier: 200 connections, 2M messages/month
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) - v2.95.3 latest

### Secondary (MEDIUM confidence)
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy patterns
- [Supabase Discussion #21410](https://github.com/orgs/supabase/discussions/21410) - React Strict Mode double subscription issue
- [Supabase Discussion #8573](https://github.com/orgs/supabase/discussions/8573) - React 18 unsubscribe issues
- [Socket.io Issue #2924](https://github.com/socketio/socket.io/issues/2924) - Safari background WebSocket drop behavior

### Tertiary (LOW confidence)
- [Supabase Discussion #357](https://github.com/orgs/supabase/discussions/357) - Offline usage discussion (confirms no built-in offline support)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Supabase is the decided technology, well-documented, verified API
- Architecture: HIGH - Patterns verified against official docs and community discussions
- Database schema: MEDIUM - Schema is straightforward but will be refined in Phases 6/7/9
- Offline queue: MEDIUM - Custom implementation, pattern is well-known but untested with Supabase specifically
- Pitfalls: HIGH - Verified against official troubleshooting docs and GitHub discussions

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable -- Supabase v2 API is mature)
