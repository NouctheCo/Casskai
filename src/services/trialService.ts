import { supabase } from '@/lib/supabase';

export interface TrialInfo {
  subscriptionId: string;
  planId: string;
  status: string;
  trialStart: Date;
  trialEnd: Date;
  daysRemaining: number;
  isExpired: boolean;
}

export interface ExpiringTrial {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  trial_end: string;
  created_at: string;
  subscription_plans: Array<{
    name: string;
    price: number;
    currency: string;
  }>;
}

class TrialService {

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
   * Vérifie si un utilisateur peut créer un essai
   */
  async canCreateTrial(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_create_trial', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error checking trial creation eligibility:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in canCreateTrial:', error);
      return false;
    }
  }

  /**
   * Obtient les informations détaillées d'essai d'un utilisateur
   */
  async getUserTrialInfo(userId: string): Promise<TrialInfo | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_trial_info', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting trial info:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const trial = data[0];
      return {
        subscriptionId: trial.subscription_id,
        planId: trial.plan_id,
        status: trial.status,
        trialStart: new Date(trial.trial_start),
        trialEnd: new Date(trial.trial_end),
        daysRemaining: trial.days_remaining,
        isExpired: trial.is_expired
      };
    } catch (error) {
      console.error('Error in getUserTrialInfo:', error);
      return null;
    }
  }

  /**
   * Convertit un essai en abonnement payant
   */
  async convertTrialToPaid(
    userId: string,
    newPlanId: string,
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('convert_trial_to_paid', {
        p_user_id: userId,
        p_new_plan_id: newPlanId,
        p_stripe_subscription_id: stripeSubscriptionId || null,
        p_stripe_customer_id: stripeCustomerId || null
      });

      if (error) {
        console.error('Error converting trial to paid:', error);
        return { success: false, error: error.message };
      }

      if (data === 'PLAN_NOT_FOUND') {
        return { success: false, error: 'Plan d\'abonnement non trouvé' };
      }

      if (data === 'NO_ACTIVE_TRIAL') {
        return { success: false, error: 'Aucun essai actif trouvé' };
      }

      if (data === 'SUCCESS') {
        return { success: true };
      }

      return { success: false, error: 'Erreur lors de la conversion' };
    } catch (error) {
      console.error('Error in convertTrialToPaid:', error);
      return { success: false, error: 'Erreur inattendue' };
    }
  }

  /**
   * Annule un abonnement d'essai
   */
  async cancelTrial(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Utiliser une approche directe au lieu de la fonction RPC
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          cancel_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'trialing')
        .eq('plan_id', 'trial')
        .select();

      if (error) {
        console.error('Error canceling trial:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Aucun essai actif trouvé pour cet utilisateur' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in cancelTrial:', error);
      return { success: false, error: 'Erreur lors de l\'annulation de l\'essai' };
    }
  }

  /**
   * Obtient des statistiques sur les essais
   */
  async getTrialStatistics(): Promise<Array<{ metric: string; value: number }>> {
    try {
      const { data, error } = await supabase.rpc('get_trial_statistics');

      if (error) {
        console.error('Error getting trial statistics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrialStatistics:', error);
      return [];
    }
  }

  /**
   * Obtient la liste des essais qui expirent bientôt
   */
  async getExpiringTrials(daysAhead: number = 7): Promise<ExpiringTrial[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          trial_end,
          created_at,
          subscription_plans (
            name,
            price,
            currency
          )
        `)
        .eq('status', 'trialing')
        .eq('plan_id', 'trial')
        .gte('trial_end', new Date().toISOString())
        .lte('trial_end', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString())
        .order('trial_end', { ascending: true });

      if (error) {
        console.error('Error getting expiring trials:', error);
        return [];
      }

      return (data || []) as ExpiringTrial[];
    } catch (error) {
      console.error('Error in getExpiringTrials:', error);
      return [];
    }
  }

  /**
   * Vérifie et met à jour automatiquement les essais expirés
   */
  async checkAndExpireTrials(): Promise<{ expiredCount: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('expire_trials');

      if (error) {
        console.error('Error expiring trials:', error);
        return { expiredCount: 0, error: error.message };
      }

      return { expiredCount: data || 0 };
    } catch (error) {
      console.error('Error in checkAndExpireTrials:', error);
      return { expiredCount: 0, error: 'Erreur inattendue' };
    }
  }
}

export const trialService = new TrialService();
export default trialService;
