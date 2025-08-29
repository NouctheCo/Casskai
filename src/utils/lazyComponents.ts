import { componentStrategies } from './performance/lazyLoading';

// Enhanced lazy components with performance optimizations
export const LazyDashboardPage = componentStrategies.route(() => import('@/pages/DashboardPage'));

export const LazyAccountingPage = componentStrategies.feature(() => import('@/pages/AccountingPage'));

export const LazyInvoicingPage = componentStrategies.feature(() => import('@/pages/InvoicingPage'));

export const LazyBanksPage = componentStrategies.feature(() => import('@/pages/BanksPage'));

export const LazyReportsPage = componentStrategies.visualization(() => import('@/pages/ReportsPage'));

export const LazySettingsPage = componentStrategies.route(() => import('@/pages/SettingsPage'));

export const LazyAuthPage = componentStrategies.route(() => import('@/pages/AuthPage'));

export const LazyLandingPage = componentStrategies.route(() => import('@/pages/LandingPage'));

// Secondary pages with optimized loading strategies
export const LazyInventoryPage = componentStrategies.feature(() => import('@/pages/InventoryPage'));

export const LazyProjectsPage = componentStrategies.feature(() => import('@/pages/ProjectsPage'));

export const LazyHumanResourcesPage = componentStrategies.feature(() => import('@/pages/HumanResourcesPage'));

export const LazyUserManagementPage = componentStrategies.modal(() => import('@/pages/UserManagementPage'));

// Feature pages
export const LazyTaxPage = componentStrategies.feature(() => import('@/pages/TaxPage'));

export const LazyThirdPartiesPage = componentStrategies.feature(() => import('@/pages/ThirdPartiesPage'));

export const LazyPurchasesPage = componentStrategies.feature(() => import('@/pages/PurchasesPage'));

export const LazyForecastsPage = componentStrategies.visualization(() => import('@/pages/ForecastsPage'));

export const LazySalesCrmPage = componentStrategies.feature(() => import('@/pages/SalesCrmPage'));

export const LazyContractsPage = componentStrategies.feature(() => import('@/pages/ContractsPage'));

export const LazyOnboardingPage = componentStrategies.route(() => import('@/pages/OnboardingPage'));

export const LazyBillingPage = componentStrategies.modal(() => import('@/pages/BillingPage'));
