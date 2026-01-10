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
 * Service pour calculer les statistiques des journaux comptables
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface JournalStats {
  id: string;
  code: string;
  name: string;
  type: 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous';
  entriesCount: number;
  totalDebit: number;
  totalCredit: number;
  lastEntryDate: string | null;
  isActive: boolean;
}
class JournalsStatsService {
  private static instance: JournalsStatsService;
  static getInstance(): JournalsStatsService {
    if (!this.instance) {
      this.instance = new JournalsStatsService();
    }
    return this.instance;
  }
  /**
   * Récupère tous les journaux avec leurs statistiques
   */
  async getJournalsWithStats(companyId: string): Promise<JournalStats[]> {
    try {
      // Récupérer tous les journaux de l'entreprise
      const { data: journals, error: journalsError } = await supabase
        .from('journals')
        .select('id, code, name, type, is_active')
        .eq('company_id', companyId)
        .order('code');
      if (journalsError) {
        logger.error('JournalsStats', 'Error fetching journals:', journalsError);
        return [];
      }
      if (!journals || journals.length === 0) {
        return [];
      }
      // Pour chaque journal, calculer les stats
      const journalStatsPromises = journals.map(async (journal) => {
        const stats = await this.calculateJournalStats(companyId, journal.id);
        return {
          id: journal.id,
          code: journal.code,
          name: journal.name,
          type: journal.type as JournalStats['type'],
          entriesCount: stats.entriesCount,
          totalDebit: stats.totalDebit,
          totalCredit: stats.totalCredit,
          lastEntryDate: stats.lastEntryDate,
          isActive: journal.is_active
        };
      });
      return await Promise.all(journalStatsPromises);
    } catch (error) {
      logger.error('JournalsStats', 'Error getting journals with stats:', error);
      return [];
    }
  }
  /**
   * Calcule les statistiques d'un journal spécifique
   */
  private async calculateJournalStats(
    companyId: string,
    journalId: string
  ): Promise<{
    entriesCount: number;
    totalDebit: number;
    totalCredit: number;
    lastEntryDate: string | null;
  }> {
    try {
      // Récupérer toutes les écritures du journal
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, entry_date')
        .eq('company_id', companyId)
        .eq('journal_id', journalId)
        .order('entry_date', { ascending: false });
      if (entriesError) {
        logger.error('JournalsStats', 'Error fetching journal entries:', entriesError);
        return {
          entriesCount: 0,
          totalDebit: 0,
          totalCredit: 0,
          lastEntryDate: null
        };
      }
      const entryIds = (entries || []).map(e => e.id);
      if (entryIds.length === 0) {
        return {
          entriesCount: 0,
          totalDebit: 0,
          totalCredit: 0,
          lastEntryDate: null
        };
      }
      // Récupérer les lignes d'écriture pour calculer débits et crédits
      const { data: items, error: itemsError } = await supabase
        .from('journal_entry_lines')
        .select('debit_amount, credit_amount')
        .in('journal_entry_id', entryIds);
      if (itemsError) {
        logger.error('JournalsStats', 'Error fetching journal entry items:', itemsError);
      }
      const totals = (items || []).reduce(
        (acc, item) => {
          acc.totalDebit += Number(item.debit_amount) || 0;
          acc.totalCredit += Number(item.credit_amount) || 0;
          return acc;
        },
        { totalDebit: 0, totalCredit: 0 }
      );
      return {
        entriesCount: entries.length,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        lastEntryDate: entries[0]?.entry_date || null
      };
    } catch (error) {
      logger.error('JournalsStats', 'Error calculating journal stats:', error);
      return {
        entriesCount: 0,
        totalDebit: 0,
        totalCredit: 0,
        lastEntryDate: null
      };
    }
  }
}
export const journalsStatsService = JournalsStatsService.getInstance();