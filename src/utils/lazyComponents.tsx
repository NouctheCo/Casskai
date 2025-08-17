/* eslint-disable react-refresh/only-export-components */
import React, { lazy, ComponentType, useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyWithPreload<T extends ComponentType<any>> = React.LazyExoticComponent<T> & {
  preload?: () => Promise<{ default: T }>;
};

// Configuration du préchargement intelligent
interface LazyComponentConfig {
  priority: 'high' | 'medium' | 'low';
  preloadCondition?: () => boolean;
  chunkName?: string;
}

// Utilitaire pour créer des composants lazy avec préchargement intelligent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  config: LazyComponentConfig = { priority: 'medium' }
) {
  const LazyComponent = lazy(() => {
    try {
      // Précharger si la condition est remplie
      if (config.preloadCondition?.()) {
        return factory();
      }
      
      // Délai stratégique selon la priorité
      const delay = {
        high: 0,
        medium: 100,
        low: 200
      }[config.priority] || 100;
      
      return new Promise<{ default: T }>((resolve, reject) => {
        setTimeout(() => {
          factory()
            .then(resolve)
            .catch(reject);
        }, delay);
      });
    } catch (error) {
      console.error('Error in lazy component factory:', error);
      throw error;
    }
  }) as LazyWithPreload<T>;

  // Méthode pour précharger manuellement
  LazyComponent.preload = () => factory();
  
  return LazyComponent;
}

// Composants lazy avec préchargement intelligent
export const LazyDashboardPage = createLazyComponent(
  () => import('@/pages/DashboardPage'),
  { 
    priority: 'high',
    preloadCondition: () => window.location.pathname === '/' || localStorage.getItem('user') !== null,
    chunkName: 'dashboard'
  }
);

export const LazyAccountingPage = createLazyComponent(
  () => import('@/pages/AccountingPage'),
  { 
    priority: 'high',
    preloadCondition: () => document.querySelector('[data-accounting-access]') !== null,
    chunkName: 'accounting'
  }
);

export const LazyInvoicingPage = createLazyComponent(
  () => import('@/pages/InvoicingPage'),
  { 
    priority: 'medium',
    chunkName: 'invoicing'
  }
);

export const LazyBanksPage = createLazyComponent(
  () => import('@/pages/BanksPage'),
  { 
    priority: 'medium',
    chunkName: 'banks'
  }
);

export const LazyReportsPage = createLazyComponent(
  () => import('@/pages/ReportsPage'),
  { 
    priority: 'medium',
    chunkName: 'reports'
  }
);

export const LazySettingsPage = createLazyComponent(
  () => import('@/pages/SettingsPage'),
  { 
    priority: 'low',
    chunkName: 'settings'
  }
);

export const LazyAuthPage = createLazyComponent(
  () => import('@/pages/AuthPage'),
  { 
    priority: 'high',
    preloadCondition: () => !localStorage.getItem('supabase.auth.token'),
    chunkName: 'auth'
  }
);

export const LazyLandingPage = createLazyComponent(
  () => import('@/pages/LandingPage'),
  { 
    priority: 'high',
    preloadCondition: () => window.location.pathname === '/',
    chunkName: 'landing'
  }
);

// Pages secondaires
export const LazyInventoryPage = createLazyComponent(
  () => import('@/pages/InventoryPage'),
  { priority: 'low', chunkName: 'inventory' }
);

export const LazyProjectsPage = createLazyComponent(
  () => import('@/pages/ProjectsPage'),
  { priority: 'low', chunkName: 'projects' }
);

export const LazyHumanResourcesPage = createLazyComponent(
  () => import('@/pages/HumanResourcesPage'),
  { priority: 'low', chunkName: 'hr' }
);

export const LazyUserManagementPage = createLazyComponent(
  () => import('@/pages/UserManagementPage'),
  { priority: 'low', chunkName: 'user-management' }
);

// Nouvelles pages
export const LazyTaxPage = createLazyComponent(
  () => import('@/pages/TaxPage'),
  { priority: 'medium', chunkName: 'tax' }
);

export const LazyThirdPartiesPage = createLazyComponent(
  () => import('@/pages/ThirdPartiesPage'),
  { priority: 'medium', chunkName: 'third-parties' }
);

export const LazyPurchasesPage = createLazyComponent(
  () => import('@/pages/PurchasesPage'),
  { priority: 'medium', chunkName: 'purchases' }
);

export const LazyForecastsPage = createLazyComponent(
  () => import('@/pages/ForecastsPage'),
  { priority: 'low', chunkName: 'forecasts' }
);

export const LazySalesCrmPage = createLazyComponent(
  () => import('@/pages/SalesCrmPage'),
  { priority: 'medium', chunkName: 'crm' }
);

export const LazyContractsPage = createLazyComponent(
  () => import('@/pages/ContractsPage'),
  { priority: 'low', chunkName: 'contracts' }
);

export const LazyOnboardingPage = createLazyComponent(
  () => import('@/pages/OnboardingPage'),
  { priority: 'high', chunkName: 'onboarding' }
);

export const LazyBillingPage = createLazyComponent(
  () => import('@/pages/BillingPage'),
  { priority: 'low', chunkName: 'billing' }
);

// Préchargement intelligent basé sur l'interaction utilisateur
export const initializeIntelligentPreloading = () => {
  // Précharger au survol des liens de navigation
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.dataset.preload !== 'false') {
      const href = link.getAttribute('href');
      preloadRouteComponent(href);
    }
  });

  // Précharger pendant les temps d'inactivité
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadLowPriorityComponents();
    });
  }

  // Précharger selon la connexion réseau
  if ('connection' in navigator) {
    type NetworkInformation = { effectiveType?: string; saveData?: boolean };
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection && connection.effectiveType === '4g' && !connection.saveData) {
      preloadMediumPriorityComponents();
    }
  }
};

// Préchargement par route
const preloadRouteComponent = (path: string | null) => {
  if (!path) return;

  const routeMap: Record<string, () => void> = {
    '/dashboard': () => LazyDashboardPage.preload?.(),
    '/accounting': () => LazyAccountingPage.preload?.(),
    '/invoicing': () => LazyInvoicingPage.preload?.(),
    '/banks': () => LazyBanksPage.preload?.(),
    '/reports': () => LazyReportsPage.preload?.(),
    '/settings': () => LazySettingsPage.preload?.(),
    '/auth': () => LazyAuthPage.preload?.(),
    '/inventory': () => LazyInventoryPage.preload?.(),
    '/projects': () => LazyProjectsPage.preload?.(),
    '/hr': () => LazyHumanResourcesPage.preload?.(),
    '/users': () => LazyUserManagementPage.preload?.(),
    '/tax': () => LazyTaxPage.preload?.(),
    '/third-parties': () => LazyThirdPartiesPage.preload?.(),
    '/purchases': () => LazyPurchasesPage.preload?.(),
    '/forecasts': () => LazyForecastsPage.preload?.(),
    '/crm': () => LazySalesCrmPage.preload?.(),
    '/contracts': () => LazyContractsPage.preload?.(),
    '/onboarding': () => LazyOnboardingPage.preload?.(),
    '/billing': () => LazyBillingPage.preload?.(),
  };

  const preloader = routeMap[path];
  if (preloader) {
    preloader();
  }
};

// Préchargement des composants de priorité moyenne
const preloadMediumPriorityComponents = () => {
  LazyInvoicingPage.preload?.();
  LazyBanksPage.preload?.();
  LazyReportsPage.preload?.();
  LazyTaxPage.preload?.();
  LazyThirdPartiesPage.preload?.();
  LazyPurchasesPage.preload?.();
  LazySalesCrmPage.preload?.();
};

// Préchargement des composants de faible priorité
const preloadLowPriorityComponents = () => {
  LazyInventoryPage.preload?.();
  LazyProjectsPage.preload?.();
  LazyHumanResourcesPage.preload?.();
  LazyUserManagementPage.preload?.();
  LazySettingsPage.preload?.();
  LazyForecastsPage.preload?.();
  LazyContractsPage.preload?.();
  LazyBillingPage.preload?.();
};

// Hook pour les statistiques de performance
export const useChunkLoadingStats = () => {
  const [stats, setStats] = useState({
    totalChunks: 0,
    loadedChunks: 0,
    failedChunks: 0,
    averageLoadTime: 0
  });

  useEffect(() => {
    // Vérifier si webpack est disponible
    const w = window as unknown as { __webpack_require__?: { e?: (chunkId: string) => Promise<unknown> } };
    if (typeof window === 'undefined' || !w.__webpack_require__?.e) {
      return;
    }

    if (!w.__webpack_require__ || !w.__webpack_require__.e) {
      return;
    }
    const originalMethod = w.__webpack_require__.e;
    const loadTimes: number[] = [];

    w.__webpack_require__.e = function(chunkId: string) {
      const startTime = performance.now();
      
      return originalMethod.call(this, chunkId)
        .then((result: unknown) => {
          const loadTime = performance.now() - startTime;
          loadTimes.push(loadTime);
          
          setStats(prev => ({
            ...prev,
            totalChunks: prev.totalChunks + 1,
            loadedChunks: prev.loadedChunks + 1,
            averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
          }));
          
          return result as unknown;
        })
        .catch((error: Error) => {
          setStats(prev => ({
            ...prev,
            totalChunks: prev.totalChunks + 1,
            failedChunks: prev.failedChunks + 1
          }));
          throw error;
        });
    };

    return () => {
      if (w.__webpack_require__) {
        w.__webpack_require__.e = originalMethod;
      }
    };
  }, []);

  return stats;
};