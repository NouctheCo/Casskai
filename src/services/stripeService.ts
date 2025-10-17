import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import {
  SubscriptionResponse,
  PaymentResponse,
  BillingResponse,
  UserSubscription,
  PaymentMethod,
  Invoice,
  SUBSCRIPTION_PLANS
} from '@/types/subscription.types';
import { logger } from '@/utils/logger';

// Configuration Stripe
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

if (!STRIPE_PUBLISHABLE_KEY) {
  logger.warn('[StripeService] ⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not configured. Stripe features will not work.')
}

class RealStripeService {
  private stripe: Promise<Stripe | null> | null = null;
  private initialized = false;

  constructor() {
    if (STRIPE_PUBLISHABLE_KEY) {
      this.stripe = loadStripe(STRIPE_PUBLISHABLE_KEY);
    } else {
      this.stripe = Promise.resolve(null);
    }
  }

  async initialize(): Promise<Stripe | null> {
    if (!this.initialized) {
      this.initialized = true;
    }
    return await this.stripe;
  }

  /**
   * Vérifie si Stripe est correctement configuré et disponible
   */
  isStripeAvailable(): boolean {
    return !!STRIPE_PUBLISHABLE_KEY && !!this.stripe;
  }

  /**
   * Obtient l'instance Stripe, ou null si non disponible
   */
  async getStripe(): Promise<Stripe | null> {
    if (!this.isStripeAvailable()) {
      logger.warn('[StripeService] Stripe is not available - check VITE_STRIPE_PUBLISHABLE_KEY configuration');
      return null;
    }
    return await this.initialize();
  }

  // ================================
  // GESTION DES PRODUITS ET PRIX
  // ================================

  /**
   * Crée automatiquement les produits et prix Stripe
   */
  async createStripeProducts(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Authentification requise' };
      }

      const response = await fetch(`${API_BASE_URL}/stripe/setup-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plans: SUBSCRIPTION_PLANS })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      logger.error('Error creating Stripe products:', error);
      return { success: false, error: 'Impossible de créer les produits Stripe' };
    }
  }

  /**
   * Synchronise les prix Stripe avec la base de données
   */
  async syncStripePrices(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.warn('[StripeService] syncStripePrices: user not authenticated');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/stripe/sync-prices`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      if (!response.ok) throw new Error('Failed to sync prices');
      
      const { prices } = await response.json();
      
      // Mettre à jour les prix dans Supabase
      for (const price of prices) {
        await supabase
          .from('subscription_plans')
          .update({
            stripe_price_id: price.id,
            stripe_product_id: price.product,
            price: price.unit_amount / 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', price.metadata.plan_id);
      }

      return true;
    } catch (error) {
      logger.error('Error syncing Stripe prices:', error);
      return false;
    }
  }

  // ================================
  // ABONNEMENTS
  // ================================

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(params: {
    planId: string;
    priceId?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionResponse> {
    const { planId, priceId, successUrl, cancelUrl, metadata } = params;

    try {
      let resolvedPriceId = priceId;

      if (!resolvedPriceId) {
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('stripe_price_id')
          .eq('id', planId)
          .single();

        if (planError || !plan) {
          return { success: false, error: 'Plan non trouvé' };
        }

        if (!plan.stripe_price_id) {
          return { success: false, error: 'Prix Stripe non configuré pour ce plan' };
        }

        resolvedPriceId = plan.stripe_price_id;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: 'Vous devez être connecté pour créer un abonnement'
        };
      }

      const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: resolvedPriceId,
          planId,
          successUrl: successUrl ?? `${window.location.origin}/stripe/success`,
          cancelUrl: cancelUrl ?? `${window.location.origin}/stripe/cancel`,
          metadata
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        logger.error('Error creating checkout session:', payload);
        return {
          success: false,
          error: payload.error || 'Impossible de créer la session de paiement'
        };
      }

      return {
        success: true,
        checkoutUrl: payload.url ?? (payload.sessionId ? `https://checkout.stripe.com/pay/${payload.sessionId}` : undefined),
        sessionId: payload.sessionId
      };
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      return {
        success: false,
        error: 'Impossible de créer la session de paiement'
      };
    }
  }

  /**
   * Récupère l'abonnement actuel depuis Supabase
   */
  async getCurrentSubscription(userId: string): Promise<SubscriptionResponse> {
    logger.warn('[StripeService] getCurrentSubscription called for user:', userId);

    try {
      logger.warn('[StripeService] Executing subscription query...');
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          stripe_subscription_id,
          stripe_customer_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          canceled_at,
          trial_start,
          trial_end,
          created_at,
          updated_at,
          company_id,
          cancel_at,
          cancel_reason,
          metadata
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1);

      logger.warn('[StripeService] Query result:', { data: subscription, error });

      if (error) {
        logger.error('[StripeService] Database error:', error);
        return { success: false, error: `Erreur base de données: ${error.message}` };
      }

      if (!subscription || subscription.length === 0) {
        logger.warn('[StripeService] No subscription found for user');
        return { success: true, subscription: undefined };
      }

      logger.warn('[StripeService] Found subscription:', subscription[0]);

      const sub = subscription[0];

      // Fetch the plan details separately
      logger.warn('[StripeService] Fetching plan details for plan_id:', sub.plan_id);
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name, price, currency, billing_period, is_trial, trial_days, stripe_price_id, is_active')
        .eq('id', sub.plan_id)
        .single();

      logger.warn('[StripeService] Plan fetch result:', { data: plan, error: planError });

      if (planError) {
        logger.error('[StripeService] Error fetching plan:', planError);
        return { success: false, error: `Erreur récupération plan: ${planError.message}` };
      }

      // Convertir en format UserSubscription
      const userSubscription: UserSubscription = {
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        stripeSubscriptionId: sub.stripe_subscription_id || '',
        stripeCustomerId: sub.stripe_customer_id || '',
        status: sub.status as UserSubscription['status'],
        currentPeriodStart: new Date(sub.current_period_start || sub.created_at),
        currentPeriodEnd: new Date(sub.current_period_end || sub.trial_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        trialEnd: sub.trial_end ? new Date(sub.trial_end) : undefined,
        metadata: sub.metadata || {},
        createdAt: new Date(sub.created_at),
        updatedAt: new Date(sub.updated_at || sub.created_at),
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          description: '',
          price: plan.price,
          currency: plan.currency,
          interval: plan.billing_period === 'yearly' ? 'year' : 'month',
          features: [],
          stripePriceId: plan.stripe_price_id || '',
          stripeProductId: '',
          supportLevel: 'basic'
        } : undefined
      };

      logger.warn('[StripeService] Converted subscription:', userSubscription);
      return { success: true, subscription: userSubscription };

    } catch (error) {
      logger.error('[StripeService] Unexpected error:', error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<SubscriptionResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          error: 'Authentification requise'
        };
      }

      const response = await fetch(`${API_BASE_URL}/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: stripeSubscriptionId,
          cancelAtPeriodEnd: true
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        logger.error('Error canceling subscription:', payload);
        return {
          success: false,
          error: payload.error || 'Impossible d\'annuler l\'abonnement'
        };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error in cancelSubscription:', error);
      return {
        success: false,
        error: 'Impossible d\'annuler l\'abonnement'
      };
    }
  }

  /**
   * Met à jour un abonnement
   */
  async updateSubscription(
    stripeSubscriptionId: string, 
    newPlanId: string
  ): Promise<SubscriptionResponse> {
    try {
      // Récupérer le nouveau plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('stripe_price_id')
        .eq('id', newPlanId)
        .single();

      if (planError || !plan?.stripe_price_id) {
        return { success: false, error: 'Plan non trouvé' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Authentification requise' };
      }

      const response = await fetch(`${API_BASE_URL}/stripe/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: stripeSubscriptionId,
          newPriceId: plan.stripe_price_id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mettre à jour dans Supabase
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', stripeSubscriptionId);

      if (updateError) {
        logger.error('Error updating subscription in Supabase:', updateError)
      }

      return { success: true };
    } catch (error) {
      logger.error('Error updating subscription:', error);
      return {
        success: false,
        error: 'Impossible de modifier l\'abonnement'
      };
    }
  }

  // ================================
  // MÉTHODES DE PAIEMENT
  // ================================

  /**
   * Récupère les méthodes de paiement depuis Supabase
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching payment methods:', error);
        return [];
      }

      return methods.map(method => ({
        id: method.id,
        userId: method.user_id,
        stripePaymentMethodId: method.stripe_payment_method_id,
        type: method.type as PaymentMethod['type'],
        brand: method.brand,
        last4: method.last4,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year,
        isDefault: method.is_default,
        createdAt: new Date(method.created_at)
      }));
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Ajoute une méthode de paiement
   */
  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Authentification requise' };
      }

      const response = await fetch(`${API_BASE_URL}/stripe/attach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paymentMethod = await response.json();
      
      // Sauvegarder dans Supabase
      const { data: savedMethod, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          stripe_payment_method_id: paymentMethod.id,
          type: paymentMethod.type,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          expiry_month: paymentMethod.card?.exp_month,
          expiry_year: paymentMethod.card?.exp_year,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving payment method:', error);
        return { success: false, error: 'Erreur de sauvegarde' };
      }

      return {
        success: true,
        paymentMethod: {
          id: savedMethod.id,
          userId: savedMethod.user_id,
          stripePaymentMethodId: savedMethod.stripe_payment_method_id,
          type: savedMethod.type as PaymentMethod['type'],
          brand: savedMethod.brand,
          last4: savedMethod.last4,
          expiryMonth: savedMethod.expiry_month,
          expiryYear: savedMethod.expiry_year,
          isDefault: savedMethod.is_default,
          createdAt: new Date(savedMethod.created_at)
        }
      };
    } catch (error) {
      logger.error('Error adding payment method:', error);
      return {
        success: false,
        error: 'Impossible d\'ajouter le moyen de paiement'
      };
    }
  }

  /**
   * Supprime une méthode de paiement
   */
  async removePaymentMethod(paymentMethodId: string): Promise<PaymentResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Authentification requise' };
      }

      // Supprimer de Stripe
      const response = await fetch(`${API_BASE_URL}/stripe/detach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Supprimer de Supabase
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('stripe_payment_method_id', paymentMethodId);

      if (error) {
        logger.error('Error deleting payment method from Supabase:', error)
      }

      return { success: true };
    } catch (error) {
      logger.error('Error removing payment method:', error);
      return {
        success: false,
        error: 'Impossible de supprimer le moyen de paiement'
      };
    }
  }

  // ================================
  // PORTAIL DE FACTURATION
  // ================================

  /**
   * Crée une session du portail de facturation
   */
  async createBillingPortalSession(
    customerIdOrReturnUrl: string,
    maybeReturnUrl?: string
  ): Promise<BillingResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Authentification requise' };
      }

      const resolvedReturnUrl = maybeReturnUrl ?? customerIdOrReturnUrl;

      const response = await fetch(`${API_BASE_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: resolvedReturnUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const portalSession = await response.json();
      return {
        success: true,
        portalUrl: portalSession.url
      };
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      return {
        success: false,
        error: 'Impossible d\'accéder au portail de facturation'
      };
    }
  }

  // ================================
  // FACTURES
  // ================================

  /**
   * Récupère les factures depuis Supabase
   */
  async getInvoices(userId: string, limit: number = 10): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices_stripe')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching invoices:', error);
        return [];
      }

      return invoices.map(inv => ({
        id: inv.id,
        userId: inv.user_id,
        stripeInvoiceId: inv.stripe_invoice_id,
        subscriptionId: inv.subscription_id,
        amount: parseFloat(inv.amount),
        currency: inv.currency,
        status: inv.status as Invoice['status'],
        invoiceUrl: inv.invoice_url,
        pdfUrl: inv.pdf_url,
        dueDate: new Date(inv.due_date),
        paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
        createdAt: new Date(inv.created_at)
      }));
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      return [];
    }
  }

  // ================================
  // UTILITAIRES
  // ================================

  /**
   * Redirige vers la checkout Stripe
   */
  async redirectToCheckout(sessionId: string): Promise<{ error?: unknown }> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        logger.warn('[StripeService] Cannot redirect to checkout - Stripe not available');
        return { error: 'Stripe not configured' };
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      return { error };
    } catch (error) {
      logger.error('Error redirecting to checkout:', error);
      return { error };
    }
  }

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/stripe/health`, { headers });
      return response.ok;
    } catch (error) {
      logger.error('Stripe service health check failed:', error);
      return false;
    }
  }
}

export const stripeService = new RealStripeService();
export default stripeService;
