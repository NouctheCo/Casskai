import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PlanCode, PlanCapability, PLAN_CAPABILITIES } from '@/config/moduleCapabilities';

export interface EnterprisePlan {
  planCode: PlanCode | null;
  status: 'active' | 'trialing' | 'canceled' | 'expired' | null;
  capabilities: Set<PlanCapability>;
  quotas: Record<string, { current: number; limit: number | null; percentage: number }>;
  isLoading: boolean;
  error: string | null;
}

export interface PlanInfo {
  code: PlanCode;
  name: string;
  capabilities: PlanCapability[];
  sortOrder: number;
}

interface QuotaData {
  quota_key: string;
  current_usage: number;
  quota_value: number;
}

interface SubscriptionData {
  plan_code: string;
  status: string;
  trial_end?: string;
}

/**
 * Charge les données d'abonnement d'une entreprise
 */
async function loadSubscriptionData(enterpriseId: string) {
  const { data: subscription, error: subError } = await supabase
    .from('enterprise_subscriptions')
    .select('*')
    .eq('enterprise_id', enterpriseId)
    .single();

  if (subError && subError.code !== 'PGRST116') {
    throw subError;
  }

  return subscription as SubscriptionData | null;
}

/**
 * Charge les quotas d'une entreprise
 */
async function loadQuotasData(enterpriseId: string) {
  const { data: quotas, error: quotaError } = await supabase
    .rpc('get_enterprise_quotas', { p_enterprise_id: enterpriseId });

  if (quotaError) {
    console.warn('Erreur chargement quotas:', quotaError);
  }

  return quotas as QuotaData[] | null;
}

/**
 * Calcule les pourcentages d'usage des quotas
 */
function calculateQuotaPercentages(quotas: Record<string, { current: number; limit: number | null }>) {
  const result: Record<string, { current: number; limit: number | null; percentage: number }> = {};

  Object.entries(quotas).forEach(([key, quota]) => {
    const percentage = quota.limit && quota.limit > 0
      ? Math.min((quota.current / quota.limit) * 100, 100)
      : 0;

    result[key] = {
      ...quota,
      percentage
    };
  });

  return result;
}

/**
 * Hook unifié pour gérer les plans et capacités d'une entreprise
 * Remplace plusieurs hooks existants pour une source unique de vérité
 */
export function useEnterprisePlan(enterpriseId?: string): EnterprisePlan {
  const { currentCompany } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<{
    planCode: PlanCode | null;
    status: string | null;
    capabilities: PlanCapability[];
    quotas: Record<string, { current: number; limit: number | null }>;
  }>({
    planCode: null,
    status: null,
    capabilities: [],
    quotas: {}
  });

  // Déterminer l'ID de l'entreprise à utiliser
  const targetEnterpriseId = enterpriseId || currentCompany?.id;

  useEffect(() => {
    if (!targetEnterpriseId) {
      setIsLoading(false);
      return;
    }

    const loadPlanData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger l'abonnement de l'entreprise
        const subscription = await loadSubscriptionData(targetEnterpriseId);

        let planCode: PlanCode | null = null;
        let status: string | null = null;
        let capabilities: PlanCapability[] = [];

        if (subscription) {
          planCode = subscription.plan_code as PlanCode;
          status = subscription.status;

          // Vérifier si l'abonnement est actif
          const isActive = status === 'active' ||
            (status === 'trialing' && subscription.trial_end && new Date(subscription.trial_end) > new Date());

          if (isActive && planCode) {
            capabilities = PLAN_CAPABILITIES[planCode] || [];
          }
        }

        // Charger les quotas
        const quotas = await loadQuotasData(targetEnterpriseId);

        const quotasMap: Record<string, { current: number; limit: number | null }> = {};
        if (quotas) {
          quotas.forEach((quota: QuotaData) => {
            quotasMap[quota.quota_key] = {
              current: Number(quota.current_usage) || 0,
              limit: quota.quota_value < 0 ? null : Number(quota.quota_value)
            };
          });
        }

        setPlanData({
          planCode,
          status,
          capabilities,
          quotas: quotasMap
        });

      } catch (err) {
        console.error('Erreur chargement plan entreprise:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanData();
  }, [targetEnterpriseId]);

  // Calculer les pourcentages d'usage
  const quotasWithPercentage = useMemo(() => {
    return calculateQuotaPercentages(planData.quotas);
  }, [planData.quotas]);

  const status = planData.status as 'active' | 'trialing' | 'canceled' | 'expired' | null;

  return {
    planCode: planData.planCode,
    status,
    capabilities: new Set(planData.capabilities),
    quotas: quotasWithPercentage,
    isLoading,
    error
  };
}

/**
 * Hook pour vérifier l'accès à une capacité spécifique
 */
export function useCapabilityAccess(capability: PlanCapability, enterpriseId?: string) {
  const plan = useEnterprisePlan(enterpriseId);
  return plan.capabilities.has(capability);
}

/**
 * Hook pour vérifier l'accès à un module spécifique
 */
export function useModuleAccess(moduleKey: string, enterpriseId?: string) {
  const { currentCompany } = useAuth();
  const targetEnterpriseId = enterpriseId || currentCompany?.id;

  return useMemo(() => {
    if (!targetEnterpriseId) return { canAccess: false, reason: 'Entreprise non trouvée' };

    // Cette logique sera implémentée avec le mapping modules -> capacités
    // Pour l'instant, on retourne true pour les modules core
    return { canAccess: true, reason: null };
  }, [targetEnterpriseId]);
}

/**
 * Liste des plans disponibles
 */
export const AVAILABLE_PLANS: PlanInfo[] = [
  {
    code: 'starter',
    name: 'Starter',
    capabilities: PLAN_CAPABILITIES.starter,
    sortOrder: 1
  },
  {
    code: 'pro',
    name: 'Professionnel',
    capabilities: PLAN_CAPABILITIES.pro,
    sortOrder: 2
  },
  {
    code: 'enterprise',
    name: 'Entreprise',
    capabilities: PLAN_CAPABILITIES.enterprise,
    sortOrder: 3
  }
];
