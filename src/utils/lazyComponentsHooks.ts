import React, { useState, useEffect, useCallback } from 'react';
import {
    LazyDashboardPage,
    LazyAccountingPage,
    LazyInvoicingPage,
    LazyBanksPage,
    LazyReportsPage,
    LazySettingsPage,
    LazyAuthPage,
    LazyInventoryPage,
    LazyProjectsPage,
    LazyHumanResourcesPage,
    LazyUserManagementPage,
    LazyTaxPage,
    LazyThirdPartiesPage,
    LazyPurchasesPage,
    LazyForecastsPage,
    LazySalesCrmPage,
    LazyContractsPage,
    LazyOnboardingPage,
    LazyBillingPage
} from './lazyComponents';

interface NavigatorWithConnection extends Navigator {
    connection?: {
      effectiveType: string;
      saveData: boolean;
    };
  }
  
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
    const navigatorWithConnection = navigator as NavigatorWithConnection;
    if (navigatorWithConnection.connection) {
      const connection = navigatorWithConnection.connection;
      if (connection.effectiveType === '4g' && !connection.saveData) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = typeof window !== 'undefined' ? (window as unknown) : undefined;
      if (!w || !w.__webpack_require__?.e) {
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
            
            return result;
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
        if (w && w.__webpack_require__) {
          w.__webpack_require__.e = originalMethod;
        }
      };
    }, []);
  
    return stats;
  };
  