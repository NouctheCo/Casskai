// Modifications à apporter à votre App.tsx existant


import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModulesProvider } from '@/contexts/ModulesContext';
import { EnterpriseProvider } from '@/contexts/EnterpriseContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useConfigContext } from '@/contexts/ConfigContext';

// Pages publiques
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// Pages protégées
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AccountingPage = lazy(() => import('@/pages/AccountingPage'));
const BanksPage = lazy(() => import('@/pages/BanksPage'));
const ThirdPartiesPage = lazy(() => import('@/pages/ThirdPartiesPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const InvoicingPage = lazy(() => import('@/pages/InvoicingPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// Composants de configuration
const SupabaseSetupWizard = lazy(() => import('@/components/setup/SupabaseSetupWizard'));

function App() {
  const { isConfigured, isLoading, config } = useConfigContext();
  const location = useLocation();

  // Log des informations importantes pour le débogage
  useEffect(() => {
    console.log("App rendu avec:", { 
      isConfigured, 
      isLoading, 
      path: location.pathname,
      setupCompleted: config?.setupCompleted
    });
  }, [isConfigured, isLoading, config, location.pathname]);

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    console.log("App en chargement...");
    return <LoadingFallback message="Chargement de la configuration..." />;
  }

  // Redirection automatique vers /setup si aucune configuration n'est trouvée
  if (!isLoading && !config && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="casskai-theme">
      <LocaleProvider>
        <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Route de configuration */}
            <Route 
              path="/setup/*" 
              element={
                <ProtectedRoute requireSetupComplete={false}>
                  <SupabaseSetupWizard />
                </ProtectedRoute>
              } 
            />

            {/* Routes protégées sous dashboard */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute requireSetupComplete={true}>
                  <AuthProvider>
                    <EnterpriseProvider>
                      <ModulesProvider>
                        <TooltipProvider>
                          <MainLayout />
                        </TooltipProvider>
                      </ModulesProvider>
                    </EnterpriseProvider>
                  </AuthProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="accounting" element={<AccountingPage />} />
              <Route path="banks" element={<BanksPage />} />
              <Route path="third-parties" element={<ThirdPartiesPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="invoicing" element={<InvoicingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback: redirige vers / si route inconnue */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
