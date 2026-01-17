/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { UserSubscription, SubscriptionPlan } from '@/types/subscription.types';
import { billingService } from '@/services/billingService';
import { logger } from '@/lib/logger';
type RawSubscription = Record<string, unknown>;
const normalizeSubscription = (raw: RawSubscription): UserSubscription => ({
  id: raw.id as string,
  userId: (raw.user_id || raw.userId) as string,
  planId: (raw.plan_id || raw.planId) as string,
  stripeSubscriptionId: (raw.stripe_subscription_id || raw.stripeSubscriptionId) as string,
  stripeCustomerId: (raw.stripe_customer_id || raw.stripeCustomerId) as string,
  status: raw.status as 'active' | 'canceled' | 'trialing' | 'past_due' | 'incomplete',
  currentPeriodStart: new Date((raw.current_period_start || raw.currentPeriodStart || Date.now()) as string | number),
  currentPeriodEnd: new Date((raw.current_period_end || raw.currentPeriodEnd || Date.now()) as string | number),
  cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end || raw.cancelAtPeriodEnd),
  trialEnd: raw.trial_ends_at ? new Date(raw.trial_ends_at as string | number) : raw.trialEnd ? new Date(raw.trialEnd as string | number) : undefined,
  metadata: (raw.metadata || undefined) as Record<string, unknown> | undefined,
  createdAt: new Date((raw.created_at || raw.createdAt || Date.now()) as string | number),
  updatedAt: new Date((raw.updated_at || raw.updatedAt || Date.now()) as string | number),
});
interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isActive: boolean;
  isTrialing: boolean;
  daysUntilRenewal: number | null;
  subscriptionPlan: string | null;
  refreshSubscription: () => Promise<void>;
  isLoading: boolean;
  canAccessFeature: (featureName: string) => Promise<boolean>;
  getUsageLimit: (featureName: string) => Promise<{ current: number; limit: number | null }>;
  openBillingPortal: () => Promise<{ success: boolean; error?: string }>;
  invoices: any[];
  paymentMethods: any[];
  defaultPaymentMethod: any | null;
  subscribe: (planId: string) => Promise<{ success: boolean; error?: string; checkoutUrl?: string }>;
  updateSubscription: (planId: string) => Promise<{ success: boolean; error?: string }>;
}
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptionPlan, setSubscriptionPlanState] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<any | null>(null);
  useEffect(() => {
    if (!user) {
      // Utilisateur non connecté - considérer comme plan gratuit
      setSubscriptionPlanState('free');
      setSubscription(null);
      setPlan(null);
      setIsLoading(false);
      return;
    }
    fetchSubscription();
  }, [user]);
  const fetchInvoicesAndPaymentMethods = async () => {
    if (!user) return;
    try {
      // Charger les factures
      const invoicesResult = await billingService.getInvoices({ limit: 50 });
      if (invoicesResult.success) {
        setInvoices(invoicesResult.invoices || []);
      }
    } catch (error) {
      logger.error('Subscription', 'Error fetching invoices:', error);
      setInvoices([]);
    }
    // TODO: Implémenter getPaymentMethods dans billingService
    // Pour l'instant, on laisse vide
    setPaymentMethods([]);
    setDefaultPaymentMethod(null);
  };
  const fetchSubscription = async () => {
    if (!user) return;
    try {
      // Récupérer la dernière subscription (quel que soit le status) pour éviter
      // de traiter un utilisateur expiré comme "free".
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptionError) {
        if (subscriptionError.code !== 'PGRST116') {
          logger.error('Subscription', 'Error fetching subscription:', subscriptionError);
        }
        setSubscriptionPlanState('free');
        setSubscription(null);
        setPlan(null);
      } else if (subscriptionData && subscriptionData.length > 0) {
        const rawSubscription = subscriptionData[0] as RawSubscription;
        const normalized = normalizeSubscription(rawSubscription);
        setSubscriptionPlanState(normalized.planId);
        setSubscription(normalized);

        if (normalized.planId) {
          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', normalized.planId)
            .single();
          if (!planError && planData) {
            setPlan(planData as SubscriptionPlan);
          } else {
            setPlan(null);
          }
        } else {
          setPlan(null);
        }
      } else {
        // Aucun abonnement trouvé - utiliser plan gratuit local (sans écrire en DB)
        const freeSubscription = {
          id: 'free-plan',
          userId: user.id,
          planId: 'free',
          stripeSubscriptionId: '',
          stripeCustomerId: '',
          status: 'active' as const,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(2099, 11, 31),
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSubscriptionPlanState('free');
        setSubscription(freeSubscription);
        setPlan({
          id: 'free',
          name: 'Gratuit',
          description: 'Plan gratuit avec fonctionnalités de base',
          price: 0,
          currency: 'EUR',
          interval: 'month',
          features: ['Accès de base', 'Jusqu\'à 10 clients', 'Support communautaire'],
          stripePriceId: 'free',
          stripeProductId: 'free',
          supportLevel: 'basic'
        });
      }
    } catch (error) {
      logger.error('Subscription', 'Unexpected error in fetchSubscription:', error);
      // En cas d'erreur, utiliser plan gratuit par défaut
      setSubscriptionPlanState('free');
      setSubscription(null);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
    // Charger les factures et moyens de paiement après avoir chargé la subscription
    await fetchInvoicesAndPaymentMethods();
  };
  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
    // fetchSubscription appelle déjà fetchInvoicesAndPaymentMethods
  };
  // Écouter les changements en temps réel pour les webhooks Stripe
  useEffect(() => {
    if (!user) return;
    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.warn('Subscription', 'Subscription change detected:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const rawSubscription = payload.new as RawSubscription;
            const normalized = normalizeSubscription(rawSubscription);
            setSubscriptionPlanState(normalized.planId);
            setSubscription(normalized);
            // Recharger les détails du plan si nécessaire
            if (rawSubscription.subscription_plans) {
              setPlan(rawSubscription.subscription_plans as SubscriptionPlan);
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const rawSubscription = payload.new as RawSubscription;
            const normalized = normalizeSubscription(rawSubscription);
            setSubscriptionPlanState(normalized.planId);
            setSubscription(normalized);
            if (rawSubscription.subscription_plans) {
              setPlan(rawSubscription.subscription_plans as SubscriptionPlan);
            }
          }
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  const canAccessFeature = async (_featureName: string): Promise<boolean> => {
    // Implementation would check feature access based on plan
    return true; // Placeholder
  };
  const getUsageLimit = async (_featureName: string): Promise<{ current: number; limit: number | null }> => {
    // Implementation would get usage limits
    return { current: 0, limit: null }; // Placeholder
  };
  const openBillingPortal = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { url } = await billingService.openCustomerPortal();
      window.location.href = url;
      return { success: true };
    } catch (error) {
      logger.error('Subscription', 'Failed to open billing portal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  const isActive = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const daysUntilRenewal = subscription
    ? Math.max(0, Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const subscribe = async (planId: string) => {
    try {
      // Extract interval from planId (ex: 'pro_monthly' -> 'monthly')
      const [, interval] = planId.split('_');
      const billingInterval = (interval === 'yearly' || interval === 'annual') ? 'yearly' : 'monthly';
      const { url } = await billingService.createCheckoutSession(
        planId,
        billingInterval as 'monthly' | 'yearly'
      );
      return { success: true, checkoutUrl: url };
    } catch (error) {
      logger.error('Subscription', 'Failed to subscribe:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  const updateSubscription = async (planId: string) => {
    try {
      await billingService.updateSubscription(planId, 'create_prorations');
      await refreshSubscription();
      return { success: true };
    } catch (error) {
      logger.error('Subscription', 'Failed to update subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  const value: SubscriptionContextType = {
    subscription,
    plan,
    isActive,
    isTrialing,
    daysUntilRenewal,
    subscriptionPlan,
    refreshSubscription,
    isLoading,
    canAccessFeature,
    getUsageLimit,
    openBillingPortal,
    invoices,
    paymentMethods,
    defaultPaymentMethod,
    subscribe,
    updateSubscription,
  };
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}