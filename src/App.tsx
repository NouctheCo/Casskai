import React, { Suspense, useEffect, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
// ConfigProvider déplacé vers main.tsx
import { ModulesProvider } from '@/contexts/ModulesContext';
import { EnterpriseProvider } from '@/contexts/EnterpriseContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// import { SubscriptionProvider } from '@/contexts/SubscriptionContext'; // Temporairement désactivé pour le build
import ABTestProvider from '@/components/ABTestProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingFallback } from '@/components/ui/LoadingFallback';
import ErrorBoundary, { setupGlobalErrorHandling } from '@/components/ErrorBoundary';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { UpdateNotification, OfflineIndicator } from '@/hooks/useServiceWorker';
import HomePage from '@/components/HomePage';

// Import des composants lazy intelligents
import {
  LazyAuthPage,
  LazyOnboardingPage,
  LazyLandingPage,
  LazyDashboardPage,
  LazyAccountingPage,
  LazyBanksPage,
  LazyThirdPartiesPage,
  LazyPurchasesPage,
  LazyInvoicingPage,
  LazySalesCrmPage,
  LazyHumanResourcesPage,
  LazyProjectsPage,
  LazyInventoryPage,
  LazyReportsPage,
  LazyForecastsPage,
  LazyTaxPage,
  LazyContractsPage,
  LazySettingsPage,
  LazyBillingPage,
  initializeIntelligentPreloading
} from '@/utils/lazyComponents';

// Pages spécifiques qui n'ont pas besoin de préchargement intelligent
const AccountingImportPage = lazy(() => import('@/pages/AccountingImportPage'));
const SecurityPage = lazy(() => import('@/components/security/SecuritySettingsPage'));
const DatabaseTestPage = lazy(() => import('@/pages/DatabaseTestPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ModuleManager = lazy(() => import('@/components/modules/ModuleManagerEnhanced'));
const ModuleDiagnostics = lazy(() => import('@/components/modules/ModuleDiagnostics'));

// Pages légales et de contenu
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const CookiesPolicyPage = lazy(() => import('@/pages/CookiesPolicyPage'));
const GDPRPage = lazy(() => import('@/pages/GDPRPage'));
const SecurityInfoPage = lazy(() => import('@/pages/SecurityPage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const DocumentationArticlePage = lazy(() => import('@/pages/DocumentationArticlePage'));
const DocumentationCategoryPage = lazy(() => import('@/pages/DocumentationCategoryPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/landing', element: <LazyLandingPage /> },
      { path: '/auth', element: <LazyAuthPage /> },
      { path: '/login', element: <LazyAuthPage /> },
      { path: '/register', element: <LazyAuthPage /> },
      {
        path: '/onboarding',
        element: (
          <ProtectedRoute requireCompany={false}>
            <LazyOnboardingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Dashboard">
              <LazyDashboardPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/accounting',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Comptabilité">
              <LazyAccountingPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/accounting/import',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Import Comptable">
              <AccountingImportPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/banks',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Banques">
              <LazyBanksPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/third-parties',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Tiers">
              <LazyThirdPartiesPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/purchases',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Achats">
              <LazyPurchasesPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/invoicing',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Facturation">
              <LazyInvoicingPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/sales',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Ventes">
              <LazySalesCrmPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/hr',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Ressources Humaines">
              <LazyHumanResourcesPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/projects',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Projets">
              <LazyProjectsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/inventory',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Inventaire">
              <LazyInventoryPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Rapports">
              <LazyReportsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/forecasts',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Prévisions">
              <LazyForecastsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/tax',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Fiscalité">
              <LazyTaxPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/contracts',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Contrats RFA">
              <LazyContractsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/security',
        element: (
          <RouteErrorBoundary routeName="Sécurité">
            <SecurityPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Paramètres">
              <LazySettingsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/modules',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Gestion des Modules">
              <ModuleManager />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/modules/diagnostics',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Diagnostics Modulaires">
              <ModuleDiagnostics />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/billing',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Facturation">
              <LazyBillingPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/database-test',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary routeName="Test Database">
              <DatabaseTestPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      // Pages légales et de contenu (accessibles publiquement)
      {
        path: '/privacy',
        element: (
          <RouteErrorBoundary routeName="Confidentialité">
            <PrivacyPolicyPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/terms',
        element: (
          <RouteErrorBoundary routeName="Conditions">
            <TermsOfServicePage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/cookies',
        element: (
          <RouteErrorBoundary routeName="Cookies">
            <CookiesPolicyPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/gdpr',
        element: (
          <RouteErrorBoundary routeName="RGPD">
            <GDPRPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/security-info',
        element: (
          <RouteErrorBoundary routeName="Sécurité">
            <SecurityInfoPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/help',
        element: (
          <RouteErrorBoundary routeName="Centre d'aide">
            <HelpCenterPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/docs',
        element: (
          <RouteErrorBoundary routeName="Documentation">
            <HelpCenterPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/docs/category/:categoryId',
        element: (
          <RouteErrorBoundary routeName="Catégorie Documentation">
            <DocumentationCategoryPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/docs/:articleId',
        element: (
          <RouteErrorBoundary routeName="Article Documentation">
            <DocumentationArticlePage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/api',
        element: (
          <RouteErrorBoundary routeName="API">
            <HelpCenterPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '/status',
        element: (
          <RouteErrorBoundary routeName="Statut">
            <HelpCenterPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: '*',
        element: (
          <RouteErrorBoundary routeName="404">
            <NotFoundPage />
          </RouteErrorBoundary>
        ),
      },
    ],
  },
]);

// Wrapper pour ModulesProvider qui utilise les données d'authentification
const ModulesProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <ModulesProvider
      userId={user?.id || 'anonymous'}
      tenantId={user?.user_metadata?.tenantId || 'default'}
      userPermissions={user?.user_metadata?.permissions || []}
    >
      {children}
    </ModulesProvider>
  );
};

function App() {
  console.warn("🚀 Application de gestion d'entreprise démarrée avec architecture modulaire");

  // Initialiser le préchargement intelligent et la gestion d'erreurs globale
  useEffect(() => {
    initializeIntelligentPreloading();
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="casskai-theme">
        <LocaleProvider>
          <AuthProvider>
            {/* <SubscriptionProvider> */}
              <ABTestProvider>
                <ModulesProviderWrapper>
                  <EnterpriseProvider>
                    <TooltipProvider>
                      <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
                        <RouterProvider router={router} />
                      </Suspense>
                      <Toaster />
                      <UpdateNotification />
                      <OfflineIndicator />
                    </TooltipProvider>
                  </EnterpriseProvider>
                </ModulesProviderWrapper>
              </ABTestProvider>
            {/* </SubscriptionProvider> */}
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;