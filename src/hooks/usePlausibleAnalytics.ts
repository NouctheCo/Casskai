import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Interface pour les événements personnalisés
interface PlausibleEventProps {
  [key: string]: string | number | boolean;
}

interface PlausibleGoalProps {
  revenue?: {
    amount: string;
    currency: string;
  };
  [key: string]: any;
}

interface PlausibleConfig {
  domain: string;
  apiHost?: string;
  trackLocalhost?: boolean;
  excludePaths?: string[];
  enableAutoOutboundTracking?: boolean;
  enableAutoFileDownloads?: boolean;
  hashMode?: boolean;
  manualPageviews?: boolean;
}

// Configuration par défaut pour Plausible
const DEFAULT_CONFIG: PlausibleConfig = {
  domain: 'app.casskai.fr',
  apiHost: 'https://plausible.io',
  trackLocalhost: false,
  excludePaths: ['/admin', '/api'],
  enableAutoOutboundTracking: true,
  enableAutoFileDownloads: true,
  hashMode: false,
  manualPageviews: false,
};

// Service Plausible Analytics
class PlausibleService {
  private static instance: PlausibleService;
  private config: PlausibleConfig;
  private isLoaded: boolean = false;
  private queue: Array<() => void> = [];

  private constructor(config: Partial<PlausibleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializePlausible();
  }

  static getInstance(config?: Partial<PlausibleConfig>): PlausibleService {
    if (!PlausibleService.instance) {
      PlausibleService.instance = new PlausibleService(config);
    }
    return PlausibleService.instance;
  }

  private async initializePlausible(): Promise<void> {
    // Éviter le chargement en mode développement local sauf si explicitement autorisé
    if (
      !this.config.trackLocalhost && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '0.0.0.0')
    ) {
      console.log('[Plausible] Tracking désactivé en développement local');
      return;
    }

    try {
      // Créer le script Plausible
      const script = document.createElement('script');
      script.defer = true;
      script.async = true;
      
      // Configuration des extensions Plausible
      const extensions = [];
      if (this.config.enableAutoOutboundTracking) extensions.push('outbound-links');
      if (this.config.enableAutoFileDownloads) extensions.push('file-downloads');
      if (this.config.hashMode) extensions.push('hash');
      if (this.config.manualPageviews) extensions.push('manual');

      const extensionSuffix = extensions.length > 0 ? `.${  extensions.join('.')}` : '';
      script.src = `${this.config.apiHost}/js/plausible${extensionSuffix}.js`;
      
      script.setAttribute('data-domain', this.config.domain);
      
      if (this.config.apiHost !== 'https://plausible.io') {
        script.setAttribute('data-api', `${this.config.apiHost}/api/event`);
      }

      // Chemins à exclure
      if (this.config.excludePaths && this.config.excludePaths.length > 0) {
        script.setAttribute('data-exclude', this.config.excludePaths.join(','));
      }

      // Événement de chargement
      script.onload = () => {
        this.isLoaded = true;
        this.processQueue();
        console.log('[Plausible] Analytics chargé avec succès');
      };

      script.onerror = () => {
        console.error('[Plausible] Échec du chargement du script analytics');
      };

      // Ajouter le script au DOM
      document.head.appendChild(script);

      // Créer l'objet plausible global si il n'existe pas
      if (!window.plausible) {
        window.plausible = this.createPlausibleProxy();
      }

    } catch (error) {
      console.error('[Plausible] Erreur lors de l\'initialisation:', error);
    }
  }

  private createPlausibleProxy() {
    return (...args: any[]) => {
      if (this.isLoaded) {
        // Si Plausible est chargé, utiliser la fonction native
        if (window.plausible && typeof window.plausible === 'function') {
          return window.plausible.apply(null, args);
        }
      } else {
        // Sinon, mettre en queue
        this.queue.push(() => {
          if (window.plausible && typeof window.plausible === 'function') {
            window.plausible.apply(null, args);
          }
        });
      }
    };
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) fn();
    }
  }

  // Suivre une page vue
  trackPageview(url?: string): void {
    if (!this.shouldTrack()) return;

    const pageUrl = url || window.location.pathname + window.location.search;
    
    if (window.plausible) {
      window.plausible('pageview', { u: pageUrl });
    }
  }

  // Suivre un événement personnalisé
  trackEvent(eventName: string, props?: PlausibleEventProps): void {
    if (!this.shouldTrack()) return;

    if (window.plausible) {
      if (props && Object.keys(props).length > 0) {
        window.plausible(eventName, { props });
      } else {
        window.plausible(eventName);
      }
    }
  }

  // Suivre un goal avec revenue
  trackGoal(goalName: string, props?: PlausibleGoalProps): void {
    if (!this.shouldTrack()) return;

    if (window.plausible) {
      const goalProps: any = { ...props };
      
      // Gérer les revenue goals
      if (props?.revenue) {
        goalProps.revenue = props.revenue;
      }

      if (Object.keys(goalProps).length > 0) {
        window.plausible(goalName, { props: goalProps });
      } else {
        window.plausible(goalName);
      }
    }
  }

  // Vérifier si on doit tracker
  private shouldTrack(): boolean {
    // Respecter Do Not Track
    if (navigator.doNotTrack === '1' || 
        (window as any).doNotTrack === '1' || 
        navigator.msDoNotTrack === '1') {
      return false;
    }

    // Vérifier les chemins exclus
    const currentPath = window.location.pathname;
    if (this.config.excludePaths?.some(path => currentPath.startsWith(path))) {
      return false;
    }

    return true;
  }

  // Obtenir la configuration actuelle
  getConfig(): PlausibleConfig {
    return { ...this.config };
  }

  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<PlausibleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Hook principal pour Plausible Analytics
export const usePlausibleAnalytics = (config?: Partial<PlausibleConfig>) => {
  const location = useLocation();
  const [service] = useState(() => PlausibleService.getInstance(config));
  const [isReady, setIsReady] = useState(false);

  // Initialisation
  useEffect(() => {
    // Vérifier si Plausible est déjà chargé ou en cours de chargement
    const checkReady = () => {
      if (window.plausible) {
        setIsReady(true);
      } else {
        // Retry après un délai
        setTimeout(checkReady, 100);
      }
    };
    
    checkReady();
  }, []);

  // Suivre les changements de page automatiquement
  useEffect(() => {
    if (isReady && !config?.manualPageviews) {
      service.trackPageview();
    }
  }, [location, isReady, service, config?.manualPageviews]);

  // Fonctions d'API
  const trackPageview = useCallback((url?: string) => {
    service.trackPageview(url);
  }, [service]);

  const trackEvent = useCallback((eventName: string, props?: PlausibleEventProps) => {
    service.trackEvent(eventName, props);
  }, [service]);

  const trackGoal = useCallback((goalName: string, props?: PlausibleGoalProps) => {
    service.trackGoal(goalName, props);
  }, [service]);

  return {
    trackPageview,
    trackEvent,
    trackGoal,
    isReady,
    service,
  };
};

// Hook pour tracker les conversions e-commerce
export const useEcommerceTracking = () => {
  const { trackGoal } = usePlausibleAnalytics();

  const trackPurchase = useCallback((amount: string, currency: string = 'EUR', orderId?: string) => {
    trackGoal('Purchase', {
      revenue: { amount, currency },
      order_id: orderId,
    });
  }, [trackGoal]);

  const trackSignup = useCallback((plan?: string) => {
    trackGoal('Signup', plan ? { plan } : undefined);
  }, [trackGoal]);

  const trackSubscription = useCallback((plan: string, amount: string, currency: string = 'EUR') => {
    trackGoal('Subscription', {
      revenue: { amount, currency },
      plan,
    });
  }, [trackGoal]);

  const trackTrialStart = useCallback((plan?: string) => {
    trackGoal('Trial Start', plan ? { plan } : undefined);
  }, [trackGoal]);

  const trackFeatureUsage = useCallback((feature: string, context?: string) => {
    trackGoal('Feature Used', {
      feature,
      context: context || 'general',
    });
  }, [trackGoal]);

  return {
    trackPurchase,
    trackSignup,
    trackSubscription,
    trackTrialStart,
    trackFeatureUsage,
  };
};

// Hook pour tracker l'engagement utilisateur
export const useEngagementTracking = () => {
  const { trackEvent } = usePlausibleAnalytics();

  const trackFileDownload = useCallback((filename: string, type?: string) => {
    trackEvent('File Download', {
      filename,
      type: type || 'unknown',
    });
  }, [trackEvent]);

  const trackOutboundLink = useCallback((url: string, context?: string) => {
    trackEvent('Outbound Link', {
      url,
      context: context || 'general',
    });
  }, [trackEvent]);

  const trackFormSubmission = useCallback((formName: string, success: boolean = true) => {
    trackEvent('Form Submission', {
      form: formName,
      status: success ? 'success' : 'error',
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, results?: number) => {
    trackEvent('Search', {
      query,
      results: results || 0,
    });
  }, [trackEvent]);

  const trackTimeSpent = useCallback((section: string, seconds: number) => {
    trackEvent('Time Spent', {
      section,
      duration: Math.round(seconds),
    });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage?: string) => {
    trackEvent('Error Occurred', {
      type: errorType,
      message: errorMessage || 'Unknown error',
    });
  }, [trackEvent]);

  return {
    trackFileDownload,
    trackOutboundLink,
    trackFormSubmission,
    trackSearch,
    trackTimeSpent,
    trackError,
  };
};

// Hook pour respecter les préférences de confidentialité
export const usePrivacyCompliantTracking = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isConsentLoaded, setIsConsentLoaded] = useState(false);

  useEffect(() => {
    // Vérifier les préférences de confidentialité stockées
    const consent = localStorage.getItem('analytics-consent');
    const doNotTrack = navigator.doNotTrack === '1';
    
    setHasConsent(consent === 'granted' && !doNotTrack);
    setIsConsentLoaded(true);
  }, []);

  const grantConsent = useCallback(() => {
    localStorage.setItem('analytics-consent', 'granted');
    setHasConsent(true);
  }, []);

  const revokeConsent = useCallback(() => {
    localStorage.setItem('analytics-consent', 'revoked');
    setHasConsent(false);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem('analytics-consent');
    setHasConsent(false);
  }, []);

  return {
    hasConsent,
    isConsentLoaded,
    grantConsent,
    revokeConsent,
    resetConsent,
  };
};

// Déclaration des types pour le global window
declare global {
  interface Window {
    plausible?: (event: string, options?: { 
      props?: Record<string, any>;
      u?: string;
      callback?: () => void;
    }) => void;
  }
}

export default usePlausibleAnalytics;