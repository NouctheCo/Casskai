import React, { useState } from 'react';
import { useEnterprisePlan } from '@/hooks/useEnterprisePlan';
import { SUBSCRIPTION_PLANS, stripeSubscriptionService } from '@/services/stripeSubscriptionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SubscriptionManagerProps {
  enterpriseId?: string;
  className?: string;
}

interface PlanCardProps {
  plan: typeof SUBSCRIPTION_PLANS[0];
  isCurrentPlan: boolean;
  isPopular: boolean;
  isLoading: boolean;
  onSubscribe: (planId: string) => void;
  onManage: () => void;
}

/**
 * Carte individuelle pour un plan d'abonnement
 */
function PlanCard({ plan, isCurrentPlan, isPopular, isLoading, onSubscribe, onManage }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative transition-all duration-200",
        isCurrentPlan && "ring-2 ring-blue-500 dark:ring-blue-400",
        isPopular && !isCurrentPlan && "ring-2 ring-yellow-500 dark:ring-yellow-400"
      )}
    >
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-yellow-500 text-white px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          {isCurrentPlan && (
            <Badge variant="default">Actuel</Badge>
          )}
        </CardTitle>
        <div className="text-3xl font-bold">
          {plan.price}€
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 dark:text-gray-400">
            /{plan.interval === 'month' ? 'mois' : 'an'}
          </span>
          {plan.savings && plan.interval === 'year' && (
            <Badge variant="secondary" className="ml-2 text-xs">
              -{plan.savings}% économie
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={onManage}
          >
            Gérer
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onSubscribe(plan.id)}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Souscrire'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface CurrentPlanCardProps {
  plan: ReturnType<typeof useEnterprisePlan>;
  onManage: () => void;
}

/**
 * Carte affichant le plan actuel
 */
function CurrentPlanCard({ plan, onManage }: CurrentPlanCardProps) {
  const currentPlanName = SUBSCRIPTION_PLANS.find(p => p.id === plan.planCode)?.name;

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Plan actuel: {currentPlanName}
          </CardTitle>
          <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
            {plan.status === 'active' ? 'Actif' :
             plan.status === 'trialing' ? 'Essai' :
             plan.status === 'canceled' ? 'Annulé' : 'Expiré'}
          </Badge>
        </div>
        <CardDescription>
          Gérez votre abonnement et consultez votre utilisation
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={onManage} variant="outline">
          Gérer l'abonnement
        </Button>
      </CardFooter>
    </Card>
  );
}

interface UsageQuotasProps {
  quotas: Record<string, { current: number; limit: number | null; percentage: number }>;
}

/**
 * Section affichant les quotas d'utilisation
 */
function UsageQuotas({ quotas }: UsageQuotasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisation des quotas</CardTitle>
        <CardDescription>
          Suivez votre utilisation des ressources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(quotas).map(([key, quota]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-gray-600 dark:text-gray-400 dark:text-gray-400">
                {key.replace('_', ' ')}
              </span>
              <span className="font-medium">
                {quota.current}{quota.limit ? `/${quota.limit}` : ''}
              </span>
            </div>
            {quota.limit && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    quota.percentage >= 90 ? "bg-red-500" :
                    quota.percentage >= 75 ? "bg-yellow-500" :
                    "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Logique de gestion des abonnements
 */
function useSubscriptionLogic(enterpriseId?: string) {
  const { currentCompany } = useAuth();
  const plan = useEnterprisePlan(enterpriseId || currentCompany?.id);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const targetEnterpriseId = enterpriseId || currentCompany?.id;

  const handleSubscribe = async (planId: string) => {
    if (!targetEnterpriseId) return;

    setIsLoading(planId);
    try {
      const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!selectedPlan) return;

      await stripeSubscriptionService.createCheckoutSession({
        priceId: selectedPlan.stripePriceId,
        enterpriseId: targetEnterpriseId,
        successUrl: `${window.location.origin}/settings/subscription?success=true`,
        cancelUrl: `${window.location.origin}/settings/subscription?canceled=true`
      });
    } catch (error) {
      console.error('Error creating subscription:', error instanceof Error ? error.message : String(error));
      // TODO: Afficher une notification d'erreur
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!targetEnterpriseId) return;

    try {
      await stripeSubscriptionService.redirectToCustomerPortal(
        targetEnterpriseId,
        `${window.location.origin}/settings/subscription`
      );
    } catch (error) {
      console.error('Error accessing customer portal:', error instanceof Error ? error.message : String(error));
      // TODO: Afficher une notification d'erreur
    }
  };

  // Filtrer les plans selon l'intervalle sélectionné
  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => plan.interval === billingInterval);

  return {
    plan,
    isLoading,
    billingInterval,
    setBillingInterval,
    filteredPlans,
    handleSubscribe,
    handleManageSubscription,
    targetEnterpriseId
  };
}

/**
 * Composant principal de gestion des abonnements
 */
export function SubscriptionManager({ enterpriseId, className }: SubscriptionManagerProps) {
  const {
    plan,
    isLoading,
    billingInterval,
    setBillingInterval,
    filteredPlans,
    handleSubscribe,
    handleManageSubscription
  } = useSubscriptionLogic(enterpriseId);

  if (plan.isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
          Gestion de l'abonnement
        </h2>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
          Choisissez le plan qui correspond à vos besoins
        </p>
      </div>

      {/* Plan actuel */}
      {plan.planCode && (
        <CurrentPlanCard plan={plan} onManage={handleManageSubscription} />
      )}

      {/* Plans disponibles */}
      <Tabs value={billingInterval} onValueChange={(value) => setBillingInterval(value as 'month' | 'year')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="month" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Mensuel</span>
          </TabsTrigger>
          <TabsTrigger value="year" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Annuel</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              -20% économisez
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {filteredPlans.map((subscriptionPlan) => (
              <PlanCard
                key={subscriptionPlan.id}
                plan={subscriptionPlan}
                isCurrentPlan={plan.planCode === subscriptionPlan.id}
                isPopular={subscriptionPlan.id === 'pro-month'}
                isLoading={isLoading === subscriptionPlan.id}
                onSubscribe={handleSubscribe}
                onManage={handleManageSubscription}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="year" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {filteredPlans.map((subscriptionPlan) => (
              <PlanCard
                key={subscriptionPlan.id}
                plan={subscriptionPlan}
                isCurrentPlan={plan.planCode === subscriptionPlan.id}
                isPopular={subscriptionPlan.id === 'pro-year'}
                isLoading={isLoading === subscriptionPlan.id}
                onSubscribe={handleSubscribe}
                onManage={handleManageSubscription}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quotas d'utilisation */}
      {plan.quotas && Object.keys(plan.quotas).length > 0 && (
        <UsageQuotas quotas={plan.quotas} />
      )}
    </div>
  );
}
