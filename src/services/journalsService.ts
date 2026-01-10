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
// src/services/journalsService.ts
import { supabase } from '../lib/supabase';
import { logger } from '@/lib/logger';
type Journal = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type JournalInsert = Omit<Journal, 'id' | 'created_at' | 'updated_at'>;
export class JournalsService {
  private static instance: JournalsService;
  static getInstance(): JournalsService {
    if (!JournalsService.instance) {
      JournalsService.instance = new JournalsService();
    }
    return JournalsService.instance;
  }
  // Récupérer tous les journaux d'une entreprise
  async getJournals(companyId: string): Promise<Journal[]> {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('company_id', companyId)
        .order('code', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur récupération journaux:', error);
      return [];
    }
  }
  // Créer un nouveau journal
  async createJournal(journalData: JournalInsert): Promise<{ success: boolean; data?: Journal; error?: string }> {
    try {
      // Vérifier l'unicité du code
      const { data: existing } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', journalData.company_id)
        .eq('code', journalData.code)
        .single();
      if (existing) {
        return { success: false, error: 'Ce code de journal existe déjà' };
      }
      const { data, error } = await supabase
        .from('journals')
        .insert([journalData])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur création journal:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Mettre à jour un journal
  async updateJournal(id: string, updates: Partial<JournalInsert>): Promise<{ success: boolean; data?: Journal; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('journals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur modification journal:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Supprimer un journal
  async deleteJournal(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier qu'aucune écriture n'utilise ce journal
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('journal_code', id)
        .limit(1);
      if (entries && entries.length > 0) {
        return { success: false, error: 'Impossible de supprimer un journal contenant des écritures' };
      }
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur suppression journal:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Activer/désactiver un journal
  async toggleJournalStatus(id: string): Promise<{ success: boolean; data?: Journal; error?: string }> {
    try {
      // Récupérer le statut actuel
      const { data: current } = await supabase
        .from('journals')
        .select('is_active')
        .eq('id', id)
        .single();
      if (!current) {
        return { success: false, error: 'Journal non trouvé' };
      }
      const { data, error } = await supabase
        .from('journals')
        .update({ is_active: !current.is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur changement statut journal:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Obtenir les statistiques d'un journal
  async getJournalStats(journalCode: string, companyId: string): Promise<{
    entriesCount: number;
    lastEntryDate: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, entry_date')
        .eq('company_id', companyId)
        .eq('journal_code', journalCode)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return {
        entriesCount: data?.length || 0,
        lastEntryDate: data?.[0]?.entry_date || null
      };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur stats journal:', error);
      return { entriesCount: 0, lastEntryDate: null };
    }
  }
  // Créer les journaux par défaut pour une nouvelle entreprise
  async createDefaultJournals(companyId: string): Promise<{ success: boolean; journalsCreated: number; error?: string }> {
    try {
      const defaultJournals: JournalInsert[] = [
        {
          company_id: companyId,
          code: 'VTE',
          name: 'Journal des Ventes',
          type: 'sale',
          description: 'Journal principal pour toutes les ventes',
          is_active: true
        },
        {
          company_id: companyId,
          code: 'ACH',
          name: 'Journal des Achats',
          type: 'purchase',
          description: 'Journal pour les achats et factures fournisseurs',
          is_active: true
        },
        {
          company_id: companyId,
          code: 'BQ1',
          name: 'Banque Principale',
          type: 'bank',
          description: 'Compte bancaire principal',
          is_active: true
        },
        {
          company_id: companyId,
          code: 'CAI',
          name: 'Caisse Espèces',
          type: 'cash',
          description: 'Caisse pour les paiements en espèces',
          is_active: true
        },
        {
          company_id: companyId,
          code: 'OD',
          name: 'Opérations Diverses',
          type: 'miscellaneous',
          description: 'Journal pour les écritures diverses et de régularisation',
          is_active: true
        }
      ];
      const { data, error } = await supabase
        .from('journals')
        .insert(defaultJournals)
        .select();
      if (error) throw error;
      return { success: true, journalsCreated: data?.length || 0 };
    } catch (error: unknown) {
      logger.error('Journals', 'Erreur création journaux par défaut:', error);
      return { success: false, journalsCreated: 0, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
}
export const journalsService = JournalsService.getInstance();