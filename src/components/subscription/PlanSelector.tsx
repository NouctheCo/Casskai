/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Building2, Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/hooks/trial.hooks';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast-helpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getDefaultCountry,
  generateCountryPricing,
  formatPriceWithCurrency,
  type CountryPricing
} from '@/services/pricingMultiCurrency';
import { logger } from '@/lib/logger';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PlanSelectorProps {
  onPlanSelected?: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ onPlanSelected }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, plan: currentPlan, refreshSubscription } = useSubscription();
  const { trialInfo, canCreateTrial } = useTrial();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [currentPricing, setCurrentPricing] = useState<CountryPricing | null>(null);

  // Charger le pricing pour le pays par défaut
  useEffect(() => {
    const pricing = generateCountryPricing(getDefaultCountry());
    setCurrentPricing(pricing);
  }, []);

  const handleChoosePlan = async (planId: string) => {
    if (!user) {
      toastError(t('pricing.errors.notLoggedIn', 'Vous devez être connecté pour choisir un plan'));
      return;
    }

    if (!currentPricing) {
      toastError(t('pricing.errors.pricingNotLoaded', 'Le pricing n\'est pas encore chargé'));
      return;
    }

    // Si c'est le plan actuel, ne rien faire
    if (currentPlan?.id === planId || subscription?.planId === planId) {
      toastWarning(t('pricing.errors.alreadyOnPlan', 'Vous êtes déjà sur ce plan'));
      return;
    }

    setIsLoading(true);
    setLoadingPlanId(planId);

    try {
      const interval = billingPeriod === 'year' ? 'yearly' : 'monthly';
      const checkoutPlanId = planId === 'free' ? 'free' : `${planId}_${interval}`;

      // Gestion spéciale pour le plan gratuit
      if (planId === 'free') {
        toastSuccess(t('pricing.freePlanActivated', 'Plan gratuit activé !'));
        await refreshSubscription();
        onPlanSelected?.();
        return;
      }

      // Pour les autres plans, utiliser Stripe via Edge Functions
      logger.info('PlanSelector', 'Starting checkout for plan:', { planId, checkoutPlanId, interval });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId: checkoutPlanId,
          interval,
          currency: currentPricing.currency,
          userId: user.id,
          metadata: {
            source: 'billing-page-plan-selector',
            timestamp: new Date().toISOString()
          }
        },
      });

      if (error) {
        logger.error('PlanSelector', 'Checkout session creation failed:', error);
        toastError(t('pricing.errors.checkoutFailed', 'Erreur lors de la création de la session de paiement'));
        return;
      }

      if (!data || !data.sessionId) {
        toastWarning(t('pricing.errors.invalidResponse', 'Réponse du service de paiement invalide'));
        return;
      }

      // Redirection vers Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        logger.warn('PlanSelector', 'Stripe failed to load, using manual redirect');
        window.location.href = data.url;
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        logger.error('PlanSelector', 'Stripe redirect error:', result.error);
        window.location.href = data.url;
      }
    } catch (error) {
      logger.error('PlanSelector', 'Error choosing plan:', error);
      toastError(t('pricing.errors.unexpected', 'Une erreur inattendue s\'est produite'));
    } finally {
      setIsLoading(false);
      setLoadingPlanId(null);
    }
  };

  if (!currentPricing) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour découvrir',
      price: 0,
      icon: Sparkles,
      features: ['Accès de base', 'Jusqu\'à 10 clients', 'Support communautaire'],
      popular: false,
      color: 'gray'
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Pour débuter',
      price: billingPeriod === 'month' ? currentPricing.starter.monthly : Math.round(currentPricing.starter.yearly / 12),
      priceYearly: currentPricing.starter.yearly,
      icon: Zap,
      features: ['Facturation illimitée', 'Jusqu\'à 100 clients', 'Comptabilité de base', 'Support email'],
      popular: false,
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Pour grandir',
      price: billingPeriod === 'month' ? currentPricing.professional.monthly : Math.round(currentPricing.professional.yearly / 12),
      priceYearly: currentPricing.professional.yearly,
      icon: Star,
      features: ['Tout du Starter', 'Clients illimités', 'CRM complet', 'Support prioritaire'],
      popular: true,
      color: 'purple'
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      description: 'Sur mesure',
      price: billingPeriod === 'month' ? currentPricing.enterprise.monthly : Math.round(currentPricing.enterprise.yearly / 12),
      priceYearly: currentPricing.enterprise.yearly,
      icon: Building2,
      features: ['Tout du Pro', 'Utilisateurs illimités', 'Support dédié 24/7', 'Formation incluse'],
      popular: false,
      color: 'amber'
    }
  ];

  const isCurrentPlan = (planId: string) => {
    if (currentPlan?.id?.toLowerCase().includes(planId)) return true;
    if (subscription?.planId?.toLowerCase().includes(planId)) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Toggle mensuel/annuel */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              billingPeriod === 'month'
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('billingPage.plans.billingPeriod.monthly')}
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all relative ${
              billingPeriod === 'year'
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('billingPage.plans.billingPeriod.yearly')}
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {t('billingPage.plans.yearlyDiscount')}
            </span>
          </button>
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const IconComponent = plan.icon;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all hover:shadow-lg ${
                plan.popular ? 'border-2 border-purple-500 dark:border-purple-400' : ''
              } ${isCurrent ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white hover:bg-purple-600">
                    {t('billingPage.plans.popular')}
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                    {t('billingPage.plans.currentPlanBadge')}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-${plan.color}-100 dark:bg-${plan.color}-900/20`}>
                    <IconComponent className={`h-5 w-5 text-${plan.color}-600 dark:text-${plan.color}-400`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.price === 0 ? 'Gratuit' : formatPriceWithCurrency(plan.price, currentPricing.currency)}
                    </span>
                    {plan.price !== 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('billingPage.plans.perMonth')}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'year' && plan.priceYearly && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Soit {formatPriceWithCurrency(plan.priceYearly, currentPricing.currency)}{t('billingPage.plans.perYear')}
                    </p>
                  )}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleChoosePlan(plan.id)}
                  className="w-full"
                  variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                  disabled={isLoading || isCurrent}
                >
                  {loadingPlanId === plan.id ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Traitement...</span>
                    </div>
                  ) : isCurrent ? (
                    t('billingPage.plans.currentPlanBadge')
                  ) : canCreateTrial && !trialInfo && plan.id !== 'free' ? (
                    'Essai gratuit'
                  ) : (
                    t('billingPage.plans.choosePlan')
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lien vers la page complète */}
      <div className="text-center pt-4">
        <Button
          variant="link"
          onClick={() => window.location.href = '/pricing'}
          className="text-blue-600 dark:text-blue-400"
        >
          {t('billingPage.plans.seeAllPlans')} →
        </Button>
      </div>
    </div>
  );
};

export default PlanSelector;
