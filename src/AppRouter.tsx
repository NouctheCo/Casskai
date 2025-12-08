/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { Suspense, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFallback } from '@/components/ui/LoadingFallback';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthForm } from '@/components/guards/AuthGuard';
import HomePage from '@/components/HomePage';
import OnboardingPage from '@/pages/OnboardingPage';
import { OnboardingProvider } from '@/contexts';
import ProtectedRoute from '@/components/guards/ProtectedRoute';

// Lazy load pages for better performance
const LazyLandingPage = React.lazy(() => import('@/pages/LandingPage'));
const LazyDashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const LazyAccountingPage = React.lazy(() => import('@/pages/AccountingPage'));
const LazyAssetsPage = React.lazy(() => import('@/pages/AssetsPage'));
const LazyInvoicingPage = React.lazy(() => import('@/pages/InvoicingPage'));
const LazyBanksPage = React.lazy(() => import('@/pages/BanksPage'));
const LazyReportsPage = React.lazy(() => import('@/pages/ReportsPage'));
const LazySettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const LazyProjectsPage = React.lazy(() => import('@/pages/ProjectsPage'));
const LazyContractsPage = React.lazy(() => import('@/pages/ContractsPage'));
const LazyPurchasesPage = React.lazy(() => import('@/pages/PurchasesPage'));
const LazyInventoryPage = React.lazy(() => import('@/pages/InventoryPage'));
const LazyTaxPage = React.lazy(() => import('@/pages/TaxPage'));
const LazyHumanResourcesPage = React.lazy(() => import('@/pages/HumanResourcesPage'));
const LazySalesCrmPage = React.lazy(() => import('@/pages/SalesCrmPage'));
const LazyBillingPage = React.lazy(() => import('@/pages/BillingPage'));
const LazyPrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage'));
const LazyTermsOfServicePage = React.lazy(() => import('@/pages/TermsOfServicePage'));
const LazyTermsOfSalePage = React.lazy(() => import('@/pages/TermsOfSalePage'));
const LazyCookiesPolicyPage = React.lazy(() => import('@/pages/CookiesPolicyPage'));
const LazyLegalPage = React.lazy(() => import('@/pages/LegalPage'));
const LazyRoadmapPage = React.lazy(() => import('@/pages/RoadmapPage'));
const LazyFAQPage = React.lazy(() => import('@/pages/FAQPage'));
const LazyGDPRPage = React.lazy(() => import('@/pages/GDPRPage'));
const LazyDiagnosticPage = React.lazy(() => import('@/pages/DiagnosticPage'));
const LazyDocumentationArticlePage = React.lazy(() => import('@/pages/DocumentationArticlePage'));
const LazyDocumentationCategoryPage = React.lazy(() => import('@/pages/DocumentationCategoryPage'));
const LazyAccountingImportPage = React.lazy(() => import('@/pages/AccountingImportPage'));
const LazyPricingPage = React.lazy(() => import('@/pages/PricingPage'));
const LazyForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const LazySystemStatusPage = React.lazy(() => import('@/pages/SystemStatusPage'));
const LazyStripeSuccessPage = React.lazy(() => import('@/pages/StripeSuccessPage'));
const LazyStripeCancelPage = React.lazy(() => import('@/pages/StripeCancelPage'));
const LazyBudgetPage = React.lazy(() => import('@/pages/BudgetPage'));
const LazyAutomationPage = React.lazy(() => import('@/pages/AutomationPage'));
const LazyThirdPartiesPage = React.lazy(() => import('@/pages/ThirdPartiesPage'));
const LazyRGPDAdminDashboard = React.lazy(() => import('@/pages/admin/RGPDAdminDashboard'));
const LazyAuditLogsPage = React.lazy(() => import('@/pages/AuditLogsPage'));
const LazyDocumentationPage = React.lazy(() => import('@/pages/public/DocumentationPage'));
const LazyTutorialsPage = React.lazy(() => import('@/pages/public/TutorialsPage'));
const LazyMentionsLegalesPage = React.lazy(() => import('@/pages/MentionsLegalesPage'));
const LazySecurityPage = React.lazy(() => import('@/pages/SecurityPage'));
const LazyHelpCenterPage = React.lazy(() => import('@/pages/HelpCenterPage'));
const LazyTeamPage = React.lazy(() => import('@/pages/TeamPage'));
const LazyAcceptInvitationPage = React.lazy(() => import('@/pages/AcceptInvitationPage'));
const LazyTeamManagementGuide = React.lazy(() => import('@/pages/docs/TeamManagementGuide'));

const AppRouter: React.FC = () => {
  const { isAuthenticated, loading, onboardingCompleted, isCheckingOnboarding, currentCompany } = useAuth();

  // Memoize the routing logic to prevent infinite re-renders
  const routingState = useMemo(() => {
    // Show loading during authentication checks
    if (loading || isCheckingOnboarding) return 'loading';

    // If not authenticated, show public routes
    if (!isAuthenticated) return 'unauthenticated';

    // If authenticated but no companies (needs onboarding)
    // IMPORTANT: Ne rediriger vers onboarding QUE si pas d'entreprise ET onboarding_completed_at null
    // Si currentCompany existe, même sans onboardingCompleted, c'est que l'onboarding est fait
    if (isAuthenticated && !currentCompany) return 'needs-onboarding';

    // Fully authenticated with company
    return 'authenticated';
  }, [loading, isAuthenticated, onboardingCompleted, isCheckingOnboarding, currentCompany]);

  if (routingState === 'loading') {
    const loadingMessage = isCheckingOnboarding 
      ? "Vérification de votre compte..." 
      : "Chargement de l'application...";
    return <LoadingFallback message={loadingMessage} />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      {routingState === 'unauthenticated' && (
        <>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyLandingPage />
              </Suspense>
            } />
            <Route path="landing" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyLandingPage />
              </Suspense>
            } />
            <Route path="pricing" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyPricingPage />
              </Suspense>
            } />
            <Route path="stripe/success" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyStripeSuccessPage />
              </Suspense>
            } />
            <Route path="stripe/cancel" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyStripeCancelPage />
              </Suspense>
            } />
            <Route path="auth" element={<AuthForm />} />
            <Route path="login" element={<AuthForm />} />
            <Route path="register" element={<AuthForm />} />
            <Route path="forgot-password" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyForgotPasswordPage />
              </Suspense>
            } />
            <Route path="privacy-policy" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyPrivacyPolicyPage />
              </Suspense>
            } />
            <Route path="terms-of-service" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyTermsOfServicePage />
              </Suspense>
            } />
            <Route path="terms-of-sale" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyTermsOfSalePage />
              </Suspense>
            } />
            <Route path="cookies-policy" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyCookiesPolicyPage />
              </Suspense>
            } />
            <Route path="legal" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyLegalPage />
              </Suspense>
            } />
            <Route path="roadmap" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyRoadmapPage />
              </Suspense>
            } />
            <Route path="faq" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyFAQPage />
              </Suspense>
            } />
            <Route path="gdpr" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyGDPRPage />
              </Suspense>
            } />
            <Route path="system-status" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazySystemStatusPage />
              </Suspense>
            } />
            <Route path="docs" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyDocumentationPage />
              </Suspense>
            } />
            <Route path="docs/:articleId" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyDocumentationArticlePage />
              </Suspense>
            } />
            <Route path="docs/:category" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyDocumentationCategoryPage />
              </Suspense>
            } />
            <Route path="docs/:category/:article" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyDocumentationArticlePage />
              </Suspense>
            } />
            <Route path="docs/guide/team-management" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyTeamManagementGuide />
              </Suspense>
            } />
            <Route path="tutorials" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyTutorialsPage />
              </Suspense>
            } />
            <Route path="mentions-legales" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyMentionsLegalesPage />
              </Suspense>
            } />
            <Route path="invitation" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyAcceptInvitationPage />
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </>
      )}

      {/* Onboarding Routes */}
      {routingState === 'needs-onboarding' && (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="onboarding" element={
              <OnboardingProvider>
                <OnboardingPage />
              </OnboardingProvider>
            } />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Route>
        </>
      )}

      {/* Authenticated App Routes */}
      {routingState === 'authenticated' && (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="accounting/*" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyAccountingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="assets" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyAssetsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="accounting-import" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyAccountingImportPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="invoicing/*" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyInvoicingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="banks" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyBanksPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyReportsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="projects" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyProjectsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="contracts" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyContractsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="purchases" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyPurchasesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="inventory" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyInventoryPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="budget" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyBudgetPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="taxes" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyTaxPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="hr" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyHumanResourcesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="sales-crm" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazySalesCrmPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="third-parties" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyThirdPartiesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="admin/rgpd" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyRGPDAdminDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="admin/audit-logs" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyAuditLogsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="diagnostic" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyDiagnosticPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="billing" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyBillingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="automation" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyAutomationPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazySettingsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="security" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazySecurityPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="help" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyHelpCenterPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="docs/guide/team-management" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyTeamManagementGuide />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="team" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyTeamPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="invitation" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyAcceptInvitationPage />
              </Suspense>
            } />
            <Route path="pricing" element={
              <ProtectedRoute requireOnboarding={false}>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyPricingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="diagnostic" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyDiagnosticPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="docs/:slug" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <LazyDocumentationArticlePage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="onboarding" element={
              <ProtectedRoute requireCompany={false} requireOnboarding={false}>
                <OnboardingProvider>
                  <OnboardingPage />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            {/* Redirections pour anciennes URLs (compatibilité) */}
            <Route path="crm" element={<Navigate to="/sales-crm" replace />} />
            <Route path="human-resources" element={<Navigate to="/hr" replace />} />
            <Route path="tax" element={<Navigate to="/taxes" replace />} />
            <Route path="forecasts" element={<Navigate to="/budget" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </>
      )}
    </Routes>
  );
};

export default AppRouter;
