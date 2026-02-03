/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface PeriodSnapshot {
  accountNumber: string;
  accountName: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  snapshotDate: string;
}

/**
 * Service pour récupérer les snapshots de soldes de périodes clôturées
 * Évite les recalculs coûteux pour les rapports comparatifs N vs N-1
 */
class PeriodSnapshotService {
  private static instance: PeriodSnapshotService;

  private constructor() {}

  static getInstance(): PeriodSnapshotService {
    if (!PeriodSnapshotService.instance) {
      PeriodSnapshotService.instance = new PeriodSnapshotService();
    }
    return PeriodSnapshotService.instance;
  }

  /**
   * Récupère le snapshot des soldes pour une période clôturée
   * Si le snapshot existe, retourne les données pré-calculées
   * Sinon, retourne null et on doit calculer manuellement
   */
  async getPeriodSnapshot(
    companyId: string,
    periodId: string
  ): Promise<PeriodSnapshot[] | null> {
    try {
      const { data, error } = await supabase.rpc('get_period_balances_snapshot', {
        p_company_id: companyId,
        p_period_id: periodId,
      });

      if (error) {
        logger.error('PeriodSnapshot', 'Error fetching snapshot:', error);
        return null;
      }

      if (!data || data.length === 0) {
        logger.info('PeriodSnapshot', `No snapshot found for period ${periodId}`);
        return null;
      }

      return data.map((row: any) => ({
        accountNumber: row.account_number,
        accountName: row.account_name || row.account_number,
        debitTotal: parseFloat(row.debit_total || '0'),
        creditTotal: parseFloat(row.credit_total || '0'),
        balance: parseFloat(row.balance || '0'),
        snapshotDate: row.snapshot_date,
      }));
    } catch (err) {
      logger.error('PeriodSnapshot', 'Unexpected error fetching snapshot:', err);
      return null;
    }
  }

  /**
   * Récupère le snapshot de la période précédente (N-1)
   * Utile pour les rapports comparatifs
   */
  async getPreviousPeriodSnapshot(
    companyId: string,
    currentPeriodStartDate: string
  ): Promise<{ periodId: string; snapshot: PeriodSnapshot[] } | null> {
    try {
      // Trouver la période précédente clôturée
      const { data: previousPeriod, error: periodError } = await supabase
        .from('accounting_periods')
        .select('id, name, end_date')
        .eq('company_id', companyId)
        .eq('is_closed', true)
        .lt('end_date', currentPeriodStartDate)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (periodError || !previousPeriod) {
        logger.info('PeriodSnapshot', 'No previous closed period found');
        return null;
      }

      // Récupérer le snapshot de cette période
      const snapshot = await this.getPeriodSnapshot(companyId, previousPeriod.id);

      if (!snapshot) {
        logger.warn('PeriodSnapshot', `Period ${previousPeriod.name} is closed but has no snapshot`);
        return null;
      }

      return {
        periodId: previousPeriod.id,
        snapshot,
      };
    } catch (err) {
      logger.error('PeriodSnapshot', 'Error fetching previous period snapshot:', err);
      return null;
    }
  }

  /**
   * Vérifie si un snapshot existe pour une période donnée
   */
  async hasSnapshot(companyId: string, periodId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('account_balances_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('period_id', periodId);

      if (error) {
        logger.error('PeriodSnapshot', 'Error checking snapshot existence:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (err) {
      logger.error('PeriodSnapshot', 'Unexpected error checking snapshot:', err);
      return false;
    }
  }

  /**
   * Convertit un snapshot en format compatible avec FinancialData
   * Pour utilisation dans les rapports existants
   */
  snapshotToFinancialData(snapshot: PeriodSnapshot[]): Array<{
    compte: string;
    libelle: string;
    debit: number;
    credit: number;
    solde: number;
  }> {
    return snapshot.map(s => ({
      compte: s.accountNumber,
      libelle: s.accountName,
      debit: s.debitTotal,
      credit: s.creditTotal,
      solde: s.balance,
    }));
  }
}

export const periodSnapshotService = PeriodSnapshotService.getInstance();
export default PeriodSnapshotService;
