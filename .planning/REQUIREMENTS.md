# Requirements: Family Dashboard

**Defined:** 2026-02-17
**Core Value:** The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.

## v1.0 Requirements (Validated)

All 34 requirements from v1.0 shipped and validated. See MILESTONES.md for full list.

## v1.1 Requirements

Requirements for polish milestone. Each maps to roadmap phases.

### Fixes

- [ ] **FIX-01**: Horoscopes display daily readings using a working API (replace broken ohmanda.com with API Ninjas)
- [ ] **FIX-02**: Calendar events show correct person emoji (🥑 Papa, 🍪 Daddy, 🌸 Wren, 🥭 Ellis, 🏠 Family)

### Calendar Layout

- [ ] **CALL-01**: Weather info (temp, icon) displays underneath the day header, not inline with events
- [ ] **CALL-02**: Person emoji badge precedes each event name in the calendar row

### Transit

- [ ] **TRNS-01**: BVG departures panel shows only the top 3 upcoming departures

### Country

- [ ] **CTRY-01**: Country of the Day displays a representative landscape photo from the country (Unsplash API)

### Behavior

- [ ] **BEHV-01**: Grocery list does not trigger priority interrupt (only active timers do)
- [ ] **BEHV-02**: Timer tab removed from mobile navigation (timers remain visible as priority interrupt on wall)

### Voice Integration

- [ ] **SIRI-01**: User can add grocery items via Siri voice command ("Add X to the list")
- [ ] **SIRI-02**: User can set timers via Siri voice command ("Set a timer for X, Y minutes")

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
| FIX-01 | — | Pending |
| FIX-02 | — | Pending |
| CALL-01 | — | Pending |
| CALL-02 | — | Pending |
| TRNS-01 | — | Pending |
| CTRY-01 | — | Pending |
| BEHV-01 | — | Pending |
| BEHV-02 | — | Pending |
| SIRI-01 | — | Pending |
| SIRI-02 | — | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 (pending roadmap creation)

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*
