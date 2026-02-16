# Requirements: Family Dashboard

**Defined:** 2026-02-16
**Core Value:** The family can glance at the wall and instantly know what's happening today — schedule, weather, and anything that needs attention — while managing household tasks from their phones.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Display

- [ ] **DISP-01**: Dashboard renders in landscape kiosk mode on Raspberry Pi Chromium
- [ ] **DISP-02**: Dashboard renders in portrait mode on iPhone Safari
- [ ] **DISP-03**: Modern, polished visual design with clean typography and smooth animations
- [ ] **DISP-04**: Content rotates through schedule, country of the day with configurable intervals and transitions
- [ ] **DISP-05**: Active timers and non-empty grocery list interrupt rotation and take visual priority
- [ ] **DISP-06**: Auto-refresh with memory leak prevention for 24/7 unattended operation

### Clock & Weather

- [ ] **CLKW-01**: Real-time clock and date display (Berlin timezone), always visible
- [ ] **CLKW-02**: Current weather conditions with temperature and icon (Open-Meteo API)
- [ ] **CLKW-03**: 7-day weather forecast with highs/lows
- [ ] **CLKW-04**: Sunrise and sunset times

### Calendar

- [ ] **CAL-01**: Display events from 5 Google Calendar iCal feeds
- [ ] **CAL-02**: Person-tagged events with emoji badges per family member
- [ ] **CAL-03**: Handle recurring events (RRULE patterns)
- [ ] **CAL-04**: Event deduplication across calendars
- [ ] **CAL-05**: Travel detection with dual timezone display when family member is away
- [ ] **CAL-06**: Filter Papa's work-hours events (9-18 weekdays)
- [ ] **CAL-07**: Highlight "No School/Schulfrei" all-day events

### Transit

- [ ] **TRNS-01**: Show upcoming BVG departures for U2 at Senefelderplatz

### Fun Content

- [ ] **FUN-01**: Daily horoscopes for family members (Capricorn, Aquarius, Sagittarius)
- [ ] **FUN-02**: Country of the Day with flag, facts, cuisine, population, language

### Grocery List

- [ ] **GROC-01**: Add grocery items from mobile phone
- [ ] **GROC-02**: Check off / remove items from mobile phone
- [ ] **GROC-03**: Shared list syncs in real-time across all devices
- [ ] **GROC-04**: Wall display shows grocery list when items exist

### Timers

- [ ] **TIMR-01**: Set timer with label and duration from mobile phone
- [ ] **TIMR-02**: Countdown display visible on wall display
- [ ] **TIMR-03**: Timer completion alert (visual + sound)
- [ ] **TIMR-04**: Cancel/dismiss timer from mobile phone
- [ ] **TIMR-05**: Multiple concurrent timers supported

### Chores

- [ ] **CHOR-01**: Define daily routines for kids (recurring tasks)
- [ ] **CHOR-02**: Define household jobs assignable to family members
- [ ] **CHOR-03**: Mark chores complete from mobile phone
- [ ] **CHOR-04**: Wall display shows chore progress/status
- [ ] **CHOR-05**: Chores reset on schedule (daily/weekly)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Photos

- **PHOT-01**: Family photo slideshow in rotating content area
- **PHOT-02**: Pull photos from shared album (iCloud or alternative)
- **PHOT-03**: Photo caching and optimization for Pi performance

### Enhancements

- **ENHN-01**: Timer presets (quick-start buttons for common durations)
- **ENHN-02**: Grocery categories (auto-organize by type)
- **ENHN-03**: Calendar event creation from mobile
- **ENHN-04**: Transit alerts (delays, departures <5 min)
- **ENHN-05**: Weather alerts (rain forecast, temperature extremes)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Voice control / Alexa integration | Waiting for new Google hardware; complexity outweighs value now |
| Native mobile app | Responsive web app with home screen bookmark is sufficient |
| User authentication | Single-family home network; no login friction needed |
| Home Assistant integration | Feature creep beyond core dashboard value |
| Multi-language support | English is household common language; keeps UI simple |
| Meal planning | Scope creep; validate grocery list usage first |
| Financial tracking | Sensitive data on always-visible display; use dedicated apps |
| Offline-first architecture | Over-engineering for always-online Pi + home WiFi |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | — | Pending |
| DISP-02 | — | Pending |
| DISP-03 | — | Pending |
| DISP-04 | — | Pending |
| DISP-05 | — | Pending |
| DISP-06 | — | Pending |
| CLKW-01 | — | Pending |
| CLKW-02 | — | Pending |
| CLKW-03 | — | Pending |
| CLKW-04 | — | Pending |
| CAL-01 | — | Pending |
| CAL-02 | — | Pending |
| CAL-03 | — | Pending |
| CAL-04 | — | Pending |
| CAL-05 | — | Pending |
| CAL-06 | — | Pending |
| CAL-07 | — | Pending |
| TRNS-01 | — | Pending |
| FUN-01 | — | Pending |
| FUN-02 | — | Pending |
| GROC-01 | — | Pending |
| GROC-02 | — | Pending |
| GROC-03 | — | Pending |
| GROC-04 | — | Pending |
| TIMR-01 | — | Pending |
| TIMR-02 | — | Pending |
| TIMR-03 | — | Pending |
| TIMR-04 | — | Pending |
| TIMR-05 | — | Pending |
| CHOR-01 | — | Pending |
| CHOR-02 | — | Pending |
| CHOR-03 | — | Pending |
| CHOR-04 | — | Pending |
| CHOR-05 | — | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 0
- Unmapped: 34

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after initial definition*
