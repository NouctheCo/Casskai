import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { stripeService } from '@/services';
import { supabase } from '@/lib/supabase';
import {
  UserSubscription,
  SubscriptionPlan,
  PaymentMethod,
  Invoice,
  SUBSCRIPTION_PLANS,
  getPlanById,
  isSubscriptionActive
} from '@/types/subscription.types';

interface SubscriptionContextType {
  // Subscription state
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  isActive: boolean;
  
  // Payment methods
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod | null;
  
  // Invoices
  invoices: Invoice[];
  
  // Actions
  subscribe: (planId: string) => Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  updateSubscription: (newPlanId: string) => Promise<{ success: boolean; error?: string }>;
  openBillingPortal: () => Promise<{ success: boolean; error?: string }>;
  refreshSubscription: () => Promise<void>;
  
  // Payment methods actions
  addPaymentMethod: (paymentMethodId: string) => Promise<{ success: boolean; error?: string }>;
  removePaymentMethod: (paymentMethodId: string) => Promise<{ success: boolean; error?: string }>;
  refreshPaymentMethods: () => Promise<void>;
  
  // Utility functions
  canAccessFeature: (feature: string) => boolean;
  getUsageLimit: (feature: string) => number | null;
  isTrialing: boolean;
  daysUntilRenewal: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Computed properties
  const isActive = subscription ? isSubscriptionActive(subscription) : false;
  const isTrialing = subscription?.status === 'trialing';
  const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault) || null;
  
  const daysUntilRenewal = subscription 
    ? Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Load subscription data when user changes
  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    } else {
      resetSubscriptionData();
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load subscription from Supabase
      const { data: supabaseSubscriptions, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptionError) {
        console.error('Error loading subscription from Supabase:', subscriptionError);
      }

      if (supabaseSubscriptions && supabaseSubscriptions.length > 0) {
        const supabaseSubscription = supabaseSubscriptions[0];
        
        // Convert Supabase data to UserSubscription format
        const subscription: UserSubscription = {
          id: supabaseSubscription.id,
          userId: supabaseSubscription.user_id,
          planId: supabaseSubscription.plan_id,
          stripeSubscriptionId: supabaseSubscription.stripe_subscription_id || '',
          stripeCustomerId: supabaseSubscription.stripe_customer_id || '',
          status: supabaseSubscription.status as UserSubscription['status'],
          currentPeriodStart: new Date(supabaseSubscription.current_period_start),
          currentPeriodEnd: new Date(supabaseSubscription.current_period_end),
          cancelAtPeriodEnd: supabaseSubscription.cancel_at_period_end || false,
          trialEnd: supabaseSubscription.trial_end ? new Date(supabaseSubscription.trial_end) : undefined,
          metadata: supabaseSubscription.metadata || {},
          createdAt: new Date(supabaseSubscription.created_at),
          updatedAt: new Date(supabaseSubscription.updated_at)
        };

        setSubscription(subscription);
        
        // Set plan from the joined data
        if (supabaseSubscription.subscription_plans) {
          const planData = supabaseSubscription.subscription_plans;
          const subscriptionPlan: SubscriptionPlan = {
            id: planData.id,
            name: planData.name,
            description: planData.description || '',
            price: parseFloat(planData.price),
            currency: planData.currency,
            interval: planData.interval as 'month' | 'year',
            features: Array.isArray(planData.features) ? planData.features : [],
            popular: planData.is_popular || false,
            stripePriceId: planData.stripe_price_id || '',
            stripeProductId: planData.stripe_product_id || '',
            maxUsers: planData.max_users,
            maxClients: planData.max_clients,
            storageLimit: planData.storage_limit_gb ? `${planData.storage_limit_gb} GB` : undefined,
            supportLevel: planData.support_level as 'basic' | 'priority' | 'dedicated'
          };
          setPlan(subscriptionPlan);
        }
      } else {
        // No active subscription found - fallback to Stripe service for backwards compatibility
        const subscriptionResponse = await stripeService.getCurrentSubscription(user.id);
        if (subscriptionResponse.success && subscriptionResponse.subscription) {
          setSubscription(subscriptionResponse.subscription);
          const subscriptionPlan = getPlanById(subscriptionResponse.subscription.planId);
          setPlan(subscriptionPlan || null);
        } else {
          setSubscription(null);
          setPlan(null);
        }
      }

      // Load payment methods from Supabase
      const { data: supabasePaymentMethods, error: paymentError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!paymentError && supabasePaymentMethods) {
        const paymentMethods: PaymentMethod[] = supabasePaymentMethods.map(pm => ({
          id: pm.id,
          userId: pm.user_id,
          stripePaymentMethodId: pm.stripe_payment_method_id,
          type: pm.type as PaymentMethod['type'],
          brand: pm.brand,
          last4: pm.last4,
          expiryMonth: pm.expiry_month,
          expiryYear: pm.expiry_year,
          isDefault: pm.is_default,
          createdAt: new Date(pm.created_at)
        }));
        setPaymentMethods(paymentMethods);
      } else {
        // Fallback to Stripe service
        const userPaymentMethods = await stripeService.getPaymentMethods(user.id);
        setPaymentMethods(userPaymentMethods);
      }

      // Load invoices from Supabase (Stripe invoices)
      const { data: supabaseInvoices, error: invoiceError } = await supabase
        .from('stripe_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!invoiceError && supabaseInvoices) {
        const invoices: Invoice[] = supabaseInvoices.map(inv => ({
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
        setInvoices(invoices);
      } else {
        // Fallback to Stripe service
        const userInvoices = await stripeService.getInvoices(user.id, 10);
        setInvoices(userInvoices);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSubscriptionData = () => {
    setSubscription(null);
    setPlan(null);
    setPaymentMethods([]);
    setInvoices([]);
    setIsLoading(false);
  };

  const subscribe = async (planId: string) => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const successUrl = `${window.location.origin}/settings/billing?success=true`;
      const cancelUrl = `${window.location.origin}/settings/billing?canceled=true`;

      const response = await stripeService.createCheckoutSession(
        planId,
        user.id,
        successUrl,
        cancelUrl
      );

      if (response.success && response.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.checkoutUrl;
        
        return { 
          success: true, 
          checkoutUrl: response.checkoutUrl 
        };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de la création de l\'abonnement' 
      };
    } catch (error) {
      console.error('Error subscribing:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de l\'abonnement' 
      };
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) {
      return { success: false, error: 'Aucun abonnement actif' };
    }

    try {
      const response = await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      
      if (response.success && response.subscription) {
        setSubscription(response.subscription);
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de l\'annulation' 
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de l\'annulation' 
      };
    }
  };

  const updateSubscription = async (newPlanId: string) => {
    if (!subscription) {
      return { success: false, error: 'Aucun abonnement actif' };
    }

    try {
      const response = await stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        newPlanId
      );
      
      if (response.success && response.subscription) {
        setSubscription(response.subscription);
        const newPlan = getPlanById(newPlanId);
        setPlan(newPlan || null);
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de la modification' 
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de la modification' 
      };
    }
  };

  const openBillingPortal = async () => {
    if (!subscription) {
      return { success: false, error: 'Aucun abonnement actif' };
    }

    try {
      const returnUrl = `${window.location.origin}/settings/billing`;
      const response = await stripeService.createBillingPortalSession(
        subscription.stripeCustomerId,
        returnUrl
      );

      if (response.success && response.portalUrl) {
        window.open(response.portalUrl, '_blank');
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de l\'ouverture du portail' 
      };
    } catch (error) {
      console.error('Error opening billing portal:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de l\'ouverture du portail' 
      };
    }
  };

  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  const addPaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const response = await stripeService.addPaymentMethod(user.id, paymentMethodId);
      
      if (response.success && response.paymentMethod) {
        setPaymentMethods(prev => [...prev, response.paymentMethod!]);
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de l\'ajout du moyen de paiement' 
      };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de l\'ajout du moyen de paiement' 
      };
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await stripeService.removePaymentMethod(paymentMethodId);
      
      if (response.success) {
        setPaymentMethods(prev => prev.filter(pm => pm.stripePaymentMethodId !== paymentMethodId));
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || 'Erreur lors de la suppression du moyen de paiement' 
      };
    } catch (error) {
      console.error('Error removing payment method:', error);
      return { 
        success: false, 
        error: 'Erreur inattendue lors de la suppression du moyen de paiement' 
      };
    }
  };

  const refreshPaymentMethods = async () => {
    if (!user?.id) return;
    
    try {
      const userPaymentMethods = await stripeService.getPaymentMethods(user.id);
      setPaymentMethods(userPaymentMethods);
    } catch (error) {
      console.error('Error refreshing payment methods:', error);
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    // En mode développement, autoriser toutes les fonctionnalités
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    if (!user?.id) return false;

    // Try to use Supabase function first
    const checkFeatureAccess = async () => {
      try {
        const { data, error } = await supabase
          .rpc('can_access_feature', {
            p_user_id: user.id,
            p_feature_name: feature
          });
        
        if (!error) {
          return data;
        }
      } catch (error) {
        console.error('Error checking feature access:', error);
      }
      
      // Fallback to local logic
      return checkFeatureAccessLocal(feature);
    };

    // For synchronous usage, use local logic
    return checkFeatureAccessLocal(feature);
  };

  const checkFeatureAccessLocal = (feature: string): boolean => {
    if (!plan || !isActive) return false;

    // Define feature access rules based on plan
    const featureRules: Record<string, string[]> = {
      'unlimited_invoices': ['starter', 'professional', 'enterprise'],
      'advanced_reports': ['professional', 'enterprise'],
      'crm': ['professional', 'enterprise'],
      'inventory': ['professional', 'enterprise'],
      'multi_user': ['professional', 'enterprise'],
      'api_access': ['enterprise'],
      'white_label': ['enterprise'],
      'dedicated_support': ['enterprise']
    };

    const allowedPlans = featureRules[feature];
    return allowedPlans ? allowedPlans.includes(plan.id) : true;
  };

  const getUsageLimit = (feature: string): number | null => {
    if (!plan) return 0;

    switch (feature) {
      case 'users':
        return plan.maxUsers;
      case 'clients':
        return plan.maxClients;
      case 'storage':
        // Convert storage string to MB (e.g., "5 GB" -> 5120)
        const storageMatch = plan.storageLimit?.match(/(\d+)\s*(GB|MB)/);
        if (storageMatch) {
          const amount = parseInt(storageMatch[1]);
          const unit = storageMatch[2];
          return unit === 'GB' ? amount * 1024 : amount;
        }
        return null;
      default:
        return null;
    }
  };

  const contextValue: SubscriptionContextType = {
    // State
    subscription,
    plan,
    isLoading,
    isActive,
    paymentMethods,
    defaultPaymentMethod,
    invoices,
    isTrialing,
    daysUntilRenewal,
    
    // Actions
    subscribe,
    cancelSubscription,
    updateSubscription,
    openBillingPortal,
    refreshSubscription,
    addPaymentMethod,
    removePaymentMethod,
    refreshPaymentMethods,
    
    // Utilities
    canAccessFeature,
    getUsageLimit
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;