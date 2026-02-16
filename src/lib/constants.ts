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
