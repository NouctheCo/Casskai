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

interface RawSubscription extends Record<string, any> {}

const normalizeSubscription = (raw: RawSubscription): UserSubscription => ({
  id: raw.id,
  userId: raw.user_id || raw.userId,
  planId: raw.plan_id || raw.planId,
  stripeSubscriptionId: raw.stripe_subscription_id || raw.stripeSubscriptionId,
  stripeCustomerId: raw.stripe_customer_id || raw.stripeCustomerId,
  status: raw.status,
  currentPeriodStart: new Date(raw.current_period_start || raw.currentPeriodStart || Date.now()),
  currentPeriodEnd: new Date(raw.current_period_end || raw.currentPeriodEnd || Date.now()),
  cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end || raw.cancelAtPeriodEnd),
  trialEnd: raw.trial_ends_at ? new Date(raw.trial_ends_at) : raw.trialEnd ? new Date(raw.trialEnd) : undefined,
  metadata: raw.metadata || undefined,
  createdAt: new Date(raw.created_at || raw.createdAt || Date.now()),
  updatedAt: new Date(raw.updated_at || raw.updatedAt || Date.now()),
});

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isActive: boolean;
  isTrialing: boolean;
  daysUntilRenewal: number | null;
  subscriptionPlan: string | null;
  setSubscriptionPlan: (plan: string) => Promise<void>;
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

  const fetchSubscription = async () => {
    if (!user) return;
    
    try {
      // Récupérer d'abord les subscriptions sans join pour éviter l'erreur 400
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing']);

      if (subscriptionError) {
        // Ne pas logger comme erreur si c'est juste "no rows found"
        if (subscriptionError.code !== 'PGRST116') {
          console.error('Error fetching subscription:', subscriptionError);
        }
        // Pas d'abonnement actif - utiliser plan gratuit
        setSubscriptionPlanState('free');
        setSubscription(null);
        setPlan(null);
      } else if (subscriptionData && subscriptionData.length > 0) {
        // Prendre le premier abonnement trouvé
        const rawSubscription = subscriptionData[0] as RawSubscription;
        const normalized = normalizeSubscription(rawSubscription);
        setSubscriptionPlanState(normalized.planId);
        setSubscription(normalized);

        // Récupérer le plan séparément si on a un plan_id
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
      // Aucun abonnement trouvé - créer automatiquement un abonnement gratuit
      const freeSubscription = {
        id: 'free-plan',
        userId: user.id,
        planId: 'free',
        stripeSubscriptionId: '',
        stripeCustomerId: '',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(2099, 11, 31), // Date très lointaine pour un plan gratuit permanent
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
      console.error('Unexpected error in fetchSubscription:', error);
      // En cas d'erreur, utiliser plan gratuit par défaut
      setSubscriptionPlanState('free');
      setSubscription(null);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
  };

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
          console.warn('Subscription change detected:', payload);

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

  const setSubscriptionPlan = async (planId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // D'abord, essayer de mettre à jour un abonnement existant (essai ou actif)
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['trialing', 'active'])
        .single();

      if (existingSubscription) {
        // Mettre à jour l'abonnement existant
        console.warn(`🔄 Updating existing subscription from ${existingSubscription.plan_id} to ${planId}`);
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
        } else {
          setSubscriptionPlanState(planId);
          // Recharger les données complètes
          await fetchSubscription();
        }
      } else {
        // Créer un nouvel abonnement si aucun n'existe
        console.warn(`🆕 Creating new subscription with plan ${planId}`);
        const { data: _data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            stripe_customer_id: 'cus_simulated',
            stripe_subscription_id: 'sub_simulated',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          });

        if (error) {
          console.error('Error creating subscription:', error);
        } else {
          setSubscriptionPlanState(planId);
          await fetchSubscription();
        }
      }
    } catch (error) {
      console.error('Error in setSubscriptionPlan:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Implementation would open Stripe billing portal
      console.warn('Open billing portal - not implemented yet');
      return { success: true };
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const isActive = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const daysUntilRenewal = subscription
    ? Math.max(0, Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Stub implementations for billing features
  const subscribe = async (planId: string) => {
    // TODO: Implement actual subscription logic
    return { success: false, error: 'Not implemented' };
  };

  const updateSubscription = async (planId: string) => {
    // TODO: Implement subscription update logic
    return { success: false, error: 'Not implemented' };
  };

  const value: SubscriptionContextType = {
    subscription,
    plan,
    isActive,
    isTrialing,
    daysUntilRenewal,
    subscriptionPlan,
    setSubscriptionPlan,
    refreshSubscription,
    isLoading,
    canAccessFeature,
    getUsageLimit,
    openBillingPortal,
    invoices: [], // TODO: Implement invoice fetching
    paymentMethods: [], // TODO: Implement payment methods fetching
    defaultPaymentMethod: null, // TODO: Implement default payment method
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
