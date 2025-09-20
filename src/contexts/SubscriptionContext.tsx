import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { UserSubscription, SubscriptionPlan } from '@/types/subscription.types';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isActive: boolean;
  isTrialing: boolean;
  daysUntilRenewal: number | null;
  subscriptionPlan: string | null;
  setSubscriptionPlan: (plan: string) => Promise<void>;
  isLoading: boolean;
  canAccessFeature: (featureName: string) => Promise<boolean>;
  getUsageLimit: (featureName: string) => Promise<{ current: number; limit: number | null }>;
  openBillingPortal: () => Promise<{ success: boolean; error?: string }>;
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
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing']);

      if (error) {
        // Ne pas logger comme erreur si c'est juste "no rows found"
        if (error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
        }
      } else if (data && data.length > 0) {
        // Prendre le premier abonnement trouvé (au lieu d'utiliser .single())
        const subscription = data[0];
        setSubscriptionPlanState(subscription.plan_id);
        setSubscription(subscription as UserSubscription);
        setPlan(subscription.subscription_plans as SubscriptionPlan);
      }
      // Si pas d'abonnement, on laisse les valeurs par défaut (null)
      setIsLoading(false);
    };

    fetchSubscription();
  }, [user]);

  const setSubscriptionPlan = async (planId: string) => {
    if (!user) return;

    setIsLoading(true);
    // This is a simulation. In a real scenario, this would be handled by the webhook.
    const { data: _data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        // Add other necessary fields with default/mock values
        stripe_customer_id: 'cus_simulated',
        stripe_subscription_id: 'sub_simulated',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      setSubscriptionPlanState(planId);
    }
    setIsLoading(false);
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
  const daysUntilRenewal = subscription?.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const value: SubscriptionContextType = {
    subscription,
    plan,
    isActive,
    isTrialing,
    daysUntilRenewal,
    subscriptionPlan,
    setSubscriptionPlan,
    isLoading,
    canAccessFeature,
    getUsageLimit,
    openBillingPortal,
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
