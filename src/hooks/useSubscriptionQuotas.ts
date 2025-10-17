import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService, UsageLimits, FeatureAccess } from '@/services/subscriptionService';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export interface QuotaStatus {
  canAccess: boolean;
  current: number;
  limit: number | null;
  percentage: number;
  isNearLimit: boolean;
}

export const useSubscriptionQuotas = () => {
  const { user } = useAuth();
  const { isLoading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  
  const [usageLimits, setUsageLimits] = useState<UsageLimits[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les limites d'usage
  const loadUsageLimits = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const limits = await subscriptionService.getUserUsageLimits(user.id);
      setUsageLimits(limits);
    } catch (error) {
      logger.error('Error loading usage limits:', error)
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    loadUsageLimits();
  }, [loadUsageLimits]);

  // Vérifier l'accès à une fonctionnalité
  const canAccessFeature = useCallback(async (featureName: string): Promise<FeatureAccess> => {
    if (!user?.id) {
      return { canAccess: false, reason: 'Utilisateur non connecté' };
    }

    try {
      return await subscriptionService.canAccessFeature(user.id, featureName);
    } catch (error) {
      logger.error('Error checking feature access:', error);
      return { canAccess: false, reason: 'Erreur de vérification' };
    }
  }, [user?.id]);

  // Incrémenter l'usage avec vérification des quotas
  const incrementUsageWithCheck = useCallback(async (
    featureName: string, 
    increment: number = 1,
    showToast: boolean = true
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Vérifier les quotas avant d'incrémenter
      const quotaCheck = await subscriptionService.checkQuotaBeforeAction(
        user.id, 
        featureName, 
        increment
      );

      if (!quotaCheck.allowed) {
        if (showToast) {
          toast({
            title: "Limite atteinte",
            description: quotaCheck.message || `Vous avez atteint la limite pour ${featureName}`,
            variant: "destructive",
          });
        }
        return false;
      }

      // Incrémenter l'usage
      const success = await subscriptionService.incrementFeatureUsage(
        user.id, 
        featureName, 
        increment
      );

      if (success) {
        // Recharger les limites pour avoir les données à jour
        await loadUsageLimits();
        
        // Afficher un avertissement si proche de la limite
        if (quotaCheck.usage && quotaCheck.usage.limit_value) {
          const newPercentage = ((quotaCheck.usage.current_usage + increment) / quotaCheck.usage.limit_value) * 100;
          
          if (newPercentage >= 90 && showToast) {
            toast({
              title: "Limite bientôt atteinte",
              description: `Vous approchez de la limite pour ${featureName} (${Math.round(newPercentage)}%)`,
              variant: "destructive",
            });
          } else if (newPercentage >= 80 && showToast) {
            toast({
              title: "Attention aux quotas",
              description: `Vous avez utilisé ${Math.round(newPercentage)}% de votre quota ${featureName}`,
              variant: "destructive",
            });
          }
        }
      }

      return success;
    } catch (error) {
      logger.error('Error incrementing usage:', error);
      return false;
    }
  }, [user?.id, loadUsageLimits, toast]);

  // Obtenir le statut d'un quota spécifique
  const getQuotaStatus = useCallback((featureName: string): QuotaStatus | null => {
    const limit = usageLimits.find(l => l.feature_name === featureName);
    
    if (!limit) return null;

    return {
      canAccess: limit.limit_value === null || limit.current_usage < limit.limit_value,
      current: limit.current_usage,
      limit: limit.limit_value,
      percentage: limit.percentage_used,
      isNearLimit: limit.percentage_used >= 80
    };
  }, [usageLimits]);

  // Obtenir les quotas les plus utilisés
  const getTopUsageFeatures = useCallback((count: number = 3): UsageLimits[] => {
    return usageLimits
      .filter(l => l.limit_value !== null)
      .sort((a, b) => b.percentage_used - a.percentage_used)
      .slice(0, count);
  }, [usageLimits]);

  // Vérifier si l'utilisateur a des quotas critiques
  const hasCriticalQuotas = useCallback((): boolean => {
    return usageLimits.some(l => 
      l.limit_value !== null && l.percentage_used >= 95
    );
  }, [usageLimits]);

  // Obtenir le nombre de quotas en approche de limite
  const getNearLimitCount = useCallback((): number => {
    return usageLimits.filter(l => 
      l.limit_value !== null && l.percentage_used >= 80 && l.percentage_used < 95
    ).length;
  }, [usageLimits]);

  return {
    // États
    usageLimits,
    isLoading: isLoading || subscriptionLoading,

    // Actions
    loadUsageLimits,
    canAccessFeature,
    incrementUsageWithCheck,

    // Utilitaires
    getQuotaStatus,
    getTopUsageFeatures,
    hasCriticalQuotas,
    getNearLimitCount,

    // Données dérivées
    totalFeatures: usageLimits.length,
    featuresWithLimits: usageLimits.filter(l => l.limit_value !== null).length,
    averageUsage: usageLimits.length > 0 
      ? Math.round(usageLimits.reduce((sum, l) => sum + l.percentage_used, 0) / usageLimits.length)
      : 0
  };
};

export default useSubscriptionQuotas;