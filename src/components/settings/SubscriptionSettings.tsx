import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '@/services/subscriptionService';
import { TrialStatusCard, TrialActionsCard } from '@/components/TrialComponents';
import { useModulesSafe } from '@/hooks/modules.hooks';
import { SUBSCRIPTION_PLANS, formatPrice, SubscriptionPlan } from '@/types/subscription.types';
import { logger } from '@/lib/logger';
import {
  Crown,
  Check,
  Star,
  AlertCircle,
  CreditCard,
  Calendar,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentPlan, isTrialUser, trialDaysRemaining, getAvailableModulesForPlan } = useModulesSafe();
  const [isLoading, _setIsLoading] = useState(false);
  const [currentPlanInfo, setCurrentPlanInfo] = useState<SubscriptionPlan | null>(null);
  useEffect(() => {
    const loadCurrentPlan = async () => {
      if (user?.id && currentPlan) {
        try {
          const planInfo = await subscriptionService.getCurrentPlanInfo(user.id);
          setCurrentPlanInfo(planInfo);
        } catch (error) {
          logger.error('SubscriptionSettings', 'Erreur chargement plan:', error instanceof Error ? error.message : String(error));
        }
      }
    };
    loadCurrentPlan();
  }, [user?.id, currentPlan]);
  const handlePlanChange = async (_newPlanId: string) => {
    // Rediriger vers la page pricing pour le processus complet de sélection/paiement
    navigate('/pricing');
  };
  const _getPlanStatusColor = (planId: string) => {
    if (planId === currentPlan) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'trial': return <Clock className="h-5 w-5" />;
      case 'starter_monthly': case 'starter_yearly': return <Zap className="h-5 w-5" />;
      case 'pro_monthly': case 'pro_yearly': return <TrendingUp className="h-5 w-5" />;
      case 'enterprise_monthly': case 'enterprise_yearly': return <Crown className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };
  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mon Abonnement
          </CardTitle>
          <CardDescription>
            Gérez votre plan et accès aux modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlanInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlanIcon(currentPlan || '')}
                  <div>
                    <h3 className="font-semibold">{('displayName' in currentPlanInfo ? (currentPlanInfo as any).displayName : currentPlanInfo.name)}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isTrialUser ? `${trialDaysRemaining} jours d'essai restants` : 'Plan actuel'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {isTrialUser ? 'Gratuit' : formatPrice(currentPlanInfo.price)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{isTrialUser ? 'Essai' : '/ mois'}</p>
                </div>
              </div>
              {isTrialUser && trialDaysRemaining <= 7 && (
                <div className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Votre période d'essai expire dans {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      Choisissez un plan pour continuer à utiliser tous les modules
                    </p>
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Modules disponibles :</h4>
                <div className="flex flex-wrap gap-2">
                  {getAvailableModulesForPlan().slice(0, 6).map((module) => (
                    <Badge key={typeof module === 'string' ? module : module.id} variant="outline" className="text-xs">
                      {typeof module === 'string' ? module : module.name || module.id}
                    </Badge>
                  ))}
                  {getAvailableModulesForPlan().length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{getAvailableModulesForPlan().length - 6} autres
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Chargement des informations d'abonnement...</span>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Enhanced Trial Management Section */}
      <div className="space-y-6">
        <TrialStatusCard />
        <TrialActionsCard />
      </div>
      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Plans Disponibles</CardTitle>
          <CardDescription>
            Choisissez le plan qui correspond le mieux à vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'trial').map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const availableModules = getAvailableModulesForPlan(plan.id);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-lg border-2 p-6 ${
                    isCurrentPlan 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Populaire
                      </Badge>
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-2">
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="text-xl font-bold">{('displayName' in plan ? (plan as any).displayName : plan.name)}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {plan.description}
                    </p>
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.price)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        / {plan.interval === 'year' ? 'an' : 'mois'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="text-sm">
                      <p className="font-medium mb-2">Modules inclus ({availableModules.length}) :</p>
                      <div className="flex flex-wrap gap-1">
                        {availableModules.slice(0, 4).map((module) => (
                          <Badge key={typeof module === 'string' ? module : module.id} variant="outline" className="text-xs">
                            {typeof module === 'string' ? module : module.name || module.id}
                          </Badge>
                        ))}
                        {availableModules.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{availableModules.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : "default"}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <>
                        {isCurrentPlan ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Plan actuel
                          </>
                        ) : (
                          <>
                            Choisir ce plan
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique de Facturation
          </CardTitle>
          <CardDescription>
            Consultez vos factures et paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune facture disponible</p>
            <p className="text-sm">Les factures apparaîtront ici après votre premier paiement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default SubscriptionSettings;