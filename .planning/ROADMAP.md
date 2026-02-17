# Roadmap: Family Dashboard

## Milestones

- ✅ **v1.0 Core Dashboard** - Phases 1-10 (shipped 2026-02-17)
- 🚧 **v1.1 Polish** - Phases 11-15 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Core Dashboard (Phases 1-10) - SHIPPED 2026-02-17</summary>

- [x] **Phase 1: Foundation & Setup** - Modern stack infrastructure with responsive design
- [x] **Phase 2: Clock & Weather Core** - Always-visible panel with real-time updates
- [x] **Phase 3: Calendar Integration** - Family scheduling with 5 iCal feeds
- [x] **Phase 4: Transit & Fun Content** - Rotating content system with BVG, horoscopes, country
- [x] **Phase 5: Real-Time Infrastructure** - Shared state database for interactive features
- [x] **Phase 6: Grocery List** - First interactive household coordination feature
- [x] **Phase 7: Timer System** - Visual countdown timers with mobile control
- [x] **Phase 8: Priority Interrupts** - Time-sensitive content visual hierarchy
- [x] **Phase 9: Chore Tracking** - Household jobs and daily routines
- [x] **Phase 10: Hardening & Polish** - 24/7 production reliability

</details>

### v1.1 Polish (In Progress)

**Milestone Goal:** Fix broken features, refine layout and UX, add Siri voice integration for groceries and timers.

- [x] **Phase 11: Horoscope Fix & RLS Prep** - Replace broken horoscope API and verify Supabase RLS for Siri (completed 2026-02-17)
- [ ] **Phase 12: Calendar Polish** - Person emoji badges and weather-under-header layout
- [ ] **Phase 13: Content Enhancements** - Country landscape photos and BVG departure limit
- [ ] **Phase 14: Behavior Cleanup** - Remove grocery priority interrupt and timer mobile tab
- [ ] **Phase 15: Siri Voice Integration** - Voice commands for groceries and timers via Apple Shortcuts

## Phase Details

### Phase 11: Horoscope Fix & RLS Prep
**Goal**: Family sees daily horoscope readings again, and Supabase is ready for external writes
**Depends on**: Phase 10 (v1.0 complete)
**Requirements**: FIX-01
**Success Criteria** (what must be TRUE):
  1. Horoscope panel displays daily readings for Capricorn, Aquarius, and Sagittarius using API Ninjas
  2. Horoscope content rotates in the sidebar without errors or blank states
  3. Supabase RLS policies on groceries and timers tables allow anon INSERT (verified, ready for Phase 15)
**Plans:** 1/1 plans complete

Plans:
- [ ] 11-01-PLAN.md — Horoscope API migration (Worker proxy + frontend) and Supabase RLS policies

### Phase 12: Calendar Polish
**Goal**: Calendar events show who they belong to and weather sits cleanly under the day header
**Depends on**: Phase 11
**Requirements**: FIX-02, CALL-01, CALL-02
**Success Criteria** (what must be TRUE):
  1. Each calendar event displays the correct person emoji before the event name (🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family)
  2. Person emoji is determined by matching calendar feed source to family member
  3. Weather info (temperature, icon) displays underneath the day header row, not inline with events
  4. Calendar layout remains readable on both wall kiosk and mobile views
**Plans:** 1 plan

Plans:
- [ ] 12-01-PLAN.md — Update person emojis, move badge before event name, relocate weather below header

### Phase 13: Content Enhancements
**Goal**: Sidebar content panels show richer information without clutter
**Depends on**: Phase 11
**Requirements**: TRNS-01, CTRY-01
**Success Criteria** (what must be TRUE):
  1. BVG departures panel shows only the top 3 upcoming departures (not the full list)
  2. Country of the Day displays a representative landscape photo from that country (Unsplash API)
  3. Unsplash attribution displays as required by API terms
  4. Country panel layout accommodates the photo without breaking Pi display or causing memory issues
**Plans:** 1 plan

Plans:
- [ ] 13-01-PLAN.md — Limit BVG departures to 3, add Unsplash country photo with attribution

### Phase 14: Behavior Cleanup
**Goal**: Priority interrupts and mobile navigation reflect actual usage patterns
**Depends on**: Phase 11
**Requirements**: BEHV-01, BEHV-02
**Success Criteria** (what must be TRUE):
  1. Grocery list items do not trigger priority interrupt on the wall display (only active timers do)
  2. Timer tab is removed from mobile navigation bar
  3. Timers remain visible as priority interrupt on wall display when active
  4. Mobile navigation does not show empty/dead states after timer tab removal
**Plans:** 1 plan

Plans:
- [ ] 14-01-PLAN.md — Remove grocery from priority interrupt logic, remove timer tab from mobile nav

### Phase 15: Siri Voice Integration
**Goal**: Family can manage groceries and timers hands-free via Siri on their iPhones
**Depends on**: Phase 11 (RLS policies verified)
**Requirements**: SIRI-01, SIRI-02
**Success Criteria** (what must be TRUE):
  1. User says "Hey Siri, add milk to the list" and milk appears on the grocery list within 2 seconds
  2. User says "Hey Siri, set a timer for pasta, 10 minutes" and a 10-minute pasta timer starts on the wall display
  3. Siri Shortcuts use the Supabase anon key (not service_role key) for secure external writes
  4. New items added via Siri propagate to all connected devices via existing realtime subscriptions
**Plans:** 1 plan

Plans:
- [ ] 15-01-PLAN.md — Verify PostgREST endpoints, create Apple Shortcut step-by-step guides for grocery and timer voice commands

## Progress

**Execution Order:**
Phases execute in numeric order: 11 -> 12 -> 13 -> 14 -> 15
(Phases 12, 13, 14 are independent and could run in any order after 11)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 24/24 | Complete | 2026-02-17 |
| 11. Horoscope Fix & RLS Prep | v1.1 | Complete    | 2026-02-17 | - |
| 12. Calendar Polish | v1.1 | 0/1 | Not started | - |
| 13. Content Enhancements | v1.1 | 0/1 | Not started | - |
| 14. Behavior Cleanup | v1.1 | 0/1 | Not started | - |
| 15. Siri Voice Integration | v1.1 | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-16*
*Last updated: 2026-02-17 (Phase 13 planned)*
