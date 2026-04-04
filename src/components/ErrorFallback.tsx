import { useEffect } from 'react';
import type { FallbackProps } from 'react-error-boundary';

/**
 * Panel-level fallback — shows inline error with retry button.
 * Used for individual panel ErrorBoundaries (calendar, timers, etc.)
 */
export function PanelFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="card-glass p-4 text-center">
      <p className="text-sm" style={{ color: 'var(--fd-text-2)' }}>Something went wrong</p>
      <button
        onClick={resetErrorBoundary}
        className="text-xs underline mt-2"
        style={{ color: 'var(--fd-accent)' }}
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Global fallback — full-screen message with auto-reload after 30s.
 * Used for the outermost ErrorBoundary wrapping the entire app.
 */
export function GlobalFallback({ error }: FallbackProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, 120_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--fd-bg-1)', color: 'var(--fd-text-1)' }}>
      <p className="text-xl font-semibold">Dashboard will restart shortly...</p>
      <p className="text-secondary text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );
}

/**
 * Error logger matching react-error-boundary's onError signature.
 * Logs component stack for debugging panel crashes.
 */
export function logError(error: unknown, info: { componentStack?: string | null }) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ErrorBoundary]', message, info.componentStack);
}
