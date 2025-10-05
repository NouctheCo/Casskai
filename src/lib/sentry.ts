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
    console.log('📊 Sentry: Skipped (development mode)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in staging

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
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

  console.log('📊 Sentry: Initialized (' + ENV + ')');
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
export function setSentryContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
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
export function addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, any>) {
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
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap a function with error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * withProfiler HOC for performance monitoring
 */
export const withProfiler = Sentry.withProfiler;
