import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ABTestingFramework from '@/utils/abTestingFramework';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

// Types pour les hooks A/B Testing
interface ABTestHookResult {
  variant: string;
  isInTest: boolean;
  config?: Record<string, any>;
  isLoading: boolean;
}

interface ABTestConfig {
  testId: string;
  defaultVariant?: string;
  userContext?: Record<string, any>;
}

interface ABTestDefinition {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config?: Record<string, any>;
    isControl?: boolean;
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  trafficAllocation: number;
  targetingRules?: Array<{
    type: 'url' | 'query' | 'cookie' | 'localStorage' | 'userAgent' | 'custom';
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'not';
    value: string | string[];
    customFunction?: (context: any) => boolean;
  }>;
}

// Tests A/B configurés pour CassKai
const CASSKAI_AB_TESTS: ABTestDefinition[] = [
  {
    id: 'landing-page-hero',
    name: 'Landing Page Hero Test',
    status: 'running',
    trafficAllocation: 100,
    variants: [
      {
        id: 'control',
        name: 'Original Hero',
        weight: 50,
        isControl: true,
        config: {
          title: 'CassKai - Gestion Financière PME',
          subtitle: 'Solution complète de gestion financière pour PME et indépendants',
          ctaText: 'Essayer gratuitement',
          ctaStyle: 'primary',
        },
      },
      {
        id: 'variant-a',
        name: 'Hero with Benefits',
        weight: 50,
        config: {
          title: 'Automatisez votre gestion financière en 5 minutes',
          subtitle: 'Plus de 1000 PME nous font confiance pour leur comptabilité, facturation et analyses',
          ctaText: 'Démarrer maintenant',
          ctaStyle: 'gradient',
          showBenefits: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url',
        operator: 'contains',
        value: ['/landing', '/'],
      },
    ],
  },
  {
    id: 'onboarding-flow',
    name: 'Onboarding Flow Optimization',
    status: 'running',
    trafficAllocation: 80,
    variants: [
      {
        id: 'control',
        name: 'Standard Onboarding',
        weight: 40,
        isControl: true,
        config: {
          steps: 4,
          showProgress: true,
          collectCompanyInfo: true,
        },
      },
      {
        id: 'minimal-onboarding',
        name: 'Minimal Onboarding',
        weight: 30,
        config: {
          steps: 2,
          showProgress: false,
          collectCompanyInfo: false,
          deferredSetup: true,
        },
      },
      {
        id: 'guided-onboarding',
        name: 'Guided Onboarding',
        weight: 30,
        config: {
          steps: 5,
          showProgress: true,
          collectCompanyInfo: true,
          showTutorial: true,
          personalizedRecommendations: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url',
        operator: 'contains',
        value: ['/auth', '/signup', '/onboarding'],
      },
    ],
  },
  {
    id: 'dashboard-layout',
    name: 'Dashboard Layout Test',
    status: 'running',
    trafficAllocation: 50,
    variants: [
      {
        id: 'control',
        name: 'Traditional Layout',
        weight: 50,
        isControl: true,
        config: {
          layout: 'traditional',
          sidebarCollapsed: false,
          showQuickActions: true,
        },
      },
      {
        id: 'modern-layout',
        name: 'Modern Compact Layout',
        weight: 50,
        config: {
          layout: 'compact',
          sidebarCollapsed: true,
          showQuickActions: false,
          floatingActionButton: true,
          modernCards: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url',
        operator: 'startsWith',
        value: '/dashboard',
      },
    ],
  },
  {
    id: 'pricing-display',
    name: 'Pricing Display Test',
    status: 'running',
    trafficAllocation: 100,
    variants: [
      {
        id: 'control',
        name: 'Monthly Pricing Focus',
        weight: 33,
        isControl: true,
        config: {
          defaultPeriod: 'monthly',
          highlightSavings: false,
        },
      },
      {
        id: 'annual-focus',
        name: 'Annual Pricing Focus',
        weight: 33,
        config: {
          defaultPeriod: 'annual',
          highlightSavings: true,
          savingsPercent: '20%',
        },
      },
      {
        id: 'value-based',
        name: 'Value-based Pricing',
        weight: 34,
        config: {
          showFeatureComparison: true,
          emphasizeBusinessValue: true,
          roiCalculator: true,
        },
      },
    ],
    targetingRules: [
      {
        type: 'url',
        operator: 'contains',
        value: ['/pricing', '/plans', '/billing'],
      },
    ],
  },
];

// Hook principal pour A/B Testing
export const useABTest = (config: ABTestConfig): ABTestHookResult => {
  const [result, setResult] = useState<ABTestHookResult>({
    variant: config.defaultVariant || 'control',
    isInTest: false,
    isLoading: true,
  });

  const framework = useRef<ABTestingFramework>(ABTestingFramework.getInstance());
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const initializeTest = async () => {
      try {
        // Initialiser le framework si nécessaire
        if (!framework.current.getTest(config.testId)) {
          await framework.current.initialize(CASSKAI_AB_TESTS);
        }

        // Obtenir la variante
        const testResult = framework.current.getVariant(config.testId, config.userContext);
        
        setResult({
          variant: testResult.variantId,
          isInTest: testResult.isInTest,
          config: testResult.config,
          isLoading: false,
        });

        // Analytics : tracker l'exposition au test
        if (testResult.isInTest) {
          trackEvent('AB Test Exposure', {
            test_id: config.testId,
            variant_id: testResult.variantId,
          });
        }

      } catch (error) {
        console.error('[ABTest] Erreur d\'initialisation:', error);
        setResult({
          variant: config.defaultVariant || 'control',
          isInTest: false,
          isLoading: false,
        });
      }
    };

    initializeTest();
  }, [config.testId, config.defaultVariant, trackEvent]);

  return result;
};

// Hook pour tracker les conversions
export const useABTestConversion = () => {
  const framework = useRef<ABTestingFramework>(ABTestingFramework.getInstance());
  const { trackEvent } = useAnalytics();

  const trackConversion = useCallback((
    testId: string, 
    eventName?: string, 
    value?: number, 
    properties?: Record<string, any>
  ) => {
    framework.current.trackConversion(testId, eventName, value, properties);
    
    // Analytics : tracker la conversion
    trackEvent('AB Test Conversion', {
      test_id: testId,
      event_name: eventName || 'default',
      value: value || 0,
      ...properties,
    });
  }, [trackEvent]);

  return { trackConversion };
};

// Hook pour les tests de page d'atterrissage
export const useLandingPageTest = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  
  const { variant, isInTest, config, isLoading } = useABTest({
    testId: 'landing-page-hero',
    defaultVariant: 'control',
  });

  const { trackConversion } = useABTestConversion();

  const trackSignupClick = useCallback(() => {
    if (isInTest) {
      trackConversion('landing-page-hero', 'signup_click');
    }
  }, [isInTest, trackConversion]);

  const trackTrialStart = useCallback(() => {
    if (isInTest) {
      trackConversion('landing-page-hero', 'trial_start', 1);
    }
  }, [isInTest, trackConversion]);

  return {
    variant,
    isInTest: isInTest && isLandingPage,
    config,
    isLoading,
    trackSignupClick,
    trackTrialStart,
  };
};

// Hook pour les tests d'onboarding
export const useOnboardingTest = () => {
  const location = useLocation();
  const isOnboardingPage = ['/auth', '/signup', '/onboarding'].some(path => 
    location.pathname.includes(path)
  );

  const { variant, isInTest, config, isLoading } = useABTest({
    testId: 'onboarding-flow',
    defaultVariant: 'control',
  });

  const { trackConversion } = useABTestConversion();

  const trackStepCompleted = useCallback((stepNumber: number) => {
    if (isInTest) {
      trackConversion('onboarding-flow', 'step_completed', stepNumber);
    }
  }, [isInTest, trackConversion]);

  const trackOnboardingCompleted = useCallback(() => {
    if (isInTest) {
      trackConversion('onboarding-flow', 'onboarding_completed', 1);
    }
  }, [isInTest, trackConversion]);

  const trackOnboardingAbandoned = useCallback((stepNumber: number) => {
    if (isInTest) {
      trackConversion('onboarding-flow', 'onboarding_abandoned', stepNumber);
    }
  }, [isInTest, trackConversion]);

  return {
    variant,
    isInTest: isInTest && isOnboardingPage,
    config,
    isLoading,
    trackStepCompleted,
    trackOnboardingCompleted,
    trackOnboardingAbandoned,
  };
};

// Hook pour les tests de dashboard
export const useDashboardTest = () => {
  const location = useLocation();
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  const { variant, isInTest, config, isLoading } = useABTest({
    testId: 'dashboard-layout',
    defaultVariant: 'control',
  });

  const { trackConversion } = useABTestConversion();

  const trackFeatureUsage = useCallback((feature: string) => {
    if (isInTest) {
      trackConversion('dashboard-layout', 'feature_used', 1, { feature });
    }
  }, [isInTest, trackConversion]);

  const trackEngagementTime = useCallback((seconds: number) => {
    if (isInTest && seconds > 30) { // Seulement si > 30 secondes
      trackConversion('dashboard-layout', 'engagement_time', seconds);
    }
  }, [isInTest, trackConversion]);

  return {
    variant,
    isInTest: isInTest && isDashboardPage,
    config,
    isLoading,
    trackFeatureUsage,
    trackEngagementTime,
  };
};

// Hook pour les tests de pricing
export const usePricingTest = () => {
  const location = useLocation();
  const isPricingPage = ['/pricing', '/plans', '/billing'].some(path => 
    location.pathname.includes(path)
  );

  const { variant, isInTest, config, isLoading } = useABTest({
    testId: 'pricing-display',
    defaultVariant: 'control',
  });

  const { trackConversion } = useABTestConversion();

  const trackPlanClick = useCallback((planId: string, price: number) => {
    if (isInTest) {
      trackConversion('pricing-display', 'plan_selected', price, { plan_id: planId });
    }
  }, [isInTest, trackConversion]);

  const trackCheckoutStarted = useCallback((planId: string, price: number) => {
    if (isInTest) {
      trackConversion('pricing-display', 'checkout_started', price, { plan_id: planId });
    }
  }, [isInTest, trackConversion]);

  return {
    variant,
    isInTest: isInTest && isPricingPage,
    config,
    isLoading,
    trackPlanClick,
    trackCheckoutStarted,
  };
};

// Hook générique pour créer des tests personnalisés
export const useCustomABTest = (testId: string, variants: string[], defaultVariant?: string) => {
  const { variant, isInTest, config, isLoading } = useABTest({
    testId,
    defaultVariant: defaultVariant || variants[0],
  });

  const { trackConversion } = useABTestConversion();

  // Helper pour vérifier si on est dans une variante spécifique
  const isVariant = useCallback((variantId: string) => {
    return isInTest && variant === variantId;
  }, [isInTest, variant]);

  // Helper pour tracker les conversions personnalisées
  const trackCustomConversion = useCallback((eventName: string, value?: number, properties?: Record<string, any>) => {
    if (isInTest) {
      trackConversion(testId, eventName, value, properties);
    }
  }, [isInTest, testId, trackConversion]);

  return {
    variant,
    isInTest,
    config,
    isLoading,
    isVariant,
    trackCustomConversion,
  };
};

// Hook pour obtenir des informations debug sur les tests A/B
export const useABTestDebug = () => {
  const framework = useRef<ABTestingFramework>(ABTestingFramework.getInstance());
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const getDebugInfo = useCallback(() => {
    const info = framework.current.getDebugInfo();
    setDebugInfo(info);
    return info;
  }, []);

  const getAllActiveTests = useCallback(() => {
    return framework.current.getActiveTests();
  }, []);

  return {
    debugInfo,
    getDebugInfo,
    getAllActiveTests,
  };
};

export default useABTest;