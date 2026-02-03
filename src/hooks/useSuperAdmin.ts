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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface SuperAdminState {
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook pour vérifier si l'utilisateur connecté est un super admin
 * SÉCURITÉ: Vérifie dans la table super_admins côté serveur (Supabase)
 */
export function useIsSuperAdmin(): SuperAdminState {
  const { user } = useAuth();
  const [state, setState] = useState<SuperAdminState>({
    isSuperAdmin: false,
    isLoading: true,
    error: null
  });

  const checkSuperAdmin = useCallback(async () => {
    if (!user?.id) {
      setState({ isSuperAdmin: false, isLoading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas encore, ne pas considérer comme erreur fatale
        if (error.code === '42P01') {
          logger.warn('SuperAdmin', 'Table super_admins non trouvée - exécutez la migration');
          setState({ isSuperAdmin: false, isLoading: false, error: null });
          return;
        }
        throw error;
      }

      setState({
        isSuperAdmin: !!data,
        isLoading: false,
        error: null
      });

      if (data) {
        logger.info('SuperAdmin', 'Utilisateur identifié comme super admin');
      }
    } catch (error) {
      logger.error('SuperAdmin', 'Erreur vérification super admin:', error);
      setState({
        isSuperAdmin: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }, [user?.id]);

  useEffect(() => {
    checkSuperAdmin();
  }, [checkSuperAdmin]);

  return state;
}

/**
 * Hook pour obtenir la liste des super admins (pour les super admins uniquement)
 */
export function useSuperAdminList() {
  const { isSuperAdmin } = useIsSuperAdmin();
  const [admins, setAdmins] = useState<Array<{ user_id: string; email: string; created_at: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('super_admins')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      logger.error('SuperAdmin', 'Erreur récupération liste admins:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return { admins, isLoading, refresh: fetchAdmins };
}

export default useIsSuperAdmin;
