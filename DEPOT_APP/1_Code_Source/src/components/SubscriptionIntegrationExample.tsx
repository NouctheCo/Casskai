import React from 'react';
import { useEnterprisePlan } from '@/hooks/useEnterprisePlan';
import { QuotaIndicator } from '@/components/FeatureGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { PlanCapability } from '@/config/moduleCapabilities';

/**
 * Composant pour afficher le statut de l'abonnement
 */
function SubscriptionStatus({ plan }: { plan: ReturnType<typeof useEnterprisePlan> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <CardTitle>Plan {plan.planCode || 'Gratuit'}</CardTitle>
          </div>
          <Badge
            variant={plan.status === 'active' ? 'default' :
                    plan.status === 'trialing' ? 'secondary' : 'destructive'}
          >
            {plan.status === 'active' ? 'Actif' :
             plan.status === 'trialing' ? 'Essai' :
             plan.status === 'canceled' ? 'Annulé' : 'Expiré'}
          </Badge>
        </div>
        <CardDescription>
          Gérez votre abonnement et consultez vos fonctionnalités
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicateurs de quota */}
        {plan.quotas && Object.keys(plan.quotas).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white">
              Utilisation des ressources
            </h4>
            {Object.keys(plan.quotas).map((quotaKey) => (
              <QuotaIndicator
                key={quotaKey}
                quotaKey={quotaKey}
                showLabel={true}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Bouton de gestion */}
        <Button variant="outline" className="w-full">
          Gérer l'abonnement
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Composant pour afficher les fonctionnalités disponibles
 */
function AvailableFeatures({ capabilities }: { capabilities: Set<PlanCapability> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fonctionnalités disponibles</CardTitle>
        <CardDescription>
          Liste des capacités activées pour votre plan actuel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-3">
          {Array.from(capabilities).map((capability) => (
            <div
              key={capability}
              className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-900/20" />
              <span className="text-sm capitalize text-green-800 dark:text-green-200">
                {capability.replace('_', ' ')}
              </span>
            </div>
          ))}
          {capabilities.size === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-3">
              Aucune fonctionnalité premium activée
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Exemple d'intégration du nouveau système de gestion des abonnements
 * Ce composant montre comment utiliser les nouveaux hooks et composants
 */
export function SubscriptionIntegrationExample() {
  const plan = useEnterprisePlan();

  if (plan.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SubscriptionStatus plan={plan} />
      <AvailableFeatures capabilities={plan.capabilities} />
    </div>
  );
}
