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
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  allowed_modules: string[];
  is_active: boolean;
  invited_at?: string;
  last_activity?: string;
  created_at: string;
}
export interface Invitation {
  id: string;
  email: string;
  role: string;
  allowed_modules: string[];
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  invited_by?: string;
  token?: string;
}
export interface InviteData {
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  allowed_modules: string[];
}
export interface SubscriptionSeats {
  seats: number;
  seats_used: number;
  seats_available: number;
}
class TeamService {
  /**
   * Récupère l'ID de la compagnie courante
   */
  private async getCurrentCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data: userCompanies, error } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .limit(1);
    if (error || !userCompanies || userCompanies.length === 0) {
      throw new Error('No active company found');
    }
    return userCompanies[0].company_id;
  }
  /**
   * Récupère tous les membres de l'équipe
   */
  async getTeamMembers(companyId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          id,
          user_id,
          role,
          allowed_modules,
          is_active,
          invited_at,
          created_at,
          profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(member => {
        const profile = member.profiles as unknown as { email?: string; full_name?: string; avatar_url?: string | null } | null;
        return {
          id: member.id,
          user_id: member.user_id,
          email: profile?.email || '',
          display_name: profile?.full_name || profile?.email?.split('@')[0] || '',
          avatar_url: profile?.avatar_url || null,
          role: member.role,
          allowed_modules: member.allowed_modules || [],
          is_active: member.is_active,
          invited_at: member.invited_at,
          created_at: member.created_at
        };
      });
    } catch (error) {
      logger.error('Team', 'Error fetching team members:', error);
      throw error;
    }
  }
  /**
   * Récupère les invitations en attente
   */
  async getPendingInvitations(companyId: string): Promise<Invitation[]> {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Team', 'Error fetching invitations:', error);
      throw error;
    }
  }
  /**
   * Envoie une invitation à un nouvel utilisateur
   */
  async sendInvitation(companyId: string, inviteData: InviteData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          company_id: companyId,
          email: inviteData.email.toLowerCase(),
          role: inviteData.role,
          allowed_modules: inviteData.allowed_modules
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.error) {
        return { success: false, error: data.error };
      }
      return { success: true };
    } catch (error) {
      logger.error('Team', 'Error sending invitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'invitation'
      };
    }
  }
  /**
   * Annule une invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);
      if (error) throw error;
    } catch (error) {
      logger.error('Team', 'Error cancelling invitation:', error);
      throw error;
    }
  }
  /**
   * Renvoie une invitation
   */
  async resendInvitation(invitationId: string, companyId: string): Promise<void> {
    try {
      // Récupérer l'invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('company_invitations')
        .select('email, role')
        .eq('id', invitationId)
        .single();
      if (fetchError || !invitation) {
        throw new Error('Invitation non trouvée');
      }
      // Annuler l'ancienne invitation
      await this.cancelInvitation(invitationId);
      // Créer une nouvelle invitation
      await this.sendInvitation(companyId, {
        email: invitation.email,
        role: invitation.role,
        allowed_modules: invitation.allowed_modules || []
      });
    } catch (error) {
      logger.error('Team', 'Error resending invitation:', error);
      throw error;
    }
  }
  /**
   * Met à jour le rôle et les modules autorisés d'un membre
   */
  async updateMemberRole(memberId: string, role: string, allowedModules?: string[]): Promise<void> {
    try {
      const updates: Record<string, unknown> = { role };
      if (allowedModules !== undefined) {
        updates.allowed_modules = allowedModules;
      }
      const { error } = await supabase
        .from('user_companies')
        .update(updates)
        .eq('id', memberId);
      if (error) throw error;
    } catch (error) {
      logger.error('Team', 'Error updating member role:', error);
      throw error;
    }
  }
  /**
   * Retire un membre de l'équipe
   */
  async removeMember(memberId: string, companyId: string): Promise<void> {
    try {
      // Récupérer l'utilisateur pour connaître le user_id
      const { data: member, error: fetchError } = await supabase
        .from('user_companies')
        .select('user_id, role')
        .eq('id', memberId)
        .single();
      if (fetchError || !member) {
        throw new Error('Membre non trouvé');
      }
      // Empêcher la suppression du propriétaire
      if (member.role === 'owner') {
        throw new Error('Impossible de retirer le propriétaire de l\'entreprise');
      }
      // Désactiver le membre
      const { error } = await supabase
        .from('user_companies')
        .update({
          is_active: false,
          status: 'removed'
        })
        .eq('id', memberId);
      if (error) throw error;
      // Mettre à jour le compteur de sièges
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          seats_used: supabase.rpc('decrement_seats_used')
        })
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (subscriptionError) {
        logger.warn('Team', 'Error updating subscription seats:', subscriptionError);
        // Ne pas bloquer la suppression si la mise à jour de l'abonnement échoue
      }
    } catch (error) {
      logger.error('Team', 'Error removing member:', error);
      throw error;
    }
  }
  /**
   * Récupère les modules disponibles pour l'entreprise
   */
  async getAvailableModules(companyId: string): Promise<{ key: string; name: string }[]> {
    try {
      // Modules par défaut disponibles dans CassKai
      const defaultModules = [
        { key: 'accounting', name: 'Comptabilité' },
        { key: 'invoicing', name: 'Facturation' },
        { key: 'crm', name: 'CRM' },
        { key: 'projects', name: 'Projets' },
        { key: 'hr', name: 'Ressources Humaines' },
        { key: 'bank', name: 'Banque' },
        { key: 'purchases', name: 'Achats' },
        { key: 'inventory', name: 'Inventaire' },
        { key: 'assets', name: 'Immobilisations' },
        { key: 'contracts', name: 'Contrats' },
        { key: 'forecasts', name: 'Prévisions' },
        { key: 'reports', name: 'Rapports' },
        { key: 'taxes', name: 'Taxes' },
        { key: 'settings', name: 'Paramètres' }
      ];
      // Vérifier si la table company_modules existe et contient des données
      const { data: companyModules, error } = await supabase
        .from('company_modules')
        .select('module_key, module_name')
        .eq('company_id', companyId)
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });
      if (!error && companyModules && companyModules.length > 0) {
        return companyModules.map(m => ({
          key: m.module_key,
          name: m.module_name
        }));
      }
      // Sinon, retourner les modules par défaut
      return defaultModules;
    } catch (error) {
      logger.error('Team', 'Error fetching modules:', error);
      // Retourner les modules par défaut en cas d'erreur
      return [
        { key: 'accounting', name: 'Comptabilité' },
        { key: 'invoicing', name: 'Facturation' },
        { key: 'crm', name: 'CRM' },
        { key: 'projects', name: 'Projets' },
        { key: 'hr', name: 'Ressources Humaines' }
      ];
    }
  }
  /**
   * Récupère le nombre de sièges de l'abonnement
   */
  async getSubscriptionSeats(companyId: string): Promise<SubscriptionSeats> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('seats, seats_used')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        logger.warn('Team', 'No active subscription found');
        return {
          seats: 1,
          seats_used: 1,
          seats_available: 0
        };
      }
      const seats = data?.seats || 1;
      const seats_used = data?.seats_used || 1;
      return {
        seats,
        seats_used,
        seats_available: Math.max(0, seats - seats_used)
      };
    } catch (error) {
      logger.error('Team', 'Error fetching subscription seats:', error);
      return {
        seats: 1,
        seats_used: 1,
        seats_available: 0
      };
    }
  }
  /**
   * Calcule le coût par siège additionnel
   */
  async getSeatPrice(companyId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_id, amount')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();
      if (error || !data) {
        // Prix par défaut si pas d'abonnement trouvé
        return 10; // 10€ par siège
      }
      // Le prix par siège est généralement le prix du plan divisé par le nombre de sièges inclus
      // Ou un prix fixe configuré pour le plan
      // Pour simplifier, on retourne 10€ par siège additionnel
      return 10;
    } catch (error) {
      logger.error('Team', 'Error fetching seat price:', error);
      return 10;
    }
  }
}
export const teamService = new TeamService();
export default teamService;