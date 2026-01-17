/**
 * Extension des types globaux Window
 * Pour Google Analytics, Sentry, Plausible, etc.
 */

interface Window {
  // Google Analytics 4
  gtag?: (
    command: 'config' | 'event' | 'consent',
    targetId: string,
    config?: Record<string, unknown>
  ) => void;

  // Plausible Analytics
  plausible?: (
    eventName: string,
    options?: { 
      props?: Record<string, string | number | boolean | any>;
      u?: string;
      callback?: () => void;
    }
  ) => void;

  // Sentry Error Tracking
  Sentry?: {
    setUser: (user: Record<string, unknown>) => void;
    captureException: (error: Error) => void;
    captureMessage: (message: string) => void;
  };

  // Debug/maintenance helpers
  fixUnaccentExtension?: () => Promise<unknown>;
}
