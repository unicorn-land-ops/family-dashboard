import { useState, useEffect, useRef } from 'react';
import {
  ROTATION_INTERVAL_MS,
  TRANSITION_DURATION_MS,
  PHOTO_SIZE_SUFFIX,
} from '../config/photos';

export interface PhotoItem {
  url: string;
  width: number;
  height: number;
}

/** Fisher-Yates in-place shuffle — returns a new shuffled array copy */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface UseGooglePhotosResult {
  photos: PhotoItem[];
  currentIndex: number;
  nextIndex: number;
  isTransitioning: boolean;
  error: string | null;
}

/**
 * Fetches family photos from the Cloudflare Worker, shuffles them, and
 * manages an automatic crossfade rotation timer with prefetching.
 *
 * @param workerUrl - URL of the Cloudflare Worker (e.g. PHOTO_WORKER_URL).
 *   Pass an empty string to disable photo loading entirely.
 */
export function useGooglePhotos(workerUrl: string): UseGooglePhotosResult {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a mutable ref to the photos array length to avoid stale closure in interval
  const photosRef = useRef<PhotoItem[]>([]);

  // Fetch photo list on mount (or when workerUrl changes)
  useEffect(() => {
    if (!workerUrl) return;

    let cancelled = false;

    fetch(workerUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Worker responded ${r.status}`);
        return r.json() as Promise<PhotoItem[]>;
      })
      .then((data) => {
        if (cancelled) return;
        const shuffled = shuffleArray(data);
        photosRef.current = shuffled;
        setPhotos(shuffled);
        setCurrentIndex(0);
        setNextIndex(Math.min(1, shuffled.length - 1));
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Silently degrade — photo frame shows empty placeholder
        setError(err instanceof Error ? err.message : 'Failed to load photos');
      });

    return () => {
      cancelled = true;
    };
  }, [workerUrl]);

  // Rotation timer — only runs when we have at least 2 photos
  useEffect(() => {
    if (photos.length < 2) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);

      const timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % photosRef.current.length;
          // If we've looped back to 0, re-shuffle for variety
          if (next === 0) {
            const reshuffled = shuffleArray(photosRef.current);
            photosRef.current = reshuffled;
            setPhotos(reshuffled);
          }
          return next;
        });
        setNextIndex((prev) => (prev + 1) % photosRef.current.length);
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);

      return () => clearTimeout(timeoutId);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [photos.length]);

  // Prefetch next image before the crossfade begins
  useEffect(() => {
    if (!photos[nextIndex]?.url) return;
    const img = new Image();
    img.src = `${photos[nextIndex].url}${PHOTO_SIZE_SUFFIX}`;
    // img goes out of scope but browser continues loading
  }, [nextIndex, photos]);

  return { photos, currentIndex, nextIndex, isTransitioning, error };
}
