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

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { TrialStatusCard } from '@/components/TrialComponents';
import { useTrial } from '@/hooks/trial.hooks';
import { toastError, toastSuccess, toastInfo, toastWarning } from '@/lib/toast-helpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PricingPageSEO } from '@/components/SEO/SEOHelmet';
import {
  getDefaultCountry,
  generateCountryPricing,
  formatPriceWithCurrency,
  getCountryGroups,
  type CountryPricing
} from '@/services/pricingMultiCurrency';
import { Globe, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const { subscriptionPlan: _subscriptionPlan } = useSubscription();
  const { user } = useAuth();
  const { trialInfo, canCreateTrial, createTrial: _createTrial } = useTrial();

  const [isLoading, setIsLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [selectedCountry, setSelectedCountry] = useState<string>(() => getDefaultCountry());
  const [currentPricing, setCurrentPricing] = useState<CountryPricing | null>(null);

  // Charger le pricing pour le pays sélectionné
  useEffect(() => {
    const pricing = generateCountryPricing(selectedCountry);
    setCurrentPricing(pricing);
  }, [selectedCountry]);

  const handleChoosePlan = async (planId: string) => {
    if (!user) {
      toastError('Vous devez être connecté pour choisir un plan');
      return;
    }

    setIsLoading(true);

    try {
      // Gestion spéciale pour le plan gratuit
      if (planId === 'free') {
        toastSuccess('Plan gratuit activé ! Vous pouvez maintenant utiliser CassKai.');
        window.location.href = '/dashboard';
        return;
      }

      // Gestion spéciale pour le plan Enterprise
      if (planId === 'enterprise_monthly' || planId === 'enterprise_yearly') {
        toastInfo('Pour le plan Enterprise, veuillez nous contacter à contact@casskai.com pour une configuration personnalisée.');
        return;
      }

      // Pour les autres plans, utiliser Stripe via Edge Functions
      console.warn('🛒 [PricingPage] Starting checkout for plan:', planId);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          userId: user.id,
          metadata: {
            source: 'pricing-page',
            timestamp: new Date().toISOString()
          }
        },
      });

      console.warn('🛒 [PricingPage] Edge function response:', { data, error });

      if (error) {
        toastError(`Erreur lors de la création de la session: ${error.message || 'Erreur inconnue'}`);
        return;
      }

      if (!data || !data.sessionId) {
        toastWarning('⚠️ Réponse du service de paiement invalide. Veuillez réessayer.');
        return;
      }

      // Redirection vers Stripe Checkout
      console.warn('🛒 [PricingPage] About to load stripe...');
      const stripe = await stripePromise;
      console.warn('🛒 [PricingPage] Stripe loaded:', !!stripe);

      if (!stripe) {
        console.error('🛒 [PricingPage] Stripe failed to load - using manual redirect');
        console.warn('🛒 [PricingPage] Manual redirect to URL:', data.url);
        window.location.href = data.url;
        return;
      }

      // Try Stripe.js redirect first, but with a timeout fallback
      console.warn('🛒 [PricingPage] Calling stripe.redirectToCheckout with sessionId:', data.sessionId);

      try {
        const redirectPromise = stripe.redirectToCheckout({ sessionId: data.sessionId });

        // Set a timeout in case redirectToCheckout hangs
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Stripe redirect timeout')), 5000);
        });

        const result = await Promise.race([redirectPromise, timeoutPromise]) as { error?: { message: string } };
        console.warn('🛒 [PricingPage] redirectToCheckout result:', result);

        if (result.error) {
          console.error('🛒 [PricingPage] Stripe redirect error:', result.error);
          console.warn('🛒 [PricingPage] Using manual redirect fallback');
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('🛒 [PricingPage] Stripe redirect failed or timed out:', error);
        console.warn('🛒 [PricingPage] Using manual redirect to URL:', data.url);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erreur lors du choix du plan:', error);
      if (error.name === 'TypeError') {
        toastWarning('⚠️ Problème de connexion réseau. Vérifiez votre connexion Internet et réessayez.');
      } else {
        toastError(`Erreur inattendue: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentPricing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour découvrir CassKai',
      price: 0,
      features: ['Accès de base', 'Jusqu\'à 10 clients', 'Support communautaire'],
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Parfait pour débuter',
      price: billingPeriod === 'month' ? currentPricing.starter.monthly : Math.round(currentPricing.starter.yearly / 12),
      priceOriginal: billingPeriod === 'month' ? currentPricing.starter.monthlyOriginal : Math.round(currentPricing.starter.yearlyOriginal / 12),
      priceYearly: currentPricing.starter.yearly,
      discount: currentPricing.starter.discount,
      features: [
        'Facturation illimitée',
        'Jusqu\'à 100 clients',
        'Comptabilité de base',
        '10 rapports standards',
        'Support email',
        '5 GB de stockage'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Professionnel',
      description: 'Pour les entreprises en croissance',
      price: billingPeriod === 'month' ? currentPricing.professional.monthly : Math.round(currentPricing.professional.yearly / 12),
      priceOriginal: billingPeriod === 'month' ? currentPricing.professional.monthlyOriginal : Math.round(currentPricing.professional.yearlyOriginal / 12),
      priceYearly: currentPricing.professional.yearly,
      discount: currentPricing.professional.discount,
      features: [
        'Tout du plan Starter',
        'Clients illimités',
        'Comptabilité avancée',
        'CRM complet',
        'Gestion de projets',
        'RH de base',
        'Rapports illimités',
        'API Access',
        '50 GB de stockage',
        'Support prioritaire'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      description: 'Solution complète sur mesure',
      price: billingPeriod === 'month' ? currentPricing.enterprise.monthly : Math.round(currentPricing.enterprise.yearly / 12),
      priceOriginal: billingPeriod === 'month' ? currentPricing.enterprise.monthlyOriginal : Math.round(currentPricing.enterprise.yearlyOriginal / 12),
      priceYearly: currentPricing.enterprise.yearly,
      discount: currentPricing.enterprise.discount,
      features: [
        'Tout du plan Professionnel',
        'Utilisateurs illimités',
        'RH avancées',
        'Import des fichiers bancaires',
        'Prévisions financières',
        'Piste d\'audit complète',
        'Intégrations personnalisées',
        'Stockage illimité',
        'Support dédié 24/7',
        'Formation incluse'
      ],
      popular: false
    }
  ];

  const countryGroups = getCountryGroups();

  return (
    <>
      <PricingPageSEO />
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Tarifs transparents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Adaptés à {currentPricing.countryName} {currentPricing.flag}
            </p>
          </div>

          {/* Sélecteur de pays */}
          <div className="flex flex-col gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[280px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                {countryGroups.map((group) => (
                  <div key={group.title}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {group.icon} {group.title}
                    </div>
                    {group.countries.map((country) => (
                      <SelectItem key={country.countryCode} value={country.countryCode}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.countryName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({country.currencySymbol})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle mensuel/annuel */}
            <div className="flex items-center space-x-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                type="button"
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
                type="button"
                onClick={() => setBillingPeriod('year')}
                className={`px-4 py-2 rounded-md transition-all relative ${
                  billingPeriod === 'year'
                    ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Annuel
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full dark:bg-green-900/20">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Trial Status */}
        <TrialStatusCard />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'border-2 border-blue-500 relative' : ''}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium dark:bg-blue-900/20">
                    Plus populaire
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">
                      {plan.price === 0 ? 'Gratuit' : formatPriceWithCurrency(plan.price, currentPricing.currency)}
                    </div>
                    {plan.price !== 0 && (
                      <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        / mois
                      </div>
                    )}
                  </div>

                  {plan.price !== 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-lg line-through text-gray-400 dark:text-gray-500">
                          {formatPriceWithCurrency(plan.priceOriginal, currentPricing.currency)}
                        </span>
                        <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          -{plan.discount}%
                        </span>
                      </div>

                      {billingPeriod === 'year' && (
                        <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                          Soit {formatPriceWithCurrency(plan.priceYearly, currentPricing.currency)}/an • Économie 20%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    // Construire l'ID du plan: planId_interval (ex: pro_monthly, starter_yearly)
                    const fullPlanId = plan.id === 'free'
                      ? 'free'
                      : `${plan.id}_${billingPeriod === 'year' ? 'yearly' : 'monthly'}`;

                    handleChoosePlan(fullPlanId);
                  }}
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
    </>
  );
}
