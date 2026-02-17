// Shared constants for the Family Dashboard

// Responsive breakpoints
export const BREAKPOINT_MOBILE = 768; // px — below this = portrait/mobile layout

// Auto-refresh configuration
export const RELOAD_HOUR = 3; // 3am Berlin time
export const TIMEZONE = 'Europe/Berlin';

// Color tokens (matching @theme in index.css, for JS usage)
export const COLORS = {
  bgPrimary: '#0a0a1a',
  bgSecondary: '#151530',
  accentGold: '#FFD700',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  surface: 'rgba(255, 255, 255, 0.1)',
} as const;

// Refresh intervals
export const CLOCK_INTERVAL_MS = 1000; // 1 second

// Content rotation configuration
export const ROTATION_INTERVAL_MS = 15_000; // 15 seconds per panel
export const ROTATION_PANELS = ['transit', 'horoscopes', 'country'] as const;

// Transit configuration
export const TRANSIT_REFRESH_MS = 60_000; // 60 seconds
export const TRANSIT_STALE_MS = 30_000; // 30 seconds

// Horoscope configuration
export const HOROSCOPE_REFRESH_MS = 6 * 60 * 60 * 1000; // 6 hours

// Country configuration
export const COUNTRY_REFRESH_MS = 24 * 60 * 60 * 1000; // 24 hours

// Memory watchdog (Chromium-only)
export const MEMORY_CHECK_INTERVAL_MS = 5 * 60_000; // 5 minutes
export const MEMORY_THRESHOLD_PERCENT = 80; // Force reload above this

// Auto-refresh backup check
export const REFRESH_BACKUP_INTERVAL_MS = 15 * 60_000; // 15 minutes
