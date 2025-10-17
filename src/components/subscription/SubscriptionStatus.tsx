import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  TrendingUp,
  Users,
  Database,
  Shield
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
  getSubscriptionStatusColor, 
  getSubscriptionStatusLabel,
  formatPrice,
  SUBSCRIPTION_PLANS
} from '@/types/subscription.types';
import { logger } from '@/utils/logger';

const SubscriptionStatus: React.FC = () => {
  const {
    subscription,
    plan,
    subscriptionPlan,
    isActive,
    isTrialing,
    daysUntilRenewal,
    openBillingPortal,
    getUsageLimit,
    isLoading
  } = useSubscription();

  const [usageLimits, setUsageLimits] = React.useState({
    users: { current: 0, limit: null as number | null },
    clients: { current: 0, limit: null as number | null },
    storage: { current: 0, limit: null as number | null }
  });

  React.useEffect(() => {
    const fetchUsageLimits = async () => {
      try {
        const [usersData, clientsData, storageData] = await Promise.all([
          getUsageLimit('users'),
          getUsageLimit('clients'),
          getUsageLimit('storage')
        ]);

        setUsageLimits({
          users: usersData,
          clients: clientsData,
          storage: storageData
        });
      } catch (error) {
        logger.error('Error fetching usage limits:', error)
      }
    };

    if (subscription && plan) {
      fetchUsageLimits();
    }
  }, [subscription, plan, getUsageLimit]);

  if (isLoading) {
    // Vérifier si c'est un plan gratuit
    if (subscriptionPlan === 'free') {
      return (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Plan Gratuit</CardTitle>
                <CardDescription>Accès de base à CassKai</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fonctionnalités incluses</span>
                <span className="font-medium">Base</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Utilisateurs</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Clients</span>
                <span className="font-medium">10</span>
              </div>
              <Button className="w-full mt-4" onClick={() => window.location.href = '/pricing'}>
                Passer à Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun abonnement actif
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Choisissez un plan pour débloquer toutes les fonctionnalités de CassKai
          </p>
          <Button>
            Voir les plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColor = getSubscriptionStatusColor(subscription.status);
  const statusLabel = getSubscriptionStatusLabel(subscription.status);

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const handleBillingPortal = async () => {
    const result = await openBillingPortal();
    if (!result.success) {
      logger.error('Failed to open billing portal:', result.error)
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Plan {plan.name}
                </h3>
                <Badge
                  className={`${
                    statusColor === 'green' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400' :
                    statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    statusColor === 'red' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  {subscription.status === 'trialing' ? (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      {statusLabel}
                    </>
                  ) : isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {statusLabel}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {statusLabel}
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {formatPrice(plan.price, plan.currency)}/{plan.interval === 'month' ? 'mois' : 'an'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {daysUntilRenewal > 0 ? 'Renouvellement dans' : 'Expiré depuis'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.abs(daysUntilRenewal)} jour{Math.abs(daysUntilRenewal) > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Période actuelle
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subscription.currentPeriodStart.toLocaleDateString('fr-FR')} - {subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Support {plan.supportLevel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.supportLevel === 'basic' ? 'Support par email' :
                     plan.supportLevel === 'priority' ? 'Support prioritaire' :
                     'Support dédié 24/7'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {subscription.cancelAtPeriodEnd && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      Annulation programmée
                    </p>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Votre abonnement sera annulé le {subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              
              {isTrialing && subscription.trialEnd && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                      Période d'essai
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Se termine le {subscription.trialEnd.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage metrics */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span>Utilisation</span>
            </h4>
            
            <div className="grid md:grid-cols-3 gap-4">
              {usageLimits.users.limit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Utilisateurs
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usageLimits.users.current}/{usageLimits.users.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usageLimits.users.current, usageLimits.users.limit)} 
                    className="h-2"
                  />
                </div>
              )}
              
              {usageLimits.clients.limit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Clients
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usageLimits.clients.current}/{usageLimits.clients.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usageLimits.clients.current, usageLimits.clients.limit)} 
                    className="h-2"
                  />
                </div>
              )}
              
              {usageLimits.storage.limit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stockage
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usageLimits.storage.current} GB/{usageLimits.storage.limit ? usageLimits.storage.limit / 1024 : 0} GB
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usageLimits.storage.current * 1024, usageLimits.storage.limit)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleBillingPortal}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Gérer l'abonnement</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
            
            <Button variant="outline">
              Changer de plan
            </Button>
            
            <Button variant="outline">
              Télécharger les factures
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubscriptionStatus;