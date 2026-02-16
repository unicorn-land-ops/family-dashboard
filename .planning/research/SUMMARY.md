# Project Research Summary

**Project:** Family Dashboard
**Domain:** Real-time responsive family dashboard web app
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

This project modernizes an existing static family dashboard into a responsive web application with real-time shared state across wall kiosk and mobile devices. The dashboard displays calendar events, weather, transit information, and will add household coordination features (grocery lists, timers, chores) plus family photos. The product is a hybrid between a digital photo frame (DAKboard, Skylight Calendar) and household management tool (Homechart), differentiated by its brownfield advantage with validated features and focus on mobile-first interaction for shared state.

The recommended approach uses React 19 + Vite 7 for the static frontend hosted on GitHub Pages (free), with Tailwind CSS 4 for responsive design, and Supabase (free tier) for real-time database sync. This static-site-plus-cloud-database hybrid architecture delivers zero-cost hosting, real-time WebSocket updates, and no server maintenance. Zustand handles local UI state, while React Query manages API data caching. The critical architectural decision is keeping the static site approach while adding real-time capabilities only for shared state (timers, groceries, chores).

Key risks center on three areas: (1) memory leaks from 24/7 kiosk operation on Raspberry Pi requiring periodic reloads and subscription cleanup, (2) breaking existing features during migration necessitating parallel deployment and feature parity validation, and (3) responsive design complexity across vastly different form factors (1920x1080 wall display vs 390x844 mobile) requiring real hardware testing throughout development. The iCloud Photos integration presents a research gap requiring API validation before commitment, with fallback plans to Google Photos or manual upload workflows.

## Key Findings

### Recommended Stack

The research converged on a modern, lightweight stack optimized for static hosting with real-time extensions. React 19 provides stable performance with excellent mobile Safari support and a massive ecosystem for brownfield migration from vanilla JavaScript. Vite 7 replaces traditional build tools with fast HMR and zero-config PWA support via plugins, making GitHub Pages deployment straightforward. Tailwind CSS 4 (Vite plugin method, NOT PostCSS) delivers responsive design built-in with minimal runtime overhead using the new Oxide engine.

**Core technologies:**
- **React 19.2+**: UI framework — industry standard with stable performance improvements, familiar for migration from vanilla JS
- **Vite 7.3+**: Build tool — fast HMR, zero-config PWA via plugins, excellent GitHub Pages deployment story
- **Tailwind CSS 4.1+**: Styling — v4 Oxide engine performance, responsive design built-in, minimal runtime overhead
- **Zustand 5.0+**: Client state — lightweight (1KB), simple API, perfect for local UI state (theme, rotation index)
- **Supabase/PartyKit**: Real-time sync — free tier available, WebSocket connections for shared state (timers, groceries, chores)
- **@tanstack/react-query 5.0+**: Server state — API data caching/refetching with stale-while-revalidate pattern
- **date-fns 3.0+**: Date handling — timezone-aware formatting (Berlin timezone), tree-shakeable
- **vite-plugin-pwa 0.20+**: Offline support — pre-caches static assets, service worker without manual configuration

**Key architectural decision:** Use PartyKit or Server-Sent Events (SSE) for real-time sync, NOT Supabase Realtime (overkill with Postgres backend) or Yjs (too heavyweight for simple shared state). If real-time proves too complex, SSE offers a simpler fallback for one-way server-to-client updates.

**Alternatives for constrained scenarios:** Consider Preact (3KB vs React's 45KB) if Raspberry Pi memory pressure becomes critical. Use DIY WebSocket server (Node.js + ws library) if zero vendor lock-in is priority.

### Expected Features

Research revealed a clear feature hierarchy divided between table stakes (users assume exist), competitive differentiators (set product apart), and anti-features (commonly requested but problematic).

**Must have (table stakes):**
- Clock & date with Berlin timezone — core function of always-on display
- Current weather + 7-day forecast — standard across all dashboard products
- Calendar integration (5 iCal feeds) — primary use case for daily planning
- Responsive layout — wall display (landscape) + mobile (portrait) are different use cases
- Shared grocery list — household coordination staple, prevents duplicate shopping
- Visual timers — kitchen/homework timers visible to whole family
- Family photos/slideshow — emotional value, makes display feel alive vs sterile data

**Should have (competitive differentiators):**
- Travel detection + dual timezone — automatic based on calendar location parsing (already implemented)
- Person-tagged calendar events — emoji badges show whose event at a glance (already implemented)
- Transit departures (BVG) — hyperlocal U2 Senefelderplatz info (already implemented)
- Priority interrupts — active timer or non-empty grocery list takes visual precedence over photos
- Chore tracking — visible accountability for kids' routines + household jobs
- Mobile-first interaction — wall = glanceable, phone = control panel
- Zero-friction access — no login required on home network

**Defer (v2+):**
- Meal planning — scope creep, validate grocery list first
- Allowance/rewards system — parenting methodology overlay, not universal
- Multi-location support — requires authentication system (anti-feature for v1)
- Voice control — complex setup, wait for hardware simplification

**Anti-features to avoid:**
- User authentication for v1 (adds friction, overkill for home network)
- Native mobile app (web app with home screen bookmark sufficient)
- Home Assistant integration (feature creep beyond core value)
- Real-time everything (tuned polling sufficient for weather, calendar)

### Architecture Approach

The recommended architecture follows a **static-site-plus-real-time-database hybrid pattern** serving static HTML/CSS/JS from GitHub Pages CDN while connecting to cloud database (Supabase/Firebase) for shared state only. This delivers free hosting, global CDN, real-time WebSocket updates, and zero server maintenance. The architecture divides screen space into three zones: always-visible panel (clock, weather, transit), rotating content area (calendar, photos, country), and priority interrupt layer (timers, groceries override rotation when active).

**Major components:**
1. **Always Visible Panel** — Clock, weather header, transit departures that never rotate; CSS Grid fixed sections with auto-refresh every 5-15 minutes
2. **Rotating Content Area** — Cycles through calendar → photos → country every 45-60 seconds with fade transitions as main content focus
3. **Priority Interrupt Layer** — Timers and grocery lists take over rotating area when active via conditional rendering and higher z-index
4. **Mobile Control Interface** — Form inputs for managing shared state (add timer, grocery item, assign chore) shown via media queries, touch-optimized
5. **State Manager** — Synchronizes local and remote state, handles offline queue using Service Worker for offline and WebSocket/polling for real-time
6. **API Coordinator** — Fetches external data, caches responses, handles rate limits with exponential backoff and stale-while-revalidate pattern
7. **Memory Monitor** — Prevents memory leaks in 24/7 kiosk mode via periodic page reload (every 6-12 hours) and cleanup of event listeners

**Key architectural patterns:**
- **Responsive Single Codebase** — Same HTML/CSS serves wall kiosk (landscape, no interaction) and mobile phones (portrait, touch controls)
- **Rotating Content with Priority Interrupts** — Efficient screen space use, time-sensitive info always visible
- **Memory Leak Prevention** — Periodic reload at 3am/3pm, WeakMap/WeakSet for caching, subscription cleanup
- **Offline-First with Service Worker** — Cache static assets and API responses, queue writes when offline, sync when restored

### Critical Pitfalls

Research surfaced seven critical pitfalls that must be addressed proactively, with memory leaks and migration risk topping the list.

1. **Memory Leaks in Long-Running Browser Sessions** — Chromium kiosk on Raspberry Pi gradually consumes RAM over 24-48 hours, causing crashes. WebSocket subscriptions accumulate event listeners without cleanup, DOM nodes persist in memory. Prevention: Implement automatic cleanup of subscriptions, use WeakMap/WeakSet for caching, schedule page reloads every 12-24 hours, run Chromium with `--disk-cache-dir=/dev/null` flags. Address in Phase 1 (architecture design with cleanup patterns) and Phase 5+ (monitoring and automatic recovery).

2. **Breaking What Already Works During Migration** — Family relies on working static dashboard daily. Migration introduces bugs, performance regressions, lost trust. The "rewrite curse" where new version never as stable as old. Prevention: Feature parity checklist before starting, run both versions in parallel during migration, keep static version as fallback 2+ weeks after launch, screenshot/video current behavior for visual regression testing, incremental migration one section at a time. Address in Phase 0 (comprehensive documentation) through all migration phases with parallel deployment and rollback capability.

3. **CORS Proxy Single Point of Failure** — Dashboard depends on third-party CORS proxy (calendar-proxy) for Google Calendar feeds. Proxy goes down → calendar disappears. Free proxies are unreliable. Prevention: Self-host proxy on same infrastructure or use serverless function (Cloudflare Workers), implement cache fallback with stale-while-revalidate, consider Google Calendar API with OAuth instead of public iCal feeds. Address in Phase 1 (self-host proxy or serverless) and Phase 2 (caching and fallback strategies).

4. **iCloud Photos Integration Impossibility** — Design assumes iCloud photos can be fetched via web API. Apple provides NO web API for iCloud Photos. Prevention: Research API availability BEFORE committing to feature, use iCloud Shared Albums (limited API via web scraping), alternative iOS Shortcut uploads photos to Supabase, or pivot to Google Photos with actual API. Address in Phase 0 (research/planning) before roadmap commitment.

5. **Real-Time Sync Conflict Resolution Ignored** — Multiple family members edit shared state simultaneously. Last-write-wins causes data loss. Prevention: Design conflict resolution per feature (grocery list merges items, timers last-write-wins acceptable, chores timestamp-based), use Firestore transactions for atomic operations, test with concurrent updates from multiple devices. Address in Phase 2 (define per feature) and Phase 3 (implement and test concurrent editing).

6. **Responsive Design That Works Nowhere** — Design looks perfect on developer's laptop, breaks on wall display (1920x1080 landscape) and iPhone (390px portrait). Prevention: Test on actual hardware from day one (Raspberry Pi + iPhone Safari), define specific breakpoints for actual devices (wall 60px+ touch targets for 2m viewing, phone 44px+ thumb-friendly zones), use container queries and viewport-relative font sizing with clamp(). Address in Phase 1 (design system with responsive patterns) and all feature phases (test every feature on both devices).

7. **Background Tab Disconnects Real-Time Sync** — Mobile browser sends dashboard tab to background, WebSocket disconnects after 3-5 minutes, real-time updates stop. User returns to stale data. Prevention: Implement reconnection with catch-up sync (fetch missed updates), show connection status indicator, force refetch on tab focus/visibility change, use service workers for persistent connections. Address in Phase 2 (reconnection logic) and Phase 3 (handle background tab scenarios).

## Implications for Roadmap

Based on research dependencies and risk mitigation strategies, I recommend a 5-phase roadmap structure that prioritizes foundation and feature parity before adding new capabilities.

### Phase 1: Foundation & Migration Preparation
**Rationale:** Must establish infrastructure and validate approach before touching working features. Research shows memory leaks and migration risk are the top two pitfalls — both require architectural decisions made upfront. Setting up Vite + React + Tailwind + responsive design system now prevents rework later.

**Delivers:** Vite 7 project scaffold, React 19 + TypeScript setup, Tailwind CSS 4 configuration (Vite plugin method), responsive design system with breakpoints for wall display and mobile, GitHub Pages deployment pipeline, PWA configuration (vite-plugin-pwa) for offline support.

**Addresses:**
- Stack: React 19 + Vite 7 + Tailwind CSS 4 + Zustand + date-fns
- Architecture: Static site hosting, responsive layout foundation, memory leak prevention patterns
- Pitfall mitigation: Memory leak prevention (cleanup patterns), responsive design testing framework (real hardware from day one), CORS proxy self-hosting or serverless approach

**Avoids:** Breaking existing features (nothing migrated yet, parallel development), responsive design failures (design system validated before feature work), framework overkill (lightweight stack choices).

**Research flag:** Standard patterns well-documented — skip detailed research.

### Phase 2: Feature Parity Migration
**Rationale:** Migrate all existing working features to new stack before adding new capabilities. This validates the architecture works for known requirements and establishes baseline for performance comparison. Research emphasizes feature parity checklist and parallel deployment to avoid breaking what works.

**Delivers:** Migrated features preserving exact functionality: clock/date (Berlin timezone), weather (Open-Meteo, 7-day forecast), transit (BVG U2 Senefelderplatz), calendar (5 iCal feeds with person-tagged events), travel detection (dual timezone), country of the day, horoscopes. Rotating content system (45-60s intervals). All features tested on Raspberry Pi + iPhone Safari.

**Addresses:**
- Features: Clock, weather, calendar, transit (table stakes already implemented)
- Features: Travel detection, person-tagged events, transit, country, horoscopes (differentiators already implemented)
- Architecture: Always visible panel, rotating content area, API coordinator with caching
- Stack: React Query for API data, date-fns for timezone handling

**Avoids:** Breaking existing features (parallel deployment, feature parity checklist validation), CORS proxy failure (self-hosted or serverless proxy, cache fallback).

**Validation criteria:** Family approves new version matches old functionality, performance within 2x of static version load time, 48-hour soak test on Raspberry Pi with no crashes.

**Research flag:** Standard patterns — skip research. However, monitor CORS proxy and calendar parsing edge cases discovered during migration.

### Phase 3: Real-Time Infrastructure
**Rationale:** Establishes shared state foundation that enables all new features (grocery list, timers, chores). Must come before mobile controls because there's nothing to control without database backend. Research shows Supabase free tier (500MB, 50K MAU) is sufficient, and WebSocket reconnection logic is critical for background tab scenarios.

**Delivers:** Supabase project setup, database schema (timers, groceries, chores tables), WebSocket subscription infrastructure, real-time sync logic with reconnection and catch-up, connection status indicator (connected/reconnecting/offline), offline queue implementation (IndexedDB for write operations during network loss), memory leak prevention for subscriptions (cleanup in component unmount).

**Addresses:**
- Stack: Supabase for real-time database, Zustand for client state management
- Architecture: State manager, real-time sync, offline queue, subscription lifecycle management
- Pitfall mitigation: Real-time sync conflict resolution (design per feature), background tab disconnects (reconnection with catch-up), memory leaks (subscription cleanup)

**Avoids:** Real-time listener per item (single listener on parent collection), no offline handling (IndexedDB queue for writes), subscription memory leaks (cleanup patterns).

**Research flag:** May need phase-specific research for Supabase security rules and schema design for family use case (4 users, no authentication initially).

### Phase 4: Mobile Controls & Grocery List
**Rationale:** First new interactive feature validates mobile-first interaction pattern and real-time sync end-to-end. Grocery list is highest-value household coordination feature (table stakes) with simpler conflict resolution than timers (merge items, no timing dependencies). Validates responsive design for touch interactions.

**Delivers:** Responsive mobile UI with touch-optimized forms (44px+ buttons), grocery list CRUD operations (add/check/uncheck/delete items from mobile), optimistic UI updates with rollback on conflict, grocery list display on wall (item count, pending items), conflict resolution strategy (merge additions, timestamp deletions), mobile breakpoints tested on iPhone Safari.

**Addresses:**
- Features: Shared grocery list (table stakes), mobile-first interaction (differentiator)
- Architecture: Mobile control interface, priority interrupt foundation (show grocery count)
- Stack: React forms with validation, Zustand for optimistic updates
- Pitfall mitigation: Sync conflict resolution (merge strategy for lists), responsive design validation (real hardware testing)

**Avoids:** Tiny touch targets (44px+ sizing), silent failures (toast notifications for save success/failure), no offline indicator (connection status visible).

**Research flag:** Standard patterns — skip research. Grocery list CRUD is well-documented.

### Phase 5: Visual Timers & Priority Interrupts
**Rationale:** Timers complete the household coordination trio (grocery list, timers, chores). Priority interrupts unlock the key differentiator of giving time-sensitive information visual precedence. Timers validate conflict resolution with timing dependencies and test real-time countdown rendering.

**Delivers:** Timer management from mobile (add/cancel with label and duration), countdown display on wall (minutes:seconds, visual prominence), priority interrupt system (timer or grocery list overrides photo rotation when active), timer completion alerts (visual pulse, sound notification), conflict resolution (last-write-wins acceptable for single timer per type), timer presets (quick-start buttons for common durations).

**Addresses:**
- Features: Visual timers (table stakes), priority interrupts (differentiator)
- Architecture: Priority interrupt layer, conditional rendering based on state
- Pitfall mitigation: Conflict resolution for time-sensitive data, memory leaks from countdown intervals

**Avoids:** Polling for timer updates (WebSocket push instant), no confirmation for destructive actions (confirm delete/cancel timer), unoptimized re-renders (React.memo for countdown).

**Research flag:** Standard patterns — skip research. Timer countdown is well-documented React pattern.

### Phase 6: Family Photos & Rotation System
**Rationale:** Photos add emotional value (table stakes for digital display) and complete the rotating content system with priority interrupts. Deferred until after household coordination features to validate API availability and choose photo source (iCloud Shared Albums, Google Photos, or manual upload).

**Delivers:** Photo source integration (API TBD based on validation), photo carousel in rotating content area (30-second intervals), photo caching strategy (serve from CDN, refresh daily), priority interrupt integration (photos hidden when timer active or grocery list >5 items), smooth transitions between rotation screens (fade effects).

**Addresses:**
- Features: Photos/slideshow (table stakes), rotating content system completion
- Architecture: Rotating content area fully functional with all content types
- Stack: Photo storage and CDN (Supabase Storage or alternative)
- Pitfall mitigation: iCloud API unavailable (validated alternative chosen), image optimization (resize/compress before upload), no virtualization for galleries (lazy loading)

**Avoids:** Large data in real-time database (store URLs only, photos in object storage), unoptimized images (WebP format, responsive sizes), loading full gallery history (limit to last 50 photos).

**Research flag:** HIGH PRIORITY — Needs detailed research during Phase 0/1 for iCloud Shared Album API validation. If unavailable, pivot to Google Photos API or iOS Shortcuts automation workflow. This is the biggest technical unknown in the roadmap.

### Phase 7: Chore Tracking & Polish
**Rationale:** Chores complete the household management feature set (differentiator). Deferred until after grocery list and timers validate the mobile control interaction pattern and conflict resolution strategies. Polish phase hardens the system for 24/7 operation.

**Delivers:** Chore management interface (assign daily routines, household jobs), chore completion tracking (checkboxes, timestamps, "who did what when"), chore display on wall (progress indicators), recurring chore logic (daily/weekly schedules), 24/7 hardening (extended soak tests, memory profiling), service worker enhancements (aggressive offline caching), analytics/monitoring setup (error tracking, usage patterns).

**Addresses:**
- Features: Chore tracking (differentiator), zero-maintenance operation (differentiator)
- Architecture: Memory monitor, service worker optimization, all components integrated
- Pitfall mitigation: Memory leaks (48+ hour testing, profiling), "looks done but isn't" checklist validation

**Avoids:** Skip automated tests (critical for 24/7 operation), no logging/monitoring (essential for production debugging), complex navigation on wall display (single-screen design maintained).

**Research flag:** Standard patterns — skip research. Chore tracking is similar to grocery list with recurring logic.

### Phase 8: Optional Enhancements (Post-Launch)
**Rationale:** These features expand scope after validating core household coordination use case. Only pursue if family actively uses grocery list, timers, and chores for 2+ weeks and requests improvements.

**Candidates:**
- Timer presets (quick-start buttons for common durations)
- Photo filters (show only "last 30 days" or "favorites")
- Grocery categories (auto-organize by produce/dairy/pantry)
- Calendar event creation from mobile (quick-add appointments)
- Transit alerts (highlight departures <5 min, show delays)
- Meal planning (weekly menu, recipe links, auto-add ingredients)
- Weather alerts (rain forecast, temperature extremes)

**Research flag:** Feature-dependent — only research when ready to implement specific enhancement.

### Phase Ordering Rationale

The phase structure follows three principles derived from research:

1. **Foundation before features:** Phase 1 establishes infrastructure preventing rework. Memory leak patterns, responsive design system, and offline support must be architected upfront. Research shows 24/7 kiosk operation failures stem from architectural decisions made early.

2. **Validate before expanding:** Phase 2 proves the new stack works for existing features before adding complexity. Phase 3 establishes real-time infrastructure, then Phases 4-5 validate mobile interaction and priority interrupts with single features (grocery list, timers) before expanding to chores. Research emphasizes incremental migration and parallel deployment to avoid breaking what works.

3. **Dependencies drive order:** Real-time infrastructure (Phase 3) must precede mobile controls (Phase 4) because there's nothing to control without database. Timers and priority interrupts (Phase 5) depend on mobile control patterns validated in Phase 4. Photos (Phase 6) deferred until iCloud API validated and other features working. Research revealed clear dependency chains in feature analysis.

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 3 (Real-Time Infrastructure):** Supabase security rules for family use case (4 users, no authentication initially), schema design for optimal real-time performance, WebSocket reconnection strategies on mobile Safari, offline queue conflict resolution patterns. Confidence MEDIUM on enterprise-scale patterns, but family-scale optimization less documented.

- **Phase 6 (Family Photos):** CRITICAL GAP — iCloud Shared Album API availability and authentication from static web app. Research shows Apple provides NO web API for iCloud Photos. Must validate iCloud Shared Album web scraping approach OR pivot to Google Photos API, Dropbox, or iOS Shortcuts automation. This is the biggest technical unknown and could require architectural changes if assumptions are wrong.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** Vite + React + Tailwind setup is extremely well-documented with official guides and examples. GitHub Pages deployment is standard. PWA configuration with vite-plugin-pwa has comprehensive documentation.

- **Phase 2 (Feature Parity):** Migrating static HTML to React components is well-documented. API integration (weather, transit, calendar parsing) follows standard patterns. React Query for data fetching has extensive documentation and examples.

- **Phase 4 (Grocery List):** CRUD operations with real-time sync are standard Supabase patterns. Form validation and optimistic updates are well-documented React patterns.

- **Phase 5 (Timers):** Timer countdown in React has countless examples. Priority interrupt conditional rendering is standard pattern.

- **Phase 7 (Chore Tracking):** Similar to grocery list with recurring logic, well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via official documentation (React 19.2, Vite 7.3, Tailwind 4.1 release blogs). Stack is production-proven for static sites in 2026. Supabase free tier details confirmed. Only MEDIUM on PartyKit free tier specifics (fallback to SSE is HIGH confidence). |
| Features | HIGH | Strong comparative analysis across DAKboard, MagicMirror, Skylight Calendar, Home Assistant. Feature hierarchy (table stakes vs differentiators vs anti-features) validated against multiple competitor products. Brownfield context provides validated existing features. |
| Architecture | HIGH | Static-site-plus-cloud-database hybrid is well-established pattern with extensive documentation. Responsive design patterns, memory leak prevention, and offline-first strategies verified across multiple real-world implementations (Raspberry Pi kiosks, Home Assistant dashboards, PWA case studies). |
| Pitfalls | MEDIUM-HIGH | Top pitfalls sourced from real GitHub issues (Supabase memory leaks, Chromium on Pi crashes, CORS proxy failures) and project-specific context (brownfield migration risk, iCloud limitations). Confidence MEDIUM on some edge cases but HIGH on critical failure modes that others have documented. |

**Overall confidence:** HIGH

The research converged on a well-established architectural pattern (static hosting + real-time database) using mature, actively-maintained technologies (React 19, Vite 7, Supabase). The brownfield context provides validated features and known deployment environment (Raspberry Pi kiosk), reducing uncertainty. Critical pitfalls are well-documented with proven prevention strategies.

### Gaps to Address

1. **iCloud Photos API validation:** Research shows Apple provides NO web API for iCloud Photos. iCloud Shared Albums may have limited scraping-based access, but this needs validation with prototype before committing to Phase 6 roadmap. **Mitigation:** Dedicate spike in Phase 1 to validate iCloud Shared Album access OR choose alternative (Google Photos API, manual upload workflow, iOS Shortcuts automation). Have fallback plan ready before starting photo feature implementation.

2. **Supabase security rules for no-auth family use case:** Research focused on authenticated multi-tenant patterns. Family dashboard is single-tenant on home network with 4 trusted users and no authentication in v1. Need to validate Supabase security rules allowing unauthenticated access restricted by IP/domain. **Mitigation:** Validate in Phase 3 during Supabase setup. Fallback: Add simple PIN authentication if fully open database poses risk.

3. **Raspberry Pi 4 hardware specifications:** Research assumes "Raspberry Pi" without specific model. Memory constraints, Chromium version, and performance characteristics vary significantly between Pi 3, Pi 4 (2GB/4GB/8GB variants), and Pi 5. **Mitigation:** Document actual hardware model during Phase 1. Adjust bundle size budget and memory monitoring thresholds based on actual RAM available.

4. **CORS proxy current implementation details:** Project uses "calendar-proxy" but specifics unclear (self-hosted? third-party? code available?). **Mitigation:** Audit current CORS proxy implementation during Phase 1. If third-party, migrate to self-hosted or serverless (Cloudflare Workers) immediately to eliminate single point of failure.

5. **Mobile Safari WebSocket reconnection behavior:** Research shows background tab disconnection is common across browsers, but mobile Safari specifics (timing, reconnection strategy effectiveness) need validation. **Mitigation:** Test WebSocket reconnection extensively on actual iPhone Safari during Phase 3. Implement fallback to polling if WebSocket proves unreliable.

6. **Family acceptance criteria:** Migration risk is critical, but specific "family approval" criteria undefined. What constitutes acceptable performance? What features are truly non-negotiable? **Mitigation:** Define explicit acceptance criteria with family during Phase 0 before starting migration. Include performance benchmarks (load time, responsiveness), feature parity checklist, and aesthetics (does it feel like an improvement?).

## Sources

### Primary (HIGH confidence)
- [React 19.2 Release Blog](https://react.dev/blog) — Current stable version verification, v19 performance improvements
- [Vite 7.3 Documentation](https://vite.dev/blog) — Current stable version, GitHub Pages deployment, PWA plugin setup
- [Tailwind CSS 4.1 Release Blog](https://tailwindcss.com/blog) — v4 stable, Vite plugin method (NOT PostCSS), Oxide engine
- [Supabase Architecture Documentation](https://supabase.com/docs/guides/getting-started/architecture) — Real-time WebSocket engine, free tier limits (500MB, 50K MAU)
- [vite-plugin-pwa Official Docs](https://vite-pwa-org.netlify.app/) — Service worker setup, Workbox strategies, offline-first patterns
- Project context files — Existing feature validation (calendar, transit, weather implementations)

### Secondary (MEDIUM-HIGH confidence)
- [DAKboard vs MagicMirror comparison 2025](https://smartnmagic.com/blogs/solutions/review-dakboard-vs-magicmirror-in-2025-and-what-sets-them-apart) — Competitor feature analysis
- [Skylight Calendar product details](https://myskylight.com/products/skylight-calendar/) — Consumer digital display features and pricing
- [GitHub: PicoPixl/family-dashboard](https://github.com/PicoPixl/family-dashboard) — Real-world implementation with Vite + React + Express
- [GitHub: stefanthurnherr/family-dashboard](https://github.com/stefanthurnherr/family-dashboard) — Self-hosted dashboard architecture
- [State Management in 2026: Modern Frontend Guide](https://www.elearningsolutions.co.in/state-management-in-2026-2/) — Zustand vs Redux vs Jotai, server state vs UI state separation
- [Raspberry Pi Kiosk Mode Guide](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/) — Official kiosk setup, Chromium configuration
- [Supabase Realtime memory leak issue #1204](https://github.com/supabase/supabase-js/issues/1204) — Long-running WebSocket memory growth documentation
- [Chromium on Raspberry Pi memory issues](https://forums.raspberrypi.com/viewtopic.php?t=296598) — Kiosk mode RAM consumption patterns
- [Mobile Safari background tab WebSocket disconnection](https://github.com/supabase/realtime-js/issues/121) — Browser throttling impact on real-time connections

### Tertiary (MEDIUM confidence, needs validation)
- [PartyKit: Building Real-Time Apps in 2026](https://latestfromtechguy.com/article/partykit-realtime-collaboration-2026) — PartyKit overview, free tier availability (needs verification)
- [iCloud Photos web API limitations](https://discussions.apple.com/thread/255287638) — Community confirmation of API unavailability (needs official Apple confirmation)
- [Server-Sent Events vs WebSockets 2026 Guide](https://www.nimbleway.com/blog/server-sent-events-vs-websockets-what-is-the-difference-2026-guide) — SSE fallback feasibility (needs prototype)
- [Preact vs React performance on Raspberry Pi](https://www.index.dev/skill-vs-skill/frontend-react-vs-preact-vs-solidjs) — Bundle size impact on constrained hardware (needs testing on actual Pi)

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
