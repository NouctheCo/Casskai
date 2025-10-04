import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown,
  CreditCard,
  Calendar,
  Users,
  ArrowUpCircle,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { 
  getSubscriptionStatusColor, 
  getSubscriptionStatusLabel,
  formatPrice
} from '@/types/subscription.types';

const SubscriptionWidget: React.FC = () => {
  const navigate = useNavigate();
  const {
    subscription,
    plan,
    isActive,
    isTrialing,
    daysUntilRenewal,
    getUsageLimit,
    isLoading
  } = useSubscription();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-1/2 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !plan) {
    return (
      <Card className="w-full border-dashed border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
                  Aucun abonnement actif
                </h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Activez un plan pour débloquer toutes les fonctionnalités
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Choisir un plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColor = getSubscriptionStatusColor(subscription.status);
  const statusLabel = getSubscriptionStatusLabel(subscription.status);
  
  const [usageData, setUsageData] = React.useState({
    users: { current: 3, limit: null as number | null }
  });

  React.useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const usersData = await getUsageLimit('users');
        setUsageData({ users: usersData });
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      }
    };

    fetchUsageData();
  }, [getUsageLimit]);

  const usagePercentage = usageData.users.limit ? Math.min((usageData.users.current / usageData.users.limit) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                plan.id === 'starter' ? 'bg-blue-100 dark:bg-blue-900/20' :
                plan.id === 'professional' ? 'bg-purple-100 dark:bg-purple-900/20' :
                'bg-yellow-100 dark:bg-yellow-900/20'
              }`}>
                <Crown className={`w-5 h-5 ${
                  plan.id === 'starter' ? 'text-blue-600 dark:text-blue-400' :
                  plan.id === 'professional' ? 'text-purple-600 dark:text-purple-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">Plan {plan.name}</CardTitle>
                <CardDescription>
                  {formatPrice(plan.price, plan.currency)}/{plan.interval === 'month' ? 'mois' : 'an'}
                </CardDescription>
              </div>
            </div>
            
            <Badge 
              className={`${
                statusColor === 'green' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400' :
                statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400' :
                statusColor === 'red' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400' :
                'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Renewal info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {daysUntilRenewal > 0 ? 'Renouvellement dans' : 'Expiré depuis'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.abs(daysUntilRenewal)} jour{Math.abs(daysUntilRenewal) > 1 ? 's' : ''}
            </span>
          </div>

          {/* Usage progress */}
          {usageData.users.limit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Utilisateurs</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {usageData.users.current}/{usageData.users.limit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
          )}

          {/* Warnings */}
          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-400">
                  Annulation programmée le {subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/settings/billing')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Gérer
            </Button>
            
            {plan.id === 'starter' && (
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => navigate('/pricing')}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubscriptionWidget;