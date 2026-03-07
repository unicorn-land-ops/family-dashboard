/**
 * Photo frame configuration constants.
 *
 * PHOTO_WORKER_URL reads from VITE_PHOTOS_WORKER_URL env var.
 * If not set, the photo frame renders as an empty placeholder (no crash).
 */

/** Cloudflare Worker URL that proxies Google Photos album requests */
export const PHOTO_WORKER_URL: string =
  import.meta.env.VITE_PHOTOS_WORKER_URL ?? '';

/** How long each photo is displayed before crossfading to the next (5 minutes) */
export const ROTATION_INTERVAL_MS: number = 5 * 60 * 1000;

/** Duration of the CSS crossfade opacity transition (must match CSS transition value) */
export const TRANSITION_DURATION_MS: number = 1800;

/**
 * Google Photos URL size parameter for portrait kiosk resolution.
 *
 * CRITICAL: Without this suffix, Google returns tiny thumbnail images.
 * Append to any lh3.googleusercontent.com URL before setting as <img src>.
 */
export const PHOTO_SIZE_SUFFIX: string = '=w1080-h1920';
