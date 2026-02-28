import { useState, useEffect } from 'react';
import { type NewsHeadline } from '../lib/news/types';
import { NEWS_WORKER_URL, NEWS_REFRESH_MS } from '../lib/news/config';

interface UseNewsTickerResult {
  headlines: NewsHeadline[];
  loading: boolean;
  error: Error | null;
}

export function useNewsTicker(): UseNewsTickerResult {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Graceful no-op when env var not set
    if (!NEWS_WORKER_URL) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchHeadlines() {
      try {
        const res = await fetch(NEWS_WORKER_URL);
        if (!res.ok) throw new Error(`News proxy returned ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setHeadlines(data.headlines ?? []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          // Keep previous headlines on error — ticker keeps scrolling stale data
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchHeadlines();

    const interval = setInterval(fetchHeadlines, NEWS_REFRESH_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { headlines, loading, error };
}
