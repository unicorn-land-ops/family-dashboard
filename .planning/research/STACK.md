# Technology Stack Research

**Project:** Family Dashboard
**Domain:** Real-time responsive family dashboard web app
**Researched:** 2026-02-16
**Overall Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React** | 19.2+ | UI framework | Industry standard (2026), excellent mobile Safari support, stable v19 with performance improvements, massive ecosystem. Familiar for brownfield migration from vanilla JS. |
| **Vite** | 7.3+ | Build tool & dev server | Fast HMR, zero-config PWA support via plugins, excellent GitHub Pages deployment story, replaces need for complex build setup. Official React recommendation over CRA. |
| **Tailwind CSS** | 4.1+ | Styling | v4 brings performance gains with new Oxide engine, responsive design built-in (critical for Pi kiosk + mobile), minimal runtime overhead, eliminates CSS file management. |
| **Zustand** | 5.0+ | Client state management | Lightweight (1KB), simple API, no boilerplate, perfect for local UI state (theme, view toggles). Does NOT handle real-time sync - that's separate. |

**Confidence: HIGH** - All versions verified via official documentation (React blog, Vite blog, Tailwind blog). Stack is production-proven for static sites in 2026.

### Real-Time Shared State

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **PartyKit** | Latest | Real-time state sync | Free tier available, runs on Cloudflare edge (low latency globally), handles WebSocket connection management automatically, perfect for family-scale usage (4 users). Acquired by Cloudflare (2024) - strong longevity signal. |

**Alternative: Server-Sent Events (SSE)** - If PartyKit proves overkill, use native SSE for one-way server→client updates. Simpler than WebSockets, works well for live dashboards where clients mostly consume data. No third-party service required.

**What NOT to use:**
- **Supabase Realtime** - Overkill for this use case, requires Postgres backend, more complex than needed
- **Yjs + y-websocket** - Excellent for collaborative editing (CRDT-based), but too heavyweight for simple shared state (timers, chores)
- **Redux Toolkit** - Unnecessary complexity for 4-user family dashboard

**Confidence: MEDIUM** - PartyKit free tier details not fully verified. SSE fallback has HIGH confidence (native web standard).

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tanstack/react-query** | 5.0+ | Server state (API data) | Fetching weather, transit, horoscope APIs. Handles caching, refetching, stale-while-revalidate automatically. Separates server state from UI state (best practice 2026). |
| **date-fns** | 3.0+ | Date/time handling | Timezone-aware date formatting (Berlin timezone), calendar parsing. Smaller than Moment.js, tree-shakeable. |
| **vite-plugin-pwa** | 0.20+ | PWA/offline support | Makes dashboard work offline on Pi during network blips. Pre-caches static assets, provides service worker without manual configuration. |
| **react-icons** | 5.0+ | Icon library | Weather icons, UI icons. Tree-shakeable, includes multiple icon sets. |

**Confidence: HIGH** - All libraries are mature, actively maintained, and have GitHub Pages + static site usage patterns documented.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** | Type safety | Prevents API shape mismatches, especially valuable when migrating 1200-line HTML file to components. Use strict mode. |
| **ESLint** | Code quality | Use `@typescript-eslint` + React plugin. Catches common React mistakes. |
| **Prettier** | Formatting | Eliminates style debates, auto-format on save. Use `.prettierrc` for consistency. |
| **Vitest** | Testing | Vite-native test runner. Use for critical logic (timer calculations, chore rotation). |

## Installation

```bash
# Initialize Vite + React + TypeScript
npm create vite@latest family-dashboard -- --template react-ts
cd family-dashboard

# Core dependencies
npm install zustand @tanstack/react-query date-fns react-icons

# Tailwind CSS v4 (Vite plugin method)
npm install -D tailwindcss @tailwindcss/vite

# PWA support
npm install -D vite-plugin-pwa

# Real-time (PartyKit)
npm install partykit partysocket

# Dev dependencies
npm install -D @types/node prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks vitest

# GitHub Pages deployment
npm install -D gh-pages
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| **Framework** | React 19 | Preact | If bundle size becomes critical (Preact is 3KB vs React's ~45KB). Preact has same API, drop-in replacement. Consider if Pi Chromium struggles. |
| **Framework** | React 19 | SolidJS | If performance becomes critical. SolidJS uses fine-grained reactivity (no vDOM), faster than React. Steeper learning curve, smaller ecosystem. |
| **Build Tool** | Vite | Astro 6 | If most content is static. Astro excels at content-heavy sites with islands of interactivity. Overkill for dashboard with live updates. |
| **State Management** | Zustand | Jotai | If you prefer atom-based state. Jotai has smaller bundle (4KB) but slightly more verbose API. Both excellent choices. |
| **Real-Time** | PartyKit | DIY WebSocket server (Node.js + ws) | If you want full control and already have a server. Requires managing WebSocket lifecycle, reconnection logic manually. More work but zero vendor lock-in. |
| **Real-Time** | PartyKit | Server-Sent Events (SSE) | If state updates are mostly server→client. SSE is simpler than WebSockets, native browser support, auto-reconnect. No bi-directional communication needed for timers/chores. |
| **Styling** | Tailwind CSS | CSS Modules | If team prefers traditional CSS. CSS Modules give scoped styles without utility classes. More verbose, but familiar. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App (CRA)** | Deprecated in 2023, no longer maintained. Slow dev server, outdated tooling. | Vite (official React recommendation) |
| **Webpack** | Complex configuration, slower HMR than Vite. Overkill for static site. | Vite |
| **Supabase Realtime** | Requires Postgres backend, overkill for 4-user family dashboard. Adds infrastructure complexity. | PartyKit or SSE |
| **Redux (classic)** | Too much boilerplate for small app. Modern alternatives (Zustand, Jotai) are simpler. | Zustand |
| **Moment.js** | Deprecated, large bundle size (67KB). Not tree-shakeable. | date-fns (13KB, tree-shakeable) |
| **Socket.IO** | Adds abstraction layer over WebSockets, larger bundle. Not needed for modern browsers (Safari supports WebSocket). | Native WebSocket or PartyKit |
| **Liveblocks** | Expensive ($939 for 10K MAUs). Designed for collaborative editing (CRDT). Overkill and overpriced for family dashboard. | PartyKit (free tier) |

## Stack Patterns by Scenario

### If reliability on Raspberry Pi is paramount:
- Use **Preact** instead of React (3KB, less memory pressure)
- Enable **vite-plugin-pwa** with aggressive caching (app works offline)
- Use **SSE** instead of PartyKit (one less dependency, native browser reconnection)
- Implement **local-first**: cache all API data in IndexedDB, sync in background

### If you need offline-first functionality:
- Use **vite-plugin-pwa** with `registerType: 'autoUpdate'`
- Store shared state in **IndexedDB** (up to GB of storage vs localStorage's 5MB)
- Use **@tanstack/react-query** with `staleTime: Infinity` for API data caching
- Implement **background sync** via Service Worker for chore completions

### If mobile performance is critical:
- Use **Preact** (3KB vs React's 45KB - faster parse/eval on mobile Safari)
- Lazy load routes with `React.lazy()` and `Suspense`
- Use **Tailwind CSS purge** to remove unused styles (~90% reduction)
- Compress images with **vite-plugin-imagetools**

### If you want zero external dependencies for real-time:
- **DIY WebSocket Server**: Node.js + `ws` library (30 lines of code)
- Deploy on **Cloudflare Workers** (free tier, global edge)
- Use **BroadcastChannel API** for same-device multi-tab sync (zero server needed)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| React 19.2 | Vite 7.3 | No known issues. Vite 6+ supports React 19 out of the box. |
| Tailwind CSS 4.1 | Vite 7.3 | Use `@tailwindcss/vite` plugin (NOT PostCSS method). Config is now CSS-based. |
| TypeScript 5.7+ | Vite 7.3 | Vite uses esbuild for TS (no tsc), fast transpilation. |
| vite-plugin-pwa 0.20+ | Vite 7.3 | No issues. Use Workbox strategy for offline support. |
| PartyKit | All above | Framework-agnostic, works with any static site. Uses native WebSocket. |

**Known Incompatibility:** Tailwind CSS 4.x + PostCSS method causes issues with React 19. Solution: Use Vite plugin method (`@tailwindcss/vite`) as documented in official Tailwind v4 migration guide.

## GitHub Pages Deployment Configuration

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/family-dashboard/', // CRITICAL: Must match repo name
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  build: {
    outDir: 'dist', // Default, but explicit for clarity
    sourcemap: false, // Disable for production
  }
})
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**GitHub Actions Alternative:** Use `.github/workflows/deploy.yml` for automated deployment on push to main. Template available in official Vite docs.

## Sources

### Official Documentation (HIGH Confidence)
- [React 19.2 Release](https://react.dev/blog) - Verified current stable version
- [Vite 7.3 Documentation](https://vite.dev/blog) - Verified current stable version
- [Tailwind CSS 4.1 Release](https://tailwindcss.com/blog) - Verified v4 stable + Vite plugin method
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy) - Official GitHub Pages setup
- [PartyKit Documentation](https://docs.partykit.io/) - Real-time collaboration platform

### Technology Comparisons (MEDIUM-HIGH Confidence)
- [Top 5 React State Management Tools in 2026](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - Zustand vs Redux vs Jotai
- [State Management in 2026: Modern Frontend Guide](https://www.elearningsolutions.co.in/state-management-in-2026-2/) - Treat server data differently from UI state
- [Zustand vs Redux vs Jotai Comparison](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux-toolkit-vs-jotai/) - Feature comparison
- [npm trends: jotai vs nanostores vs zustand](https://npmtrends.com/jotai-vs-nanostores-vs-recoil-vs-redux-vs-valtio-vs-zustand) - Download statistics

### Real-Time Technologies (MEDIUM Confidence)
- [PartyKit: Building Real-Time Apps in 2026](https://latestfromtechguy.com/article/partykit-realtime-collaboration-2026) - PartyKit overview
- [Liveblocks vs Supabase Realtime Comparison](https://ably.com/compare/liveblocks-broadcast-vs-supabase) - Pricing comparison (7x difference)
- [Server-Sent Events vs WebSockets Guide 2026](https://www.nimbleway.com/blog/server-sent-events-vs-websockets-what-is-the-difference-2026-guide) - Use case comparison
- [WebSockets vs SSE vs Polling](https://rxdb.info/articles/websockets-sse-polling-webrtc-webtransport.html) - Technical comparison

### Framework Alternatives (MEDIUM Confidence)
- [React vs Preact vs SolidJS 2026 Comparison](https://www.index.dev/skill-vs-skill/frontend-react-vs-preact-vs-solidjs) - Performance benchmarks
- [Preact Signals vs SolidJS Signals](https://medium.com/@prathameshpolsane/a-detailed-comparison-react-js-vs-preact-vs-solid-js-546b7add27df) - Reactivity comparison
- [Astro 6 Beta Features](https://www.infoq.com/news/2026/02/astro-v6-beta-cloudflare/) - Content-focused alternative

### Raspberry Pi Kiosk (MEDIUM Confidence)
- [Family Dashboard on Raspberry Pi](https://github.com/stefanthurnherr/family-dashboard) - Real-world implementation
- [Scott Hanselman: Wall-Mounted Family Calendar](https://www.hanselman.com/blog/how-to-build-a-wall-mounted-family-calendar-and-dashboard-with-a-raspberry-pi-and-cheap-monitor) - Pi kiosk setup
- [Raspberry Pi Kiosk Mode Setup](https://core-electronics.com.au/guides/raspberry-pi-kiosk-mode-setup/) - Chromium configuration

### PWA & Offline Support (HIGH Confidence)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) - Official documentation
- [Making Offline-First PWAs with Vite + React](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/) - Implementation guide
- [localStorage vs IndexedDB Comparison](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html) - Storage comparison

### WebSocket Implementation (HIGH Confidence)
- [ws Library - Node.js WebSockets](https://github.com/websockets/ws) - 900+ GitHub stars, de facto standard
- [Getting Started with Express WebSockets](https://betterstack.com/community/guides/scaling-nodejs/express-websockets/) - Tutorial
- [Yjs CRDT Documentation](https://docs.yjs.dev/) - 900K weekly downloads

---

**Recommendation:** Start with React 19 + Vite 7 + Tailwind 4 + Zustand for client state. Add PartyKit for real-time state sync (timers, chores). If PartyKit free tier is insufficient, fall back to Server-Sent Events (SSE) with a lightweight Node.js server or Cloudflare Worker.

**Migration Path from Current HTML:**
1. Set up Vite + React project
2. Extract CSS into Tailwind classes (incrementally)
3. Convert HTML sections to React components (header, weather, calendar, etc.)
4. Replace `fetch()` calls with React Query
5. Add Zustand for UI state (view toggles, settings)
6. Add PartyKit/SSE for shared state last (timers, chores, groceries)

**Risk Mitigation:** Since this runs 24/7 unattended on a Raspberry Pi, prioritize PWA offline support (vite-plugin-pwa) and error boundaries. Consider Preact if memory pressure becomes an issue (Pi has limited RAM).
