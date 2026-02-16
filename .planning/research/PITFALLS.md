# Pitfalls Research

**Domain:** Family Dashboard / Smart Home Display
**Researched:** 2026-02-16
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Memory Leaks in Long-Running Browser Sessions

**What goes wrong:**
Chromium kiosk mode on Raspberry Pi gradually consumes more RAM over 24-48 hours, eventually causing tab crashes and requiring manual restarts. Dashboard applications that work perfectly for hours fail catastrophically after 1-2 days of continuous operation.

**Why it happens:**
- Real-time WebSocket connections (Firebase/Supabase) accumulate event listeners and subscription handlers that aren't properly cleaned up
- Single-page applications don't trigger browser garbage collection like page reloads do
- Image galleries and photo carousels create DOM nodes that persist in memory
- Chromium on ARM hardware (Raspberry Pi) has more aggressive memory management than desktop browsers

**How to avoid:**
- Implement automatic cleanup of WebSocket subscriptions when components unmount
- Use WeakMap/WeakSet for caching to allow garbage collection
- Scheduled page reloads every 12-24 hours via cron job or service worker
- Monitor memory usage and implement thresholds that trigger cleanup
- Run Chromium with `--disk-cache-dir=/dev/null --disk-cache-size=1` flags
- Implement periodic cache cleanup: `rm -rf ~/.cache/chromium/Default/Cache/*`

**Warning signs:**
- RAM usage steadily climbing from 20% to 90%+ over days
- Browser becoming sluggish after 12+ hours
- Tab crashes appearing in console logs
- Chromium low memory warnings in system logs

**Phase to address:**
Phase 1 (Infrastructure Setup) — Design architecture with cleanup patterns from the start. Phase 2 (Core Features) — Implement proper subscription lifecycle management. Phase 5+ (Reliability) — Add monitoring and automatic recovery.

**Sources:**
- [Severe memory leak in latest Chromium - Raspberry Pi Forums](https://forums.raspberrypi.com/viewtopic.php?t=296598)
- [Long running realtime channel results in steady growing memory - Supabase](https://github.com/supabase/supabase-js/issues/1204)
- [Chromium eats up all the RAM - Node-RED Forum](https://discourse.nodered.org/t/chromium-eats-up-all-the-ram/3082)

---

### Pitfall 2: Breaking What Already Works During Migration

**What goes wrong:**
Family relies on working static dashboard daily. Migration introduces bugs, broken features, or performance regressions. Users lose trust and resist future changes. The "rewrite curse" where new version is never as stable as old one.

**Why it happens:**
- jQuery and direct DOM manipulation conflict with React/Vue virtual DOM
- Static HTML loads instantly; framework bundles introduce loading states
- Simple features become complex when forced into framework patterns
- Edge cases in working code are forgotten and not tested in new version
- Different browser behavior between static HTML and SPA routing

**How to avoid:**
- Feature parity checklist: document EVERY current feature before starting
- Run both versions in parallel during migration (A/B toggle)
- Keep static version as fallback for 2+ weeks after launch
- Screenshot/video current behavior for visual regression testing
- Incremental migration: migrate one section at a time, not all-or-nothing
- Performance budget: new version must load within 2x current load time
- Migration acceptance criteria: family approves new version before deprecating old

**Warning signs:**
- Features being skipped as "we'll add that later"
- Performance degrading compared to static version
- More than 2 weeks in migration without showing working replacement
- "It works on my machine" but fails on Raspberry Pi
- Loading spinners appearing where content was instant before

**Phase to address:**
Phase 0 (Pre-migration) — Comprehensive documentation and acceptance criteria. Phase 1-3 (Migration phases) — Parallel deployment with rollback capability. Phase 4 (Post-migration) — Keep static version archived for emergency rollback.

**Sources:**
- [Vue to React Migration: A Step-by-Step Approach](https://www.index.dev/blog/vue-to-react-migration-strategy)
- [Why Prefer Nuxt Over React When Migrating Old Static HTML Websites](https://medium.com/@arhamkhnz/why-prefer-nuxt-over-react-when-migrating-old-static-html-websites-01651f5ecc7b)
- Project context: "Currently working well as static site — risk of breaking what works during upgrade"

---

### Pitfall 3: CORS Proxy Single Point of Failure

**What goes wrong:**
Dashboard depends on third-party CORS proxy (calendar-proxy) for Google Calendar feeds. Proxy goes down, gets rate-limited, or shuts down → calendar disappears from dashboard. Free proxy services are notoriously unreliable.

**Why it happens:**
- Calendar feeds (iCal format) don't support CORS for browser requests
- Free/shared CORS proxies are slow, rate-limited, and unmaintained
- Many free proxy services have deprecated or disappeared entirely
- Self-hosted proxy adds deployment complexity and maintenance burden
- No fallback when proxy fails

**How to avoid:**
- Self-host the CORS proxy on same infrastructure as dashboard
- Implement proxy health checks and automatic failover
- Cache calendar data locally (IndexedDB) with stale-while-revalidate pattern
- Display cached calendar data when proxy is unreachable
- Consider serverless function (Cloudflare Workers, Vercel Edge) instead of dedicated proxy
- Alternative: Use Google Calendar API with OAuth instead of public iCal feeds
- Show proxy health status in admin panel

**Warning signs:**
- Calendar randomly disappearing from dashboard
- Proxy requests taking >5 seconds
- CORS errors in browser console
- Calendar data is stale/outdated
- Dependency on external proxy service not under your control

**Phase to address:**
Phase 1 (Infrastructure) — Self-host proxy or move to serverless. Phase 2 (Core Features) — Implement caching and fallback strategies. Phase 5+ (Reliability) — Health monitoring and alerting.

**Sources:**
- [NewsPanel: CORS proxy deprecated and need to find an alternative - Grafana](https://github.com/grafana/grafana/issues/37841)
- [Exploring CORS, RSS, and Techniques to Bypass Restrictions](https://medium.com/@rahul1ramesh/exploring-cors-rss-and-techniques-to-bypass-restrictions-e6533188243b)
- [CORS Error when attempting to fetch Calendar Feed - Canvas](https://community.canvaslms.com/t5/Canvas-Developers-Group/CORS-Error-when-attempting-to-fetch-Calendar-Feed/m-p/618478)
- Project context: "CORS proxy dependency for Google Calendar feeds"

---

### Pitfall 4: iCloud Photos Integration Impossibility

**What goes wrong:**
Dashboard design assumes iCloud photos can be fetched via web API. Apple provides NO web API for iCloud Photos. Project blocked or requires fundamental redesign. Weeks of development wasted on impossible feature.

**Why it happens:**
- Apple deliberately restricts photo access to native apps only
- No CloudKit API for photo library access
- iCloud web interface is not an API (JavaScript-rendered, not scrapeable)
- Developers assume "if Google Photos has API, iCloud must too"

**How to avoid:**
- Research API availability BEFORE committing to feature
- Alternative approach: Use iCloud Shared Albums (has limited API via web scraping)
- Alternative approach: Native iOS Shortcut uploads photos to Firebase/Supabase
- Alternative approach: Use Google Photos or other service with actual API
- Pivot to "family members manually upload favorite photos" workflow
- Don't promise features dependent on unavailable APIs

**Warning signs:**
- Assuming API exists without checking official documentation
- Finding only unofficial/scraping solutions for major feature
- Third-party libraries with unmaintained code and workarounds
- Community forums full of "this doesn't work" posts

**Phase to address:**
Phase 0 (Research/Planning) — Verify API availability before roadmap commitment. Phase 1 (Architecture) — Design photo feature around available APIs, not wishful thinking.

**Sources:**
- [Accessing iCloud Photos from a Web Application - Apple Community](https://discussions.apple.com/thread/255287638)
- [Access user's iCloud Photo Library from CloudKit Web API - Apple Forums](https://developer.apple.com/forums/thread/74434)
- Project context: "iCloud photo integration (notoriously difficult from web)"

---

### Pitfall 5: Real-Time Sync Conflict Resolution Ignored

**What goes wrong:**
Multiple family members edit shared state (chores, grocery list) simultaneously. Last-write-wins causes data loss. Mom adds milk to grocery list, Dad removes it at same time → one change disappears. Users report "my changes keep disappearing."

**Why it happens:**
- Firebase/Supabase default behavior is last-write-wins
- Developers test with single user, conflicts don't appear
- No conflict resolution strategy designed upfront
- Mobile phone and wall display update simultaneously
- Network latency causes writes to arrive out of order

**How to avoid:**
- Design conflict resolution strategy per feature type:
  - Grocery list: Merge items (never delete without explicit user action)
  - Timers: Last-write-wins acceptable (only one active timer per type)
  - Chores: Timestamp-based with merge (show who did what when)
- Use Firestore transactions for atomic operations
- Optimistic UI updates with rollback on conflict
- Version vectors or Operational Transformation for complex shared state
- Test with concurrent updates from multiple devices
- Log conflicts for monitoring/debugging

**Warning signs:**
- Users complaining about "lost changes"
- Race conditions in testing with multiple browsers
- Database writes without transactions
- No timestamp or version tracking on shared documents
- Features designed assuming single writer

**Phase to address:**
Phase 2 (Core Features) — Define conflict resolution per feature. Phase 3 (Multi-User) — Implement and test concurrent editing. Phase 5+ (Reliability) — Monitor conflicts and refine strategies.

**Sources:**
- [Data Synchronization in PWAs: Offline-First Strategies](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [RxDB realtime Sync Engine - Conflict Resolution](https://rxdb.info/replication.html)
- [Racer: Realtime model synchronization with Operational Transformation](https://github.com/derbyjs/racer)

---

### Pitfall 6: Responsive Design That Works Nowhere

**What goes wrong:**
Design looks perfect on developer's laptop (1440px). Breaks on wall display (1920x1080 in landscape) and iPhone (390px portrait). Text too small, buttons unreachable, layouts collapsed. Family can't use it on their devices.

**Why it happens:**
- Designing for "average" screen size that doesn't match actual devices
- Testing only in browser DevTools, not on real Raspberry Pi + iPhone
- Assuming portrait orientation for mobile (wall display is landscape)
- Fixed pixel sizes instead of relative units
- Breakpoints optimized for standard devices, not wall displays

**How to avoid:**
- Test on actual target hardware from day one (Raspberry Pi + iPhone Safari)
- Define specific breakpoints for actual devices:
  - Wall display: 1920x1080 landscape, touch targets 60px+, view from 2m distance
  - iPhone: 390x844 portrait, touch targets 44px+, thumb-friendly zones
- Use container queries (not just media queries) for component responsiveness
- Font sizes scaled by viewport: `clamp()` with rem/em units
- Critical content visible without scrolling on both devices
- Touch targets sized for fingers (48-60px minimum), not mouse pointers

**Warning signs:**
- Only testing in Chrome DevTools responsive mode
- "Looks good on my screen" without specifying which screen
- Fixed pixel values everywhere (px instead of rem/em/%)
- Horizontal scrolling on any device
- Text requiring zoom to read on either device
- Buttons too small to tap reliably

**Phase to address:**
Phase 1 (Infrastructure) — Establish design system with responsive patterns. Phase 2-4 (All feature phases) — Test every feature on both devices. Phase 5+ (Polish) — Refinement based on family usage patterns.

**Sources:**
- [What is the Ideal Screen Size for Responsive Design - BrowserStack](https://www.browserstack.com/guide/ideal-screen-sizes-for-responsive-design)
- [Common Screen Resolutions in 2026: Mobile, Desktop & Tablet](https://www.browserstack.com/guide/common-screen-resolutions)
- [How to Optimize Screen Sizes for Responsive Design - Mailchimp](https://mailchimp.com/resources/screen-sizes-for-responsive-design/)
- Project context: "Responsive design for very different form factors (large wall display vs phone)"

---

### Pitfall 7: Background Tab Disconnects Real-Time Sync

**What goes wrong:**
Mobile browser sends dashboard tab to background. WebSocket disconnects after 3-5 minutes. Real-time updates stop working. User returns to stale data, makes changes based on outdated state → conflicts.

**Why it happens:**
- Mobile browsers aggressively throttle background tabs to save battery
- Supabase/Firebase WebSocket connections drop when tab loses focus
- Browser sleep mode disconnects network entirely
- Automatic reconnection loses updates that occurred during disconnect
- No indication to user that they're viewing stale data

**How to avoid:**
- Implement reconnection with catch-up sync (fetch missed updates)
- Show connection status indicator (connected/reconnecting/offline)
- Force refetch on tab focus/visibility change
- Use service workers for persistent connections (PWA approach)
- Cache last known state, show staleness indicator if too old
- Consider polling fallback when WebSocket unavailable
- Design features to work with eventual consistency (not requiring instant sync)

**Warning signs:**
- Real-time features only work when tab is active
- No reconnection logic implemented
- WebSocket errors in console when returning from background
- Users reporting "out of date" data after leaving app
- Testing only with app in foreground

**Phase to address:**
Phase 2 (Core Features) — Implement reconnection and sync catch-up. Phase 3 (Multi-Device) — Handle background tab scenarios. Phase 5+ (Reliability) — Connection status monitoring.

**Sources:**
- [Realtime websocket loses connection regularly when browser tab goes to background - Supabase](https://github.com/supabase/realtime-js/issues/121)
- [How to obtain reliable realtime updates in the real world - Supabase](https://github.com/orgs/supabase/discussions/5641)
- [Best way to prevent supabase real-time from dying?](https://www.answeroverflow.com/m/1402375783942590525)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip automated tests | Ship features faster | Regressions in production, fear of refactoring | Never — family depends on this 24/7 |
| Hard-code API keys in frontend | Avoid backend setup | Keys exposed in source, security risk | Never — Firebase/Supabase keys should use domain restrictions only |
| No error boundaries | Simpler code | Entire app crashes from single component error | Never — dashboard must degrade gracefully |
| Polling instead of real-time | Simpler implementation | Higher latency, more bandwidth, more server load | Acceptable for non-critical features (weather updates) |
| No caching strategy | Faster initial development | Slow loads, high API costs, offline unusable | Never — wall display must show something even when APIs fail |
| Skip accessibility | Faster UI development | Unusable for family members with visual/motor impairments | Never — family members of all abilities should use it |
| No logging/monitoring | Avoid infrastructure complexity | Impossible to debug production issues | Acceptable in MVP, critical by Phase 3 |
| Inline styles instead of design system | Quick prototyping | Inconsistent UI, hard to maintain, large bundle | Acceptable in Phase 1, must refactor by Phase 3 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Calendar iCal | Trusting public CORS proxies | Self-host proxy OR use Google Calendar API with OAuth |
| Firebase/Supabase real-time | Not cleaning up subscriptions | Unsubscribe in component cleanup (useEffect return function) |
| OpenWeatherMap API | Hitting rate limits with frequent polling | Cache for 10+ minutes, weather doesn't change that fast |
| iCloud Photos | Assuming web API exists | Use alternative (Google Photos, manual upload, or iOS Shortcuts automation) |
| Raspberry Pi Chromium | Running without resource limits | Use kiosk flags (`--disk-cache-dir=/dev/null`), scheduled restarts, cache cleanup |
| Safari iOS | Assuming Chrome feature parity | Test touch events, WebSocket reconnection, background tab behavior |
| Home Assistant | Assuming real-time updates work | Implement polling fallback, handle connection errors gracefully |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Real-time listener per list item | Memory usage grows with data | Single listener on parent collection, filter in UI | 50+ items in grocery list/chores |
| Loading full calendar history | Slow initial load, large memory | Limit query to ±30 days, paginate older events | >500 calendar events |
| No image optimization | Slow load, high bandwidth | Resize/compress before upload, use WebP, lazy load | Photo gallery >10 images |
| Fetching weather every minute | API rate limits, unnecessary load | Cache 10+ minutes, weather changes slowly | Immediate (wastes API quota) |
| Large bundle size | Slow load on Raspberry Pi | Code splitting, tree shaking, analyze bundle | Bundle >500KB parsed |
| No virtualization for lists | UI lag with many items | Virtual scrolling for >50 items | 100+ list items |
| Unoptimized re-renders | UI jank, high CPU | React.memo, useMemo, useCallback for expensive components | 20+ components re-rendering frequently |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public Firebase/Supabase with no rules | Anyone can read/write all family data | Implement security rules, require authentication |
| API keys in frontend code | Keys stolen from source code/bundles | Use domain restrictions, backend proxy for sensitive APIs |
| No authentication on dashboard | Anyone on network can access/modify | Add simple password/PIN for admin features, consider Google Sign-In |
| Storing sensitive data in localStorage | XSS can steal data | Use httpOnly cookies, or encrypt before storing |
| No HTTPS in production | Man-in-the-middle attacks | Always use HTTPS (required for service workers anyway) |
| Embedding credentials in calendar URLs | Credentials visible in browser history/logs | Use short-lived tokens, OAuth, or separate auth layer |
| No rate limiting | Abuse of admin features | Implement client-side throttling, server-side rate limits |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No offline indicator | Users think it's working but changes don't save | Clear "Offline" badge, disable edit actions |
| Silent failures | Changes appear to work but don't persist | Toast notifications for save success/failure |
| No loading states | Feels broken when APIs are slow | Skeleton screens, spinners, optimistic updates |
| Tiny touch targets on wall display | Can't tap buttons from distance | 60px+ buttons, large spacing, high contrast |
| Auto-refresh without warning | Discards in-progress edits | Warn before refresh, save drafts, smart merge |
| No confirmation for destructive actions | Accidental deletion of tasks/groceries | Confirm delete, undo option, soft delete with recovery |
| Complex navigation on wall display | Hard to use while cooking/busy | Single-screen design, minimal interactions, voice control consideration |
| No dark/light mode consideration | Blinding at night, hard to see during day | Auto dark mode at night, high contrast in bright rooms |

## "Looks Done But Isn't" Checklist

- [ ] **Real-time sync:** Handles reconnection after network loss — verify disconnect/reconnect doesn't lose data
- [ ] **Touch targets:** Actually usable from 2 meters away on wall display — test with non-developer family members
- [ ] **Memory leaks:** Runs for 48+ hours without RAM issues — verify with extended testing on Raspberry Pi
- [ ] **Error handling:** Gracefully handles API failures — verify by blocking network in DevTools
- [ ] **Responsive design:** Works on actual iPhone Safari, not just DevTools — verify on real device
- [ ] **Background tabs:** Reconnects properly when mobile app returns from background — verify by switching apps
- [ ] **Conflict resolution:** Multiple simultaneous edits don't lose data — verify with two devices editing same item
- [ ] **Accessibility:** Keyboard navigable, screen reader compatible — verify with actual assistive tech
- [ ] **Offline functionality:** Shows cached data when network is down — verify airplane mode behavior
- [ ] **Performance:** Loads in <3s on Raspberry Pi 4 — verify on actual hardware, not development machine
- [ ] **Cache invalidation:** Stale data refreshes appropriately — verify after calendar/weather changes
- [ ] **Cross-browser:** Works in Safari iOS, not just Chrome — verify WebSocket, CSS, and JavaScript compatibility

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leak in production | LOW | Add scheduled page reload via cron (temporary), refactor subscription cleanup (permanent) |
| Breaking existing features | MEDIUM | Restore static version from Git, identify regression, fix in new version, redeploy |
| CORS proxy down | LOW | Switch to cached calendar data, fix/replace proxy, redeploy |
| iCloud photos not working | HIGH | Redesign photo feature for available API (Google Photos), migrate workflows |
| Data loss from conflicts | MEDIUM | Restore from database backups if available, implement conflict resolution, add logging |
| Unresponsive on target devices | MEDIUM | Performance profiling on real hardware, optimize bundle size, reduce re-renders |
| WebSocket disconnects | LOW | Implement reconnection logic, add status indicator, test background scenarios |
| Authentication exposed | HIGH | Rotate API keys, add security rules, audit access logs, implement proper auth |
| Bundle too large | MEDIUM | Code splitting, tree shaking, analyze with webpack-bundle-analyzer, lazy loading |
| No offline functionality | MEDIUM | Add service worker, IndexedDB caching, implement offline-first patterns |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Memory leaks | Phase 1 (Architecture) + Phase 5 (Monitoring) | 48-hour soak test on Raspberry Pi, memory profiling |
| Breaking existing features | Phase 0 (Documentation) + All phases | Feature parity checklist, parallel deployment, family acceptance |
| CORS proxy failure | Phase 1 (Infrastructure) | Proxy health checks, cache fallback, offline functionality |
| iCloud API unavailable | Phase 0 (Research/Planning) | API documentation verification, prototype before commitment |
| Sync conflicts | Phase 2 (Core Features) + Phase 3 (Multi-Device) | Concurrent edit testing with multiple devices |
| Responsive design failures | Phase 1 (Design System) + All phases | Test every feature on real Raspberry Pi + iPhone Safari |
| Background tab disconnects | Phase 2 (Real-time features) + Phase 3 (Multi-Device) | Background tab testing, connection status monitoring |
| Performance degradation | Phase 1 (Infrastructure) + All phases | Performance budget, real hardware testing, bundle analysis |
| Security vulnerabilities | Phase 1 (Infrastructure) + Phase 4 (Security) | Security rules, authentication, code audit |
| Poor UX feedback | Phase 2-4 (All feature phases) | User testing with family, error handling verification |

---

*Pitfalls research for: Family Dashboard / Smart Home Display (Brownfield Migration)*
*Researched: 2026-02-16*
*Confidence: MEDIUM-HIGH based on WebSearch (community forums, GitHub issues, technical blogs) with project-specific context*
