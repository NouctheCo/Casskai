// Subscription and Stripe related types

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId: string;
  stripeProductId: string;
  maxUsers?: number;
  maxClients?: number;
  storageLimit?: string;
  supportLevel: 'basic' | 'priority' | 'dedicated';
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'sepa_debit' | 'ideal' | 'bancontact';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceUrl?: string;
  pdfUrl?: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  feature: string;
  quantity: number;
  timestamp: Date;
  period: string; // YYYY-MM format
}

export interface BillingPortalSession {
  url: string;
  returnUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  successUrl: string;
  cancelUrl: string;
  clientSecret?: string;
}

// Webhook event types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

// API Response types
export interface SubscriptionResponse {
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
  checkoutUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}

export interface BillingResponse {
  success: boolean;
  portalUrl?: string;
  error?: string;
}

// Plan configurations
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect pour débuter avec CassKai',
    price: 29,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_starter_monthly',
    stripeProductId: 'prod_starter',
    maxUsers: 2,
    maxClients: 100,
    storageLimit: '5 GB',
    supportLevel: 'basic',
    features: [
      'Facturation illimitée',
      'Jusqu\'à 100 clients',
      'Comptabilité de base',
      'Rapports essentiels',
      '2 utilisateurs inclus',
      '5 GB de stockage',
      'Support par email'
    ]
  },
  {
    id: 'professional',
    name: 'Professionnel',
    description: 'Idéal pour les entreprises en croissance',
    price: 69,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    stripeProductId: 'prod_professional',
    maxUsers: 10,
    maxClients: 1000,
    storageLimit: '50 GB',
    supportLevel: 'priority',
    popular: true,
    features: [
      'Tout du plan Starter',
      'Clients illimités',
      'CRM complet',
      'Gestion des stocks',
      'Modules avancés',
      '10 utilisateurs inclus',
      '50 GB de stockage',
      'Support prioritaire',
      'Intégrations bancaires',
      'Rapports avancés'
    ]
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    description: 'Solution complète pour grandes entreprises',
    price: 129,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
    stripeProductId: 'prod_enterprise',
    maxUsers: null, // unlimited
    maxClients: null, // unlimited
    storageLimit: '500 GB',
    supportLevel: 'dedicated',
    features: [
      'Tout du plan Professionnel',
      'Utilisateurs illimités',
      'RH avancées',
      'Connexions bancaires',
      'Multi-entités',
      'API complète',
      'Stockage étendu',
      'Support dédié',
      'Formation personnalisée',
      'SLA garanti'
    ]
  }
];

// Utility functions
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getPlanByStripeId = (stripePriceId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.stripePriceId === stripePriceId);
};

export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(price);
};

export const isSubscriptionActive = (subscription: UserSubscription): boolean => {
  return ['active', 'trialing'].includes(subscription.status);
};

export const getSubscriptionStatusColor = (status: UserSubscription['status']): string => {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'green';
    case 'past_due':
      return 'yellow';
    case 'canceled':
    case 'incomplete':
      return 'red';
    default:
      return 'gray';
  }
};

export const getSubscriptionStatusLabel = (status: UserSubscription['status']): string => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'trialing':
      return 'Période d\'essai';
    case 'past_due':
      return 'Paiement en retard';
    case 'canceled':
      return 'Annulé';
    case 'incomplete':
      return 'Incomplet';
    default:
      return 'Inconnu';
  }
};

// Configuration des modules par plan d'abonnement
export interface PlanModules {
  planId: string;
  modules: string[];
}

export const PLAN_MODULES: PlanModules[] = [
  {
    planId: 'starter',
    modules: [
      'dashboard',
      'accounting',
      'invoicing',
      'banking',
      'reports',
      'users',
      'settings',
      'security'
    ]
  },
  {
    planId: 'professional',
    modules: [
      'dashboard',
      'accounting',
      'invoicing',
      'purchases',
      'banking',
      'salesCrm',
      'inventory',
      'reports',
      'forecasts',
      'thirdParties',
      'contracts',
      'users',
      'settings',
      'security'
    ]
  },
  {
    planId: 'enterprise',
    modules: [
      'dashboard',
      'accounting',
      'invoicing',
      'purchases',
      'banking',
      'salesCrm',
      'humanResources',
      'projects',
      'inventory',
      'reports',
      'forecasts',
      'thirdParties',
      'tax',
      'contracts',
      'users',
      'settings',
      'security'
    ]
  },
  {
    planId: 'trial', // Période d'essai - tous les modules
    modules: [
      'dashboard',
      'accounting',
      'invoicing',
      'purchases',
      'banking',
      'salesCrm',
      'humanResources',
      'projects',
      'inventory',
      'reports',
      'forecasts',
      'thirdParties',
      'tax',
      'contracts',
      'users',
      'settings',
      'security'
    ]
  }
];

// Fonction utilitaire pour obtenir les modules autorisés pour un plan
export const getModulesForPlan = (planId: string): string[] => {
  const planModules = PLAN_MODULES.find(p => p.planId === planId);
  return planModules?.modules || [];
};

// Fonction pour vérifier si un module est autorisé pour un plan
export const isModuleAllowedForPlan = (moduleId: string, planId: string): boolean => {
  const allowedModules = getModulesForPlan(planId);
  return allowedModules.includes(moduleId);
};

// Fonction pour détecter si un utilisateur est en période d'essai
export const isTrialUser = (subscription: UserSubscription | null): boolean => {
  if (!subscription) return true; // Nouvel utilisateur = essai
  return subscription.status === 'trialing';
};