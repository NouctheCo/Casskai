// Configuration des routes de l'application
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
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
  LazyInventoryPage,
  LazyReportsPage,
  LazyForecastsPage,
  LazyTaxPage,
  LazyContractsPage,
  LazySettingsPage,
  LazyBillingPage,
  LazyModulesManagementPage,
} from '@/utils/lazyComponents';

// Pages spécifiques
const AccountingImportPage = lazy(() => import('@/pages/AccountingImportPage'));
const SecurityPage = lazy(() => import('@/components/security/SecuritySettingsPage'));
const DatabaseTestPage = lazy(() => import('@/pages/DatabaseTestPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ModuleManager = lazy(() => import('@/components/modules/ModuleManagerEnhanced'));
const ModuleDiagnostics = lazy(() => import('@/components/modules/ModuleDiagnostics'));
const ModuleRenderer = lazy(() => import('@/components/modules/ModuleRenderer'));

// Pages légales
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const CookiesPolicyPage = lazy(() => import('@/pages/CookiesPolicyPage'));
const GDPRPage = lazy(() => import('@/pages/GDPRPage'));
const SecurityInfoPage = lazy(() => import('@/pages/SecurityPage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const DocumentationArticlePage = lazy(() => import('@/pages/DocumentationArticlePage'));
const DocumentationCategoryPage = lazy(() => import('@/pages/DocumentationCategoryPage'));

// Pages utilisateurs et projets
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage'));
const HumanResourcesPage = lazy(() => import('@/pages/HumanResourcesPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const SalesCrmPage = lazy(() => import('@/pages/SalesCrmPage'));
const DiagnosticPage = lazy(() => import('@/pages/DiagnosticPage'));

export const appRouter = createBrowserRouter([
  // Routes publiques
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "auth", element: <LazyAuthPage /> },
      { path: "landing", element: <LazyLandingPage /> },
      
      // Pages légales
      { path: "legal/privacy", element: <PrivacyPolicyPage /> },
      { path: "legal/terms", element: <TermsOfServicePage /> },
      { path: "legal/cookies", element: <CookiesPolicyPage /> },
      { path: "legal/gdpr", element: <GDPRPage /> },
      { path: "legal/security", element: <SecurityInfoPage /> },
      
      // Documentation et aide
      { path: "help", element: <HelpCenterPage /> },
      { path: "docs/:category", element: <DocumentationCategoryPage /> },
      { path: "docs/:category/:article", element: <DocumentationArticlePage /> },
      
      // Routes protégées
      {
        path: "onboarding",
        element: (
          <ProtectedRoute requireAuth={true}>
            <LazyOnboardingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "accounting",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyAccountingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "accounting/import",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <AccountingImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "banks",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyBanksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "third-parties",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyThirdPartiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "purchases",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyPurchasesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "invoicing",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyInvoicingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyInventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "forecasts",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyForecastsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tax",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyTaxPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "contracts",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyContractsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "user-management",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "human-resources",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <HumanResourcesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "projects",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "crm",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <SalesCrmPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazySettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "billing",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyBillingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "security",
        element: (
          <ProtectedRoute requireAuth={true}>
            <SecurityPage />
          </ProtectedRoute>
        ),
      },
      
      // Routes de diagnostic et modules
      {
        path: "diagnostic",
        element: (
          <ProtectedRoute requireAuth={true}>
            <DiagnosticPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "modules",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <LazyModulesManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "modules/diagnostics",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <ModuleDiagnostics />
          </ProtectedRoute>
        ),
      },
      {
        path: "modules/:moduleId",
        element: (
          <ProtectedRoute requireAuth={true} requireOnboarding={true}>
            <ModuleRenderer />
          </ProtectedRoute>
        ),
      },
      
      // Route de test (dev uniquement)
      ...(import.meta.env.DEV ? [{
        path: "database-test",
        element: (
          <ProtectedRoute requireAuth={true}>
            <DatabaseTestPage />
          </ProtectedRoute>
        ),
      }] : []),
      
      // 404 et redirections
      { path: "404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);