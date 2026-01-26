/**
 * CassKai - Service de Facturation (Billing)
 * Appels directs aux Edge Functions Supabase sécurisées
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
}
export interface PortalSessionResponse {
  url: string;
}
export interface SubscriptionUpdateResponse {
  success: boolean;
  subscription?: any;
  message?: string;
}
export interface CancelSubscriptionResponse {
  success: boolean;
  subscription?: any;
  message?: string;
}
/**
 * Gestion centralisée des erreurs Edge Functions
 */
function handleEdgeFunctionError(error: any): string {
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  if (error?.message?.includes('429')) {
    return 'Trop de requêtes. Veuillez patienter quelques instants.';
  }
  if (error?.message?.includes('500')) {
    return 'Erreur serveur. Veuillez réessayer dans quelques instants.';
  }
  if (error?.message?.includes('No active subscription')) {
    return 'Aucun abonnement actif trouvé.';
  }
  return error?.message || 'Une erreur est survenue';
}
export const billingService = {
  /**
   * Créer une session de checkout Stripe
   *
   * @param planId - ID du plan (ex: 'starter', 'pro', 'enterprise')
   * @param interval - Intervalle de facturation ('monthly' ou 'yearly')
   * @param currency - Devise (par défaut 'EUR')
   * @returns URL de la session de checkout
   */
  async createCheckoutSession(
    planId: string,
    interval: 'monthly' | 'yearly' = 'monthly',
    currency?: string
  ): Promise<CheckoutSessionResponse> {
    try {
      currency = currency || getCurrentCompanyCurrency();
      // Construire le planId complet (ex: 'starter_monthly')
      const fullPlanId = planId.includes('_') ? planId : `${planId}_${interval}`;
      logger.debug('Billing', '[BillingService] Creating checkout session:', { planId: fullPlanId, interval, currency });
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId: fullPlanId,
          interval,
          currency
        }
      });
      if (error) {
        logger.error('Billing', '[BillingService] Checkout session error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      if (!data?.url) {
        throw new Error('Aucune URL de checkout retournée par le serveur');
      }
      logger.debug('Billing', '[BillingService] Checkout session created:', data);
      return data;
    } catch (error) {
      logger.error('Billing', '[BillingService] Error creating checkout session:', error);
      throw error;
    }
  },
  /**
   * Ouvrir le portail client Stripe (Customer Portal)
   * Permet à l'utilisateur de gérer son abonnement, paiements, factures, etc.
   *
   * @returns URL du portail client
   */
  async openCustomerPortal(): Promise<PortalSessionResponse> {
    try {
      logger.debug('Billing', '[BillingService] Opening customer portal');
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {}
      });
      if (error) {
        logger.error('Billing', '[BillingService] Portal session error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      if (!data?.url) {
        throw new Error('Aucune URL de portail retournée par le serveur');
      }
      logger.debug('Billing', '[BillingService] Portal session created');
      return data;
    } catch (error) {
      logger.error('Billing', '[BillingService] Error opening customer portal:', error);
      throw error;
    }
  },
  /**
   * Changer de plan d'abonnement
   *
   * @param newPlanId - ID du nouveau plan (ex: 'pro_monthly')
   * @param prorationBehavior - Comportement de proratisation ('create_prorations' par défaut)
   * @returns Détails de l'abonnement mis à jour
   */
  async updateSubscription(
    newPlanId: string,
    prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
  ): Promise<SubscriptionUpdateResponse> {
    try {
      logger.debug('Billing', '[BillingService] Updating subscription:', { newPlanId, prorationBehavior });
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: {
          new_plan_id: newPlanId,
          proration_behavior: prorationBehavior
        }
      });
      if (error) {
        logger.error('Billing', '[BillingService] Update subscription error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      logger.debug('Billing', '[BillingService] Subscription updated:', data);
      return {
        success: true,
        subscription: data.subscription,
        message: 'Abonnement mis à jour avec succès'
      };
    } catch (error) {
      logger.error('Billing', '[BillingService] Error updating subscription:', error);
      throw error;
    }
  },
  /**
   * Annuler l'abonnement
   *
   * @param cancelAtPeriodEnd - Si true, annule à la fin de la période en cours. Si false, annule immédiatement
   * @param reason - Raison de l'annulation (optionnel)
   * @returns Détails de l'abonnement annulé
   */
  async cancelSubscription(
    cancelAtPeriodEnd: boolean = true,
    reason?: string
  ): Promise<CancelSubscriptionResponse> {
    try {
      logger.debug('Billing', '[BillingService] Canceling subscription:', { cancelAtPeriodEnd, reason });
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          cancelAtPeriodEnd,
          reason
        }
      });
      if (error) {
        logger.error('Billing', '[BillingService] Cancel subscription error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      logger.debug('Billing', '[BillingService] Subscription canceled:', data);
      return {
        success: true,
        subscription: data.subscription,
        message: cancelAtPeriodEnd
          ? 'Abonnement annulé. Actif jusqu\'à la fin de la période en cours.'
          : 'Abonnement annulé immédiatement.'
      };
    } catch (error) {
      logger.error('Billing', '[BillingService] Error canceling subscription:', error);
      throw error;
    }
  },
  /**
   * Obtenir les détails de l'abonnement actuel depuis Supabase
   *
   * @param userId - ID de l'utilisateur
   * @returns Détails de l'abonnement ou null
   */
  async getCurrentSubscription(userId: string) {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            price,
            currency,
            billing_period,
            is_trial,
            trial_days
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          // Aucun abonnement trouvé - ce n'est pas une erreur
          return null;
        }
        throw error;
      }
      return subscription;
    } catch (error) {
      logger.error('Billing', '[BillingService] Error fetching subscription:', error);
      throw error;
    }
  },
  /**
   * Récupérer la liste des factures Stripe
   *
   * @param options - Options de pagination et filtrage
   * @returns Liste des factures avec pagination
   */
  async getInvoices(options?: {
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  }): Promise<{ success: boolean; invoices: any[]; has_more: boolean; total_count: number }> {
    try {
      logger.debug('Billing', '[BillingService] Fetching invoices:', options);
      const { data, error } = await supabase.functions.invoke('get-invoices', {
        body: options || {}
      });
      if (error) {
        logger.error('Billing', '[BillingService] Get invoices error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      logger.debug('Billing', '[BillingService] Invoices fetched:', data.total_count);
      return data;
    } catch (error) {
      logger.error('Billing', '[BillingService] Error fetching invoices:', error);
      throw error;
    }
  },
  /**
   * Télécharger le PDF d'une facture Stripe
   *
   * @param invoiceId - ID de la facture Stripe
   * @param format - 'url' retourne l'URL, 'pdf' redirige vers le PDF
   * @returns URL du PDF et hosted URL
   */
  async downloadInvoice(
    invoiceId: string,
    format: 'url' | 'pdf' = 'url'
  ): Promise<{ success: boolean; invoice_id: string; invoice_number?: string; pdf_url: string; hosted_url?: string }> {
    try {
      logger.debug('Billing', '[BillingService] Downloading invoice:', { invoiceId, format });
      const { data, error } = await supabase.functions.invoke('download-invoice', {
        body: {
          invoice_id: invoiceId,
          download_format: format
        }
      });
      if (error) {
        logger.error('Billing', '[BillingService] Download invoice error:', error);
        throw new Error(handleEdgeFunctionError(error));
      }
      logger.debug('Billing', '[BillingService] Invoice downloaded:', data.invoice_number);
      return data;
    } catch (error) {
      logger.error('Billing', '[BillingService] Error downloading invoice:', error);
      throw error;
    }
  }
};
export default billingService;