import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Users, 
  Database, 
  HeadphonesIcon,
  ArrowRight
} from 'lucide-react';
import { SubscriptionPlan, formatPrice } from '@/types/subscription.types';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect?: (planId: string) => void;
  loading?: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isCurrentPlan = false,
  onSelect,
  loading = false,
  className = ''
}) => {
  const { isLoading } = useSubscription();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return Zap;
      case 'professional':
        return Star;
      case 'enterprise':
        return Crown;
      default:
        return Zap;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'blue';
      case 'professional':
        return 'purple';
      case 'enterprise':
        return 'gold';
      default:
        return 'blue';
    }
  };

  const PlanIcon = getPlanIcon(plan.id);
  const planColor = getPlanColor(plan.id);

  const handleSelect = () => {
    if (onSelect && !isCurrentPlan) {
      onSelect(plan.id);
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`h-full border-2 transition-all duration-300 ${
        plan.popular 
          ? 'border-purple-500 shadow-2xl shadow-purple-500/20' 
          : isCurrentPlan
          ? 'border-green-500 shadow-lg shadow-green-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${isCurrentPlan ? 'ring-2 ring-green-500/20' : ''}`}>
        
        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-sm font-semibold">
              <Star className="w-3 h-3 mr-1" />
              Plus populaire
            </Badge>
          </div>
        )}

        {/* Current plan badge */}
        {isCurrentPlan && (
          <div className="absolute -top-3 right-4">
            <Badge variant="outline" className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <Check className="w-3 h-3 mr-1" />
              Plan actuel
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${
            planColor === 'blue' ? 'from-blue-500 to-blue-600' :
            planColor === 'purple' ? 'from-purple-500 to-purple-600' :
            'from-yellow-500 to-orange-500'
          } flex items-center justify-center shadow-lg`}>
            <PlanIcon className="w-8 h-8 text-white" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {plan.name}
          </CardTitle>
          
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {plan.description}
          </CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatPrice(plan.price, plan.currency)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-lg">
                /{plan.interval === 'month' ? 'mois' : 'an'}
              </span>
            </div>
            
            {plan.interval === 'month' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatPrice(plan.price * 12 * 0.8, plan.currency)}/an avec facturation annuelle
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Plan limits */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {plan.maxUsers && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.maxUsers} utilisateur{plan.maxUsers > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {plan.maxClients && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.maxClients === null ? 'Clients illimités' : `${plan.maxClients} clients`}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {plan.storageLimit}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <HeadphonesIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                Support {plan.supportLevel}
              </span>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-5 h-5 mt-0.5 rounded-full bg-gradient-to-r ${
                  planColor === 'blue' ? 'from-blue-500 to-blue-600' :
                  planColor === 'purple' ? 'from-purple-500 to-purple-600' :
                  'from-yellow-500 to-orange-500'
                } flex items-center justify-center flex-shrink-0`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action button */}
          <div className="mt-auto">
            <Button
              onClick={handleSelect}
              disabled={isCurrentPlan || loading || isLoading}
              className={`w-full py-3 font-semibold transition-all duration-200 ${
                isCurrentPlan
                  ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 cursor-default'
                  : plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white'
              }`}
            >
              {isCurrentPlan ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Plan actuel
                </>
              ) : loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Traitement...</span>
                </div>
              ) : (
                <>
                  <span>
                    {plan.id === 'starter' ? 'Commencer' : 
                     plan.id === 'professional' ? 'Choisir Pro' : 
                     'Contacter l\'équipe'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            
            {!isCurrentPlan && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Changement immédiat • Annulation à tout moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PricingCard;
