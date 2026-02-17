# Family Dashboard

## What This Is

A modern, polished family information center for a household of four in Berlin — two dads (Papa & Daddy) and two kids (Wren, 13, and Ellis, 9). Runs on a wall-mounted Raspberry Pi in kiosk mode AND is fully responsive for mobile phones. Features weather, calendar, transit, horoscopes, country of the day, plus interactive household management (chores, groceries, timers) with Supabase realtime sync.

## Core Value

The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.

## Current Milestone: v1.1 Polish

**Goal:** Fix broken features, refine layout and UX, add Siri voice integration for groceries and timers.

**Target features:**
- Fix calendar layout (person emojis, weather under day header)
- Fix horoscopes (currently broken)
- Limit BVG transit to top 3 departures
- Country of the day image
- Remove grocery list as priority interrupt
- Siri voice integration for groceries and timers
- Remove timer tab from mobile nav

## Requirements

### Validated

- ✓ Modern, polished visual design — v1.0
- ✓ Responsive layout for kiosk + mobile — v1.0
- ✓ Clock, weather, sunrise/sunset always visible — v1.0
- ✓ Family calendar integration (5 iCal feeds) — v1.0
- ✓ BVG transit departures — v1.0
- ✓ Country of the Day — v1.0
- ✓ Travel detection with dual timezone — v1.0
- ✓ Timer system with countdown and alerts — v1.0
- ✓ Grocery list with realtime sync — v1.0
- ✓ Chore tracking with daily routines — v1.0
- ✓ Priority interrupts for timers — v1.0
- ✓ 24/7 hardening and Pi optimization — v1.0

### Active

- [ ] Calendar person emojis: 🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family — emoji precedes event name
- [ ] Calendar layout: weather info (temp, icon) underneath day header, not inline with events
- [ ] BVG transit: limit to top 3 departures
- [ ] Fix horoscopes (currently broken)
- [ ] Country of the Day: add a representative image to fill extra space
- [ ] Grocery list should NOT be a priority interrupt (only timers)
- [ ] Remove timer tab from mobile nav (not needed as separate screen)
- [ ] Siri voice integration for adding grocery items
- [ ] Siri voice integration for setting timers

### Out of Scope

- Voice control / Alexa integration — waiting for new Google hardware
- Native mobile app — web-based responsive design is sufficient
- Multi-language support — dashboard is in English (Ellis gets help from family)
- Home Assistant integration — keeping it independent and simple
- User authentication — family-only, no login needed on home network
- Family photos — deferred to v2
- Chore completion → kids' network access — v2

## Context

- v1.0 shipped with 10 phases, all features functional
- Supabase project is running with realtime enabled
- Cloudflare Worker CORS proxy deployed for calendar feeds
- Wall display is NOT touchscreen — all interaction is phone-only
- Family uses iPhones — Siri Shortcuts can make HTTP requests to Supabase
- Horoscope API appears to be broken/unreliable — needs investigation
- Calendar emojis from original dashboard: 🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family

## Constraints

- **Hosting**: GitHub Pages (static) + Supabase (realtime)
- **Display**: Chromium kiosk on Pi (view-only, no touch)
- **Mobile**: iPhone Safari (interactive)
- **APIs**: Free, CORS-friendly preferred
- **Reliability**: 24/7 unattended operation
- **Siri**: Apple Shortcuts → HTTP POST to Supabase Edge Function or REST API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site + Supabase | No server to maintain, GitHub Pages + Supabase realtime | ✓ Good |
| Responsive single codebase | One site for wall + mobile | ✓ Good |
| Phone-based interaction only | Wall display is not touchscreen | ✓ Good |
| English only | Household common language | ✓ Good |
| Siri via Supabase REST API | Apple Shortcuts can POST directly to Supabase PostgREST | — Pending |

---
*Last updated: 2026-02-17 after v1.1 milestone start*
