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
import { useState, useEffect, useCallback } from 'react';
import { teamService, TeamMember, Invitation, InviteData, SubscriptionSeats } from '@/services/teamService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
export function useTeam() {
  const { currentCompany } = useAuth();
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [modules, setModules] = useState<{ key: string; name: string }[]>([]);
  const [seats, setSeats] = useState<SubscriptionSeats>({
    seats: 1,
    seats_used: 1,
    seats_available: 0
  });
  const [seatPrice, setSeatPrice] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [membersData, invitationsData, modulesData, seatsData, seatPriceData] = await Promise.all([
        teamService.getTeamMembers(currentCompany.id),
        teamService.getPendingInvitations(currentCompany.id),
        teamService.getAvailableModules(currentCompany.id),
        teamService.getSubscriptionSeats(currentCompany.id),
        teamService.getSeatPrice(currentCompany.id)
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
      setModules(modulesData);
      setSeats(seatsData);
      setSeatPrice(seatPriceData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'équipe';
      setError(errorMessage);
      logger.error('UseTeam', '[useTeam] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const sendInvitation = async (data: InviteData) => {
    if (!currentCompany?.id) {
      toast.error(t('team.no_company'));
      return { success: false, error: 'No company selected' };
    }
    // Vérifier si on a des sièges disponibles
    if (seats.seats_available <= 0) {
      toast.error(t('team.no_seats_available'));
      return { success: false, error: 'No seats available' };
    }
    try {
      const result = await teamService.sendInvitation(currentCompany.id, data);
      if (result.success) {
        toast.success(t('team.invitation_sent'));
        await loadData();
      } else {
        toast.error(result.error || t('team.invitation_error'));
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  const cancelInvitation = async (invitationId: string) => {
    try {
      await teamService.cancelInvitation(invitationId);
      toast.success(t('team.invitation_cancelled'));
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
      toast.error(errorMessage);
      throw err;
    }
  };
  const resendInvitation = async (invitationId: string) => {
    if (!currentCompany?.id) {
      toast.error(t('team.no_company'));
      return;
    }
    try {
      await teamService.resendInvitation(invitationId, currentCompany.id);
      toast.success(t('team.invitation_resent'));
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du renvoi';
      toast.error(errorMessage);
      throw err;
    }
  };
  const updateMember = async (memberId: string, role: string, allowedModules?: string[]) => {
    try {
      await teamService.updateMemberRole(memberId, role, allowedModules);
      toast.success(t('team.member_updated'));
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      throw err;
    }
  };
  const removeMember = async (memberId: string) => {
    if (!currentCompany?.id) {
      toast.error(t('team.no_company'));
      return;
    }
    try {
      await teamService.removeMember(memberId, currentCompany.id);
      toast.success(t('team.member_removed'));
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(errorMessage);
      throw err;
    }
  };
  const canInvite = useCallback(() => {
    if (!currentCompany?.id) return false;
    if (seats.seats_available <= 0) return false;
    // Vérifier si l'utilisateur a le rôle owner ou admin
    // Cette vérification devrait être faite côté serveur également
    return true;
  }, [currentCompany?.id, seats.seats_available]);
  return {
    members,
    invitations,
    modules,
    seats,
    seatPrice,
    loading,
    error,
    canInvite: canInvite(),
    refresh: loadData,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    updateMember,
    removeMember
  };
}