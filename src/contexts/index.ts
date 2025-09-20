// src/contexts/index.ts
export { ConfigProvider, useConfigContext } from './ConfigContext';
export { AuthProvider, useAuth } from './AuthContext';
export { ModulesProvider } from './ModulesContext';
export { EnterpriseProvider, useEnterprise } from './EnterpriseContext';
export { ThemeProvider } from './ThemeContext';
export { LocaleProvider } from './LocaleContext';
export { SubscriptionProvider, useSubscription } from './SubscriptionContext';
export { OnboardingProvider } from './OnboardingContextNew';
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
