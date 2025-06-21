import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModulesProvider } from '@/contexts/ModulesContext';
import { EnterpriseProvider } from '@/contexts/EnterpriseContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const AuthPage = lazy(() => import('@/pages/AuthPage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AccountingPage = lazy(() => import('@/pages/AccountingPage'));
const BanksPage = lazy(() => import('@/pages/BanksPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const ForecastsPage = lazy(() => import('@/pages/ForecastsPage'));
const ThirdPartiesPage = lazy(() => import('@/pages/ThirdPartiesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const InvoicingPage = lazy(() => import('@/pages/InvoicingPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const SalesCrmPage = lazy(() => import('@/pages/SalesCrmPage'));
const HumanResourcesPage = lazy(() => import('@/pages/HumanResourcesPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const TaxPage = lazy(() => import('@/pages/TaxPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const SetupWizard = lazy(() => import('@/components/setup/SetupWizard'));


const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="casskai-theme">
      <LocaleProvider>
        <AuthProvider>
          <EnterpriseProvider>
            <ModulesProvider>
              <TooltipProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/setup" element={<SetupWizard />} />  

                    <Route element={<MainLayout />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/accounting" element={<AccountingPage />} />
                      <Route path="/banking" element={<BanksPage />} />
                      <Route path="/invoicing" element={<InvoicingPage />} />
                      <Route path="/purchases" element={<PurchasesPage />} />
                      <Route path="/sales-crm" element={<SalesCrmPage />} />
                      <Route path="/human-resources" element={<HumanResourcesPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/forecasts" element={<ForecastsPage />} />
                      <Route path="/third-parties" element={<ThirdPartiesPage />} />
                      <Route path="/tax" element={<TaxPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/user-management" element={<UserManagementPage />} />
                    </Route>

                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </TooltipProvider>
            </ModulesProvider>
          </EnterpriseProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
