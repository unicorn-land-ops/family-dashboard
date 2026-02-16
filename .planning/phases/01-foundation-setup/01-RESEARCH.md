# Phase 1: Foundation & Setup - Research

**Researched:** 2026-02-16
**Domain:** Vite + React + TypeScript project scaffolding, responsive design for kiosk + mobile, GitHub Pages deployment, 24/7 auto-refresh with memory leak prevention
**Confidence:** HIGH

## Summary

Phase 1 establishes the modern web application infrastructure that replaces the existing 1215-line single-file static dashboard. The core challenge is building a Vite + React + TypeScript project that renders correctly on two very different form factors -- a Raspberry Pi Chromium kiosk in landscape (1920x1080, viewed from 2 meters) and iPhone Safari in portrait (390x844, held in hand) -- while deploying to GitHub Pages and surviving 24/7 unattended operation.

The technology choices are well-established and thoroughly documented. Vite's official scaffolding template provides React + TypeScript out of the box. Tailwind CSS v4 integrates via a first-party Vite plugin with zero configuration (no `tailwind.config.js` needed for basic usage, automatic content detection). GitHub Pages deployment uses a standard GitHub Actions workflow from Vite's official documentation. The auto-refresh mechanism from the existing dashboard (6-hour `setTimeout` reload) is a proven pattern that should be preserved and enhanced with React lifecycle cleanup.

**Primary recommendation:** Scaffold with `npm create vite@latest`, add Tailwind CSS v4 via `@tailwindcss/vite` plugin, use CSS Grid with `clamp()` typography for responsive layout, deploy via GitHub Actions, and implement a scheduled page reload with proper React cleanup for 24/7 operation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-01 | Dashboard renders in landscape kiosk mode on Raspberry Pi Chromium | Chromium kiosk flags documented (`--kiosk`, `--noerrdialogs`, `--disable-infobars`). CSS Grid layout with fixed viewport (`100vw x 100vh`). Existing dashboard already runs in this mode -- new build must match. Pi resolution quirks addressed via `disable_overscan=1`. |
| DISP-02 | Dashboard renders in portrait mode on iPhone Safari | `100dvh` (dynamic viewport height) solves Safari's address bar issue. PWA home screen bookmark eliminates Safari chrome entirely. Touch targets 44px+ per Apple HIG. Media queries for `orientation: portrait` and `max-width: 768px`. |
| DISP-03 | Modern, polished visual design with clean typography and smooth animations | Inter font (designed for screens, excellent at all sizes). Tailwind CSS v4 provides design system with consistent spacing/color. `clamp()` for fluid typography across viewports. CSS transitions and `@keyframes` for smooth animations. Dark theme with gradient backgrounds (preserving existing aesthetic). |
| DISP-06 | Auto-refresh with memory leak prevention for 24/7 unattended operation | Existing 6-hour `setTimeout(() => location.reload())` pattern preserved. React `useEffect` cleanup prevents listener accumulation. `document.addEventListener('visibilitychange')` for tab focus handling. Chromium flags (`--disk-cache-dir=/dev/null`) reduce memory pressure. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Industry standard 2026; stable v19 with performance improvements; excellent Safari support; massive ecosystem for future phases |
| Vite | 6.x/7.x | Build tool + dev server | Official React recommendation; fast HMR; zero-config GitHub Pages deployment; first-party Tailwind CSS plugin support |
| TypeScript | 5.7+ | Type safety | Prevents API shape mismatches during migration; Vite uses esbuild for fast transpilation (no `tsc` in dev) |
| Tailwind CSS | 4.x | Styling + responsive design | First-party Vite plugin (`@tailwindcss/vite`); zero-config content detection; responsive utilities built-in; minimal runtime overhead |

**Confidence: HIGH** -- All verified via official documentation and release blogs. Vite scaffold template (`react-ts`) bundles React + TypeScript together.

**Note on versions:** The existing project research references Vite 7.3+ and React 19.2+, but the scaffolding command `npm create vite@latest` will install whatever is current stable at execution time. Pin exact versions in `package.json` after scaffolding.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Inter font | Variable | Typography | Load via Google Fonts CDN or self-host; designed for screens, excellent legibility from 2m wall distance and phone handheld |
| vite-plugin-pwa | 0.20+ | PWA manifest + service worker | Enables iPhone "Add to Home Screen" (eliminates Safari chrome); pre-caches static assets for offline resilience |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React 19 | Preact (3KB vs ~45KB) | Consider if Pi memory pressure becomes critical; same API, drop-in replacement. Start with React, measure first. |
| Tailwind CSS | CSS Modules | More verbose but familiar; loses utility-class responsive design shortcuts. Not recommended for this project. |
| Inter font | System font stack (`-apple-system, ...`) | Zero load time, but inconsistent across Pi (Linux) and iPhone (iOS). Existing dashboard uses system fonts -- Inter is an upgrade. |

**Installation:**
```bash
# Scaffold project
npm create vite@latest family-dashboard -- --template react-ts
cd family-dashboard

# Tailwind CSS v4 (Vite plugin)
npm install -D tailwindcss @tailwindcss/vite

# PWA support (for iPhone home screen + offline caching)
npm install -D vite-plugin-pwa

# Dev tools
npm install -D prettier
```

## Architecture Patterns

### Recommended Project Structure

```
family-dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deployment
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardShell.tsx   # Top-level grid layout (responsive)
│   │   │   ├── Header.tsx           # Clock + weather bar (always visible)
│   │   │   └── StatusBar.tsx        # Last refresh timestamps
│   │   └── ui/                      # Shared UI primitives (Card, etc.)
│   ├── hooks/
│   │   ├── useAutoRefresh.ts        # Page reload + data refresh scheduling
│   │   └── useViewport.ts           # Responsive breakpoint detection
│   ├── lib/
│   │   └── constants.ts             # Breakpoints, refresh intervals, colors
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point (React.createRoot)
│   └── index.css                    # Tailwind import + global styles
├── index.html                       # Vite entry HTML
├── vite.config.ts                   # Vite + Tailwind + PWA config
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Optional Tailwind customization
└── package.json
```

### Pattern 1: Responsive Shell with CSS Grid

**What:** A single CSS Grid layout that adapts between landscape kiosk and portrait mobile using media queries and `grid-template-areas`.

**When to use:** The root layout component that wraps all dashboard content.

**Example:**
```css
/* Landscape kiosk (Raspberry Pi 1920x1080) */
.dashboard {
  display: grid;
  grid-template-areas:
    "header  header"
    "main    sidebar"
    "status  status";
  grid-template-columns: 1fr 380px;
  grid-template-rows: auto 1fr auto;
  height: 100dvh;
  width: 100vw;
  padding: clamp(12px, 1.5vw, 24px);
  gap: clamp(10px, 1vw, 20px);
  overflow: hidden;
}

/* Portrait mobile (iPhone 390x844) */
@media (max-width: 768px) and (orientation: portrait) {
  .dashboard {
    grid-template-areas:
      "header"
      "main"
      "status";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  .sidebar { display: none; } /* Hidden on mobile for Phase 1 */
}
```

### Pattern 2: Fluid Typography with `clamp()`

**What:** Font sizes that scale smoothly between mobile (390px) and kiosk (1920px) using CSS `clamp()`, ensuring readability at both handheld and 2-meter viewing distances.

**When to use:** All text elements across the dashboard.

**Example:**
```css
/* Source: CSS-Tricks clamp() guide, MDN clamp() docs */

/* Time display: large on kiosk, smaller on mobile */
.time {
  font-size: clamp(3rem, 8vw, 10rem);
  font-weight: 300;
  line-height: 1;
}

/* Body text: readable at 2m on kiosk, normal on mobile */
.body-text {
  font-size: clamp(0.875rem, 1.2vw, 1.4rem);
  line-height: 1.5;
}

/* Section headers */
.section-header {
  font-size: clamp(1rem, 1.5vw, 1.5rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
```

**Key insight:** The existing dashboard uses `rem` units (e.g., `font-size: 10rem` for time, `1.4rem` for body text). These work for a fixed viewport but do not scale. `clamp()` preserves the large kiosk sizes while providing readable mobile sizes.

### Pattern 3: Scheduled Page Reload for 24/7 Operation

**What:** A React hook that schedules a full page reload at a specific time (e.g., 3am) to clear accumulated memory, plus cleanup of intervals/listeners.

**When to use:** Mounted once in the root App component.

**Example:**
```typescript
// src/hooks/useAutoRefresh.ts
import { useEffect } from 'react';

export function useAutoRefresh() {
  useEffect(() => {
    // Schedule reload at next 3am Berlin time
    const scheduleReload = () => {
      const now = new Date();
      const berlinNow = new Date(
        now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
      );
      const next3am = new Date(berlinNow);
      next3am.setHours(3, 0, 0, 0);
      if (next3am <= berlinNow) next3am.setDate(next3am.getDate() + 1);

      const msUntilReload = next3am.getTime() - berlinNow.getTime();
      return setTimeout(() => window.location.reload(), msUntilReload);
    };

    const reloadTimer = scheduleReload();

    // Cleanup on unmount (prevents stale timers in development HMR)
    return () => clearTimeout(reloadTimer);
  }, []);
}
```

### Pattern 4: iPhone Safari Viewport Handling

**What:** Using `100dvh` (dynamic viewport height) instead of `100vh` to handle Safari's collapsing address bar, plus PWA manifest for home screen launch.

**When to use:** Root layout container height.

**Example:**
```css
/* Use dvh to handle Safari's dynamic toolbar */
.dashboard {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
}

/* Fallback for older browsers that don't support dvh */
@supports not (height: 100dvh) {
  .dashboard {
    height: 100vh;
  }
}
```

```typescript
// vite.config.ts -- PWA config for iPhone home screen
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Family Dashboard',
    short_name: 'Dashboard',
    display: 'standalone',          // Eliminates Safari chrome when launched from home screen
    orientation: 'any',             // Supports both landscape (kiosk) and portrait (phone)
    background_color: '#0a0a1a',    // Match existing dark background
    theme_color: '#0a0a1a',
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
  }
})
```

### Anti-Patterns to Avoid

- **Fixed pixel breakpoints without testing on real devices:** Chrome DevTools responsive mode does NOT accurately simulate Raspberry Pi Chromium or iPhone Safari. Test on actual hardware from day one.
- **Using `100vh` on mobile Safari:** The address bar causes content to overflow. Always use `100dvh` with `100vh` fallback.
- **Forgetting React cleanup in `useEffect`:** Every `setInterval`, `setTimeout`, and event listener MUST have a cleanup return. This is critical for 24/7 operation where HMR and re-renders accumulate leaked timers.
- **Installing Tailwind via PostCSS method:** Tailwind CSS v4 + PostCSS causes known issues. Use the Vite plugin (`@tailwindcss/vite`) exclusively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive breakpoints | Custom JS resize listeners | Tailwind responsive prefixes (`md:`, `lg:`) + CSS media queries | Battle-tested, zero JS overhead, handles orientation changes |
| PWA manifest + service worker | Manual service worker registration | `vite-plugin-pwa` | Handles cache versioning, update prompts, workbox strategies automatically |
| GitHub Pages deployment | Manual `gh-pages` npm scripts | GitHub Actions workflow (official Vite template) | Automatic on push to `master`, no local deploy step needed, uses official `actions/deploy-pages` |
| CSS reset / normalization | Custom reset stylesheet | Tailwind Preflight (included automatically) | Consistent cross-browser baseline between Chromium (Pi) and Safari (iPhone) |
| Dark theme color system | Ad-hoc color values | Tailwind CSS custom properties / theme extension | Consistent palette, easy to adjust, referenced throughout components |

**Key insight:** Phase 1 is infrastructure. Every hand-rolled solution here becomes technical debt that slows Phases 2-10. Use established tools and save custom code for domain-specific features (calendar parsing, transit API, etc.).

## Common Pitfalls

### Pitfall 1: Tailwind v4 Configuration Confusion

**What goes wrong:** Developers follow Tailwind v3 tutorials and create `tailwind.config.js` with `content` arrays, `postcss.config.js`, etc. Tailwind v4 uses a completely different setup with the Vite plugin.

**Why it happens:** Most tutorials and Stack Overflow answers reference Tailwind v3. The v4 setup is radically simplified but unfamiliar.

**How to avoid:**
1. Install ONLY `tailwindcss` and `@tailwindcss/vite`
2. Add `tailwindcss()` to Vite plugins array
3. Add `@import "tailwindcss";` to your CSS entry file
4. No `tailwind.config.js` needed for basic usage (content detection is automatic)
5. If custom theme needed, use `@theme` directive in CSS, not a JS config

**Warning signs:** Getting `content` path errors, PostCSS-related build failures, "no utilities generated" in dev mode.

### Pitfall 2: Safari-Specific CSS Gaps

**What goes wrong:** Layout works in Chromium on Pi but breaks on iPhone Safari. Common issues: `100vh` overflow, `gap` in flexbox not supported in older Safari, `dvh` units not working, backdrop-filter rendering differently.

**Why it happens:** Safari has historically lagged behind Chrome in CSS feature support. iPhone Safari and desktop Safari also differ.

**How to avoid:**
- Use `100dvh` with `100vh` fallback (`@supports`)
- Test on actual iPhone Safari, not just Chrome DevTools
- Use `caniuse.com` to verify CSS features against Safari iOS target version
- `backdrop-filter` needs `-webkit-backdrop-filter` prefix on Safari
- Avoid CSS features without Safari support: `:has()` is fine (supported since Safari 15.4), `container queries` supported since Safari 16

**Warning signs:** Layout overflow on iPhone, transparent backgrounds where blur expected, missing gaps between flex items.

### Pitfall 3: GitHub Pages Base Path Misconfiguration

**What goes wrong:** App deploys to GitHub Pages but all assets return 404. CSS, JS, images fail to load. Blank page with console errors.

**Why it happens:** GitHub Pages serves project repos at `username.github.io/repo-name/`, but Vite defaults `base` to `'/'`. All asset paths become absolute from root, missing the repo prefix.

**How to avoid:**
- Set `base: '/family-dashboard/'` in `vite.config.ts` (MUST match repository name exactly)
- Verify after first deploy: check browser DevTools Network tab for 404s
- If using custom domain later, switch `base` back to `'/'`

**Warning signs:** Blank white page after deploy, 404 errors in browser console for `.js` and `.css` files.

### Pitfall 4: Raspberry Pi Chromium Rendering Quirks

**What goes wrong:** Dashboard renders perfectly in desktop Chrome but has overscan issues, blurry text, or performance problems on Pi Chromium.

**Why it happens:** Pi Chromium runs on ARM hardware with different GPU capabilities. Display configuration affects actual viewport. Overscan can crop 10px off edges.

**How to avoid:**
- Set `disable_overscan=1` in `/boot/config.txt` on the Pi
- Use Chromium kiosk flags: `--kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble`
- Add memory-saving flags: `--disable-features=TranslateUI --disable-background-timer-throttling`
- Test with actual Pi from first deploy, not just desktop Chrome
- Avoid heavy CSS filters/blurs that stress Pi GPU

**Warning signs:** Content clipped at screen edges, sluggish animations, Chromium crash bubbles appearing.

### Pitfall 5: Memory Leak from React Development Patterns

**What goes wrong:** Dashboard runs fine for hours but after 24-48 hours on Pi, memory usage climbs and eventually crashes.

**Why it happens:** React `useEffect` without cleanup, `setInterval` not cleared, event listeners stacking up across re-renders, stale closures holding references to old state.

**How to avoid:**
- EVERY `useEffect` that sets up intervals/listeners MUST return a cleanup function
- Use `AbortController` for fetch requests that should cancel on unmount
- The scheduled page reload at 3am is a safety net, not an excuse to skip cleanup
- In development, React Strict Mode (default in Vite template) mounts/unmounts twice -- fix any double-subscription warnings immediately
- Profile memory in Chrome DevTools before deploying to Pi

**Warning signs:** React Strict Mode warnings about cleanup, growing DOM node count in DevTools Performance Monitor, increasing JS heap in Memory tab.

## Code Examples

### Vite Configuration (Complete)

```typescript
// vite.config.ts
// Source: Vite official docs (https://vite.dev/guide/static-deploy)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/family-dashboard/',  // MUST match GitHub repo name
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Family Dashboard',
        short_name: 'Dashboard',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0a0a1a',
        theme_color: '#0a0a1a',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
});
```

### GitHub Actions Deployment Workflow

```yaml
# .github/workflows/deploy.yml
# Source: Vite official docs (https://vite.dev/guide/static-deploy)
name: Deploy to GitHub Pages

on:
  push:
    branches: ['master']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### CSS Entry File (Tailwind v4)

```css
/* src/index.css */
/* Source: Tailwind CSS v4 docs (https://tailwindcss.com/docs) */

@import "tailwindcss";

/* Inter font from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Custom theme extending Tailwind */
@theme {
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --color-bg-primary: #0a0a1a;
  --color-bg-secondary: #151530;
  --color-accent-gold: #FFD700;
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-surface: rgba(255, 255, 255, 0.1);
}

/* Global styles */
html {
  background: var(--color-bg-primary);
}

body {
  font-family: var(--font-family-sans);
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  color: var(--color-text-primary);
  overflow: hidden;
}
```

### Responsive Dashboard Shell Component

```tsx
// src/components/layout/DashboardShell.tsx

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="
      h-dvh w-screen overflow-hidden
      grid gap-[clamp(10px,1vw,20px)] p-[clamp(12px,1.5vw,24px)]

      /* Landscape kiosk layout (default) */
      grid-cols-[1fr_380px]
      grid-rows-[auto_1fr_auto]
      [grid-template-areas:'header_header'_'main_sidebar'_'status_status']

      /* Portrait mobile layout */
      max-[768px]:grid-cols-1
      max-[768px]:grid-rows-[auto_1fr_auto]
      max-[768px]:[grid-template-areas:'header'_'main'_'status']
    ">
      {children}
    </div>
  );
}
```

### Auto-Refresh Hook

```typescript
// src/hooks/useAutoRefresh.ts
import { useEffect } from 'react';

const RELOAD_HOUR = 3; // 3am Berlin time
const TIMEZONE = 'Europe/Berlin';

export function useAutoRefresh() {
  useEffect(() => {
    const getNextReloadMs = (): number => {
      const now = new Date();
      // Get current Berlin time
      const berlinStr = now.toLocaleString('en-US', { timeZone: TIMEZONE });
      const berlinNow = new Date(berlinStr);

      const next = new Date(berlinNow);
      next.setHours(RELOAD_HOUR, 0, 0, 0);
      if (next <= berlinNow) next.setDate(next.getDate() + 1);

      return next.getTime() - berlinNow.getTime();
    };

    const timerId = setTimeout(() => {
      console.log('[AutoRefresh] Reloading to prevent memory leaks');
      window.location.reload();
    }, getNextReloadMs());

    // Also reload on visibility change if page has been hidden for >1 hour
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Could trigger data refresh here in future phases
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 with `tailwind.config.js` + PostCSS | Tailwind v4 with `@tailwindcss/vite` plugin + CSS `@theme` | Jan 2025 (v4.0) | No JS config file needed; content detection is automatic; theme defined in CSS |
| `100vh` for full-height layouts | `100dvh` (dynamic viewport height) | Safari 15.4+ (2022) | Solves mobile Safari address bar overflow; `dvh` adjusts as toolbar shows/hides |
| Create React App (CRA) | Vite + `react-ts` template | CRA deprecated 2023 | 40x faster builds; native ESM dev server; no webpack config |
| `gh-pages` npm package | GitHub Actions `deploy-pages` action | 2023+ | Automatic on push; no local deploy step; official GitHub support |
| System font stack | Inter variable font | Ongoing trend | Consistent cross-platform look; designed for screens; excellent at all sizes |

**Deprecated/outdated:**
- **Create React App (CRA):** Deprecated since 2023. Do not use.
- **Tailwind CSS PostCSS method with v4:** Causes known issues with React. Use Vite plugin method only.
- **`gh-pages` npm package:** Still works but GitHub Actions is the modern approach with zero local setup.

## Open Questions

1. **Exact Raspberry Pi model and RAM**
   - What we know: Project docs say "Raspberry Pi" without specifying model (3/4/5) or RAM (1GB/2GB/4GB/8GB)
   - What's unclear: Memory budget for bundle size decisions and animation complexity
   - Recommendation: Document during Phase 1 setup. If Pi 3 with 1GB, consider Preact instead of React. If Pi 4 with 4GB+, React is fine.

2. **GitHub repo branch name: `master` vs `main`**
   - What we know: Git status shows current branch is `master`
   - What's unclear: Whether GitHub Pages should deploy from `master` or if repo should migrate to `main`
   - Recommendation: Use `master` in GitHub Actions workflow (matches current repo). The deploy workflow references `branches: ['master']`.

3. **Custom domain vs project page URL**
   - What we know: Currently deployed at `username.github.io/family-dashboard/`
   - What's unclear: Whether a custom domain will be used
   - Recommendation: Set `base: '/family-dashboard/'` in Vite config. If custom domain added later, change to `base: '/'`.

4. **Existing `index.html` migration strategy**
   - What we know: Current dashboard is a 1215-line single file with inline CSS and JS. It works and is used daily.
   - What's unclear: Whether to keep old version accessible during migration or fully replace from day one
   - Recommendation: Phase 1 scaffolds the NEW project alongside the existing file. Old `index.html` can be preserved (renamed or moved) until Phase 2 migrates features. The Vite build outputs to `dist/` so there is no conflict during development.

## Sources

### Primary (HIGH confidence)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy) -- GitHub Actions workflow, base path configuration
- [Tailwind CSS v4 Installation with Vite](https://tailwindcss.com/docs) -- Vite plugin setup, `@import "tailwindcss"`, `@theme` directive
- [MDN `clamp()` Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) -- Fluid typography syntax and browser support
- [MDN Dynamic Viewport Units (`dvh`)](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths) -- Safari support for `100dvh`

### Secondary (MEDIUM confidence)
- [Raspberry Pi Kiosk Mode Setup 2025](https://gist.github.com/lellky/673d84260dfa26fa9b57287e0f67d09e) -- Chromium flags, Wayland/systemd setup, crash recovery
- [Raspberry Pi Chromium Kiosk Autostart 2026](https://copyprogramming.com/howto/raspberry-pi-4-autostart-chromium) -- Memory optimization flags, overscan fixes
- [CSS-Tricks: clamp() for Font Scaling](https://css-tricks.com/linearly-scale-font-size-with-css-clamp-based-on-the-viewport/) -- Fluid typography calculation methods
- [Smashing Magazine: Modern Fluid Typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) -- Best practices for `clamp()` with `rem` units
- [Inter Font Family](https://rsms.me/inter/) -- Variable font designed for screens, free and open source
- [Safari iOS viewport / `100dvh` Solutions](https://lukechannings.com/blog/2021-06-09-does-safari-15-fix-the-vh-bug/) -- Dynamic viewport units and `-webkit-fill-available` fallback
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/) -- `registerType: 'autoUpdate'`, manifest configuration, workbox patterns

### Tertiary (LOW confidence, needs validation)
- Raspberry Pi model-specific performance characteristics -- Need to test on actual hardware; varies by model/RAM
- Tailwind CSS v4 `@theme` directive completeness -- Relatively new; most examples still reference v3 patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Vite + React + TypeScript + Tailwind v4 are extremely well-documented with official setup guides
- Architecture: HIGH -- CSS Grid responsive layouts, `clamp()` typography, PWA manifests are mature web standards
- Pitfalls: HIGH -- Safari viewport issues, Tailwind v3/v4 confusion, GitHub Pages base path, and Pi kiosk quirks are all well-documented with known solutions

**Research date:** 2026-02-16
**Valid until:** 2026-04-16 (stable technologies, 60-day validity)
