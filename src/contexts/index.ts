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

// src/contexts/index.ts
export { ConfigProvider, useConfigContext } from './ConfigContext';
export { AuthProvider, useAuth } from './AuthContext';
export { ModulesProvider } from './ModulesContext';
export { EnterpriseProvider, useEnterprise } from './EnterpriseContext';
export { ThemeProvider } from './ThemeContext';
export { LocaleProvider } from './LocaleContext';
export { SubscriptionProvider, useSubscription } from './SubscriptionContext';
export { OnboardingProvider } from './OnboardingContext';
export { useOnboarding } from '../hooks/useOnboarding';

// Export des hooks de modules depuis le fichier séparé
export {
  useModules,
  useModulesSafe,
  useModuleActive,
  useModuleConfig,
  useConditionalFeature,
  useModuleComponents
} from '../hooks/modules.hooks';
