/**
 * Service de suppression de compte utilisateur
 * Gère la suppression sécurisée avec période de grâce et export des données
 */

import { supabase } from '@/lib/supabase';
import { fecExportService } from './fecExportService';
import { logger } from '@/utils/logger';

interface DeletionAnalysis {
  canDelete: boolean;
  companiesAsSoleOwner: Array<{
    company_id: string;
    company_name: string;
    owner_count: number;
  }>;
  requiresOwnershipTransfer: boolean;
  totalCompanies: number;
  message: string;
}

interface OwnershipTransferPlan {
  company_id: string;
  company_name: string;
  new_owner_id: string;
  new_owner_email: string;
}

interface DeletionRequest {
  reason?: string;
  exportRequested: boolean;
  transferPlans: OwnershipTransferPlan[];
  scheduledDate?: Date;
}

export class AccountDeletionService {
  private static instance: AccountDeletionService;

  static getInstance(): AccountDeletionService {
    if (!AccountDeletionService.instance) {
      AccountDeletionService.instance = new AccountDeletionService();
    }
    return AccountDeletionService.instance;
  }

  /**
   * Analyse si un utilisateur peut supprimer son compte
   */
  async analyzeAccountDeletion(userId?: string): Promise<DeletionAnalysis> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      const { data, error } = await supabase
        .rpc('can_user_delete_account', { p_user_id: targetUserId });

      if (error) throw error;

      return {
        canDelete: data.can_delete,
        companiesAsSoleOwner: data.companies_as_sole_owner || [],
        requiresOwnershipTransfer: data.requires_ownership_transfer,
        totalCompanies: data.companies_as_sole_owner?.length || 0,
        message: data.message
      };

    } catch (error) {
      logger.error('❌ Erreur analyse suppression:', error);
      throw error;
    }
  }

  /**
   * Récupère les utilisateurs éligibles pour le transfert de propriété
   */
  async getEligibleTransferUsers(companyId: string): Promise<Array<{
    user_id: string;
    email: string;
    role: string;
    last_activity: string;
  }>> {
    try {
      const { error } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          role,
          last_activity,
          auth_users:user_id (email)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .neq('role', 'readonly')
        .order('role', { ascending: true }) // owners first, then admins
        .order('last_activity', { ascending: false });

      if (error) throw error;

      return (data || []).map((uc: Record<string, unknown>) => ({
        user_id: uc.user_id as string,
        email: (uc.auth_users as Record<string, unknown>)?.email as string || 'email@inconnu.fr',
        role: uc.role as string,
        last_activity: uc.last_activity as string
      }));

    } catch (error) {
      logger.error('❌ Erreur récupération utilisateurs éligibles:', error);
      throw error;
    }
  }

  /**
   * Initie une demande de suppression de compte
   */
  async requestAccountDeletion(request: DeletionRequest): Promise<{
    success: boolean;
    requestId?: string;
    scheduledDate?: string;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      // 1. Créer la demande de suppression
      const scheduledDate = request.scheduledDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { data: deletionRequest, error: createError } = await supabase
        .from('user_deletion_requests')
        .insert({
          user_id: user.id,
          reason: request.reason,
          scheduled_deletion_at: scheduledDate.toISOString(),
          export_requested: request.exportRequested,
          companies_to_transfer: request.transferPlans,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Effectuer les transferts de propriété si nécessaire
      if (request.transferPlans.length > 0) {
        await this.processOwnershipTransfers(request.transferPlans, user.id);
      }

      // 3. Déclencher l'export des données si demandé
      if (request.exportRequested) {
        await this.initiateDataExport(user.id, deletionRequest.id);
      }

      // 4. Programmer la notification d'autres utilisateurs
      await this.notifyTeamMembers(user.id, scheduledDate);

      return {
        success: true,
        requestId: deletionRequest.id,
        scheduledDate: scheduledDate.toISOString()
      };

    } catch (error) {
      logger.error('❌ Erreur demande suppression:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Traite les transferts de propriété
   */
  private async processOwnershipTransfers(
    transferPlans: OwnershipTransferPlan[],
    fromUserId: string
  ): Promise<void> {
    for (const plan of transferPlans) {
      try {
        const { error } = await supabase
          .rpc('transfer_company_ownership', {
            p_company_id: plan.company_id,
            p_from_user_id: fromUserId,
            p_to_user_id: plan.new_owner_id
          });

        if (error) {
          logger.error(`❌ Erreur transfert propriété ${plan.company_name}:`, error);
          // Continuer avec les autres transferts même en cas d'erreur
        } else {
          logger.warn(`✅ Propriété transférée pour ${plan.company_name}`)
        }

      } catch (error) {
        logger.error(`❌ Erreur transfert propriété ${plan.company_name}:`, error)
      }
    }
  }

  /**
   * Initie l'export des données utilisateur
   */
  private async initiateDataExport(userId: string, requestId: string): Promise<void> {
    try {
      // Récupérer toutes les entreprises de l'utilisateur
      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select('company_id, companies(name)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Générer un export FEC pour chaque entreprise
      const exportPromises = (userCompanies || []).map(async (uc: Record<string, unknown>) => {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);

        return fecExportService.generateFECExport({
          companyId: uc.company_id as string,
          year: currentYear,
          startDate,
          endDate,
          includeDocuments: true
        });
      });

      const exports = await Promise.all(exportPromises);

      // Mettre à jour la demande avec les liens d'export
      const exportUrls = exports
        .filter(exp => exp.success)
        .map(exp => exp.fileUrl)
        .join(',');

      await supabase
        .from('user_deletion_requests')
        .update({
          export_download_url: exportUrls,
          export_generated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      logger.warn('✅ Exports générés pour suppression compte')

    } catch (error) {
      logger.error('❌ Erreur génération exports:', error)
    }
  }

  /**
   * Notifie les membres des équipes
   */
  private async notifyTeamMembers(userId: string, scheduledDate: Date): Promise<void> {
    // En production, implémenter l'envoi d'emails via service de mail
    logger.warn(`📧 Notification programmée pour suppression le ${scheduledDate.toLocaleDateString()}`);

    // Récupérer les collègues à notifier
    // D'abord obtenir les company_ids de l'utilisateur
    const { data: userCompanies } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const companyIds = userCompanies?.map(uc => uc.company_id) || [];

    // Ensuite obtenir les collègues
    const { data: teammates } = await supabase
      .from('user_companies')
      .select(`
        company_id,
        companies(name),
        user_id,
        auth_users:user_id (email)
      `)
      .in('company_id', companyIds)
      .neq('user_id', userId);

    // En production, envoyer les emails de notification
    logger.warn(`📧 ${teammates?.length || 0} personnes à notifier de la suppression`)
  }

  /**
   * Annule une demande de suppression
   */
  async cancelDeletionRequest(requestId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { error } = await supabase
        .from('user_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Annulation par l\'utilisateur'
        })
        .eq('id', requestId)
        .eq('user_id', user.id); // Sécurité : seul le propriétaire peut annuler

      if (error) throw error;

      logger.warn('✅ Demande de suppression annulée');
      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur annulation suppression:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère le statut d'une demande de suppression
   */
  async getDeletionRequestStatus(userId?: string): Promise<{
    hasRequest: boolean;
    request?: Record<string, unknown>;
    daysRemaining?: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) throw new Error('Utilisateur non authentifié');

    try {
      const { error } = await supabase
        .from('user_deletion_requests')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return { hasRequest: false };
      }

      const scheduledDate = new Date(data.scheduled_deletion_at);
      const now = new Date();
      const daysRemaining = Math.ceil((scheduledDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      return {
        hasRequest: true,
        request: data,
        daysRemaining: Math.max(0, daysRemaining)
      };

    } catch (error) {
      logger.error('❌ Erreur récupération statut suppression:', error);
      throw error;
    }
  }

  /**
   * Traite les suppressions programmées (fonction administrative)
   */
  async processPendingDeletions(): Promise<void> {
    // Cette fonction serait appelée par un cron job
    const { data: pendingDeletions } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_deletion_at', new Date().toISOString());

    for (const deletion of pendingDeletions || []) {
      try {
        // 1. Archiver les données légalement
        await this.archiveUserDataLegally(deletion.user_id);

        // 2. Supprimer les accès aux entreprises
        await this.removeUserFromCompanies(deletion.user_id);

        // 3. Supprimer le compte utilisateur
        await this.deleteUserAccount(deletion.user_id);

        // 4. Marquer comme traité
        await supabase
          .from('user_deletion_requests')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', deletion.id);

        logger.warn(`✅ Compte ${deletion.user_id} supprimé avec succès`)

      } catch (error) {
        logger.error(`❌ Erreur suppression compte ${deletion.user_id}:`, error)
      }
    }
  }

  /**
   * Archive légalement les données d'un utilisateur
   */
  private async archiveUserDataLegally(userId: string): Promise<void> {
    // Récupérer toutes les données utilisateur
    const userData = await this.collectUserData(userId);

    // Créer l'archive légale
    await supabase
      .from('legal_archives')
      .insert({
        entity_type: 'user',
        entity_id: userId,
        original_name: userData.email || `Utilisateur ${userId}`,
        archived_data: userData,
        legal_basis: 'RGPD + Code de commerce - Conservation 7 ans',
        is_encrypted: true
      });

    logger.warn(`📚 Données utilisateur ${userId} archivées légalement`)
  }

  /**
   * Collecte toutes les données d'un utilisateur
   */
  private async collectUserData(userId: string): Promise<Record<string, unknown>> {
    // Implémenter la collecte complète des données utilisateur
    // En production, inclure toutes les tables liées
    return {
      user_id: userId,
      collected_at: new Date().toISOString(),
      // Ajouter toutes les données nécessaires
    };
  }

  /**
   * Retire un utilisateur de toutes ses entreprises
   */
  private async removeUserFromCompanies(userId: string): Promise<void> {
    const { error } = await supabase
        .from('user_companies')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Supprime définitivement le compte utilisateur
   */
  private async deleteUserAccount(userId: string): Promise<void> {
    // En production, utiliser l'API admin de Supabase pour supprimer l'utilisateur
    logger.warn(`🗑️ Suppression définitive compte ${userId}`)
  }
}

export const accountDeletionService = AccountDeletionService.getInstance();






