/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import { useState, useEffect } from 'react';
import { getUserTrialInfo, convertTrialToPaid, cancelTrial, createTrialSubscription, getTrialStatistics, getExpiringTrials, canCreateTrial, type TrialStatus } from '@/services/trialService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
export interface UseTrialReturn {
  // État de l'essai
  trialInfo: TrialStatus | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  canCreateTrial: boolean;
  createTrial: (companyId?: string) => Promise<{ success: boolean; subscriptionId?: string; error?: string }>;
  convertTrialToPaid: (newPlanId: string, stripeSubscriptionId?: string, stripeCustomerId?: string) => Promise<{ success: boolean; error?: string }>;
  cancelTrial: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  // Utilitaires
  refreshTrialInfo: () => Promise<void>;
  daysRemaining: number;
  isExpired: boolean;
  isActive: boolean;
}
export const useTrial = (): UseTrialReturn => {
  const { user } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreateTrialFlag, setCanCreateTrialFlag] = useState(false);
  // Charger les informations d'essai au montage
  useEffect(() => {
    if (user?.id) {
      loadTrialInfo();
      checkTrialEligibility();
    }
  }, [user?.id]);
  const loadTrialInfo = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const info = await getUserTrialInfo(user.id);
      setTrialInfo(info);
    } catch (_err) {
      setError('Erreur lors du chargement des informations d\'essai');
      logger.error('Trial.hooks', '...', error);
    } finally {
      setIsLoading(false);
    }
  };
  const checkTrialEligibility = async () => {
    if (!user?.id) return;
    try {
      const canCreate = await canCreateTrial(user.id);
      setCanCreateTrialFlag(canCreate);
    } catch (_err) {
      logger.error('Trial.hooks', '...', error);
    }
  };
  const createTrial = async (companyId?: string) => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await createTrialSubscription(user.id, companyId || '');
      if (result.success) {
        // Recharger les informations après création
        await loadTrialInfo();
        await checkTrialEligibility();
      }
      return result;
    } catch (_err) {
      const errorMessage = 'Erreur lors de la création de l\'essai';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  const convertTrialToPaidAsync = async (
    _newPlanId: string,
    _stripeSubscriptionId?: string,
    _stripeCustomerId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await convertTrialToPaid(user.id);
      if (result.success) {
        // Recharger les informations après conversion
        await loadTrialInfo();
        await checkTrialEligibility();
      }
      return { success: result.success, error: result.error ? String(result.error) : undefined };
    } catch (_err) {
      const errorMessage = 'Erreur lors de la conversion de l\'essai';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  const cancelTrialAsync = async (_reason?: string) => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await cancelTrial(user.id);
      if (result.success) {
        // Recharger les informations après annulation
        await loadTrialInfo();
        await checkTrialEligibility();
      }
      return result;
    } catch (_err) {
      const errorMessage = 'Erreur lors de l\'annulation de l\'essai';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  const refreshTrialInfo = async () => {
    await loadTrialInfo();
    await checkTrialEligibility();
  };
  // Utilitaires calculés
  const daysRemaining = trialInfo?.daysRemaining || 0;
  const isExpired = (trialInfo?.daysRemaining || 0) <= 0;
  const isActive = (trialInfo as any)?.status === 'trialing' && !isExpired;
  return {
    // État
    trialInfo,
    isLoading,
    error,
    // Actions
    canCreateTrial: canCreateTrialFlag,
    createTrial,
    convertTrialToPaid: convertTrialToPaidAsync,
    cancelTrial: cancelTrialAsync,
    // Utilitaires
    refreshTrialInfo,
    daysRemaining,
    isExpired,
    isActive
  };
};
// Hook pour les statistiques d'essai (pour les administrateurs)
export const useTrialStatistics = () => {
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await getTrialStatistics();
      setStatistics(stats);
    } catch (_err) {
      setError('Erreur lors du chargement des statistiques');
      logger.error('Trial.hooks', '...', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadStatistics();
  }, []);
  return {
    statistics,
    isLoading,
    error,
    refresh: loadStatistics
  };
};
// Hook pour surveiller les essais qui expirent bientôt
export const useExpiringTrials = (daysAhead: number = 7) => {
  const [expiringTrials, setExpiringTrials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadExpiringTrials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trials = await getExpiringTrials(daysAhead);
      setExpiringTrials(trials);
    } catch (_err) {
      setError('Erreur lors du chargement des essais expirants');
      logger.error('Trial.hooks', '...', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadExpiringTrials();
  }, [daysAhead]);
  return {
    expiringTrials,
    isLoading,
    error,
    refresh: loadExpiringTrials
  };
};