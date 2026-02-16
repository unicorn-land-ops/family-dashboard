# Roadmap: Family Dashboard

## Overview

This roadmap transforms the existing static family dashboard into a modern, responsive web application that runs on a wall-mounted Raspberry Pi kiosk AND mobile phones. The journey begins by establishing infrastructure and migrating existing features (clock, weather, calendar, transit, fun content) to a modern React stack, then adds new interactive household management features (grocery list, timers, chores) with real-time sync across devices. The final phases implement priority interrupts (time-sensitive content takes precedence) and harden the system for reliable 24/7 unattended operation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Setup** - Modern stack infrastructure with responsive design (completed 2026-02-16)
- [ ] **Phase 2: Clock & Weather Core** - Always-visible panel with real-time updates
- [ ] **Phase 3: Calendar Integration** - Family scheduling with 5 iCal feeds
- [ ] **Phase 4: Transit & Fun Content** - Rotating content system with BVG, horoscopes, country
- [ ] **Phase 5: Real-Time Infrastructure** - Shared state database for interactive features
- [ ] **Phase 6: Grocery List** - First interactive household coordination feature
- [ ] **Phase 7: Timer System** - Visual countdown timers with mobile control
- [ ] **Phase 8: Priority Interrupts** - Time-sensitive content visual hierarchy
- [ ] **Phase 9: Chore Tracking** - Household jobs and daily routines
- [ ] **Phase 10: Hardening & Polish** - 24/7 production reliability

## Phase Details

### Phase 1: Foundation & Setup
**Goal**: Modern web application infrastructure that runs on Raspberry Pi kiosk and mobile phones with responsive design
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-06
**Success Criteria** (what must be TRUE):
  1. Vite + React + TypeScript project builds and deploys to GitHub Pages
  2. Dashboard renders correctly in landscape on Raspberry Pi Chromium kiosk
  3. Dashboard renders correctly in portrait on iPhone Safari
  4. Visual design feels modern and polished with clean typography
  5. Auto-refresh mechanism prevents memory leaks during 24/7 operation
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold Vite + React + TypeScript with Tailwind CSS v4, PWA, and GitHub Pages deployment
- [ ] 01-02-PLAN.md — Responsive layout shell, fluid typography, auto-refresh, and visual verification

### Phase 2: Clock & Weather Core
**Goal**: Always-visible panel showing real-time clock, date, and weather conditions
**Depends on**: Phase 1
**Requirements**: CLKW-01, CLKW-02, CLKW-03, CLKW-04
**Success Criteria** (what must be TRUE):
  1. Real-time clock displays current time in Berlin timezone with auto-update
  2. Current date displays in readable format
  3. Current weather shows temperature and conditions from Open-Meteo API
  4. 7-day forecast displays with daily highs and lows
  5. Sunrise and sunset times display for Berlin
  6. Weather data refreshes automatically without page reload
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 3: Calendar Integration
**Goal**: Family scheduling visible on wall with intelligent event handling
**Depends on**: Phase 2
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07
**Success Criteria** (what must be TRUE):
  1. Events display from 5 Google Calendar iCal feeds (Papa, Daddy, Wren, Ellis, Family)
  2. Each event shows person emoji badge indicating who it applies to
  3. Recurring events expand correctly based on RRULE patterns
  4. Duplicate events across calendars display only once
  5. When a family member is traveling, dual timezone displays for their location
  6. Papa's work-hours events (9-18 weekdays) are filtered out
  7. "No School/Schulfrei" all-day events display with visual highlight
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 4: Transit & Fun Content
**Goal**: Rotating content area cycling through transit, horoscopes, and country information
**Depends on**: Phase 3
**Requirements**: TRNS-01, FUN-01, FUN-02, DISP-04
**Success Criteria** (what must be TRUE):
  1. BVG U2 departures at Senefelderplatz display with real-time updates
  2. Daily horoscopes display for family members (Capricorn, Aquarius, Sagittarius)
  3. Country of the Day displays with flag, facts, cuisine, population, language
  4. Content rotates through schedule, transit, horoscopes, country with smooth transitions
  5. Rotation intervals are configurable
  6. User can see which content is currently displayed and what's next
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 5: Real-Time Infrastructure
**Goal**: Cloud database and WebSocket infrastructure for shared state across devices
**Depends on**: Phase 4
**Requirements**: (Enables GROC, TIMR, CHOR - no direct requirements)
**Success Criteria** (what must be TRUE):
  1. Supabase project is configured with database tables for timers, groceries, chores
  2. WebSocket connection establishes between client and database
  3. Real-time updates sync across wall display and mobile devices within 1 second
  4. Connection status indicator shows connected/reconnecting/offline state
  5. When offline, writes queue locally and sync when connection restored
  6. WebSocket subscriptions cleanup properly to prevent memory leaks
  7. Reconnection logic handles background tab scenarios on mobile Safari
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 6: Grocery List
**Goal**: Shared grocery list manageable from mobile, visible on wall display
**Depends on**: Phase 5
**Requirements**: GROC-01, GROC-02, GROC-03, GROC-04
**Success Criteria** (what must be TRUE):
  1. User can add grocery items from mobile phone with touch-friendly interface
  2. User can check off items from mobile phone
  3. User can remove items from mobile phone
  4. Grocery list changes sync in real-time across all devices
  5. Wall display shows grocery list when items exist
  6. When multiple users edit simultaneously, changes merge correctly without data loss
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 7: Timer System
**Goal**: Visual countdown timers set from mobile, displayed on wall
**Depends on**: Phase 6
**Requirements**: TIMR-01, TIMR-02, TIMR-03, TIMR-04, TIMR-05
**Success Criteria** (what must be TRUE):
  1. User can set timer from mobile with label and duration
  2. Countdown displays on wall in minutes:seconds format with visual prominence
  3. When timer completes, visual and sound alert activates
  4. User can cancel or dismiss timer from mobile phone
  5. Multiple timers run concurrently without interference
  6. Timer countdown updates in real-time across all devices
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 8: Priority Interrupts
**Goal**: Time-sensitive content (timers, grocery list) takes visual priority over rotating content
**Depends on**: Phase 7
**Requirements**: DISP-05
**Success Criteria** (what must be TRUE):
  1. When a timer is active, it interrupts content rotation and displays prominently
  2. When grocery list has items, it interrupts content rotation
  3. Priority interrupts return to normal rotation when condition clears
  4. Visual hierarchy clearly indicates priority content vs normal rotation
  5. Transitions between priority and normal states are smooth
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 9: Chore Tracking
**Goal**: Household chores and kids' daily routines tracked and visible
**Depends on**: Phase 8
**Requirements**: CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05
**Success Criteria** (what must be TRUE):
  1. User can define daily routines for kids (recurring tasks)
  2. User can define household jobs assignable to family members
  3. Family members can mark chores complete from mobile phone
  4. Wall display shows chore progress and current status
  5. Chores reset automatically on schedule (daily/weekly)
  6. Completed chores show who did them and when
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 10: Hardening & Polish
**Goal**: Production-ready system for reliable 24/7 unattended operation
**Depends on**: Phase 9
**Requirements**: (Hardens all previous requirements for production)
**Success Criteria** (what must be TRUE):
  1. Dashboard runs continuously for 48+ hours without crashes or memory issues
  2. Automatic page reload at 3am prevents memory accumulation
  3. Service worker caches static assets for offline reliability
  4. Error tracking captures and logs production issues
  5. Performance metrics confirm responsive load times (<3s on Pi, <1s on mobile)
  6. All animations and transitions perform smoothly on Raspberry Pi hardware
  7. Family confirms system feels polished and reliable for daily use
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Setup | 0/2 | Complete    | 2026-02-16 |
| 2. Clock & Weather Core | 0/TBD | Not started | - |
| 3. Calendar Integration | 0/TBD | Not started | - |
| 4. Transit & Fun Content | 0/TBD | Not started | - |
| 5. Real-Time Infrastructure | 0/TBD | Not started | - |
| 6. Grocery List | 0/TBD | Not started | - |
| 7. Timer System | 0/TBD | Not started | - |
| 8. Priority Interrupts | 0/TBD | Not started | - |
| 9. Chore Tracking | 0/TBD | Not started | - |
| 10. Hardening & Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-16*
*Last updated: 2026-02-16*
