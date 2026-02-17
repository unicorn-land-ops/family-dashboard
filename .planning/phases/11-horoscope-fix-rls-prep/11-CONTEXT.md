# Phase 11: Horoscope Fix & RLS Prep - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the broken ohmanda.com horoscope scraper with API Ninjas horoscope API, and configure + verify Supabase RLS policies on groceries and timers tables to allow anon CRUD (preparation for Phase 15 Siri integration).

</domain>

<decisions>
## Implementation Decisions

### Horoscope display
- Show all 3 signs stacked (Capricorn, Aquarius, Sagittarius) — no rotation/cycling
- Zodiac emoji only as heading per sign (e.g. ♑ ♒ ♐) — no sign name, no person name
- Text length per reading: Claude's discretion based on what fits the sidebar

### API failure handling
- Fetch horoscopes once daily — cache for 24 hours
- API key managed as environment variable (same pattern as other API keys)
- When API is unreachable and no cached data: hide the horoscope panel entirely
- CORS proxy approach: Claude's discretion — investigate API Ninjas CORS headers and use existing Cloudflare Worker proxy if needed

### RLS policy scope
- Full CRUD (SELECT, INSERT, UPDATE, DELETE) for anon role on groceries and timers tables
- Row count limits as basic guardrail (e.g. cap at 100 grocery items, 10 timers) to prevent spam
- Verify policies with actual test queries (INSERT/SELECT/UPDATE/DELETE as anon) before marking complete
- No additional auth for now — accept risk until site-wide password gate is added

### Claude's Discretion
- Horoscope text truncation/length per reading
- CORS proxy vs direct fetch decision
- Exact row count limits for RLS guardrails
- ErrorBoundary implementation details per panel

</decisions>

<specifics>
## Specific Ideas

- Family members: Capricorn (Papa), Aquarius (Daddy), Sagittarius (Wren) — Ellis doesn't have a horoscope shown
- Horoscope panel is in the sidebar, part of the rotating content system from Phase 4
- Existing CORS proxy is a Cloudflare Worker already deployed

</specifics>

<deferred>
## Deferred Ideas

- **Site-wide password protection** — User concerned that anyone with the GitHub Pages URL can see the family schedule (calendar, events). Wants a password gate on the dashboard with the Pi auto-entering the password in kiosk mode. This is a new capability and should be its own phase.

</deferred>

---

*Phase: 11-horoscope-fix-rls-prep*
*Context gathered: 2026-02-17*
