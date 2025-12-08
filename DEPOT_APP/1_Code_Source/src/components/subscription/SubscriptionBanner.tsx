/**
 * Bandeau d'avertissement pour l'abonnement expiré ou expirant bientôt
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, CreditCard, Clock } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const SubscriptionBanner: React.FC = () => {
  const { isExpired, isTrialExpired, isTrialExpiringSoon, daysLeft, status } = useSubscriptionStatus();

  // Pas d'abonnement ou abonnement actif sans avertissement
  if (status === 'active' || status === 'free' || status === 'unknown') {
    return null;
  }

  // Abonnement expiré (trial ou payant)
  if (isExpired) {
    return (
      <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20 rounded-none border-x-0 border-t-0">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-red-600 dark:text-red-400">
              {isTrialExpired ? '🚫 Votre période d\'essai a expiré' : '🚫 Votre abonnement a expiré'}
            </span>
            <span className="text-sm text-red-700 dark:text-red-300">
              Choisissez un plan pour continuer à utiliser CassKai
            </span>
          </div>
          <Link to="/settings/billing">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              {isTrialExpired ? 'Choisir un plan' : 'Renouveler maintenant'}
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Période d'essai expirant bientôt (7 jours ou moins)
  if (isTrialExpiringSoon && daysLeft > 0) {
    const urgencyColor = daysLeft <= 3 ? 'orange' : 'yellow';
    const bgClass = urgencyColor === 'orange'
      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500';
    const textClass = urgencyColor === 'orange'
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-yellow-600 dark:text-yellow-400';
    const buttonClass = urgencyColor === 'orange'
      ? 'bg-orange-600 hover:bg-orange-700'
      : 'bg-yellow-600 hover:bg-yellow-700';

    return (
      <Alert className={`${bgClass} rounded-none border-x-0 border-t-0`}>
        <AlertTriangle className={`h-5 w-5 ${textClass}`} />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${textClass}`}>
              ⚠️ Votre essai expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Choisissez un plan pour continuer sans interruption
            </span>
          </div>
          <Link to="/settings/billing">
            <Button size="sm" className={`${buttonClass} text-white`}>
              <CreditCard className="w-4 h-4 mr-2" />
              Voir les plans
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // ✅ NOUVEAU : Afficher un bandeau informatif pour les utilisateurs en période d'essai (plus de 7 jours)
  if (status === 'trialing' && daysLeft > 7) {
    return (
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-500 rounded-none border-x-0 border-t-0">
        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              ℹ️ Période d'essai active
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Il vous reste {daysLeft} jours d'essai gratuit
            </span>
          </div>
          <Link to="/settings/billing">
            <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <CreditCard className="w-4 h-4 mr-2" />
              Voir les plans
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
