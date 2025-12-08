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

  plan?: SubscriptionPlan;

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

  // Plans mensuels

  {

    id: 'starter_monthly',

    name: 'Starter',

    description: 'Parfait pour débuter avec CassKai',

    price: 29,

    currency: 'EUR',

    interval: 'month',

    stripePriceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || 'prod_T01lJIXIuYnCKS',

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

    id: 'starter_yearly',

    name: 'Starter Annuel',

    description: 'Parfait pour débuter avec CassKai - Économie 20%',

    price: 290, // 29 * 12 * 0.8

    currency: 'EUR',

    interval: 'year',

    stripePriceId: import.meta.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID || '',

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

      'Support par email',

      'Économie de 20% sur l\'année'

    ]

  },

  {

    id: 'pro_monthly',

    name: 'Pro',

    description: 'Idéal pour les entreprises en croissance',

    price: 69,

    currency: 'EUR',

    interval: 'month',

    stripePriceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || 'prod_T01krkpN8GYLQ9',

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

    id: 'pro_yearly',

    name: 'Pro Annuel',

    description: 'Idéal pour les entreprises en croissance - Économie 20%',

    price: 662, // 69 * 12 * 0.8

    currency: 'EUR',

    interval: 'year',

    stripePriceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',

    stripeProductId: 'prod_professional',

    maxUsers: 10,

    maxClients: 1000,

    storageLimit: '50 GB',

    supportLevel: 'priority',

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

      'Rapports avancés',

      'Économie de 20% sur l\'année'

    ]

  },

  {

    id: 'enterprise_monthly',

    name: 'Entreprise',

    description: 'Solution complète pour grandes entreprises',

    price: 129,

    currency: 'EUR',

    interval: 'month',

    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'prod_T01jMLYAdVd3be',

    stripeProductId: 'prod_enterprise',

    maxUsers: null,

    maxClients: null,

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

  },

  {

    id: 'enterprise_yearly',

    name: 'Entreprise Annuel',

    description: 'Solution complète pour grandes entreprises - Économie 20%',

    price: 1238, // 129 * 12 * 0.8

    currency: 'EUR',

    interval: 'year',

    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',

    stripeProductId: 'prod_enterprise',

    maxUsers: null,

    maxClients: null,

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

      'SLA garanti',

      'Économie de 20% sur l\'année'

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

    case 'active': case 'trialing':

      return 'green';

    case 'past_due':

      return 'yellow';

    case 'canceled': case 'incomplete':

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



// Définition centralisée de tous les modules disponibles

export const AVAILABLE_MODULES = [

  // Core modules (toujours disponibles)

  { key: 'dashboard', name: 'Tableau de bord', category: 'core', required: true },

  { key: 'settings', name: 'Paramètres', category: 'core', required: true },

  { key: 'users', name: 'Utilisateurs', category: 'core', required: true },

  { key: 'security', name: 'Sécurité', category: 'core', required: true },

  { key: 'onboarding', name: 'Onboarding', category: 'core', required: true },



  // Finance modules

  { key: 'accounting', name: 'Comptabilité', category: 'finance', required: false },

  { key: 'invoicing', name: 'Facturation', category: 'finance', required: false },

  { key: 'banking', name: 'Banque', category: 'finance', required: false },

  { key: 'purchases', name: 'Achats', category: 'finance', required: false },

  { key: 'reports', name: 'Rapports', category: 'finance', required: false },

  { key: 'budget', name: 'Budget & Prévisions', category: 'finance', required: false },

  { key: 'tax', name: 'Fiscalité', category: 'finance', required: false },



  // Operations modules

  { key: 'salesCrm', name: 'CRM Ventes', category: 'operations', required: false },

  { key: 'inventory', name: 'Stock & Inventaire', category: 'operations', required: false },

  { key: 'projects', name: 'Projets', category: 'operations', required: false },

  { key: 'thirdParties', name: 'Tiers', category: 'operations', required: false },

  { key: 'contracts', name: 'Contrats', category: 'operations', required: false },



  // Advanced modules

  { key: 'humanResources', name: 'Ressources Humaines', category: 'analytics', required: false },

  { key: 'automation', name: 'Automatisation', category: 'analytics', required: false }

];



export const PLAN_MODULES: PlanModules[] = [

  // Modules pour plans mensuels - SYNCHRONISÉS avec PostgreSQL

  {

    planId: 'starter_monthly',

    modules: [

      // STARTER : modules de base

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties'

    ]

  },

  {

    planId: 'pro_monthly',

    modules: [

      // PRO : Starter + modules avancés

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',

      'reports', 'budget', 'humanResources', 'tax'

    ]

  },

  {

    planId: 'enterprise_monthly',

    modules: [

      // ENTERPRISE : Pro + modules entreprise

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',

      'reports', 'budget', 'humanResources', 'tax',

      'salesCrm', 'inventory', 'projects', 'contracts', 'automation'

    ]

  },

  // Modules pour plans annuels (identiques aux mensuels)

  {

    planId: 'starter_yearly',

    modules: [

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties'

    ]

  },

  {

    planId: 'pro_yearly',

    modules: [

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',

      'reports', 'budget', 'humanResources', 'tax'

    ]

  },

  {

    planId: 'enterprise_yearly',

    modules: [

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',

      'reports', 'budget', 'humanResources', 'tax',

      'salesCrm', 'inventory', 'projects', 'contracts', 'automation'

    ]

  },

  // Plans spéciaux

  {

    planId: 'trial',

    modules: [

      // Tous les modules pendant l'essai - SYNCHRONISÉ avec PostgreSQL

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',

      'reports', 'budget', 'humanResources', 'tax', 'contracts',

      'salesCrm', 'inventory', 'projects', 'onboarding', 'automation'

    ]

  },

  {

    planId: 'free',

    modules: [

      'dashboard', 'settings', 'users', 'security',

      'accounting', 'invoicing'

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
