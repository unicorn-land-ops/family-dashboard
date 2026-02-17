/**
 * Global error handlers for unhandled JS errors and promise rejections.
 * Logs structured context to console for kiosk debugging.
 */

export function setupGlobalErrorHandlers(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GlobalError]', {
      message,
      source,
      lineno,
      colno,
      error,
    });
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    console.error('[UnhandledRejection]', event.reason);
  });
}
