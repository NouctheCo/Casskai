import React, { createContext, useContext, useEffect, useState } from 'react';
import ABTestingFramework, { UserContext as ABTestUserContext } from '@/utils/abTestingFramework';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

// Types pour A/B Testing - on utilise le type du framework
type UserContext = Partial<ABTestUserContext> & {
  companyId?: string;
  subscription?: string;
  locale?: string;
};

interface TestVariantConfig {
  [key: string]: string | number | boolean | undefined;
}

interface TestVariantResult {
  variant: string;
  isInTest: boolean;
  config?: TestVariantConfig;
}

interface ConversionProperties {
  [key: string]: string | number | boolean;
}

// Context pour A/B Testing
interface ABTestContextType {
  framework: ABTestingFramework;
  isInitialized: boolean;
  getVariant: (testId: string, userContext?: UserContext) => TestVariantResult;
  trackConversion: (testId: string, eventName?: string, value?: number, properties?: ConversionProperties) => void;
}

const ABTestContext = createContext<ABTestContextType | null>(null);

// Configuration des tests A/B pour CassKai
const AB_TESTS_CONFIG = [
  {
    id: 'landing-page-cta',
    name: 'Landing Page CTA Test',
    description: 'Test différents styles de CTA sur la page d\'accueil',
    status: 'running' as const,
    trafficAllocation: 100,
    variants: [
      {
        id: 'control',
        name: 'CTA Original',
        weight: 50,
        isControl: true,
        config: {
          ctaText: 'Essayer gratuitement',
          ctaStyle: 'primary',
          showFeatures: false,
        },
      },
      {
        id: 'urgent-cta',
        name: 'CTA avec Urgence',
        weight: 50,
        config: {
          ctaText: 'Commencer maintenant - Gratuit',
          ctaStyle: 'gradient',
          showFeatures: true,
          urgencyText: 'Rejoignez plus de 1000 PME',
        },
      },
    ],
    targetingRules: [
      {
        type: 'url' as const,
        operator: 'contains' as const,
        value: ['/landing', '/'],
      },
    ],
    metrics: ['cta_clicks', 'signups', 'trial_starts'],
  },
  {
    id: 'signup-form',
    name: 'Signup Form Optimization',
    description: 'Test différentes versions du formulaire d\'inscription',
    status: 'running' as const,
    trafficAllocation: 80,
    variants: [
      {
        id: 'control',
        name: 'Formulaire Standard',
        weight: 33,
        isControl: true,
        config: {
          fields: ['email', 'password', 'company'],
          socialAuth: false,
          progressIndicator: false,
        },
      },
      {
        id: 'minimal-form',
        name: 'Formulaire Minimal',
        weight: 33,
        config: {
          fields: ['email', 'password'],
          socialAuth: true,
          progressIndicator: false,
          deferredInfo: true,
        },
      },
      {
        id: 'social-first',
        name: 'Social Auth First',
        weight: 34,
        config: {
          fields: ['email', 'password'],
          socialAuth: true,
          socialFirst: true,
          progressIndicator: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url' as const,
        operator: 'contains' as const,
        value: ['/signup', '/register', '/auth'],
      },
    ],
    metrics: ['form_starts', 'form_completions', 'signup_success'],
  },
  {
    id: 'dashboard-widgets',
    name: 'Dashboard Widgets Layout',
    description: 'Test différentes dispositions des widgets du dashboard',
    status: 'running' as const,
    trafficAllocation: 60,
    variants: [
      {
        id: 'control',
        name: 'Layout Classique',
        weight: 50,
        isControl: true,
        config: {
          layout: 'grid-2x3',
          widgetSizes: 'uniform',
          showWelcome: true,
        },
      },
      {
        id: 'dynamic-layout',
        name: 'Layout Dynamique',
        weight: 50,
        config: {
          layout: 'masonry',
          widgetSizes: 'adaptive',
          showWelcome: false,
          smartRecommendations: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url' as const,
        operator: 'startsWith' as const,
        value: '/dashboard',
      },
    ],
    metrics: ['widget_interactions', 'time_on_dashboard', 'feature_adoption'],
  },
  {
    id: 'pricing-strategy',
    name: 'Pricing Strategy Test',
    description: 'Test différentes stratégies de présentation des prix',
    status: 'running' as const,
    trafficAllocation: 100,
    variants: [
      {
        id: 'control',
        name: 'Prix Mensuel',
        weight: 25,
        isControl: true,
        config: {
          defaultPeriod: 'monthly',
          showDiscount: false,
          emphasizePopular: false,
        },
      },
      {
        id: 'annual-focus',
        name: 'Focus Annuel',
        weight: 25,
        config: {
          defaultPeriod: 'annual',
          showDiscount: true,
          discountBadge: '2 mois offerts',
          emphasizePopular: false,
        },
      },
      {
        id: 'value-emphasis',
        name: 'Emphase sur la Valeur',
        weight: 25,
        config: {
          showROI: true,
          featureComparison: true,
          customerTestimonials: true,
          emphasizePopular: true,
        },
      },
      {
        id: 'freemium-focus',
        name: 'Focus Freemium',
        weight: 25,
        config: {
          highlightFreePlan: true,
          freeTrialDays: 30,
          noCreditCard: true,
          upgradeIncentives: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url' as const,
        operator: 'contains' as const,
        value: ['/pricing', '/plans'],
      },
    ],
    metrics: ['plan_clicks', 'checkout_starts', 'conversions'],
  },
  {
    id: 'mobile-navigation',
    name: 'Mobile Navigation Test',
    description: 'Test différents styles de navigation mobile',
    status: 'running' as const,
    trafficAllocation: 90,
    variants: [
      {
        id: 'control',
        name: 'Menu Hamburger',
        weight: 50,
        isControl: true,
        config: {
          navStyle: 'hamburger',
          position: 'top-right',
          animation: 'slide',
        },
      },
      {
        id: 'bottom-nav',
        name: 'Navigation Bottom',
        weight: 50,
        config: {
          navStyle: 'bottom-tabs',
          position: 'bottom',
          animation: 'fade',
          quickActions: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'custom' as const,
        operator: 'equals' as const,
        value: 'mobile',
        customFunction: (_context: UserContext) => {
          return window.innerWidth <= 768;
        },
      },
    ],
    metrics: ['navigation_usage', 'page_depth', 'session_duration'],
  },
];

// Provider pour A/B Testing
export const ABTestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [framework] = useState(() => ABTestingFramework.getInstance({
    persistentStorage: true,
    analyticsIntegration: true,
    flushInterval: 5000,
    maxQueueSize: 50,
    hashSalt: 'casskai-ab-2024',
  }));
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Utiliser le hook analytics de manière conditionnelle
  let trackEvent: ((eventName: string, props?: ConversionProperties) => void) | null = null;
  try {
    const analytics = useAnalytics();
    trackEvent = analytics.trackEvent;
  } catch (error) {
    // AnalyticsProvider n'est pas disponible, créer un fallback
    console.warn('[ABTest] Analytics non disponible:', error instanceof Error ? error.message : String(error));
    trackEvent = () => {
      console.warn('[ABTest] Analytics non disponible, événement ignoré');
    };
  }

  useEffect(() => {
    const initializeFramework = async () => {
      try {
        await framework.initialize(AB_TESTS_CONFIG);
        setIsInitialized(true);
        console.warn('[ABTest] Framework A/B Testing initialisé');
      } catch (error) {
        console.error('[ABTest] Erreur d\'initialisation:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeFramework();
  }, [framework]);

  const getVariant = (testId: string, userContext?: UserContext) => {
    if (!isInitialized) {
      return { variant: 'control', isInTest: false };
    }

    const result = framework.getVariant(testId, userContext);
    
    // Analytics: tracker l'exposition si c'est la première fois
    if (result.isInTest && trackEvent) {
      trackEvent('AB Test Assigned', {
        test_id: testId,
        variant_id: result.variantId,
        is_control: result.variantId === 'control',
      });
    }

    return {
      variant: result.variantId,
      isInTest: result.isInTest,
      config: result.config as TestVariantConfig,
    };
  };

  const trackConversion = (testId: string, eventName?: string, value?: number, properties?: ConversionProperties) => {
    if (!isInitialized) return;

    framework.trackConversion(testId, eventName, value, properties);
    
    // Analytics: tracker la conversion
    if (trackEvent) {
      trackEvent('AB Test Conversion', {
        test_id: testId,
        event_name: eventName || 'default',
        value: value || 0,
        ...properties,
      });
    }
  };

  const contextValue: ABTestContextType = {
    framework,
    isInitialized,
    getVariant,
    trackConversion,
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
};

// Hook pour utiliser le contexte A/B Testing
export const useABTestContext = () => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTestContext must be used within an ABTestProvider');
  }
  return context;
};

// Composant pour afficher les informations de debug des tests A/B
export const ABTestDebugPanel: React.FC<{ isVisible?: boolean }> = ({ isVisible = false }) => {
  const { framework, isInitialized } = useABTestContext();
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (isInitialized && isVisible) {
      const info = framework.getDebugInfo();
      setDebugInfo(info);
    }
  }, [framework, isInitialized, isVisible]);

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">A/B Tests Debug</h3>
      {debugInfo && (
        <div className="text-xs space-y-1">
          <div>Tests: {String(debugInfo.activeTestsCount)}/{String(debugInfo.testsCount)}</div>
          <div>Session: {String(debugInfo.sessionId)?.slice(-8)}</div>
          <div>Assignments: {String(debugInfo.assignmentsCount)}</div>
          <div>Queue: {String(debugInfo.queuedEventsCount)}</div>
        </div>
      )}
      
      {isInitialized && (
        <div className="mt-2 text-xs">
          <div className="font-semibold">Tests Actifs:</div>
          {framework.getActiveTests().map(test => (
            <div key={test.id} className="ml-2">
              {test.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// HOC pour wrapper des composants avec A/B Testing
export function withABTest<P extends object>(
  Component: React.ComponentType<P>,
  testId: string,
  variantProp: string = 'variant'
) {
  return React.forwardRef<React.ComponentRef<typeof Component>, P>((props, ref) => {
    const { getVariant } = useABTestContext();
    const { variant, config } = getVariant(testId);

    const enhancedProps = {
      ...props,
      [variantProp]: variant,
      [`${variantProp}Config`]: config,
    } as P & Record<string, unknown>;

    return <Component {...enhancedProps} ref={ref} />;
  });
}

export default ABTestProvider;
