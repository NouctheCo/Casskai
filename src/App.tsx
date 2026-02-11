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
import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { ModulesProvider } from '@/contexts/ModulesContext';
import { EnterpriseProvider } from '@/contexts/EnterpriseContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import ABTestProvider from '@/components/ABTestProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingFallback } from '@/components/ui/LoadingFallback';
import ErrorBoundary, { setupGlobalErrorHandling } from '@/components/ErrorBoundary';
import { UpdateNotification, OfflineIndicator } from '@/hooks/useServiceWorker';
import AppRouter from './AppRouter'; // Import the new router
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { logger } from '@/lib/logger';
// Initialiser la gestion d'erreurs globale
setupGlobalErrorHandling();
// Wrapper pour ModulesProvider qui utilise les données d'authentification
const ModulesProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currentCompany, onboardingCompleted } = useAuth();
  // Ne charger ModulesProvider que si l'utilisateur a terminé l'onboarding et a une entreprise
  if (!onboardingCompleted || !currentCompany || !user) {
    return <>{children}</>;
  }
  // Permissions par défaut pour l'environnement de développement/démonstration
  const defaultPermissions = ['*', 'module:activate', 'module:configure', 'module:deactivate'];
  const userPermissions = user.user_metadata?.permissions || defaultPermissions;
  return (
    <ModulesProvider
      userId={user.id}
      tenantId={currentCompany.id}
      userPermissions={userPermissions}
    >
      {children}
    </ModulesProvider>
  );
};
function App() {
  logger.warn('App', "🚀 Application de gestion d'entreprise démarrée avec architecture modulaire");
  const isE2EMinimal = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_E2E_MINIMAL === 'true';
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="casskai-theme">
        <LocaleProvider>
          <ConfigProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <ABTestProvider>
                  <BrowserRouter future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}>
                    {isE2EMinimal ? (
                      <EnterpriseProvider>
                        <TooltipProvider>
                          <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
                            <AppRouter />
                          </Suspense>
                          <Toaster position="top-right" richColors closeButton duration={4000} />
                          <UpdateNotification />
                          <OfflineIndicator />
                          <CookieConsentBanner />
                        </TooltipProvider>
                      </EnterpriseProvider>
                    ) : (
                      <ModulesProviderWrapper>
                        <EnterpriseProvider>
                          <TooltipProvider>
                            <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
                              <AppRouter />
                            </Suspense>
                            <Toaster position="top-right" richColors closeButton duration={4000} />
                            <UpdateNotification />
                            <OfflineIndicator />
                            <CookieConsentBanner />
                          </TooltipProvider>
                        </EnterpriseProvider>
                      </ModulesProviderWrapper>
                    )}
                  </BrowserRouter>
                </ABTestProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ConfigProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;