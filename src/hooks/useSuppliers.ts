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
/**
 * Hook pour gérer les fournisseurs avec création à la volée
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}
export const useSuppliers = () => {
  const { currentCompany } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (currentCompany?.id) {
      loadSuppliers();
    }
  }, [currentCompany?.id]);
  const loadSuppliers = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name, email, phone, address_line1')
        .eq('company_id', currentCompany.id)
        .eq('type', 'supplier')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      logger.error('UseSuppliers', 'Erreur chargement fournisseurs:', error);
      toast.error('Impossible de charger les fournisseurs');
    } finally {
      setLoading(false);
    }
  };
  const createSupplier = async (name: string): Promise<{ value: string; label: string } | null> => {
    if (!currentCompany?.id) return null;
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .insert({
          company_id: currentCompany.id,
          name,
          type: 'supplier',
          status: 'active'
        })
        .select()
        .single();
      if (error) throw error;
      // Ajouter à la liste locale
      setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Fournisseur "${name}" créé avec succès`);
      return { value: data.id, label: data.name };
    } catch (error: any) {
      logger.error('UseSuppliers', 'Erreur création fournisseur:', error);
      toast.error(error.message || 'Impossible de créer le fournisseur');
      return null;
    }
  };
  return {
    suppliers,
    loading,
    createSupplier,
    refreshSuppliers: loadSuppliers
  };
};