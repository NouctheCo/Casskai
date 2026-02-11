/**
 * Trial Management Service
 * Gère les essais gratuits limités (1 par utilisateur)
 * 
 * ✅ NOUVEAU: Limite stricte d'1 essai par utilisateur
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface TrialStatus {
  hasActiveTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysRemaining?: number;
  hasUsedTrial: boolean;
}

/**
 * Vérifie le statut d'essai de l'utilisateur
 */
export async function getUserTrialStatus(userId: string): Promise<TrialStatus> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('trial_start, trial_end, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('trialService', 'Error checking trial status:', error);
      return { hasActiveTrial: false, hasUsedTrial: false };
    }

    if (!data || data.length === 0) {
      return { hasActiveTrial: false, hasUsedTrial: false };
    }

    const subscription = data[0];
    const now = new Date();
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;

    // Vérifier si l'essai est encore actif
    const hasActiveTrial = trialEnd ? now < trialEnd : false;
    const daysRemaining = trialEnd
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      hasActiveTrial,
      trialStartDate: subscription.trial_start,
      trialEndDate: subscription.trial_end,
      daysRemaining: Math.max(0, daysRemaining),
      hasUsedTrial: true, // L'utilisateur a déjà utilisé un essai
    };
  } catch (error) {
    logger.error('trialService', 'Error in getUserTrialStatus:', error);
    return { hasActiveTrial: false, hasUsedTrial: false };
  }
}

/**
 * ✅ NOUVEAU: Créer un essai gratuit pour l'utilisateur
 * Limite stricte: 1 essai par utilisateur, sinon erreur
 */
export async function createUserTrial(userId: string, planId: string, daysToAdd: number = 30) {
  try {
    // Vérifier si l'utilisateur a déjà utilisé un essai
    const { data: existingTrials, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .not('trial_end', 'is', null)
      .limit(1);

    if (checkError) {
      logger.error('trialService', 'Error checking existing trials:', checkError);
      throw checkError;
    }

    if (existingTrials && existingTrials.length > 0) {
      throw new Error('Utilisateur a déjà utilisé son essai gratuit (limité à 1 par utilisateur)');
    }

    // Créer un nouvel essai
    const now = new Date();
    const trialEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { data: subscription, error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'trial',
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      logger.error('trialService', 'Error creating trial:', createError);
      throw createError;
    }

    return {
      success: true,
      subscription,
      daysRemaining: daysToAdd,
    };
  } catch (error) {
    logger.error('trialService', 'Error in createUserTrial:', error);
    throw error;
  }
}

/**
 * ✅ NOUVEAU: Vérifier si l'utilisateur peut créer un essai
 */
export async function canCreateTrial(userId: string): Promise<boolean> {
  try {
    const status = await getUserTrialStatus(userId);
    return !status.hasUsedTrial;
  } catch (error) {
    logger.error('trialService', 'Error checking if can create trial:', error);
    return false;
  }
}

/**
 * ✅ NOUVEAU: Créer un abonnement d'essai
 */
export async function createTrialSubscription(
  userId: string,
  companyId: string,
  planId: string = 'trial',
  daysToAdd: number = 30
) {
  try {
    const result = await createUserTrial(userId, planId, daysToAdd);
    return {
      success: true,
      subscription: result.subscription,
      daysRemaining: result.daysRemaining,
    };
  } catch (error) {
    logger.error('trialService', 'Error creating trial subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ✅ NOUVEAU: Obtenir les infos d'essai de l'utilisateur
 */
export async function getUserTrialInfo(userId: string) {
  try {
    const status = await getUserTrialStatus(userId);
    return {
      hasActiveTrial: status.hasActiveTrial,
      trialStartDate: status.trialStartDate,
      trialEndDate: status.trialEndDate,
      daysRemaining: status.daysRemaining,
      hasUsedTrial: status.hasUsedTrial,
    };
  } catch (error) {
    logger.error('trialService', 'Error getting trial info:', error);
    return null;
  }
}

/**
 * ✅ NOUVEAU: Statistiques des essais
 */
export async function getTrialStatistics() {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'trial');

    if (error) throw error;

    return {
      totalTrials: data?.length || 0,
      activeTrials: data?.filter(s => {
        const endDate = new Date(s.trial_end);
        return endDate > new Date();
      }).length || 0,
    };
  } catch (error) {
    logger.error('trialService', 'Error getting trial statistics:', error);
    return { totalTrials: 0, activeTrials: 0 };
  }
}

/**
 * ✅ NOUVEAU: Essais expirant bientôt
 */
export async function getExpiringTrials(daysAhead: number = 3) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'trial')
      .not('trial_end', 'is', null);

    if (error) throw error;

    const now = new Date();
    const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return data?.filter(s => {
      const endDate = new Date(s.trial_end);
      return endDate <= cutoff && endDate > now;
    }) || [];
  } catch (error) {
    logger.error('trialService', 'Error getting expiring trials:', error);
    return [];
  }
}

/**
 * ✅ NOUVEAU: Convertir essai en payant
 */
export async function convertTrialToPaid(userId: string, reason?: string) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        trial_start: null,
        trial_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'trial');

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('trialService', 'Error converting trial to paid:', error);
    return { success: false, error };
  }
}

/**
 * Trial Status interface exportée
 */
export type TrialInfo = TrialStatus;

/**
 * ✅ NOUVEAU: Annuler l'essai gratuit
 */
export async function cancelTrial(userId: string, reason?: string) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        trial_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'trial');

    if (error) {
      logger.error('trialService', 'Error cancelling trial:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    logger.error('trialService', 'Error in cancelTrial:', error);
    throw error;
  }
}

/**
 * ✅ NOUVEAU: Formater les jours restants pour affichage
 */
export function formatTrialDaysRemaining(days: number): string {
  if (days <= 0) return 'Expiré';
  if (days === 1) return '1 jour restant';
  return `${days} jours restants`;
}

/**
 * ✅ NOUVEAU: Envoyer email de rappel avant expiration
 */
export async function sendTrialExpiringEmail(
  email: string,
  daysRemaining: number,
  userName: string
): Promise<boolean> {
  try {
    // Utiliser SendGrid ou autre service d'email
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        template: 'trial_expiring',
        data: {
          userName,
          daysRemaining,
          actionUrl: `${window.location.origin}/pricing`,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    logger.error('trialService', 'Error sending trial expiring email:', error);
    return false;
  }
}
