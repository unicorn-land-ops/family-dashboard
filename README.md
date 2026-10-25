# Family Dashboard

A self-hosted family dashboard (React 19 + Vite 7 + TypeScript + Tailwind 4 + Supabase)
for the wall display and phones at home. Replaces the earlier Home Assistant
prototype (see "Legacy" below).

## Views

The view is selected by URL query parameter in `src/App.tsx`:

| URL | View |
|---|---|
| `/` | Default dashboard: header, main panel (Calendar / Groceries / Chores / Events via bottom nav), auto-rotating sidebar (Countdown, Transit, Horoscope, Country), timers take over the sidebar in priority mode, status bar. |
| `?view=kiosk` | Wall-display kiosk: fixed grid with today + next days, countdowns, compact groceries, Google Photos frame, news ticker, status bar. |
| `?view=chores&child=<name>` | Kid chore checklist view. |

## Data sources

- **Supabase** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`): `groceries`,
  `timers`, `chores`, `chore_completions`, `events` tables (see `supabase/`).
  Data layer is TanStack Query + Supabase Realtime invalidation + optimistic
  mutations (`src/hooks/useGroceries.ts` is the reference implementation).
  If the env vars are absent the app runs without Supabase (`supabaseEnabled`).
- **Calendars**: ICS feeds per family member via `VITE_CAL_*` env vars, fetched
  through `VITE_CORS_PROXY_URL` (see `src/lib/calendar/config.ts`).
  A reference Cloudflare CORS proxy lives in `cloudflare-worker/`.
- **Weather**: Open-Meteo (`src/lib/api/openMeteo.ts`, `src/hooks/useWeather.ts`).
- **Photos**: Google Photos via a worker URL (see `src/config/photos.ts`,
  `src/hooks/useGooglePhotos.ts`).
- **Transit**: BVG departures (`src/lib/api/bvgTransit.ts`).
- **News ticker**: see `src/lib/news/` and `src/hooks/useNewsTicker.ts`.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
npm run test     # vitest
```

Deploy by serving `dist/` with any static file server (the kiosk just needs the
built files; there is no server-side component in this repo).

Required env vars (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_CAL_PAPA`, `VITE_CAL_PAPA_WORK`, `VITE_CAL_DADDY`, `VITE_CAL_DADDY_WORK`,
`VITE_CAL_Wren`, `VITE_CAL_ELLIS`, `VITE_CAL_FAMILY`, `VITE_CAL_TRIPIT`,
`VITE_CORS_PROXY_URL`. Optional travel overrides: `VITE_DADDY_TRAVEL_TIMEZONE`,
`VITE_DADDY_TRAVEL_LOCATION`, `VITE_DADDY_TRAVEL_LAT`, `VITE_DADDY_TRAVEL_LON`.

## Project structure

```
src/
  App.tsx                 # view router (default / kiosk / kid chores)
  main.tsx                # entry; unregisters stale service workers
  components/
    layout/               # DashboardShell, Header, StatusBar, MobileNav, ...
    calendar/             # CalendarPanel
    grocery/              # GroceryPanel
    timer/                # TimerPanel
    chore/                # ChorePanel, KidChoreView
    events/               # EventsPanel
    sidebar/              # Countdown, Transit, Horoscope, Country panels + rotator
    kiosk/                # KioskDashboard + kiosk cards/frame/ticker
    clock/ weather/       # shared clock + weather widgets (used by Header)
  hooks/                  # data hooks (useGroceries, useCalendar, useWeather, ...)
  lib/                    # api clients, calendar/ics parsing, chore schedule, utils
  config/                 # photos + app constants
  types/database.ts       # hand-written Supabase row types (5 tables)
supabase/                 # schema.sql, rls-policies.sql, events.sql, ...
_archive/                 # retired files, kept for reversibility (see its README)
docs/                     # design docs and implementation plans
```

## Important: what NOT to touch

- **Supabase schema**: `supabase/*.sql` is the source of truth. Do not add or
  alter tables/policies without explicit approval.
- **EXIT checklist sync**: the EXIT-games checklist lives in
  `~/Projects/Personal/docs/exit-games.md` and syncs against a *different*
  Supabase project/table (`public.checklists`, row `exit-games`). This dashboard
  never touches that table — keep it that way.

## Legacy (superseded, kept for reference)

The original approach was a Home Assistant + Raspberry Pi kiosk. It is no longer
the product; the React app above is. These remain on disk for reference only:

- `ha-config/` — Home Assistant Lovelace dashboard YAML
- `scripts/kiosk-setup.sh`, `scripts/autostart.sh` — Pi kiosk setup
- `calendar-proxy/Code.gs` — Apps Script calendar proxy
- `docs/alexa-timer-setup.md` — Alexa Media Player guide

## Housekeeping notes

- 2026-09-26: structural refresh — archived the pre-kiosk-v5 dead files
  (`KioskPageA/B`, `KioskRotatingStage`, `useStageRotation`, `index.old.html`)
  to `_archive/2026-09-26-kiosk-v5-cleanup/`; rewrote this README (it still
  described the Home Assistant prototype); fixed the table count in
  `src/types/database.ts`. No Supabase changes. No behavior changes.
