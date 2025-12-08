/**
 * Hook pour vérifier le statut de l'abonnement et de la période d'essai
 * CRITIQUE : Bloque l'accès si l'abonnement est expiré
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface SubscriptionStatus {
  subscription: any | null;
  isExpired: boolean;
  isTrialExpired: boolean;
  isTrialExpiringSoon: boolean;
  daysLeft: number;
  isLoading: boolean;
  canUseApp: boolean;
  status: 'active' | 'trialing' | 'trial_expired' | 'expired' | 'free' | 'unknown';
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer l'abonnement de l'utilisateur
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setSubscription(null);
        } else {
          setSubscription(data);
        }
      } catch (error) {
        console.error('Exception checking subscription:', error);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user?.id]);

  // Calculer les jours restants de la période d'essai
  const daysLeft = subscription?.trial_end
    ? Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Vérifier si la période d'essai est expirée
  const isTrialExpired =
    subscription?.status === 'trialing' &&
    subscription?.trial_end &&
    new Date(subscription.trial_end) < new Date();

  // Vérifier si la période d'essai expire bientôt (7 jours ou moins)
  const isTrialExpiringSoon =
    subscription?.status === 'trialing' &&
    daysLeft > 0 &&
    daysLeft <= 7;

  // Vérifier si l'abonnement est expiré (canceled, unpaid, past_due, ou trial expiré)
  const isExpired =
    subscription?.status === 'canceled' ||
    subscription?.status === 'unpaid' ||
    subscription?.status === 'past_due' ||
    isTrialExpired;

  // Déterminer si l'utilisateur peut utiliser l'app
  const canUseApp =
    !isLoading &&
    subscription &&
    !isExpired &&
    (subscription.status === 'active' ||
      subscription.status === 'trialing');

  // Déterminer le statut global
  let status: SubscriptionStatus['status'] = 'unknown';
  if (!subscription) {
    status = 'free';
  } else if (isTrialExpired) {
    status = 'trial_expired';
  } else if (isExpired) {
    status = 'expired';
  } else if (subscription.status === 'trialing') {
    status = 'trialing';
  } else if (subscription.status === 'active') {
    status = 'active';
  }

  return {
    subscription,
    isExpired,
    isTrialExpired,
    isTrialExpiringSoon,
    daysLeft,
    isLoading,
    canUseApp,
    status,
  };
};
