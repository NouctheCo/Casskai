/**
 * Service de suppression d'entreprise avec consensus des propriétaires
 * Gère la demande, l'approbation et l'export FEC avant suppression
 */

import { supabase } from '@/lib/supabase';

export interface CompanyDeletionRequest {
  id: string;
  company_id: string;
  requested_by: string;
  status: 'pending' | 'approval_pending' | 'approved' | 'processing' | 'completed' | 'cancelled';
  required_approvals: any[];
  received_approvals: any;
  export_requested: boolean;
  scheduled_deletion_at: string;
  created_at: string;
  other_owners_count: number;
}

export interface CompanyDeletionApproval {
  id: string;
  deletion_request_id: string;
  approver_id: string;
  approved: boolean;
  approval_reason?: string;
  approved_at?: string;
  created_at: string;
}

class CompanyDeletionService {
  private static instance: CompanyDeletionService;

  static getInstance(): CompanyDeletionService {
    if (!CompanyDeletionService.instance) {
      CompanyDeletionService.instance = new CompanyDeletionService();
    }
    return CompanyDeletionService.instance;
  }

  /**
   * Initie une demande de suppression d'entreprise
   */
  async requestCompanyDeletion(
    companyId: string,
    reason?: string,
    exportRequested: boolean = true
  ): Promise<{
    success: boolean;
    deletion_request?: CompanyDeletionRequest;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      // Appeler la Edge Function
      const { data, error } = await supabase.functions.invoke('delete-company', {
        body: {
          company_id: companyId,
          reason: reason || null,
          export_requested: exportRequested
        }
      });

      if (error) {
        console.error('❌ Erreur deletion request:', error);
        return { success: false, error: error.message || 'Erreur lors de la création de la demande' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' };
      }

      return {
        success: true,
        deletion_request: {
          id: data.deletion_request.id,
          company_id: companyId,
          requested_by: user.id,
          status: data.deletion_request.status,
          required_approvals: data.deletion_request.requires_approval ? [] : [],
          received_approvals: {},
          export_requested: exportRequested,
          scheduled_deletion_at: data.deletion_request.scheduled_deletion_at,
          created_at: new Date().toISOString(),
          other_owners_count: data.deletion_request.other_owners_count || 0
        }
      };
    } catch (error) {
      console.error('❌ Erreur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère l'état d'une demande de suppression
   */
  async getCompanyDeletionStatus(companyId: string): Promise<CompanyDeletionRequest | null> {
    try {
      const { data, error } = await supabase
        .from('company_deletion_requests')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['pending', 'approval_pending', 'approved'])
        .maybeSingle();

      if (error && error.code !== '42P01') throw error;

      if (!data) return null;

      return {
        id: data.id,
        company_id: data.company_id,
        requested_by: data.requested_by,
        status: data.status,
        required_approvals: data.required_approvals || [],
        received_approvals: data.received_approvals || {},
        export_requested: data.export_requested,
        scheduled_deletion_at: data.scheduled_deletion_at,
        created_at: data.created_at,
        other_owners_count: data.metadata?.other_owners_count || 0
      };
    } catch (error) {
      console.error('❌ Erreur récupération statut:', error);
      return null;
    }
  }

  /**
   * Approuve une demande de suppression d'entreprise
   */
  async approveCompanyDeletion(
    deletionRequestId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    approval?: CompanyDeletionApproval;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      // Appeler la Edge Function
      const { data, error } = await supabase.functions.invoke('approve-company-deletion', {
        body: {
          deletion_request_id: deletionRequestId,
          approved: true,
          reason: reason || null
        }
      });

      if (error) {
        console.error('❌ Erreur approbation:', error);
        return { success: false, error: error.message || 'Erreur lors de l\'approbation' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Rejette une demande de suppression d'entreprise
   */
  async rejectCompanyDeletion(
    deletionRequestId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      // Appeler la Edge Function
      const { data, error } = await supabase.functions.invoke('approve-company-deletion', {
        body: {
          deletion_request_id: deletionRequestId,
          approved: false,
          reason: reason || null
        }
      });

      if (error) {
        console.error('❌ Erreur rejet:', error);
        return { success: false, error: error.message || 'Erreur lors du rejet' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Annule une demande de suppression d'entreprise
   */
  async cancelCompanyDeletion(
    deletionRequestId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('company_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || null
        })
        .eq('id', deletionRequestId);

      if (error && error.code !== '42P01') throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère les demandes en attente d'approbation pour un utilisateur
   */
  async getPendingApprovalsForUser(): Promise<CompanyDeletionRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('company_deletion_approvals')
        .select(`
          deletion_request:deletion_request_id (
            id,
            company_id,
            requested_by,
            status,
            required_approvals,
            received_approvals,
            export_requested,
            scheduled_deletion_at,
            created_at,
            metadata
          )
        `)
        .eq('approver_id', user.id)
        .eq('approved', false)
        .is('approved_at', null);

      if (error && error.code !== '42P01') throw error;

      return (data || [])
        .map((d: any) => d.deletion_request)
        .filter(Boolean)
        .map((dr: any) => ({
          id: dr.id,
          company_id: dr.company_id,
          requested_by: dr.requested_by,
          status: dr.status,
          required_approvals: dr.required_approvals || [],
          received_approvals: dr.received_approvals || {},
          export_requested: dr.export_requested,
          scheduled_deletion_at: dr.scheduled_deletion_at,
          created_at: dr.created_at,
          other_owners_count: dr.metadata?.other_owners_count || 0
        }));
    } catch (error) {
      console.error('❌ Erreur récupération approvals:', error);
      return [];
    }
  }
}

export const companyDeletionService = CompanyDeletionService.getInstance();
