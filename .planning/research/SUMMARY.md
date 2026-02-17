# Research Summary: Family Dashboard v1.1 Polish

**Domain:** Stack additions for Siri Shortcuts, horoscope fix, country images, UI refinements
**Researched:** 2026-02-17
**Overall confidence:** HIGH

## Executive Summary

The v1.1 milestone adds polish features to the existing family dashboard: Siri Shortcuts for voice-activated grocery and timer management, a replacement for the broken horoscope API, country landscape photos, calendar emoji badges, and UI layout refinements. Research across all five areas converges on a key finding: this milestone requires zero new npm dependencies. All new capabilities are achieved through API integrations (fetch calls), Apple Shortcuts configuration, and component-level code changes.

The most architecturally significant addition is Apple Shortcuts posting directly to Supabase's auto-generated PostgREST API. This bypasses the React app entirely -- Shortcuts make native HTTP POST calls, Supabase inserts the row, and the existing realtime subscriptions propagate the change to the wall display within 1-2 seconds. No Edge Functions, no middleware, no native iOS app.

The horoscope fix replaces the dead ohmanda.com API with API Ninjas (free tier, 100K requests/month, clean REST endpoint). The country image feature adds Unsplash API integration for landscape photos (50 requests/hour free tier, one request/day needed). Calendar emoji badges are pure frontend keyword matching. All features are independent of each other and can be built in any order, though RLS policy verification blocks Siri Shortcuts.

Critical pitfalls include: (1) using the Supabase service_role key in Shortcuts instead of the anon key, (2) Apple Shortcuts silently malforming JSON payloads, (3) SVG flag memory bloat on the Pi, and (4) horoscope API migration crashing the sidebar rotation due to shared ErrorBoundary. All have straightforward preventions documented in PITFALLS.md.

## Key Findings

**Stack:** Zero new npm packages. Two new API keys (API Ninjas free tier, Unsplash free tier). Apple Shortcuts configuration only for Siri integration.
**Architecture:** Shortcuts POST directly to Supabase PostgREST; existing realtime hooks handle propagation. Country images via Unsplash search API with mandatory attribution.
**Critical pitfall:** Supabase RLS policies must allow anon INSERT on groceries/timers tables before building Siri Shortcuts. Each ContentRotator panel needs its own ErrorBoundary before swapping the horoscope API.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **RLS verification + horoscope API fix** - Fix what is broken first
   - Addresses: Broken horoscopes, Siri Shortcuts RLS blocker
   - Avoids: Deploying new features while existing feature is broken (Pitfall 4)

2. **Country images + flag caching** - Visual enhancement with Pi optimization
   - Addresses: Country panel photo, flag SVG memory issue (Pitfall 3), REST Countries caching (Pitfall 8)
   - Avoids: Memory bloat on Pi from new image content (Pitfall 10)

3. **Calendar emoji badges** - Pure frontend polish
   - Addresses: Event type visual scanning, bilingual keyword matching
   - Avoids: Over-engineering with React Context (anti-pattern documented in ARCHITECTURE.md)

4. **Siri Shortcuts** - Configuration-only, depends on Phase 1 RLS verification
   - Addresses: Voice-activated grocery/timer management
   - Avoids: Service role key exposure (Pitfall 1), JSON malformation (Pitfall 2)

5. **UI layout refinements** - Priority interrupt changes, mobile nav cleanup
   - Addresses: Layout improvements, removing grocery interrupt, timer tab changes
   - Avoids: Breaking priority state (Pitfall 6), navigation dead state (Pitfall 7)

**Phase ordering rationale:**
- Fixing broken features (horoscopes) must come before adding new ones
- RLS verification is a 5-minute task that unblocks Siri Shortcuts later
- Country images and emoji badges are independent; order by visual impact
- Siri Shortcuts are config-only but depend on verified RLS policies
- Layout changes are riskiest (highest blast radius) and should come last

**Research flags for phases:**
- Phase 1: API Ninjas CORS behavior needs live testing (may need Cloudflare Worker proxy)
- Phase 2: Unsplash search quality for obscure countries needs testing (fallback to flag-only)
- Phase 4: Shortcuts JSON payload formatting needs careful testing per Pitfall 2
- Phase 5: Calendar layout changes need documented variant testing per Pitfall 5

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages. API endpoints verified from official docs. Supabase PostgREST well-documented. |
| Siri Shortcuts | HIGH | Supabase REST API is standard PostgREST. Apple Shortcuts HTTP well-documented. Only unknown is current RLS state. |
| Horoscope API | MEDIUM-HIGH | API Ninjas endpoint verified. Free tier generous (100K/month). CORS behavior unverified. |
| Country Images | HIGH | Unsplash API docs verified directly. Rate limits (50/hr) far exceed needs (1/day). Attribution requirement confirmed. |
| Calendar Emoji | HIGH | Pure frontend keyword matching. No external dependencies. Bilingual support straightforward. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls identified from codebase analysis and platform docs. SVG memory and ErrorBoundary issues are real. |

## Gaps to Address

- Verify current Supabase RLS policies on `groceries` and `timers` tables (hands-on check)
- Test API Ninjas CORS headers from browser (may need Cloudflare Worker proxy allowlisting)
- Test Unsplash search quality for countries like Tuvalu, Nauru, Eswatini (obscure names)
- Determine if Unsplash Demo tier requires Production approval for public-facing use
- Validate Apple Shortcuts JSON payload with actual Supabase endpoint before building all shortcuts

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
