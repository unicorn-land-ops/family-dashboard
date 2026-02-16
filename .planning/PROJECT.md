# Family Dashboard

## What This Is

A modern, polished family information center for a household of four in Berlin — two dads (Papa & Daddy) and two kids (Wren, 13, and Ellis, 9). Runs on a wall-mounted Raspberry Pi in kiosk mode AND is fully responsive for mobile phones. Replaces the current static dashboard with a premium-feeling interface that adds household management features (chores, groceries, timers) alongside the existing weather, calendar, transit, and fun content.

## Core Value

The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Modern, polished visual design — premium look, clean typography, smooth animations
- [ ] Responsive layout for wall-mounted Pi (landscape kiosk) AND mobile phones (portrait, interactive)
- [ ] Always-visible: clock, weather (current + forecast), active timers, travel timezone when applicable
- [ ] Rotating content area: daily schedule, family photos, country of the day cycle through
- [ ] Family calendar integration (5 Google Calendar iCal feeds for Papa, Daddy, Wren, Ellis, Family)
- [ ] BVG transit departures for U2 at Senefelderplatz
- [ ] Daily horoscopes for family members (Capricorn, Aquarius, Sagittarius)
- [ ] Country of the Day with facts, cuisine, and flag
- [ ] Travel detection — show dual timezone when a family member is traveling
- [ ] Timer system — set from phone, countdown visible on wall display, priority interrupt when active
- [ ] Grocery list — shared list, add/check items from phone, visible on wall display when items exist
- [ ] Chore tracking — daily routines for kids + household jobs assigned to family members
- [ ] Family photos — pull from iCloud shared album, display in rotation
- [ ] Mobile interactive features — set timers, manage chores, manage groceries from phone
- [ ] Priority interrupts — timers and grocery list take visual priority over rotating content when active

### Out of Scope

- Voice control / Alexa integration — waiting for new Google hardware
- Native mobile app — web-based responsive design is sufficient
- Multi-language support — dashboard is in English (Ellis gets help from family)
- Home Assistant integration — keeping it independent and simple
- User authentication — family-only, no login needed on home network

## Context

- Currently a single-file static site (index.html, ~1200 lines) hosted on GitHub Pages
- All current APIs are CORS-friendly and free (Open-Meteo, BVG, restcountries, horoscope)
- Google Calendar feeds proxied through corsproxy.io
- Raspberry Pi runs Chromium in kiosk mode with autostart scripts
- The family all uses iPhones — Siri available for timers as alternative input
- Ellis reads only in German but dashboard will be English (family helps)
- Wall display is landscape, phones are portrait — needs truly responsive design
- Existing features (weather, calendar, transit, horoscopes, country) all work and should be preserved
- Calendar already handles event deduplication, Papa's work filter, travel detection, recurring events

## Constraints

- **Hosting**: GitHub Pages (static site) — any dynamic data needs a cloud service (Firebase/Supabase)
- **Display**: Must work in Chromium kiosk mode on Raspberry Pi (always-on, no interaction)
- **Mobile**: Must be responsive and interactive on iPhone Safari
- **APIs**: Prefer free, CORS-friendly APIs — no API keys to manage if possible
- **Reliability**: Auto-refresh, memory leak prevention — this runs 24/7 unattended
- **Photos**: iCloud shared album — need a way to access photos from a static site

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site + cloud database | No server to maintain, GitHub Pages hosting, Firebase/Supabase for shared state (chores, groceries, timers) | — Pending |
| Responsive single codebase | One site for wall + mobile, not separate apps | — Pending |
| iCloud shared album for photos | Family already uses iCloud, will create dedicated album | — Pending |
| Phone-based timers (not voice) | Avoids Alexa integration complexity, Siri available on iPhones | — Pending |
| English only | Household common language, keeps UI simple | — Pending |

---
*Last updated: 2026-02-16 after initialization*
