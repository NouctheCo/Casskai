// Providers pour l'application
import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { ModulesProvider } from '@/contexts/ModulesContext';
import { EnterpriseProvider } from '@/contexts/EnterpriseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import ABTestProvider from '@/components/ABTestProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const isE2EMinimal = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_E2E_MINIMAL === 'true';
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="casskai-ui-theme">
        <LocaleProvider>
          <TooltipProvider>
            <AuthProvider>
              <EnterpriseProvider>
                <SubscriptionProvider>
                  {isE2EMinimal ? (
                    <ABTestProvider>{children}</ABTestProvider>
                  ) : (
                    <ModulesProvider
                      userId="default"
                      tenantId="default"
                      userPermissions={['*']}
                    >
                      <ABTestProvider>
                        {children}
                      </ABTestProvider>
                    </ModulesProvider>
                  )}
                </SubscriptionProvider>
              </EnterpriseProvider>
            </AuthProvider>
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
