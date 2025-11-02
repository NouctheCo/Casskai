import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error monitoring
 * Only enabled in production environment
 */
export function initializeSentry() {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const ENV = import.meta.env.MODE;

  // Only initialize if DSN is provided and not in development
  if (!SENTRY_DSN || ENV === 'development') {
  console.warn('📊 Sentry: Skipped (development mode)');
    return;
  }

  // Enhanced config for beta testing (staging environment)
  const isBeta = import.meta.env.VITE_APP_ENV === 'staging' ||
                 import.meta.env.VITE_BETA_FEEDBACK_ENABLED === 'true';

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || ENV,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    // Beta testing: 100% sampling for better debugging
    tracesSampleRate: isBeta
      ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0')
      : (ENV === 'production' ? 0.1 : 1.0),

    // Session Replay
    // Beta testing: Higher replay rate to catch UX issues
    replaysSessionSampleRate: isBeta
      ? parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '1.0')
      : 0.1,
    replaysOnErrorSampleRate: 1.0, // 100% when error occurs

    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore network errors (user's connection issues)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();
        if (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout') ||
          message.includes('aborted')
        ) {
          return null;
        }
      }

      // Ignore ResizeObserver errors (browser bugs)
      if (
        event.message &&
        event.message.includes('ResizeObserver')
      ) {
        return null;
      }

      return event;
    },

    // Enhanced error context
    beforeBreadcrumb(breadcrumb) {
      // Sanitize sensitive data from breadcrumbs
      if (breadcrumb.category === 'console') {
        // Don't log API keys or passwords
        if (breadcrumb.message?.includes('password') || breadcrumb.message?.includes('api_key')) {
          return null;
        }
      }

      return breadcrumb;
    },
  });

  // Tag beta testers for filtering
  if (isBeta) {
    Sentry.setTag('beta_testing', true);
    Sentry.setTag('environment_type', 'staging');
  }

  console.warn(`📊 Sentry: Initialized (${ENV}${isBeta ? ' - BETA MODE' : ''})`);
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom context to errors
 */
export function setSentryContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string = 'custom') {
  // Sentry v8+: startTransaction may not be available on @sentry/react.
  // Prefer startInactiveSpan if available to get a span handle that can be ended manually.
  type SentryCompat = {
    startInactiveSpan?: (options: { name: string; op?: string }) => { end?: () => void };
    startSpan?: (options: { name: string; op?: string }, cb: () => void) => void;
  };
  const anySentry = Sentry as unknown as SentryCompat;
  if (typeof anySentry.startInactiveSpan === 'function') {
    return anySentry.startInactiveSpan({ name, op });
  }
  if (typeof anySentry.startSpan === 'function') {
    // startSpan executes a callback; return a minimal span-like shim
    const span = { end: () => void 0 } as const;
    anySentry.startSpan({ name, op }, () => {
      // we cannot return span from here; provide a no-op shim
    });
    return span;
  }
  // As a last resort, return a no-op span shim to avoid breaking callers
  return { end: () => void 0 } as { end: () => void };
}

/**
 * Wrap a function with error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * withProfiler HOC for performance monitoring
 */
export const withProfiler = Sentry.withProfiler;
