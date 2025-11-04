import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  planCode: string;
  savings?: number; // Pourcentage d'économie annuel vs mensuel
}

export interface CreateSubscriptionData {
  priceId: string;
  enterpriseId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Service de gestion des abonnements Stripe
 */
export class StripeSubscriptionService {
  private stripe: Stripe | null = null;

  async initialize() {
    if (!this.stripe) {
      this.stripe = await getStripe();
    }
    return this.stripe;
  }

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(data: CreateSubscriptionData) {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      // Créer la session de checkout via Supabase Edge Function
      const { data: session, error } = await supabase.functions.invoke('create-checkout-session', {
        body: data
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      // Rediriger vers Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error in createCheckoutSession:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Met à jour l'abonnement d'une entreprise
   */
  async updateSubscription(enterpriseId: string, newPriceId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: {
          enterpriseId,
          newPriceId
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating subscription:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Annule l'abonnement d'une entreprise
   */
  async cancelSubscription(enterpriseId: string, cancelAtPeriodEnd = true) {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          enterpriseId,
          cancelAtPeriodEnd
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Réactive un abonnement annulé
   */
  async reactivateSubscription(enterpriseId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: {
          enterpriseId
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error reactivating subscription:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Récupère les informations de facturation du client
   */
  async getCustomerPortalSession(enterpriseId: string, returnUrl: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          enterpriseId,
          returnUrl
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating portal session:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Redirige vers le portail client Stripe
   */
  async redirectToCustomerPortal(enterpriseId: string, returnUrl: string) {
    const stripe = await this.initialize();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const portalSession = await this.getCustomerPortalSession(enterpriseId, returnUrl);

      // Rediriger vers le portail
      window.location.href = portalSession.url;
    } catch (error) {
      console.error('Error redirecting to customer portal:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

// Instance singleton
export const stripeSubscriptionService = new StripeSubscriptionService();

// Plans d'abonnement disponibles
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter-monthly',
    name: 'Starter',
    price: 29,
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    planCode: 'starter',
    features: [
      'Jusqu\'à 5 utilisateurs',
      'Modules de base',
      'Support par email',
      'Sauvegarde quotidienne'
    ]
  },
  {
    id: 'starter-yearly',
    name: 'Starter Annuel',
    price: 290, // 29 * 12 * 0.8 = économie de 20%
    interval: 'year',
    stripePriceId: process.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID || '',
    planCode: 'starter',
    savings: 20,
    features: [
      'Jusqu\'à 5 utilisateurs',
      'Modules de base',
      'Support par email',
      'Sauvegarde quotidienne',
      'Économie de 20% sur l\'année'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Professionnel',
    price: 79,
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    planCode: 'pro',
    features: [
      'Jusqu\'à 25 utilisateurs',
      'Tous les modules',
      'Rapports avancés',
      'Support prioritaire',
      'API access'
    ]
  },
  {
    id: 'pro-yearly',
    name: 'Professionnel Annuel',
    price: 790, // 79 * 12 * 0.8 = économie de 20%
    interval: 'year',
    stripePriceId: process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',
    planCode: 'pro',
    savings: 20,
    features: [
      'Jusqu\'à 25 utilisateurs',
      'Tous les modules',
      'Rapports avancés',
      'Support prioritaire',
      'API access',
      'Économie de 20% sur l\'année'
    ]
  },
  {
    id: 'enterprise-monthly',
    name: 'Entreprise',
    price: 199,
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    planCode: 'enterprise',
    features: [
      'Utilisateurs illimités',
      'Tous les modules premium',
      'Analyses personnalisées',
      'Support dédié 24/7',
      'Intégrations avancées',
      'SLA garanti'
    ]
  },
  {
    id: 'enterprise-yearly',
    name: 'Entreprise Annuel',
    price: 1990, // 199 * 12 * 0.8 = économie de 20%
    interval: 'year',
    stripePriceId: process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    planCode: 'enterprise',
    savings: 20,
    features: [
      'Utilisateurs illimités',
      'Tous les modules premium',
      'Analyses personnalisées',
      'Support dédié 24/7',
      'Intégrations avancées',
      'SLA garanti',
      'Économie de 20% sur l\'année'
    ]
  }
];
