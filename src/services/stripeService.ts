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

// Configuration Stripe
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('[StripeService] ⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not configured. Stripe features will not work.');
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
      console.warn('[StripeService] Stripe is not available - check VITE_STRIPE_PUBLISHABLE_KEY configuration');
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
      const response = await fetch(`${API_BASE_URL}/stripe/setup-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plans: SUBSCRIPTION_PLANS })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      console.error('Error creating Stripe products:', error);
      return { success: false, error: 'Impossible de créer les produits Stripe' };
    }
  }

  /**
   * Synchronise les prix Stripe avec la base de données
   */
  async syncStripePrices(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/sync-prices`);
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
      console.error('Error syncing Stripe prices:', error);
      return false;
    }
  }

  // ================================
  // ABONNEMENTS
  // ================================

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(
    planId: string,
    userId: string,
    _successUrl: string,
    _cancelUrl: string
  ): Promise<SubscriptionResponse> {
    try {
      // Récupérer le plan depuis Supabase
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'Plan non trouvé' };
      }

      if (!plan.stripe_price_id) {
        return { success: false, error: 'Prix Stripe non configuré pour ce plan' };
      }

      // Utiliser la fonction Edge Supabase au lieu du backend Express
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          userId
        }
      });

      if (sessionError) {
        console.error('Error creating checkout session:', sessionError);
        return {
          success: false,
          error: 'Impossible de créer la session de paiement'
        };
      }

      return {
        success: true,
        checkoutUrl: sessionData.sessionId ? `https://checkout.stripe.com/pay/${sessionData.sessionId}` : undefined
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
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
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching subscription:', error);
        return { success: false, error: 'Erreur lors de la récupération de l\'abonnement' };
      }

      if (!subscription || subscription.length === 0) {
        return { success: true, subscription: undefined };
      }

      // Convertir en format UserSubscription
      const userSubscription: UserSubscription = {
        id: subscription[0].id,
        userId: subscription[0].user_id,
        planId: subscription[0].plan_id,
        stripeSubscriptionId: subscription[0].stripe_subscription_id || '',
        stripeCustomerId: subscription[0].stripe_customer_id || '',
        status: subscription[0].status as UserSubscription['status'],
        currentPeriodStart: new Date(subscription[0].current_period_start),
        currentPeriodEnd: new Date(subscription[0].current_period_end),
        cancelAtPeriodEnd: subscription[0].cancel_at_period_end || false,
        trialEnd: subscription[0].trial_end ? new Date(subscription[0].trial_end) : undefined,
        metadata: subscription[0].metadata || {},
        createdAt: new Date(subscription[0].created_at),
        updatedAt: new Date(subscription[0].updated_at)
      };

      return { success: true, subscription: userSubscription };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: 'Impossible de récupérer l\'abonnement'
      };
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<SubscriptionResponse> {
    try {
      // Utiliser la fonction Edge Supabase
      const { data: _data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: stripeSubscriptionId,
          cancelAtPeriodEnd: true
        }
      });

      if (error) {
        console.error('Error canceling subscription:', error);
        return {
          success: false,
          error: 'Impossible d\'annuler l\'abonnement'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
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

      const response = await fetch(`${API_BASE_URL}/stripe/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('Error updating subscription in Supabase:', updateError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
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
        console.error('Error fetching payment methods:', error);
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
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Ajoute une méthode de paiement
   */
  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/attach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          userId
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
        console.error('Error saving payment method:', error);
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
      console.error('Error adding payment method:', error);
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
      // Supprimer de Stripe
      const response = await fetch(`${API_BASE_URL}/stripe/detach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('Error deleting payment method from Supabase:', error);
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing payment method:', error);
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
    customerId: string,
    returnUrl: string
  ): Promise<BillingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = await response.json();
      return {
        success: true,
        portalUrl: session.url
      };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
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
        console.error('Error fetching invoices:', error);
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
      console.error('Error fetching invoices:', error);
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
        console.warn('[StripeService] Cannot redirect to checkout - Stripe not available');
        return { error: 'Stripe not configured' };
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      return { error };
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      return { error };
    }
  }

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe/health`);
      return response.ok;
    } catch (error) {
      console.error('Stripe service health check failed:', error);
      return false;
    }
  }
}

export const stripeService = new RealStripeService();
export default stripeService;