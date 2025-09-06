import { useEnterprisePlan } from '@/hooks/useEnterprisePlan';
import { PlanCapability } from '@/config/moduleCapabilities';

/**
 * Hook personnalisé pour vérifier l'accès à une fonctionnalité spécifique
 * Utilise le nouveau système de capacités
 */
export function useFeatureAccess(feature: string) {
  const plan = useEnterprisePlan();

  // Mapping des fonctionnalités vers les capacités
  const featureMapping: Record<string, string[]> = {
    'advanced_reports': ['advanced_reporting'],
    'api_access': ['api_access'],
    'multi_company': ['multi_company'],
    'user_management': ['user_management'],
  };

  const requiredCapabilities = featureMapping[feature] || [];

  return {
    hasAccess: requiredCapabilities.every(cap => plan.capabilities.has(cap as PlanCapability)),
    currentPlan: plan.planCode,
    requiredCapabilities,
    isLoading: plan.isLoading,
  };
}
