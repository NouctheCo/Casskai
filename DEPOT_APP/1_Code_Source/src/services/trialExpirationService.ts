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

import { subscriptionService } from './subscriptionService';

/**
 * Service pour gérer l'expiration des périodes d'essai
 */
class TrialExpirationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Démarre la vérification périodique des essais expirés
   */
  startPeriodicCheck(intervalMinutes: number = 60) {
    if (this.isRunning) {
      console.warn('[TrialExpirationService] Service déjà en cours');
      return;
    }

    this.isRunning = true;
    console.warn(`[TrialExpirationService] Démarrage vérification périodique (${intervalMinutes}min)`);

    // Vérifier immédiatement
    this.checkExpiredTrials();

    // Puis vérifier périodiquement
    this.checkInterval = setInterval(() => {
      this.checkExpiredTrials();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Arrête la vérification périodique
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.warn('[TrialExpirationService] Vérification périodique arrêtée');
  }

  /**
   * Vérifie et traite les essais expirés
   */
  async checkExpiredTrials(): Promise<void> {
    try {
      console.warn('[TrialExpirationService] Vérification des essais expirés...');

      // Appeler la fonction Supabase pour expirer les essais
      const result = await subscriptionService.expireTrials();

      if (result.error) {
        console.error('[TrialExpirationService] Erreur lors de l\'expiration des essais:', result.error);
        return;
      }

      if (result.expiredCount > 0) {
        console.warn(`[TrialExpirationService] ${result.expiredCount} essai(s) expiré(s)`);

        // Émettre un événement pour informer l'application
        window.dispatchEvent(new CustomEvent('trials-expired', {
          detail: { count: result.expiredCount }
        }));
      }
    } catch (error) {
      console.error('[TrialExpirationService] Erreur inattendue:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Vérifie si un utilisateur spécifique a un essai expiré
   */
  async checkUserTrialStatus(userId: string): Promise<{
    isExpired: boolean;
    canAccess: boolean;
    planId: string | null;
    daysRemaining: number;
  }> {
    try {
      const status = await subscriptionService.getUserSubscriptionStatus(userId);

      if (!status) {
        // Pas d'abonnement trouvé, créer un essai
        const trialResult = await subscriptionService.createTrialSubscription(userId);
        if (trialResult.success) {
          return {
            isExpired: false,
            canAccess: true,
            planId: 'trial',
            daysRemaining: 30
          };
        }

        // Échec de création d'essai, accès refusé
        return {
          isExpired: true,
          canAccess: false,
          planId: null,
          daysRemaining: 0
        };
      }

      return {
        isExpired: status.is_expired,
        canAccess: status.can_access_app,
        planId: status.plan_id,
        daysRemaining: status.days_remaining
      };
    } catch (error) {
      console.error('[TrialExpirationService] Erreur vérification statut utilisateur:', error instanceof Error ? error.message : String(error));
      return {
        isExpired: true,
        canAccess: false,
        planId: null,
        daysRemaining: 0
      };
    }
  }

  /**
   * Applique les restrictions de modules après expiration d'essai
   */
  async applyPlanRestrictions(userId: string, planId: string): Promise<void> {
    try {
      // Obtenir les modules autorisés pour le plan
      const allowedModules = await subscriptionService.getAllowedModulesForPlan(planId);

      // Obtenir tous les modules actuellement actifs depuis localStorage
      const storedStates = localStorage.getItem('casskai-module-states');
      const allActiveModules = storedStates ? JSON.parse(storedStates) : {};

      // Désactiver les modules non autorisés
      const modulesToDeactivate = Object.keys(allActiveModules).filter(
        moduleKey => allActiveModules[moduleKey] && !allowedModules.includes(moduleKey)
      );

      if (modulesToDeactivate.length > 0) {
        console.warn(`[TrialExpirationService] Désactivation de ${modulesToDeactivate.length} module(s) non autorisé(s):`, modulesToDeactivate);

        // Désactiver les modules directement dans localStorage
        const updatedStates = { ...allActiveModules };
        modulesToDeactivate.forEach(moduleKey => {
          updatedStates[moduleKey] = false;
        });
        localStorage.setItem('casskai-module-states', JSON.stringify(updatedStates));

        // Émettre un événement pour synchroniser avec le contexte des modules
        window.dispatchEvent(new CustomEvent('module-state-changed', {
          detail: {
            allStates: updatedStates
          }
        }));
      }
    } catch (error) {
      console.error('[TrialExpirationService] Erreur application restrictions:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Gère la transition d'essai vers plan payant
   */
  async handleTrialExpiration(userId: string): Promise<void> {
    try {
      const status = await this.checkUserTrialStatus(userId);

      if (status.isExpired && !status.canAccess) {
        console.warn(`[TrialExpirationService] Essai expiré pour l'utilisateur ${userId}`);

        // Appliquer les restrictions du plan par défaut (aucun accès)
        await this.applyPlanRestrictions(userId, 'expired');

        // Émettre un événement pour rediriger vers la page de tarification
        window.dispatchEvent(new CustomEvent('trial-expired', {
          detail: {
            userId,
            redirectToPricing: true
          }
        }));
      } else if (status.planId && status.planId !== 'trial') {
        // L'utilisateur a souscrit à un plan, appliquer ses restrictions
        await this.applyPlanRestrictions(userId, status.planId);
      }
    } catch (error) {
      console.error('[TrialExpirationService] Erreur gestion expiration essai:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Vérifie l'état de l'utilisateur au démarrage de l'application
   */
  async checkUserOnStartup(userId: string): Promise<void> {
    console.warn(`[TrialExpirationService] Vérification utilisateur au démarrage: ${userId}`);
    await this.handleTrialExpiration(userId);
  }

  /**
   * Nettoie les ressources du service
   */
  cleanup(): void {
    this.stopPeriodicCheck();
  }
}

export const trialExpirationService = new TrialExpirationService();
export default trialExpirationService;
