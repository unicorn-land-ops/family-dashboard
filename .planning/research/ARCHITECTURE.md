# Architecture Research

**Domain:** Family dashboard with real-time shared state
**Researched:** 2026-02-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                             │
│  (Responsive Components - Wall Kiosk + Mobile Interactive)           │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────┤
│  Always      │  Rotating    │  Priority    │  Mobile      │  Status │
│  Visible     │  Content     │  Interrupt   │  Controls    │  Bar    │
│              │              │              │              │         │
│  • Clock     │  • Calendar  │  • Timers    │  • Timer     │ Last    │
│  • Weather   │  • Photos    │  • Grocery   │    Manager   │ Refresh │
│  • Transit   │  • Country   │    List      │  • Chore     │ Icons   │
│              │              │              │    Manager   │         │
│              │              │              │  • Grocery   │         │
│              │              │              │    List      │         │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────┘
         ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         STATE LAYER                                  │
│  (Local State + Real-time Sync)                                      │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ Display State  │  │  Shared State  │  │  Cache State   │         │
│  │                │  │                │  │                │         │
│  │ • Rotation idx │  │ • Timers       │  │ • Weather data │         │
│  │ • View mode    │  │ • Groceries    │  │ • Calendar     │         │
│  │ • Last refresh │  │ • Chores       │  │ • Transit      │         │
│  │                │  │                │  │ • Country      │         │
│  │                │  │ • Photos URLs  │  │                │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│         ↓                   ↓                     ↓                  │
│    localStorage      Realtime Sync          sessionStorage          │
└─────────────────────────────────────────────────────────────────────┘
         ↓                   ↓                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA SOURCE LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │   External   │   │   Real-time  │   │    Static    │            │
│  │     APIs     │   │   Database   │   │    Assets    │            │
│  │              │   │              │   │              │            │
│  │ • Weather    │   │ Supabase/    │   │ • HTML/CSS   │            │
│  │ • BVG        │   │ Firebase:    │   │ • App logic  │            │
│  │ • Calendar   │   │  - Timers    │   │ • Images     │            │
│  │ • Country    │   │  - Groceries │   │              │            │
│  │ • Horoscope  │   │  - Chores    │   │              │            │
│  │ • iCloud     │   │  - Photos    │   │              │            │
│  └──────────────┘   └──────────────┘   └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Always Visible Panel** | Clock, weather header, transit departures - never rotates | CSS Grid fixed top/left sections, auto-refresh every 5-15 min |
| **Rotating Content Area** | Cycles through calendar, photos, country - main content focus | JavaScript interval rotation (30-60s), fade transitions |
| **Priority Interrupt Layer** | Timers & grocery list take over rotating area when active | Conditional rendering, higher z-index, pulse/notification animations |
| **Mobile Control Interface** | Form inputs for managing shared state (add timer, grocery item, assign chore) | Media queries show/hide, touch-optimized buttons (44px min) |
| **Status Bar** | Last refresh indicators, connection status | Small icons, minimal UI, debug info hidden by default |
| **State Manager** | Synchronizes local and remote state, handles offline queue | Service Worker for offline, WebSocket/polling for real-time |
| **API Coordinator** | Fetches external data, caches responses, handles rate limits | Fetch API with error handling, exponential backoff, stale-while-revalidate |
| **Memory Monitor** | Prevents memory leaks in 24/7 kiosk mode | Periodic page reload (every 6-12 hours), cleanup event listeners |

## Recommended Project Structure

```
family-dashboard/
├── index.html                 # Single-file entry point (GitHub Pages root)
├── src/
│   ├── components/           # UI component modules
│   │   ├── always-visible/   # Non-rotating sections
│   │   │   ├── clock.js      # Time/date display with auto-update
│   │   │   ├── weather.js    # Current weather + forecast
│   │   │   └── transit.js    # BVG departures
│   │   ├── rotating/         # Content carousel
│   │   │   ├── calendar.js   # Daily schedule from iCal
│   │   │   ├── photos.js     # iCloud shared album display
│   │   │   └── country.js    # Country of the day facts
│   │   ├── interrupts/       # Priority overlays
│   │   │   ├── timers.js     # Active countdown timers
│   │   │   └── groceries.js  # Shopping list display
│   │   └── controls/         # Mobile-only interactive forms
│   │       ├── timer-form.js      # Add/delete timers
│   │       ├── grocery-form.js    # Manage shopping list
│   │       └── chore-manager.js   # Assign/complete chores
│   ├── state/               # State management
│   │   ├── sync.js          # Real-time database sync (Supabase client)
│   │   ├── local.js         # localStorage wrapper for display state
│   │   └── cache.js         # API response caching (sessionStorage)
│   ├── api/                 # External data fetchers
│   │   ├── weather.js       # Open-Meteo integration
│   │   ├── transit.js       # BVG REST API
│   │   ├── calendar.js      # iCal parser (CORS proxy)
│   │   ├── country.js       # restcountries.com
│   │   ├── horoscope.js     # Horoscope API
│   │   └── photos.js        # iCloud shared album (TBD method)
│   ├── utils/               # Shared utilities
│   │   ├── rotation.js      # Content carousel logic
│   │   ├── refresh.js       # Memory leak prevention (periodic reload)
│   │   └── responsive.js    # Breakpoint detection, orientation changes
│   └── styles/              # CSS modules (or inline in HTML initially)
│       ├── layout.css       # Grid system, responsive breakpoints
│       ├── components.css   # Component-specific styles
│       └── animations.css   # Transitions, pulse effects
├── service-worker.js        # Offline-first caching, background sync
└── manifest.json            # PWA manifest (optional for mobile install)
```

### Structure Rationale

- **Single HTML entry point:** GitHub Pages static hosting - keep initial load simple, bundle JS/CSS later if needed
- **Component modularity:** Each feature (weather, timer, etc.) is self-contained for easier testing and refactoring
- **State separation:** Display state (rotation index) vs. shared state (timers) vs. cached data (weather) have different lifecycles
- **API isolation:** External services wrapped in modules for easy mocking and error handling
- **Mobile-first controls:** Touch-optimized forms hidden on desktop, shown on mobile via media queries

## Architectural Patterns

### Pattern 1: Static Site + Real-time Database Hybrid

**What:** Serve static HTML/CSS/JS from GitHub Pages CDN, connect to cloud database (Supabase/Firebase) for shared state only

**When to use:** Need real-time sync across devices but want zero-cost hosting and no server maintenance

**Trade-offs:**
- ✅ Free hosting (GitHub Pages) + generous free tier (Supabase: 500MB, Firebase: Spark plan)
- ✅ Global CDN for fast static asset delivery
- ✅ Real-time WebSocket updates for timers, groceries, chores
- ✅ No server to maintain or deploy
- ⚠️ Cold start latency on Supabase free tier (acceptable for family use)
- ⚠️ Must design for offline-first (static site continues working if database unavailable)

**Example:**
```javascript
// src/state/sync.js - Real-time sync with Supabase
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to timer changes across all devices
export function subscribeToTimers(callback) {
  return supabase
    .channel('timers')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'timers' },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// Add timer from mobile device
export async function addTimer(label, durationMinutes) {
  const { data, error } = await supabase
    .from('timers')
    .insert([{ label, duration_minutes: durationMinutes, started_at: new Date() }])

  if (error) throw error
  return data
}
```

### Pattern 2: Rotating Content with Priority Interrupts

**What:** Main display area cycles through calendar → photos → country, but timers/groceries take over when active

**When to use:** Limited screen space, need to show multiple content types but prioritize time-sensitive information

**Trade-offs:**
- ✅ Makes efficient use of wall display real estate
- ✅ Family always sees important info (timers) even if they don't interact
- ✅ Prevents "banner blindness" by rotating engaging content
- ⚠️ Can miss content if rotation too fast (30-60s minimum per screen)
- ⚠️ Need smooth transitions to avoid jarring experience

**Example:**
```javascript
// src/utils/rotation.js - Content carousel with priority override
const ROTATION_ORDER = ['calendar', 'photos', 'country']
const ROTATION_INTERVAL_MS = 45000 // 45 seconds

export class ContentRotator {
  constructor() {
    this.currentIndex = 0
    this.intervalId = null
  }

  start() {
    this.show(ROTATION_ORDER[this.currentIndex])
    this.intervalId = setInterval(() => {
      if (!hasPriorityInterrupt()) { // Check if timers or groceries active
        this.currentIndex = (this.currentIndex + 1) % ROTATION_ORDER.length
        this.show(ROTATION_ORDER[this.currentIndex])
      }
    }, ROTATION_INTERVAL_MS)
  }

  show(contentType) {
    // Hide all sections, show target section with fade transition
    document.querySelectorAll('.rotating-content').forEach(el => el.classList.remove('active'))
    document.getElementById(`${contentType}-section`).classList.add('active')
  }
}

function hasPriorityInterrupt() {
  const activeTimers = document.querySelectorAll('.timer.active').length
  const groceryItems = document.querySelectorAll('.grocery-item.unchecked').length
  return activeTimers > 0 || groceryItems > 5 // Show groceries if list > 5 items
}
```

### Pattern 3: Responsive Single Codebase (Adaptive Components)

**What:** Same HTML/CSS serves wall kiosk (landscape, no interaction) and mobile phones (portrait, touch controls)

**When to use:** Avoid maintaining separate codebases, users access from different form factors

**Trade-offs:**
- ✅ One codebase to maintain
- ✅ Consistent data/state across devices
- ✅ Easier to add features (write once, works everywhere)
- ⚠️ CSS complexity increases (many breakpoints, conditional visibility)
- ⚠️ Must test on both landscape tablets and portrait phones

**Example:**
```css
/* src/styles/layout.css - Responsive grid system */

/* Desktop/Wall Display (landscape, 1024px+ width) */
.container {
  display: grid;
  grid-template-areas:
    "clock    weather  weather"
    "transit  content  content"
    "transit  content  content";
  grid-template-columns: 300px 1fr 1fr;
  grid-template-rows: auto 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.mobile-controls { display: none; } /* Hidden on wall display */

/* Mobile (portrait, <768px width) */
@media (max-width: 768px) and (orientation: portrait) {
  .container {
    grid-template-areas:
      "clock"
      "weather"
      "content"
      "controls";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
  }

  .transit-section { display: none; } /* Too detailed for small screen */
  .mobile-controls { display: block; } /* Show add timer/grocery buttons */
}

/* Tablet (landscape, 768-1024px) */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .container {
    grid-template-areas:
      "clock   weather content"
      "transit content content";
    grid-template-columns: 250px 300px 1fr;
  }
}
```

### Pattern 4: Memory Leak Prevention (24/7 Kiosk Hardening)

**What:** Periodic full page reload + event listener cleanup to prevent browser memory accumulation

**When to use:** Dashboard runs continuously in kiosk mode for days/weeks without manual intervention

**Trade-offs:**
- ✅ Prevents out-of-memory crashes on resource-constrained devices (Raspberry Pi)
- ✅ Forces fresh API data fetches, clears stale connections
- ✅ Simple to implement (reload every 6-12 hours)
- ⚠️ Brief interruption during reload (choose off-peak time, e.g., 3am)
- ⚠️ Loses any in-memory state not persisted to localStorage

**Example:**
```javascript
// src/utils/refresh.js - Memory leak prevention
const RELOAD_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours

export function schedulePeriodicReload() {
  // Reload at 3am and 3pm local time to minimize disruption
  const now = new Date()
  const next3am = new Date(now)
  next3am.setHours(3, 0, 0, 0)
  if (next3am < now) next3am.setDate(next3am.getDate() + 1)

  const msUntil3am = next3am - now

  setTimeout(() => {
    console.log('Scheduled reload to prevent memory leaks')
    location.reload()
  }, msUntil3am)
}

// Clean up event listeners before unmount (if using framework)
export function cleanupEventListeners() {
  // Remove all custom event listeners to prevent leaks
  document.querySelectorAll('.interactive').forEach(el => {
    el.replaceWith(el.cloneNode(true)) // Nuclear option: replace node
  })
}
```

### Pattern 5: Offline-First with Service Worker

**What:** Cache static assets and API responses locally, queue writes when offline, sync when connection restored

**When to use:** Want dashboard to work even if internet drops, or during cloud database maintenance

**Trade-offs:**
- ✅ Dashboard stays functional during Wi-Fi outages
- ✅ Faster load times (serve from cache)
- ✅ Can add timers offline, sync when online
- ⚠️ Service worker complexity (caching strategies, version management)
- ⚠️ Potential for stale data if cache invalidation not handled properly

**Example:**
```javascript
// service-worker.js - Offline-first caching
const CACHE_NAME = 'family-dashboard-v1'
const STATIC_ASSETS = ['/index.html', '/styles.css', '/app.js']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

// Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.pathname.startsWith('/api/')) {
    // Network-first with 3-second timeout fallback to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request)) // Offline fallback
    )
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    )
  }
})
```

## Data Flow

### Request Flow (External APIs)

```
[User views dashboard]
    ↓
[Clock updates every second] → [Display layer re-renders time]
    ↓
[Weather component checks cache]
    ↓
[If cache expired (>15 min old)]
    ↓
[Fetch Open-Meteo API] → [Parse JSON response] → [Update cache] → [Render weather]
    ↓
[If cache valid]
    ↓
[Render from cache immediately]
```

### State Management (Shared State)

```
[Mobile device: User adds timer "Pizza - 12 minutes"]
    ↓
[Timer form submits] → [API call to Supabase INSERT]
    ↓
[Supabase broadcasts change via WebSocket]
    ↓
[All connected clients receive update]
    ↓
[Wall display: Timer appears in interrupt layer]
[Mobile display: Confirmation + updated list]
    ↓
[Every second: Timer component decrements countdown]
    ↓
[When timer reaches 0:00]
    ↓
[Visual alert: Pulse animation, sound notification]
[Mark timer complete in database]
```

### Key Data Flows

1. **Cold start flow:** Page load → Check localStorage for display state → Restore rotation index → Fetch all API data in parallel → Subscribe to Supabase real-time → Render initial view
2. **Rotation flow:** Every 45s → Check for priority interrupts (timers/groceries) → If none, advance rotation index → Save to localStorage → Fade transition to next content screen
3. **Real-time sync flow:** Device A adds grocery item → Supabase INSERT → WebSocket broadcast → Device B receives event → Update local grocery list state → Re-render grocery UI
4. **Offline queue flow:** No internet → User adds chore on mobile → Queue write in IndexedDB → Show optimistic UI update → When connection restored → Replay queued writes → Sync database
5. **Memory cleanup flow:** Every 6 hours → Save current state to localStorage → window.location.reload() → Restore state from localStorage → Resume normal operation

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1 family (4 devices)** | Current architecture is perfect - Supabase free tier (500MB, 50K monthly active users), GitHub Pages free hosting, no optimization needed |
| **10 families (~40 devices)** | Still on free tier, but consider adding analytics (PostHog/Plausible) to monitor usage patterns, may need CDN caching for iCloud photos |
| **100+ families** | Supabase Pro tier ($25/mo for 8GB, 100K users), implement rate limiting on API endpoints, consider batching real-time updates instead of per-item broadcasts |

### Scaling Priorities

1. **First bottleneck: iCloud photo fetching** — If using a server proxy for iCloud photos, this will hit rate limits first. Mitigation: Cache photos in Supabase Storage, only refresh daily, serve via CDN.
2. **Second bottleneck: Real-time connection limits** — Supabase free tier has connection limits. Mitigation: Use long polling fallback instead of persistent WebSocket if >50 concurrent devices.

## Anti-Patterns

### Anti-Pattern 1: Polling Instead of Real-Time Subscriptions

**What people do:** Check database every 5 seconds for timer updates: `setInterval(() => fetchTimers(), 5000)`

**Why it's wrong:**
- Wastes bandwidth (most polls return no changes)
- Adds 5-second lag to updates (user adds timer on phone, wall display takes 0-5s to show it)
- Hits API rate limits unnecessarily

**Do this instead:** Use WebSocket subscriptions (Supabase Realtime, Firebase onSnapshot) so updates push instantly to all devices. Only fall back to polling if connection drops.

### Anti-Pattern 2: Storing Large Data in Real-Time Database

**What people do:** Store full-resolution family photos (5MB each) directly in Supabase/Firebase database

**Why it's wrong:**
- Blows through free tier storage limits (500MB on Supabase)
- Slow to sync large binary blobs over WebSocket
- Expensive bandwidth costs if photos change frequently

**Do this instead:** Store photos in object storage (Supabase Storage, Firebase Storage, Cloudinary) and only store URLs in the real-time database. Database holds small metadata (`{id: 1, url: 'https://cdn.../photo.jpg', uploaded_at: '...'}`).

### Anti-Pattern 3: No Offline Handling

**What people do:** Assume internet is always available, show error message if API fails

**Why it's wrong:**
- Dashboard becomes useless during Wi-Fi outages
- Lost user actions (add timer → internet drops → data lost)
- Poor user experience on unreliable connections

**Do this instead:** Implement offline-first with service worker caching for static assets, IndexedDB queue for write operations, graceful degradation (show last cached data + "offline" indicator).

### Anti-Pattern 4: Framework Overkill for Simple Dashboard

**What people do:** "Let's use React + Redux + TypeScript + Webpack + Next.js for a family dashboard"

**Why it's wrong:**
- Massive bundle size (React 42KB gzipped + framework overhead)
- Complexity doesn't match problem (displaying timers and weather isn't complex state management)
- Build step required for every change (slows iteration)
- Memory overhead in kiosk mode (framework abstractions accumulate)

**Do this instead:** Start with vanilla JavaScript modules, HTML, CSS. If state management gets complex (>500 lines of state logic), upgrade to lightweight library (Preact 3KB, Alpine.js 15KB, Lit 5KB). Only use React/Vue if building many interactive components.

### Anti-Pattern 5: Ignoring Memory Leaks in Kiosk Mode

**What people do:** Deploy dashboard, leave it running 24/7, wonder why Raspberry Pi crashes after 3 days

**Why it's wrong:**
- Event listeners accumulate (each rotation/timer creates listeners that aren't cleaned up)
- DOM nodes held in memory even after removal
- WebSocket connections leak memory over time
- Browser heap grows until out-of-memory crash

**Do this instead:** Implement periodic page reload (every 6-12 hours), use weak references for event listeners where possible, monitor memory usage in development (Chrome DevTools Memory Profiler), clean up timers/intervals on component unmount.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Open-Meteo (Weather)** | REST API, fetch every 15 minutes, cache in sessionStorage | Free, no API key, CORS-friendly, includes sunrise/sunset |
| **BVG (Transit)** | REST API, fetch every 2 minutes, use v6.bvg.transport.rest | Free, no API key, returns real-time departures for stop ID |
| **Google Calendar** | iCal feed via CORS proxy (corsproxy.io or allorigins.win) | Parse iCal text format (VEVENT blocks), cache daily |
| **restcountries.com** | REST API, fetch once daily, deterministic country selection by date | Free, comprehensive country data, no API key |
| **Horoscope API** | REST API, fetch once daily for each family member's sign | Free, simple JSON response |
| **iCloud Shared Album** | TBD - requires Apple ID authentication or public shared link scraping | Research needed: icloud-shared-album npm package or manual parsing |
| **Supabase (Database)** | WebSocket subscription for real-time, REST for CRUD operations | Free tier: 500MB, 50K MAU, 2GB bandwidth/day |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Component ↔ State Manager** | Event-driven (CustomEvent) + direct function calls | Components dispatch events (`timer-added`), state manager updates database + local state |
| **State Manager ↔ Supabase** | WebSocket (real-time subscriptions) + REST (CRUD) | Subscribe to table changes, INSERT/UPDATE/DELETE via Supabase client |
| **API Module ↔ Cache** | Direct function calls (check cache → fetch → update cache) | Cache layer wraps all API calls with stale-while-revalidate logic |
| **Rotating Content ↔ Priority Interrupt** | Conditional rendering based on state | Check `hasActiveTimers()` before showing next rotation screen |
| **Wall Display ↔ Mobile Controls** | Shared Supabase state (no direct communication) | Mobile writes to DB → Wall subscribes to changes |

## Build Order Implications

### Phase 1: Foundation (Static Display)
**What to build:** Single HTML file with clock, weather, transit, calendar - all read-only, no database yet

**Dependencies:** None - pure frontend, existing APIs work

**Validates:** Basic layout responsive design, API integrations, content rotation logic

### Phase 2: Real-Time Infrastructure
**What to build:** Supabase setup, database schema (timers, groceries, chores tables), WebSocket subscription logic

**Dependencies:** Phase 1 complete (need UI to display real-time data)

**Validates:** Real-time sync across devices, offline queue, connection error handling

### Phase 3: Mobile Controls
**What to build:** Interactive forms for adding timers, managing groceries, assigning chores - mobile-only UI

**Dependencies:** Phase 2 complete (need database backend to write to)

**Validates:** Touch UX, form validation, optimistic UI updates

### Phase 4: Priority Interrupts + Photos
**What to build:** Timer countdown display, grocery list interrupt, iCloud photo carousel

**Dependencies:** Phase 3 complete (need timers/groceries in database to trigger interrupts)

**Validates:** Visual priority system, photo fetching/caching, smooth transitions

### Phase 5: Hardening for 24/7 Operation
**What to build:** Service worker, memory leak prevention, offline mode, analytics/monitoring

**Dependencies:** Phases 1-4 complete (need stable feature set before optimizing)

**Validates:** Multi-day uptime, graceful degradation, performance on Raspberry Pi

**Critical path:** Phase 1 → Phase 2 (can't add real-time controls without database) → Phase 3 (can't test priority interrupts without data) → Phase 4 → Phase 5

**Parallelizable:** API integrations in Phase 1 can be built independently, iCloud photo research can happen during Phase 2

## Sources

### Architecture Patterns
- [GitHub: PicoPixl/family-dashboard](https://github.com/PicoPixl/family-dashboard) - Real-time family dashboard example with Vite + React + Express
- [GitHub: stefanthurnherr/family-dashboard](https://github.com/stefanthurnherr/family-dashboard) - Self-hosted dashboard with shared events and calendar
- [Quora: Real-time web app architecture](https://www.quora.com/What-is-an-appropriate-architecture-for-real-time-web-applications-where-the-user-s-state-will-be-shared-in-real-time-across-mobile-devices-and-web) - CQRS-ES pattern for shared state
- [Medium: Shared State in Micro Frontends](https://medium.com/front-end-weekly/essential-considerations-for-shared-state-in-micro-frontends-8848b768877a) - State isolation and tenant-specific data patterns

### Real-Time Database Architecture
- [Supabase Architecture Docs](https://supabase.com/docs/guides/getting-started/architecture) - PostgreSQL-based real-time with WebSocket engine
- [UI Bakery: Firebase vs Supabase](https://uibakery.io/blog/firebase-vs-supabase) - NoSQL vs SQL comparison for real-time apps
- [Medium: Supabase or Firebase for Modern Web Apps](https://medium.com/@adorablepaty/supabase-or-firebase-which-fits-modern-web-apps-fa87e95a2d34) - Real-time capabilities comparison

### Kiosk Mode & Raspberry Pi
- [Raspberry Pi Kiosk Mode Guide](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/) - Official kiosk setup documentation
- [Core Electronics: Raspberry Pi Kiosk Setup](https://core-electronics.com.au/guides/raspberry-pi-kiosk-mode-setup/) - Chromium kiosk with systemd service
- [Rebecca DePrey: Raspberry Pi Home Assistant Dashboard](https://rebeccamdeprey.com/blog/raspberry-pi-kiosk-mode) - Full-screen dashboard on Pi

### Modern Web Architecture
- [HQ Software Lab: Web Application Architecture 2026](https://hqsoftwarelab.com/blog/web-application-architecture/) - Current trends in web app structure
- [ClickIT: Web Application Architecture 2026](https://www.clickittech.com/software-development/web-application-architecture/) - AI-native and edge computing patterns
- [DasRoot: Hugo + Web Components](https://dasroot.net/posts/2026/01/hugo-web-components-interactive-static-sites/) - Static sites with interactive components

### Responsive Dashboard Design
- [Justinmind: Dashboard Design Best Practices](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux) - UX principles for dashboards
- [Reintech: Creating Responsive Dashboard with CSS](https://reintech.io/blog/creating-responsive-dashboard-with-css) - CSS Grid and Flexbox patterns
- [Toptal: Mobile Dashboard UI Best Practices](https://www.toptal.com/designers/dashboard-design/mobile-dashboard-ui) - Touch interface design, button sizing

### State Management
- [Medium: State Management in Vanilla JS 2026](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de) - Modern patterns without frameworks
- [Patterns.dev: React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/) - Hybrid state approach (React Query + Zustand)
- [Syncfusion: Top 5 React State Management Tools](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - Zustand, Jotai, Redux Toolkit comparison

### Progressive Web Apps (Offline-First)
- [Alex Lockhart: Building Spinder - Offline First PWA](https://www.alexlockhart.me/2026/01/building-spinder-progressive-web-app.html) - Local-first web app architecture
- [Medium: PWAs with Offline-First Architecture](https://medium.com/@pranshu1902/building-progressive-web-apps-pwas-with-offline-first-architecture-a-beginners-guide-138c4bbb69f1) - Service worker and cache-first patterns
- [LogRocket: Offline-First Frontend Apps 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) - IndexedDB and SQLite in browser

### Memory Leak Prevention
- [GitHub: Home Assistant Memory Leak Issue](https://github.com/home-assistant/frontend/issues/16952) - Memory leak when keeping dashboard open on tablet 24/7
- [GitHub: Grafana Chrome OOM in Kiosk Mode](https://github.com/grafana/grafana/issues/50820) - Out-of-memory after 8+ hours in kiosk
- [Nolan Lawson: Fixing Memory Leaks in Web Applications](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/) - Prevention and detection strategies

---
*Architecture research for: Family dashboard with real-time shared state across wall kiosk and mobile devices*
*Researched: 2026-02-16*
