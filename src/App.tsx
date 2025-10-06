import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
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
import { FeedbackWidget } from '@/components/beta/FeedbackWidget';
import AppRouter from './AppRouter'; // Import the new router

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
  console.warn("🚀 Application de gestion d'entreprise démarrée avec architecture modulaire");

  const isE2EMinimal = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_E2E_MINIMAL === 'true';

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="casskai-theme">
        <LocaleProvider>
          <ConfigProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <ABTestProvider>
                  <BrowserRouter>
                    {isE2EMinimal ? (
                      <EnterpriseProvider>
                        <TooltipProvider>
                          <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
                            <AppRouter />
                          </Suspense>
                          <Toaster />
                          <UpdateNotification />
                          <OfflineIndicator />
                          <FeedbackWidget />
                        </TooltipProvider>
                      </EnterpriseProvider>
                    ) : (
                      <ModulesProviderWrapper>
                        <EnterpriseProvider>
                          <TooltipProvider>
                            <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
                              <AppRouter />
                            </Suspense>
                            <Toaster />
                            <UpdateNotification />
                            <OfflineIndicator />
                            <FeedbackWidget />
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