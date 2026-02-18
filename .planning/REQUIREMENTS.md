# Requirements: Family Dashboard

**Defined:** 2026-02-17
**Core Value:** The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.

## v1.0 Requirements (Validated)

All 34 requirements from v1.0 shipped and validated. See MILESTONES.md for full list.

## v1.1 Requirements

Requirements for polish milestone. Each maps to roadmap phases.

### Fixes

- [x] **FIX-01**: Horoscopes display daily readings using a working API (replace broken ohmanda.com with API Ninjas)
- [x] **FIX-02**: Calendar events show correct person emoji (🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family)

### Calendar Layout

- [x] **CALL-01**: Weather info (temp, icon) displays underneath the day header, not inline with events
- [x] **CALL-02**: Person emoji badge precedes each event name in the calendar row

### Transit

- [x] **TRNS-01**: BVG departures panel shows only the top 3 upcoming departures

### Country

- [x] **CTRY-01**: Country of the Day displays a representative landscape photo from the country (Unsplash API)

### Behavior

- [x] **BEHV-01**: Grocery list does not trigger priority interrupt (only active timers do)
- [x] **BEHV-02**: Timer tab removed from mobile navigation (timers remain visible as priority interrupt on wall)

### Voice Integration

- [x] **SIRI-01**: User can add grocery items via Siri voice command ("Add X to the list")
- [x] **SIRI-02**: User can set timers via Siri voice command ("Set a timer for X, Y minutes")

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Photos

- **PHOT-01**: Family photo slideshow in rotating content area
- **PHOT-02**: Pull photos from shared album (iCloud or alternative)
- **PHOT-03**: Photo caching and optimization for Pi performance

### Automation

- **AUTO-01**: Chore completion controls children's network access
- **AUTO-02**: Siri Shortcuts for chore completion

### Enhancements

- **ENHN-01**: Timer presets (quick-start buttons for common durations)
- **ENHN-02**: Grocery categories (auto-organize by type)
- **ENHN-03**: Calendar event creation from mobile
- **ENHN-04**: Transit alerts (delays, departures <5 min)
- **ENHN-05**: Weather alerts (rain forecast, temperature extremes)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Voice control / Alexa integration | Waiting for new Google hardware |
| Native mobile app | Responsive web app is sufficient |
| User authentication | Family-only, no login needed on home network |
| Home Assistant integration | Feature creep beyond core dashboard value |
| Multi-language support | English is household common language |
| Meal planning | Validate grocery list usage first |
| Financial tracking | Sensitive data on always-visible display |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 11 | Satisfied |
| FIX-02 | Phase 12 (verify: Phase 17) | Satisfied (re-verify) |
| CALL-01 | Phase 12 (verify: Phase 17) | Satisfied (re-verify) |
| CALL-02 | Phase 12 (verify: Phase 17) | Satisfied (re-verify) |
| TRNS-01 | Phase 13 | Satisfied |
| CTRY-01 | Phase 13 | Satisfied |
| BEHV-01 | Phase 14 | Satisfied |
| BEHV-02 | Phase 14 | Satisfied |
| SIRI-01 | Phase 15 | Satisfied |
| SIRI-02 | Phase 16 | Satisfied |

**Coverage:**
- v1.1 requirements: 10 total
- Satisfied: 10
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-18 (all v1.1 requirements satisfied, SIRI-02 marked complete)*
