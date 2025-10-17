import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { TrialStatusCard } from '@/components/TrialComponents';
import { useTrial } from '@/hooks/trial.hooks';
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice } from '@/types/subscription.types';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import stripeService from '@/services/stripeService';
import { logger } from '@/utils/logger';

export default function PricingPage() {
  const { subscriptionPlan } = useSubscription();
  const { user } = useAuth();
  const { trialInfo, canCreateTrial, createTrial } = useTrial();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');


  // Ajouter le plan gratuit aux plans existants
  const freePlan = {
    id: 'free',
    name: 'Gratuit',
    description: 'Pour découvrir CassKai',
    price: 0,
    currency: 'EUR',
    interval: 'month' as const,
    features: ['Accès de base', 'Jusqu\'à 10 clients', 'Support communautaire'],
    popular: false
  };

  // Filtrer les plans selon la période de facturation sélectionnée
  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => plan.interval === billingPeriod);
  const plans = [freePlan, ...filteredPlans];

  const handleChoosePlan = async (planId: string) => {
  if (!user) {
    showToast('Vous devez être connecté pour choisir un plan', 'error');
    return;
  }

  setIsLoading(true);

  try {
    const origin = window.location.origin;

    if (planId === 'free') {
      showToast('Plan gratuit activé ! Vous pouvez maintenant utiliser CassKai.', 'success');
      window.location.href = `${origin}/dashboard`;
      return;
    }

    if (planId === 'enterprise_monthly' || planId === 'enterprise_yearly') {
      showToast('Pour le plan Enterprise, veuillez nous contacter à contact@casskai.com pour une configuration personnalisée.', 'info');
      return;
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
    if (!selectedPlan || !selectedPlan.stripePriceId) {
      showToast('Offre indisponible. Veuillez contacter le support.', 'error');
      return;
    }

    const checkoutResponse = await stripeService.createCheckoutSession({
      planId,
      priceId: selectedPlan.stripePriceId,
      successUrl: `${window.location.origin}/pricing?success=true`,
      cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      metadata: {
        source: 'pricing-page',
        billingPeriod,
        timestamp: new Date().toISOString()
      }
    });

    if (!checkoutResponse.success) {
      showToast(checkoutResponse.error ?? 'Impossible de créer la session de paiement.', 'error');
      return;
    }

    if (checkoutResponse.sessionId) {
      const redirectResult = await stripeService.redirectToCheckout(checkoutResponse.sessionId);
      if (redirectResult.error && checkoutResponse.checkoutUrl) {
        // eslint-disable-next-line require-atomic-updates
        window.location.href = checkoutResponse.checkoutUrl;
      }
    } else if (checkoutResponse.checkoutUrl) {
      // eslint-disable-next-line require-atomic-updates
      window.location.href = checkoutResponse.checkoutUrl;
    } else {
      showToast('La redirection de paiement a échoué. Veuillez réessayer.', 'error');
    }
  } catch (error) {
    logger.error('Erreur lors du choix du plan:', error);
    if ((error as Error).name === 'TypeError') {
      showToast('⚠️ Problème de connexion réseau. Vérifiez votre connexion Internet et réessayez.', 'warning');
    } else {
      showToast(`Erreur inattendue: ${(error as Error).message || 'Veuillez réessayer'}`, 'error');
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Abonnements et tarifs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        {/* Toggle mensuel/annuel */}
        <div className="flex items-center space-x-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('month')}
            className={`px-4 py-2 rounded-md transition-all ${
              billingPeriod === 'month'
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod('year')}
            className={`px-4 py-2 rounded-md transition-all relative ${
              billingPeriod === 'year'
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Annuel
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Trial Status */}
      <TrialStatusCard />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.popular ? 'border-2 border-blue-500 relative' : ''}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-3xl font-bold">
                {plan.price === 0 ? 'Gratuit' : (
                  <>
                    {plan.interval === 'year' ?
                      formatPrice(Math.round(plan.price / 12)) :
                      formatPrice(plan.price)
                    }
                    <span className="text-sm font-normal text-gray-500">
                      / mois{plan.interval === 'year' ? ' (facturé annuellement)' : ''}
                    </span>
                    {plan.interval === 'year' && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Soit {formatPrice(plan.price)}/an - Économie 20%
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleChoosePlan(plan.id)}
                className="w-full"
                disabled={isLoading}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Traitement...
                  </div>
                ) : (
                  canCreateTrial && !trialInfo && plan.id !== 'free'
                    ? 'Commencer l\'essai gratuit'
                    : 'Choisir ce plan'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

