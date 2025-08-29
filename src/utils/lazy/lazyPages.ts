import { createLazyComponent } from './createLazyComponent';

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
