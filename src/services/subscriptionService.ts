import { supabase } from '@/lib/supabase';
import { 
  UserSubscription, 
  SubscriptionPlan, 
  getModulesForPlan, 
  isModuleAllowedForPlan, 
  isTrialUser,
  SUBSCRIPTION_PLANS as PREDEFINED_PLANS
} from '@/types/subscription.types';

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
        .maybeSingle();

      if (error) {
        console.warn('[SubscriptionService] Erreur requête subscription:', error);
        return null;
      }

      if (!data) {
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
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_trial_subscription', {
        p_user_id: userId,
        p_company_id: companyId || null
      });

      if (error) {
        console.error('Error creating trial subscription:', error);
        return { success: false, error: error.message };
      }

      if (data === 'ALREADY_EXISTS') {
        return { success: false, error: 'Un essai existe déjà pour cet utilisateur' };
      }

      if (!data) {
        return { success: false, error: 'Erreur lors de la création de l\'essai' };
      }

      return { success: true, subscriptionId: data };
    } catch (error) {
      console.error('Error in createTrialSubscription:', error);
      return { success: false, error: 'Erreur inattendue' };
    }
  }

  /**
   * Expire les essais qui ont dépassé leur date de fin
   */
  async expireTrials(): Promise<{ expiredCount: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('expire_trials');

      if (error) {
        console.error('Error expiring trials:', error);
        return { expiredCount: 0, error: error.message };
      }

      return { expiredCount: data || 0 };
    } catch (error) {
      console.error('Error in expireTrials:', error);
      return { expiredCount: 0, error: 'Erreur inattendue' };
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

  /**
   * Obtenir le plan actuel de l'utilisateur avec fallback intelligent
   */
  async getCurrentUserPlan(userId: string): Promise<string> {
    try {
      // Essayer de récupérer depuis Supabase d'abord
      const subscription = await this.getCurrentSubscription(userId);
      
      if (subscription && subscription.status === 'trialing') {
        return 'trial';
      }
      
      if (subscription && subscription.status === 'active') {
        return subscription.planId;
      }

      // Vérifier le localStorage pour les utilisateurs sans DB
      const localPlan = localStorage.getItem(`user_plan_${userId}`);
      if (localPlan) {
        return localPlan;
      }

      // Vérifier si c'est un nouvel utilisateur (période d'essai)
      return await this.checkTrialStatus(userId);
    } catch (error) {
      console.error('[SubscriptionService] Erreur récupération plan:', error);
      return await this.checkTrialStatus(userId);
    }
  }

  /**
   * Vérifier le statut d'essai avec localStorage fallback
   */
  private async checkTrialStatus(userId: string): Promise<string> {
    const trialKey = `trial_start_${userId}`;
    const trialStart = localStorage.getItem(trialKey);
    
    if (!trialStart) {
      // Première connexion, démarrer l'essai
      localStorage.setItem(trialKey, new Date().toISOString());
      return 'trial';
    }

    const trialStartDate = new Date(trialStart);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 30) {
      return 'trial';
    } else {
      // Essai expiré, passer au plan starter par défaut
      return 'starter';
    }
  }

  /**
   * Obtenir les modules disponibles pour un plan
   */
  getAvailableModules(planId: string): string[] {
    return getModulesForPlan(planId);
  }

  /**
   * Vérifier si un module est disponible dans le plan
   */
  isModuleAvailableInPlan(moduleKey: string, planId: string): boolean {
    return isModuleAllowedForPlan(moduleKey, planId);
  }

  /**
   * Obtenir les jours restants d'essai
   */
  async getTrialDaysRemaining(userId: string): Promise<number> {
    const subscription = await this.getCurrentSubscription(userId);
    
    if (subscription && subscription.status === 'trialing' && subscription.trialEnd) {
      const now = new Date();
      const daysRemaining = Math.ceil(
        (subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, daysRemaining);
    }

    // Fallback localStorage pour les utilisateurs sans DB
    const trialKey = `trial_start_${userId}`;
    const trialStart = localStorage.getItem(trialKey);
    
    if (!trialStart) return 30;

    const trialStartDate = new Date(trialStart);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, 30 - daysDiff);
  }

  /**
   * Changer de plan (avec support localStorage)
   */
  async changePlan(userId: string, newPlanId: string): Promise<boolean> {
    try {
      // Essayer la mise à jour en DB d'abord
      const subscription = await this.getCurrentSubscription(userId);
      
      if (subscription) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ plan_id: newPlanId, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (error) {
          console.warn('[SubscriptionService] Erreur mise à jour DB, fallback localStorage');
        }
      }

      // Toujours sauvegarder en localStorage comme fallback
      const subscriptionKey = `user_plan_${userId}`;
      localStorage.setItem(subscriptionKey, newPlanId);
      
      // Émettre un événement pour que les composants se mettent à jour
      window.dispatchEvent(new CustomEvent('subscription-changed', { 
        detail: { userId, newPlanId } 
      }));

      return true;
    } catch (error) {
      console.error('[SubscriptionService] Erreur changement plan:', error);
      return false;
    }
  }

  /**
   * Obtenir le prix de mise à niveau
   */
  getUpgradePrice(currentPlan: string, targetPlan: string): number {
    const current = PREDEFINED_PLANS.find(p => p.id === currentPlan);
    const target = PREDEFINED_PLANS.find(p => p.id === targetPlan);
    
    if (!current || !target) return 0;
    
    return Math.max(0, target.price - current.price);
  }

  /**
   * Vérifier si l'utilisateur peut accéder à un module
   */
  async canAccessModule(userId: string, moduleKey: string): Promise<boolean> {
    const currentPlan = await this.getCurrentUserPlan(userId);
    return this.isModuleAvailableInPlan(moduleKey, currentPlan);
  }

  /**
   * Obtenir les modules manquants pour un plan cible
   */
  getMissingModulesForPlan(currentPlan: string, targetModules: string[]): string[] {
    const availableModules = this.getAvailableModules(currentPlan);
    return targetModules.filter(module => !availableModules.includes(module));
  }

  /**
   * Recommander un plan pour des modules spécifiques
   */
  recommendPlanForModules(desiredModules: string[]): string {
    for (const plan of PREDEFINED_PLANS) {
      if (plan.id === 'trial') continue;
      
      const availableModules = this.getAvailableModules(plan.id);
      const hasAllModules = desiredModules.every(module => availableModules.includes(module));
      
      if (hasAllModules) {
        return plan.id;
      }
    }
    
    return 'enterprise'; // Par défaut si aucun plan ne convient
  }

  /**
   * Vérifier si l'utilisateur est en période d'essai
   */
  async isUserOnTrial(userId: string): Promise<boolean> {
    const currentPlan = await this.getCurrentUserPlan(userId);
    return currentPlan === 'trial';
  }

  /**
   * Obtenir les informations du plan actuel
   */
  async getCurrentPlanInfo(userId: string): Promise<SubscriptionPlan | null> {
    const planId = await this.getCurrentUserPlan(userId);
    return PREDEFINED_PLANS.find(p => p.id === planId) || null;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;