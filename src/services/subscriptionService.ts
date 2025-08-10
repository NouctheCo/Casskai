import { supabase } from '@/lib/supabase';
import { UserSubscription, SubscriptionPlan } from '@/types/subscription.types';

export interface UsageLimits {
  feature_name: string;
  current_usage: number;
  limit_value: number | null;
  percentage_used: number;
}

export interface FeatureAccess {
  canAccess: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}

class SubscriptionService {
  
  /**
   * Vérifie si l'utilisateur peut accéder à une fonctionnalité
   */
  async canAccessFeature(userId: string, featureName: string): Promise<FeatureAccess> {
    try {
      const { data, error } = await supabase
        .rpc('can_access_feature', {
          p_user_id: userId,
          p_feature_name: featureName
        });

      if (error) {
        console.error('Error checking feature access:', error);
        return { canAccess: false, reason: 'Erreur de vérification' };
      }

      return { canAccess: data };
    } catch (error) {
      console.error('Error in canAccessFeature:', error);
      return { canAccess: false, reason: 'Erreur inattendue' };
    }
  }

  /**
   * Incrémente l'usage d'une fonctionnalité
   */
  async incrementFeatureUsage(
    userId: string, 
    featureName: string, 
    increment: number = 1
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('increment_feature_usage', {
          p_user_id: userId,
          p_feature_name: featureName,
          p_increment: increment
        });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in incrementFeatureUsage:', error);
      return false;
    }
  }

  /**
   * Récupère les limites d'usage de l'utilisateur
   */
  async getUserUsageLimits(userId: string): Promise<UsageLimits[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_usage_limits', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error getting usage limits:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserUsageLimits:', error);
      return [];
    }
  }

  /**
   * Récupère l'abonnement actuel de l'utilisateur
   */
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        stripeSubscriptionId: data.stripe_subscription_id || '',
        stripeCustomerId: data.stripe_customer_id || '',
        status: data.status as UserSubscription['status'],
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
        metadata: data.metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return null;
    }
  }

  /**
   * Met à jour le statut d'un abonnement (typiquement via webhook Stripe)
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: UserSubscription['status'],
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status,
          metadata: { ...metadata },
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating subscription status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubscriptionStatus:', error);
      return false;
    }
  }

  /**
   * Crée un abonnement d'essai pour un utilisateur
   */
  async createTrialSubscription(
    userId: string,
    companyId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: userId,
          p_company_id: companyId || null
        });

      if (error) {
        console.error('Error creating trial subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createTrialSubscription:', error);
      return null;
    }
  }

  /**
   * Expire les essais qui ont dépassé leur date de fin
   */
  async expireTrials(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('expire_trials');

      if (error) {
        console.error('Error expiring trials:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in expireTrials:', error);
      return 0;
    }
  }

  /**
   * Récupère tous les plans d'abonnement disponibles
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error getting plans:', error);
        return [];
      }

      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: parseFloat(plan.price),
        currency: plan.currency,
        interval: plan.interval as 'month' | 'year',
        features: Array.isArray(plan.features) ? plan.features : [],
        popular: plan.is_popular || false,
        stripePriceId: plan.stripe_price_id || '',
        stripeProductId: plan.stripe_product_id || '',
        maxUsers: plan.max_users,
        maxClients: plan.max_clients,
        storageLimit: plan.storage_limit_gb ? `${plan.storage_limit_gb} GB` : undefined,
        supportLevel: plan.support_level as 'basic' | 'priority' | 'dedicated'
      }));
    } catch (error) {
      console.error('Error in getAvailablePlans:', error);
      return [];
    }
  }

  /**
   * Vérifie si un abonnement est proche de l'expiration
   */
  isNearExpiration(subscription: UserSubscription, daysThreshold: number = 7): boolean {
    const now = new Date();
    const expirationDate = subscription.status === 'trialing' 
      ? subscription.trialEnd 
      : subscription.currentPeriodEnd;
    
    if (!expirationDate) return false;

    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilExpiration <= daysThreshold;
  }

  /**
   * Calcule les jours restants jusqu'à l'expiration
   */
  getDaysUntilExpiration(subscription: UserSubscription): number {
    const now = new Date();
    const expirationDate = subscription.status === 'trialing' 
      ? subscription.trialEnd 
      : subscription.currentPeriodEnd;
    
    if (!expirationDate) return 0;

    return Math.max(0, Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));
  }

  /**
   * Vérifie les quotas avant d'autoriser une action
   */
  async checkQuotaBeforeAction(
    userId: string, 
    featureName: string, 
    increment: number = 1
  ): Promise<{ allowed: boolean; message?: string; usage?: UsageLimits }> {
    try {
      // Récupérer les limites actuelles
      const limits = await this.getUserUsageLimits(userId);
      const featureLimit = limits.find(l => l.feature_name === featureName);

      if (!featureLimit) {
        // Pas de limite configurée, autoriser
        return { allowed: true };
      }

      if (featureLimit.limit_value === null) {
        // Limite illimitée
        return { allowed: true, usage: featureLimit };
      }

      const newUsage = featureLimit.current_usage + increment;
      
      if (newUsage > featureLimit.limit_value) {
        return {
          allowed: false,
          message: `Limite atteinte pour ${featureName} (${featureLimit.current_usage}/${featureLimit.limit_value})`,
          usage: featureLimit
        };
      }

      return { allowed: true, usage: featureLimit };
    } catch (error) {
      console.error('Error checking quota:', error);
      return { allowed: false, message: 'Erreur de vérification des quotas' };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;