# Phase 13: Content Enhancements - Research

**Researched:** 2026-02-17
**Domain:** BVG transit API limiting, Unsplash photo API integration
**Confidence:** HIGH

## Summary

Phase 13 has two discrete tasks: (1) limit BVG departures to top 3 and (2) add Unsplash landscape photos to Country of the Day panel. Both are straightforward modifications to existing code with minimal risk.

The BVG departures change is trivial -- the API already supports a `results` parameter, and it currently requests 10. Changing it to 3 at the API level (plus removing excess skeleton loaders) completes TRNS-01. The Unsplash integration requires a new API call, image display, proper attribution with UTM parameters, and a download trigger endpoint call for API compliance. The dashboard already has a memory watchdog and runs on a Pi, so image size selection matters.

**Primary recommendation:** Change BVG `results=10` to `results=3` in the API call. For Unsplash, use `urls.small` (400px) for the sidebar panel to keep memory low on the Pi, fetch once per day alongside the country data, and include mandatory attribution with UTM links.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRNS-01 | BVG departures panel shows only the top 3 upcoming departures | BVG API `results` parameter directly supports this; change from `results=10` to `results=3` in `bvgTransit.ts` line 21 |
| CTRY-01 | Country of the Day displays a representative landscape photo from the country (Unsplash API) | Unsplash `/search/photos` endpoint with country name query, landscape orientation, proper attribution and download trigger |
</phase_requirements>

## Standard Stack

### Core (already installed, no changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in use |
| @tanstack/react-query | existing | Data fetching + caching | Already manages country and transit data |
| Tailwind CSS | v4 | Styling | Already in use for all panels |

### Supporting (no new packages needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` | built-in | Unsplash API calls | Direct HTTP requests, same pattern as existing API calls |

### New External Services
| Service | Auth | Free Tier | Setup |
|---------|------|-----------|-------|
| Unsplash API | `Client-ID` header via `VITE_UNSPLASH_ACCESS_KEY` | 50 req/hour (Demo) | Register app at unsplash.com/developers |

**Installation:**
```bash
# No new npm packages needed
# Add to .env:
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

## Architecture Patterns

### TRNS-01: BVG Departure Limiting

**What:** Change the API request parameter from `results=10` to `results=3`.

**Current code** (`src/lib/api/bvgTransit.ts` line 21):
```typescript
const url = `${BVG_BASE}/stops/${SENEFELDERPLATZ_ID}/departures?duration=30&results=10`;
```

**New code:**
```typescript
const url = `${BVG_BASE}/stops/${SENEFELDERPLATZ_ID}/departures?duration=30&results=3`;
```

**Verified:** The BVG REST API at `v6.bvg.transport.rest` accepts `results=3` and correctly returns exactly 3 departures. This was tested live during research.

**UI updates needed:**
- `TransitPanel.tsx` line 28: Change skeleton loader count from 5 to 3
- No other UI changes required -- the panel already maps over `departures` dynamically

### CTRY-01: Unsplash Country Photo Integration

**Pattern: Parallel Query with Dependent Display**

The country photo should be fetched as a separate React Query alongside the existing country data, keyed by the country name. This avoids coupling the image fetch to the country data fetch and allows graceful fallback if Unsplash fails.

```
src/
├── lib/api/
│   ├── countryOfDay.ts       # MODIFY: add fetchCountryImage()
│   └── bvgTransit.ts         # MODIFY: results=3
├── hooks/
│   └── useCountryOfDay.ts    # MODIFY: add useCountryImage() or extend existing
├── components/sidebar/
│   ├── CountryPanel.tsx       # MODIFY: add image + attribution
│   └── TransitPanel.tsx       # MODIFY: skeleton count
└── lib/
    └── constants.ts           # No changes needed (24h cache already configured)
```

### Unsplash API Call Pattern
```typescript
// Source: Unsplash API documentation (https://unsplash.com/documentation)
const UNSPLASH_BASE = 'https://api.unsplash.com';
const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

interface UnsplashPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
  downloadLocationUrl: string;
}

export async function fetchCountryImage(
  countryName: string
): Promise<UnsplashPhoto | null> {
  const query = encodeURIComponent(`${countryName} landscape`);
  const response = await fetch(
    `${UNSPLASH_BASE}/search/photos?query=${query}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.results?.length) return null;

  const photo = data.results[0];

  // REQUIRED: Trigger download endpoint for Unsplash analytics
  triggerUnsplashDownload(photo.links.download_location);

  return {
    url: photo.urls.small,  // 400px wide -- appropriate for sidebar panel on Pi
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
    downloadLocationUrl: photo.links.download_location,
  };
}

// Fire-and-forget download trigger (required by Unsplash API terms)
function triggerUnsplashDownload(downloadLocationUrl: string): void {
  fetch(downloadLocationUrl, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  }).catch(() => {
    // Silently fail -- this is analytics, not critical
  });
}
```

### Attribution Component Pattern
```tsx
// Source: Unsplash API Guidelines (https://help.unsplash.com/en/articles/2511315-guideline-attribution)
// UTM format: ?utm_source=YOUR_APP_NAME&utm_medium=referral
const APP_NAME = 'family_dashboard';

function UnsplashAttribution({
  photographer,
  photographerUrl,
  unsplashUrl,
}: {
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}) {
  return (
    <p className="text-[clamp(8px,0.6vw,10px)] text-text-secondary mt-1">
      Photo by{' '}
      <a
        href={`${photographerUrl}?utm_source=${APP_NAME}&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {photographer}
      </a>
      {' '}on{' '}
      <a
        href={`https://unsplash.com/?utm_source=${APP_NAME}&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Unsplash
      </a>
    </p>
  );
}
```

### Anti-Patterns to Avoid
- **Fetching `urls.regular` (1080px) for the sidebar panel:** The sidebar on the Pi is roughly 300-400px wide. Use `urls.small` (400px) to save memory and bandwidth.
- **Coupling image fetch to country data fetch:** If Unsplash is down, the country panel should still display all its current data. Keep queries independent.
- **Hotlinking without download trigger:** Unsplash API terms require calling the `download_location` endpoint when displaying a photo. This is for photographer analytics tracking, not an actual file download.
- **Missing UTM parameters on attribution links:** All links to Unsplash and photographer profiles MUST include `?utm_source=family_dashboard&utm_medium=referral`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image caching | Custom localStorage image cache | React Query's `staleTime: 24h` | Country changes daily; one API call per day is well within limits. React Query handles caching automatically. |
| Image optimization | Manual resizing/compression | Unsplash `urls.small` parameter | Unsplash CDN serves pre-optimized images at multiple sizes. Image CDN requests don't count against rate limits. |
| Country-to-photo mapping | Manual curated photo database | Unsplash search API | 250 countries is too many to curate. Search handles it automatically, and results are generally excellent for country names. |

## Common Pitfalls

### Pitfall 1: Missing Unsplash Download Trigger
**What goes wrong:** App displays photos but never calls `download_location` endpoint. Unsplash tracks this and can revoke API access.
**Why it happens:** Developers assume "display" only needs the image URL.
**How to avoid:** Call `photo.links.download_location` with auth header every time a photo is displayed. Fire-and-forget pattern is fine.
**Warning signs:** Unsplash developer dashboard shows 0 downloads despite many views.

### Pitfall 2: Large Images Causing Pi Memory Issues
**What goes wrong:** Using `urls.regular` (1080px) or `urls.full` (original) causes high memory usage on Raspberry Pi's Chromium, eventually triggering the memory watchdog reload.
**Why it happens:** The Pi has limited RAM (1-4GB shared with OS).
**How to avoid:** Use `urls.small` (400px wide) for the sidebar. The panel is only ~300-400px wide anyway.
**Warning signs:** Memory watchdog logs showing heap usage climbing after country panel displays.

### Pitfall 3: Unsplash Returns Irrelevant Results for Obscure Countries
**What goes wrong:** Searching for "Tuvalu landscape" might return generic stock photos or no results.
**Why it happens:** Unsplash's coverage is biased toward popular tourist destinations.
**How to avoid:** Check `data.results.length > 0` before displaying. If empty, gracefully fall back to the current flag-only layout. Do NOT show a broken image placeholder.
**Warning signs:** `null` return from `fetchCountryImage()`.

### Pitfall 4: Forgetting UTM Parameters on Attribution Links
**What goes wrong:** Attribution links don't include UTM parameters. This violates Unsplash API guidelines.
**Why it happens:** Developers add the visible attribution text but forget the URL parameters.
**How to avoid:** Use a dedicated `UnsplashAttribution` component that always includes UTM params.
**Warning signs:** Raw Unsplash URLs without `?utm_source=` in the href.

### Pitfall 5: Transit Panel Layout Breaks with Fewer Items
**What goes wrong:** Reducing from 10 to 3 departures makes the panel look empty or unbalanced.
**Why it happens:** The panel was designed visually with more items.
**How to avoid:** The panel already uses `flex-1` and `overflow-y-auto`, so it should adapt. But verify visually that 3 items look intentional, not broken. Consider slightly larger row spacing or text if needed.
**Warning signs:** Panel looks like it's "missing data" rather than intentionally concise.

## Code Examples

### BVG API Limiting (Verified Live)
```typescript
// Source: Live test of https://v6.bvg.transport.rest/stops/900110005/departures?duration=30&results=3
// Confirmed: Returns exactly 3 departures with identical structure to results=10
const url = `${BVG_BASE}/stops/${SENEFELDERPLATZ_ID}/departures?duration=30&results=3`;
```

### Unsplash Search Response Shape
```typescript
// Source: Unsplash API Documentation (https://unsplash.com/documentation#search-photos)
interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: Array<{
    id: string;
    created_at: string;
    width: number;
    height: number;
    color: string;         // hex color for placeholder
    blur_hash: string;     // BlurHash for progressive loading
    description: string | null;
    urls: {
      raw: string;         // Base image URL (add params for custom size)
      full: string;        // Original size
      regular: string;     // 1080px wide
      small: string;       // 400px wide  <-- USE THIS
      thumb: string;       // 200px wide
    };
    links: {
      self: string;
      html: string;        // Link to photo page on Unsplash
      download: string;
      download_location: string;  // MUST call this endpoint
    };
    user: {
      name: string;
      links: {
        html: string;      // Link to photographer's profile
      };
    };
  }>;
}
```

### React Query Hook for Country Image
```typescript
// Separate query keyed by country name, runs only after country data loads
export function useCountryImage(countryName: string | undefined) {
  return useQuery({
    queryKey: ['country-image', countryName],
    queryFn: () => fetchCountryImage(countryName!),
    enabled: !!countryName,
    staleTime: COUNTRY_REFRESH_MS,  // 24 hours, same as country data
    refetchInterval: false,          // Don't refetch -- country changes daily
    retry: 1,                        // One retry, then fall back to no image
  });
}
```

### Image Display in CountryPanel
```tsx
// Insert between flag+name section and facts grid
{countryImage && (
  <div className="mb-3 rounded-lg overflow-hidden">
    <img
      src={countryImage.url}
      alt={`Landscape of ${country.name.common}`}
      className="w-full h-auto rounded-lg object-cover"
      style={{ maxHeight: 'clamp(100px, 12vw, 180px)' }}
      loading="eager"  // Panel is in sidebar rotation, should load promptly
    />
    <UnsplashAttribution
      photographer={countryImage.photographer}
      photographerUrl={countryImage.photographerUrl}
      unsplashUrl={countryImage.unsplashUrl}
    />
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BVG REST API v5 | BVG REST API v6 (`v6.bvg.transport.rest`) | 2023 | Already using v6 -- no migration needed |
| Unsplash Source (simple embed URLs) | Unsplash API (full search + attribution) | Ongoing | Source URLs don't require API key but have no search capability. API is required for search-by-country. |

## Open Questions

1. **Unsplash search quality for micro-nations and territories**
   - What we know: Works well for major countries (Germany, Brazil, Japan). Prior research flagged "obscure countries" as untested.
   - What's unclear: Quality for places like Nauru, Tuvalu, Pitcairn Islands.
   - Recommendation: Implement with graceful fallback to no-image. The deterministic daily rotation means most days will be well-known countries. Accept occasional misses.

2. **Image height in sidebar panel layout**
   - What we know: The sidebar rotates between Transit, Horoscope, and Country panels. Adding a photo increases CountryPanel height.
   - What's unclear: Whether a photo + all existing facts will overflow the panel area.
   - Recommendation: Use `maxHeight: clamp(100px, 12vw, 180px)` with `object-cover` to cap image height. If panel overflows, the existing `overflow-hidden` on the card will handle it. May need to test and adjust on actual Pi display.

3. **Unsplash Demo vs Production approval**
   - What we know: Demo tier allows 50 req/hour. Dashboard needs ~1 req/day.
   - What's unclear: Whether Unsplash requires Production approval for long-running apps.
   - Recommendation: Start with Demo tier. 50 req/hour is 1200x more than needed. Apply for Production only if approaching limits (extremely unlikely).

## Sources

### Primary (HIGH confidence)
- [Unsplash API Documentation](https://unsplash.com/documentation) - Endpoints, auth, rate limits, response format
- [Unsplash Attribution Guidelines](https://help.unsplash.com/en/articles/2511315-guideline-attribution) - Required attribution format
- [Unsplash Download Trigger Guidelines](https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download) - Required download endpoint call
- [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) - UTM parameters, hotlinking rules
- Live BVG API test (`v6.bvg.transport.rest/stops/900110005/departures?results=3`) - Confirmed `results` parameter works

### Secondary (MEDIUM confidence)
- [Prior project research](.planning/research/STACK.md) - Feature 3 section covers Unsplash integration patterns, verified and extended here

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages needed, all APIs verified
- Architecture: HIGH - Patterns follow existing codebase conventions exactly
- Pitfalls: HIGH - Unsplash API terms are well-documented; Pi memory constraints understood from existing watchdog

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable APIs, unlikely to change)
