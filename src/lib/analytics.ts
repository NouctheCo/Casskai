/**
 * Analytics utilities for Plausible tracking
 * Privacy-friendly analytics without cookies
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

/**
 * Track a custom event in Plausible Analytics
 * Only tracks in production environment
 * 
 * @param eventName - Name of the event (e.g., "Signup", "Invoice Created")
 * @param props - Optional properties to attach to the event
 * 
 * @example
 * trackEvent('Signup', { plan: 'starter' });
 * trackEvent('Invoice Created', { amount: 150, currency: 'EUR' });
 */
export const trackEvent = (
  eventName: string,
  props?: Record<string, string | number | boolean>
): void => {
  // Only track in production
  if (!import.meta.env.PROD) {
    // Dev mode: ne pas tracker
    return;
  }

  // Check if Plausible script is loaded
  if (typeof window.plausible === 'function') {
    try {
      window.plausible(eventName, { props });
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', error);
    }
  } else {
    console.warn('[Analytics] Plausible not loaded');
  }
};

/**
 * Track a pageview (usually automatic, but can be used for SPAs)
 * Plausible auto-tracks pageviews, this is for manual tracking if needed
 */
export const trackPageview = (url?: string): void => {
  if (!import.meta.env.PROD) {
    return;
  }

  if (typeof window.plausible === 'function') {
    try {
      window.plausible('pageview', url ? { props: { path: url } } : undefined);
    } catch (error) {
      console.warn('[Analytics] Failed to track pageview:', error);
    }
  }
};

/**
 * Predefined events for common actions
 * Use these instead of raw trackEvent calls for consistency
 */
export const analytics = {
  // Authentication events
  signup: (plan: string) => trackEvent('Signup', { plan }),
  login: () => trackEvent('Login'),
  logout: () => trackEvent('Logout'),

  // Subscription events
  subscriptionStarted: (plan: string, amount: number) =>
    trackEvent('Subscription Started', { plan, amount }),
  subscriptionCancelled: (plan: string) =>
    trackEvent('Subscription Cancelled', { plan }),
  subscriptionUpgraded: (oldPlan: string, newPlan: string) =>
    trackEvent('Subscription Upgraded', { old_plan: oldPlan, new_plan: newPlan }),

  // Invoice events
  invoiceCreated: (amount: number, currency: string = 'EUR') =>
    trackEvent('Invoice Created', { amount, currency }),
  invoiceExported: (format: string) =>
    trackEvent('Invoice Exported', { format }),

  // Accounting events
  fecExported: (year: number, entries: number) =>
    trackEvent('FEC Exported', { year, entries }),
  bankSynced: (bank: string, transactions: number) =>
    trackEvent('Bank Synced', { bank, transactions }),
  journalEntryCreated: (type: string, amount: number) =>
    trackEvent('Journal Entry Created', { type, amount }),

  // RGPD events
  dataExported: () => trackEvent('Data Exported'),
  accountDeleted: () => trackEvent('Account Deleted'),
  consentUpdated: (analytics: boolean, marketing: boolean) =>
    trackEvent('Consent Updated', { analytics, marketing }),

  // Feature usage
  dashboardViewed: () => trackEvent('Dashboard Viewed'),
  reportGenerated: (type: string) => trackEvent('Report Generated', { type }),
  helpViewed: (topic: string) => trackEvent('Help Viewed', { topic }),
  feedbackSubmitted: (rating: number) => trackEvent('Feedback Submitted', { rating }),
};
