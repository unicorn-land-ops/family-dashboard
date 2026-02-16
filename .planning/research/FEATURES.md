# Feature Research: Family Dashboard / Smart Home Display

**Domain:** Family information center and household management dashboard
**Researched:** 2026-02-16
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clock & Date | Core function of always-on display; first thing users check | LOW | Already implemented; real-time update with Berlin timezone |
| Current Weather | Standard across all dashboard products (DAKboard, MagicMirror, Skylight) | LOW | Already implemented via Open-Meteo; includes current temp + icon |
| Calendar Integration | Primary use case — "what's happening today/this week" | MEDIUM | Already implemented with 5 Google Calendar iCal feeds, handles recurring events, deduplication, filtering |
| Multi-day Forecast | Context for planning; complements calendar view | LOW | Already implemented; 7-day forecast with highs/lows |
| Photos/Slideshow | Emotional value; makes display feel alive vs sterile data | MEDIUM | NOT IMPLEMENTED. Need iCloud shared album integration, automatic rotation, transition effects |
| Responsive Layout | Wall display (landscape) + mobile phones (portrait) are different use cases | HIGH | NOT IMPLEMENTED. Current design is fixed landscape grid; needs breakpoints for mobile portrait |
| Shared Grocery List | Household coordination staple; prevents duplicate shopping | MEDIUM | NOT IMPLEMENTED. Need cloud database (Firebase/Supabase), real-time sync, mobile add/check interface |
| Visual Timers | Kitchen/homework timers visible to whole family | MEDIUM | NOT IMPLEMENTED. Need countdown display, priority interrupt on wall display, mobile control |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Travel Detection + Dual Timezone | Automatic — no manual input; shows "Papa in NYC 14:30 (Berlin 20:30)" when calendar contains travel | MEDIUM | Already implemented via calendar location parsing; unique to this implementation vs competitors |
| Person-Tagged Calendar Events | Emoji badges (🏠🥖🍪🌸🥭) show whose event is whose at a glance | LOW | Already implemented; enables quick visual filtering vs text-only competitor displays |
| Transit Departures (BVG) | Hyperlocal — shows "U2 at Senefelderplatz in 3 min" for your actual commute stop | LOW | Already implemented; differentiates from generic traffic/commute widgets |
| Country of the Day | Educational + conversation starter; rotates daily with facts, cuisine, flag | LOW | Already implemented; unique cultural enrichment vs pure utility dashboards |
| Horoscopes (Family) | Personalized fun content; daily talking point for kids/family | LOW | Already implemented; adds personality vs strictly utilitarian competitors |
| Priority Interrupts | Active timer or grocery list with pending items takes visual priority over photos/rotating content | HIGH | NOT IMPLEMENTED. Requires state management + dynamic layout reconfiguration |
| Chore Tracking | Visible accountability for kids' daily routines + household jobs | MEDIUM | NOT IMPLEMENTED. Need database, assignment system, completion tracking, mobile interaction |
| Mobile-First Interaction | Wall display = glanceable; phone = control panel for timers/chores/groceries | HIGH | NOT IMPLEMENTED. Requires responsive breakpoints + touch-optimized mobile UI |
| No Login Required | Family-only home network; zero friction to access from any device | LOW | Currently true; maintain this simplicity vs authentication complexity |
| Zero-Maintenance Operation | Auto-refresh, memory leak prevention, 6-hour reload cycle; no manual intervention | MEDIUM | Already implemented; critical for 24/7 unattended Raspberry Pi deployment |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Voice Control (Alexa/Google) | "Hands-free convenience" | Requires always-listening hardware, cloud dependencies, authentication complexity, another service to maintain | Use Siri on iPhones for timers (already in everyone's pocket); wait for new Google hardware before revisiting |
| Native Mobile App | "Better performance/integration" | Requires App Store submission, separate codebase, version management, push notification setup | Responsive web app with home screen bookmark; sufficient for family use case |
| User Authentication | "Privacy/personalization" | Adds login friction, password management, session handling; overkill for single-family home network | Rely on home network isolation; all family members are trusted users |
| Home Assistant Integration | "Control smart home from dashboard" | Introduces external dependency, configuration complexity, feature creep beyond core value | Keep dashboard focused on information + coordination; separate tools for device control |
| Real-Time Everything | "Live updates!" | WebSocket connections, higher complexity, battery drain on mobile, unnecessary for most dashboard data | Polling intervals tuned per data type (transit 60s, weather 10min, calendar 5min) is sufficient |
| Offline-First Architecture | "Works without internet" | Complex service worker setup, data syncing conflicts, over-engineering for always-online Pi + home WiFi | Accept internet dependency; graceful degradation with cached data + error messages |
| Multi-Language Support | "Accessibility for Ellis" | Translation maintenance, UI complexity, content overflow issues | English-only; family helps Ellis as needed (current practice) |
| Meal Planning | "Complete household management" | Scope creep; overlaps with groceries; adds recipe storage, meal calendar, nutrition tracking complexity | Defer; grocery list is sufficient starting point; validate demand before expanding |
| Financial Tracking / Budget | "All household management in one place" | Sensitive data on always-visible wall display; privacy concerns; feature bloat | Use dedicated apps (banking apps, budgeting tools); keep dashboard focused on daily coordination |
| Social Media Integration | "Share calendar/photos publicly" | Privacy risks, moderation burden, authentication complexity, feature creep | Family dashboard is private; use existing social platforms for public sharing |

## Feature Dependencies

```
Calendar Integration
    └──requires──> CORS Proxy (corsproxy.io)
    └──enables──> Travel Detection
    └──enables──> Person-Tagged Events

Grocery List
    └──requires──> Cloud Database (Firebase/Supabase)
    └──requires──> Responsive Layout (mobile interaction)

Chore Tracking
    └──requires──> Cloud Database (Firebase/Supabase)
    └──requires──> Responsive Layout (mobile interaction)

Visual Timers
    └──requires──> Cloud Database (Firebase/Supabase for sync)
    └──requires──> Responsive Layout (mobile control)
    └──requires──> Priority Interrupts (visual hierarchy)

Priority Interrupts
    └──requires──> Rotating Content System
    └──enhances──> Visual Timers
    └──enhances──> Grocery List

Photos/Slideshow
    └──requires──> iCloud Shared Album API/Access
    └──requires──> Rotating Content System
    └──conflicts──> Priority Interrupts (competes for screen space)

Responsive Layout
    └──enables──> Mobile-First Interaction
    └──enables──> Grocery List (mobile add/check)
    └──enables──> Chore Tracking (mobile interaction)
    └──enables──> Visual Timers (mobile set/cancel)

Rotating Content System
    └──requires──> State Management (what's showing now)
    └──enables──> Photos/Slideshow
    └──enables──> Priority Interrupts
```

### Dependency Notes

- **Cloud Database is a bottleneck:** Grocery list, chore tracking, and timers all need shared state between wall display and mobile devices. Firebase or Supabase required before these features work.
- **Responsive Layout unlocks mobile features:** Without proper mobile breakpoints and touch optimization, interactive features (groceries, chores, timers) are inaccessible from phones.
- **Priority Interrupts require Rotating Content first:** Can't interrupt static layout; need content rotation system to know what to replace when timer/grocery list needs attention.
- **Photos depend on iCloud access:** iCloud Shared Album API access from static site is challenging; may need cloud function proxy or alternative photo source (Dropbox, Google Photos).
- **Travel Detection enhances existing calendar:** No new data source needed; leverages existing calendar event parsing logic.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the brownfield update adds value.

- [x] **All existing features preserved** — clock, weather, calendar, transit, horoscopes, country (already working)
- [ ] **Responsive layout** — wall display (landscape) + mobile (portrait) with proper breakpoints
- [ ] **Cloud database setup** — Firebase or Supabase for shared state (grocery list, timers foundation)
- [ ] **Grocery list** — add/check items from mobile, visible count on wall display when items exist
- [ ] **Visual timers (basic)** — set from mobile, countdown visible on wall, audible alert on completion
- [ ] **Family photos** — iCloud shared album integration, 30-second rotation in content area
- [ ] **Priority interrupts** — active timer or non-empty grocery list takes precedence over photos

**Rationale:** These features validate the core hypothesis: "adding household management (groceries, timers) + family photos makes the dashboard more valuable." If family doesn't use grocery list or timers after 2 weeks, the feature set is wrong.

### Add After Validation (v1.x)

Features to add once core is working and validated through use.

- [ ] **Chore tracking** — daily routines for kids, household jobs, completion checkboxes
- [ ] **Timer presets** — "20 min homework", "30 min baking", "5 min teeth brushing" quick-start buttons
- [ ] **Photo filters** — show only "last 30 days" or "favorites" album subset
- [ ] **Grocery categories** — auto-organize by "produce", "dairy", "pantry" for shopping efficiency
- [ ] **Calendar event creation from mobile** — quick-add "Dentist Tuesday 3pm" from phone
- [ ] **Transit alerts** — highlight departures <5 min in red; show delays/disruptions

**Trigger for adding:** Family actively uses grocery list + timers for 2+ weeks; requests improvements to existing features.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Meal planning** — weekly menu, recipe links, auto-add ingredients to grocery list
- [ ] **Allowance/rewards** — kids earn points for completed chores, redeem for privileges
- [ ] **Weather alerts** — rain forecast, temperature extremes, air quality warnings
- [ ] **Multi-location support** — summer house, vacation rental, grandparents' house
- [ ] **Guest mode** — temporary PIN access for house sitters, guests staying over
- [ ] **Voice input (revisit)** — IF new Google hardware simplifies setup; still complex

**Why defer:** These expand scope significantly; validate core household coordination use case first before adding complexity. Meal planning overlaps heavily with groceries but adds recipe/nutrition complexity. Allowance system is parenting methodology (not universal). Multi-location requires user account system (authentication anti-feature).

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Responsive Layout | HIGH | HIGH | P1 |
| Cloud Database Setup | HIGH | MEDIUM | P1 |
| Grocery List | HIGH | MEDIUM | P1 |
| Visual Timers (basic) | HIGH | MEDIUM | P1 |
| Family Photos | HIGH | MEDIUM | P1 |
| Priority Interrupts | MEDIUM | HIGH | P1 |
| Chore Tracking | MEDIUM | MEDIUM | P2 |
| Timer Presets | MEDIUM | LOW | P2 |
| Photo Filters | LOW | LOW | P2 |
| Grocery Categories | MEDIUM | MEDIUM | P2 |
| Calendar Event Creation | LOW | MEDIUM | P2 |
| Transit Alerts | LOW | LOW | P2 |
| Meal Planning | MEDIUM | HIGH | P3 |
| Allowance/Rewards | LOW | HIGH | P3 |
| Weather Alerts | LOW | MEDIUM | P3 |
| Multi-Location Support | LOW | HIGH | P3 |
| Guest Mode | LOW | MEDIUM | P3 |

**Priority key:**
- **P1**: Must have for launch — validates brownfield update hypothesis
- **P2**: Should have when possible — enhances validated features after initial adoption
- **P3**: Nice to have, future consideration — defer until core product-market fit proven

## Competitor Feature Analysis

| Feature | DAKboard | MagicMirror | Skylight Calendar | Home Assistant | Our Approach |
|---------|----------|-------------|-------------------|----------------|--------------|
| **Calendar** | Google/iCloud/Facebook sync, agenda or monthly view | Module-based, customizable | AI Magic Import, color-coded | Lovelace calendar card | 5 iCal feeds, person-tagged emoji badges, 7-day agenda |
| **Photos** | Flickr/Dropbox/iCloud/Box, configurable rotation | Custom modules, local files | Unlimited family uploads via app | Media gallery entity | iCloud Shared Album, 30-sec rotation, priority interrupts |
| **Weather** | Built-in, multiple sources | Current + forecast modules | Display only, no customization | Weather entity integration | Open-Meteo (free, CORS-friendly), 7-day forecast, sunrise/sunset |
| **To-Do Lists** | Built-in to-do widget | Custom modules available | To-do lists with sections | To-do entity integration | Grocery list (specific use case) + chore tracking |
| **Timers** | Not standard | Custom timer modules | NOT INCLUDED | Timer entities via devices | Visual countdown on wall + mobile control + priority interrupt |
| **Chores** | NOT INCLUDED | NOT INCLUDED | Chore tracking, assignments | Custom automation only | Daily routines + household jobs with mobile check-off |
| **Transit** | Traffic widgets | Custom modules (varies by location) | NOT INCLUDED | Public transit integration (complex) | BVG REST API (U2 Senefelderplatz hyperlocal) |
| **Customization** | Drag-and-drop editor, templates | Code-based, high flexibility | Limited layout options | YAML configuration, steep learning curve | Code-based (single HTML file) with clear config section |
| **Mobile App** | Web + optional CPU device | NOT INCLUDED | Smartphone app for management | Companion mobile app | Responsive web app (no separate app needed) |
| **Setup Complexity** | LOW (cloud service, GUI) | HIGH (Linux, modules, coding) | LOW (consumer device) | HIGH (server, YAML, integrations) | MEDIUM (static site + cloud DB, some coding) |
| **Cost** | $9.99-19.99/mo OR self-hosted | FREE (open source) | $199 device + optional $39/yr | FREE (self-hosted) | FREE (GitHub Pages + free Firebase tier) |

**Our competitive positioning:**
- **Simpler than Home Assistant/MagicMirror** (no server, no YAML, no Linux administration)
- **More affordable than DAKboard/Skylight** (free hosting + free cloud database tier)
- **More customizable than Skylight** (code access, not locked-in consumer device)
- **More polished than MagicMirror DIY** (cohesive design, not module patchwork)
- **More household-focused than DAKboard** (chores, grocery list, timers vs generic news/stocks)

**Differentiation strategy:**
1. **Household coordination focus** — groceries, chores, timers (vs generic information display)
2. **Mobile-first interaction** — wall = glanceable, phone = control panel (vs touch-screen-only or view-only)
3. **Priority interrupts** — timers and actionable items get attention (vs equal visual weight for all content)
4. **Zero-friction access** — no login, no separate app installs, works on home network (vs authentication, app stores)
5. **Brownfield advantage** — existing working features (calendar, transit, travel detection) are already validated

## Sources

- [DAKboard vs MagicMirror comparison (2025)](https://smartnmagic.com/blogs/solutions/review-dakboard-vs-magicmirror-in-2025-and-what-sets-them-apart)
- [DAKboard alternatives for digital displays](https://technicalustad.com/dakboard-alternatives/)
- [Skylight Calendar product details](https://myskylight.com/products/skylight-calendar/)
- [Best digital wall calendars reviewed (Consumer Reports)](https://www.consumerreports.org/electronics-computers/best-digital-calendars-a1935397155/)
- [Home Assistant 2026.1 dashboard update](https://www.home-assistant.io/blog/2026/01/07/release-20261)
- [Home Assistant family dashboard features (XDA)](https://www.xda-developers.com/home-assistant-february-update-2026/)
- [Homechart household management app](https://homechart.app/)
- [Family chore apps essential guide](https://www.familydaily.app/blog/family-chore-apps)
- [Home organization apps to streamline routines](https://www.familyhandyman.com/article/home-organization-apps/)
- [Feature creep causes and prevention](https://www.june.so/blog/feature-creep-causes-consequences-and-how-to-avoid-it)
- [Digital photo frame slideshow features guide](https://nexfoto.com/blogs/news/complete-guide-digital-photo-frames-slideshow-features)
- [Best digital photo frames 2026 (Tom's Guide)](https://www.tomsguide.com/best-picks/best-digital-photo-frames)

---
*Feature research for: Family Dashboard / Smart Home Display*
*Researched: 2026-02-16*
