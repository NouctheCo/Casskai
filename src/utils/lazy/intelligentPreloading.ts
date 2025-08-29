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
    LazyBillingPage,
    LazyLandingPage
  } from './lazyPages';
  
  // Préchargement par route
  const preloadRouteComponent = (path: string | null) => {
    if (!path) return;
  
    const routeMap: Record<string, () => void> = {
      '/': () => LazyLandingPage.preload?.(),
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
      const connection = (navigator as {connection?: {effectiveType?: string, saveData?: boolean}}).connection;
      if (connection?.effectiveType === '4g' && !connection.saveData) {
        preloadMediumPriorityComponents();
      }
    }
  };
  