import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { TrialStatusCard } from '@/components/TrialComponents';
import { useTrial } from '@/hooks/trial.hooks';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const { subscriptionPlan } = useSubscription();
  const { user } = useAuth();
  const { trialInfo, canCreateTrial, createTrial } = useTrial();
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '0€',
      features: ['Gestion des modules de base'],
      planId: 'free',
    },
    {
      name: 'Pro',
      price: '29€',
      features: ['Modules de base', 'Modules Pro'],
      planId: 'pro',
    },
    {
      name: 'Enterprise',
      price: 'Sur devis',
      features: ['Tous les modules', 'Support prioritaire'],
      planId: 'enterprise',
    },
  ];

  const handleChoosePlan = async (planId) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Si l'utilisateur peut créer un essai et qu'aucun plan n'est sélectionné, créer un essai
      if (canCreateTrial && !trialInfo) {
        const result = await createTrial();
        if (result.success) {
          console.warn('Essai créé avec succès');
        } else {
          console.error('Erreur lors de la création de l\'essai:', result.error);
        }
      } else {
        // Sinon, procéder au checkout normal
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { planId, userId: user.id },
        });

        if (error) {
          console.error('Error creating checkout session:', error);
          return;
        }

        const stripe = await stripePromise;
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

        if (stripeError) {
          console.error('Error redirecting to checkout:', stripeError);
        }
      }
    } catch (error) {
      console.error('Erreur lors du choix du plan:', error);
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
      </div>

      {/* Trial Status */}
      <TrialStatusCard />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.planId}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-green-500 mr-2">✔</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleChoosePlan(plan.planId)}
                className="w-full mt-6"
                disabled={isLoading || subscriptionPlan === plan.planId}
              >
                {subscriptionPlan === plan.planId
                  ? 'Plan actuel'
                  : canCreateTrial && !trialInfo
                  ? 'Commencer l\'essai gratuit'
                  : 'Choisir ce plan'
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
