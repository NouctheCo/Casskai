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
 * Service de calcul RFA (Remise de Fin d'Année)
 * Gère tous les calculs liés aux RFA des contrats :
 * - CA actuel, projeté, fin d'année, fin de contrat
 * - Calcul RFA selon barème progressif
 * - Intégration devis pondérés par taux de conversion
 * 
 * ✅ MIGRATED TO: acceptedAccountingService pour calcul revenue client
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
import { acceptedAccountingService } from './acceptedAccountingService';
export interface RFABracket {
  min: number;
  max: number | null;
  rate: number;
}
export interface ContractRFAData {
  contract: {
    id: string;
    name: string;
    client_id: string;
    client_name: string;
    start_date: Date;
    end_date: Date;
    rfa_brackets: RFABracket[];
    rfa_calculation_base: 'ht' | 'ttc';
  };
  // Données actuelles
  currentRevenue: number;
  invoicedAmount: number;
  paidAmount: number;
  // Devis en attente
  pendingQuotes: {
    total: number;
    count: number;
    conversionRate: number;
    weightedAmount: number;
  };
  // Projections temporelles
  periodProgress: {
    daysElapsed: number;
    totalDays: number;
    percentage: number;
  };
  yearProgress: {
    daysElapsed: number;
    totalDays: number;
    percentage: number;
  };
  // CA Projetés
  projectedRevenue: {
    prorata: number;        // Prorata temporis simple
    withQuotes: number;     // Avec devis pondérés
    endOfYear: number;      // Fin d'année
    endOfContract: number;  // Fin de contrat
  };
  // RFA Calculées
  rfa: {
    current: number;              // Sur CA actuel
    projectedEndOfYear: number;   // Projection fin d'année
    projectedEndOfContract: number; // Projection fin contrat
  };
  // Détails pour affichage
  bracketDetails: {
    bracket: string;
    revenue: number;
    rate: number;
    rfa: number;
  }[];
}
export const rfaCalculationService = {
  async getVatCollectedAccountIds(companyId: string): Promise<string[]> {
    const { data: numberAccounts, error: numberError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .like('account_number', '4457%');

    if (numberError) {
      throw numberError;
    }

    if (numberAccounts && numberAccounts.length > 0) {
      return numberAccounts.map((acc) => acc.id);
    }

    const { data: nameAccounts, error: nameError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .ilike('account_name', '%tva%collect%');

    if (nameError) {
      throw nameError;
    }

    return (nameAccounts || []).map((acc) => acc.id);
  },

  async getMissingClientRevenueLinesCount(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const revenueAccountIds = await this.getRevenueAccountIds(companyId);
    if (revenueAccountIds.length === 0) {
      return 0;
    }

    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('company_id', companyId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    if (entriesError) {
      throw entriesError;
    }

    const entryIds = (entries || []).map((entry) => entry.id);
    if (entryIds.length === 0) {
      return 0;
    }

    const { data: lines, error: linesError } = await supabase
      .from('journal_entry_lines')
      .select('id')
      .in('journal_entry_id', entryIds)
      .in('account_id', revenueAccountIds);

    if (linesError) {
      throw linesError;
    }

    return lines?.length ?? 0;
  },

  async getRevenueFromAccounting(
    companyId: string,
    clientId: string,
    startDate: string,
    endDate: string,
    includeVatCollected: boolean
  ): Promise<number> {
    try {
      // ✅ MIGRATED: Utiliser acceptedAccountingService pour la source unique  
      // Passer clientId directement pour filtrer par client
      const { revenue } = await acceptedAccountingService.calculateRevenueWithAudit(
        companyId,
        startDate,
        endDate,
        clientId, // IMPORTANT: Filter revenue for this client only
        {
          vatTreatment: includeVatCollected ? 'ttc' : 'ht',
          includeBreakdown: false,
          includeReconciliation: false
        }
      );

      logger.debug('RfaCalculation', `[getRevenueFromAccounting] Client ${clientId}: ${formatCurrency(revenue)} (${includeVatCollected ? 'TTC' : 'HT'})`);
      return revenue;
    } catch (error) {
      logger.error('RfaCalculation', 'Failed to calculate client revenue from acceptedAccountingService, using fallback', error);
      
      // Fallback: Direct journal query (safety net)
      try {
        const revenueAccountIds = await this.getRevenueAccountIds(companyId);
        if (revenueAccountIds.length === 0) {
          logger.warn('RfaCalculation', 'Aucun compte de produits (classe 7) trouvé pour le CA');
          return 0;
        }

        const vatAccountIds = includeVatCollected
          ? await this.getVatCollectedAccountIds(companyId)
          : [];

        const accountIds = [...new Set([...revenueAccountIds, ...vatAccountIds])];
        if (accountIds.length === 0) {
          return 0;
        }

        const { data: entries, error: entriesError } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('company_id', companyId)
          .gte('entry_date', startDate)
          .lte('entry_date', endDate);

        if (entriesError) {
          throw entriesError;
        }

        const entryIds = (entries || []).map((entry) => entry.id);
        if (entryIds.length === 0) {
          return 0;
        }

        const { data: lines, error: linesError } = await supabase
          .from('journal_entry_lines')
          .select(`
            debit_amount,
            credit_amount,
            journal_entries!inner(company_id)
          `)
          .eq('journal_entries.company_id', companyId)
          .in('journal_entry_id', entryIds)
          .in('account_id', accountIds);

        if (linesError) {
          throw linesError;
        }

        return (lines || []).reduce((sum, line) => {
          const credit = Number(line.credit_amount || 0);
          const debit = Number(line.debit_amount || 0);
          return sum + (credit - debit);
        }, 0);
      } catch (fallbackError) {
        logger.error('RfaCalculation', 'Fallback revenue calculation also failed', fallbackError);
        return 0;
      }
    }
  },
  async getRevenueAccountIds(companyId: string): Promise<string[]> {
    const { data: classAccounts, error: classError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('account_class', 7);

    if (classError) {
      throw classError;
    }

    if (classAccounts && classAccounts.length > 0) {
      return classAccounts.map((acc) => acc.id);
    }

    const { data: numberAccounts, error: numberError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .like('account_number', '7%');

    if (numberError) {
      throw numberError;
    }

    return (numberAccounts || []).map((acc) => acc.id);
  },

  // Barème RFA par défaut
  DEFAULT_BRACKETS: [
    { min: 0, max: 100000, rate: 0 },
    { min: 100000, max: 200000, rate: 0.02 },
    { min: 200000, max: 500000, rate: 0.03 },
    { min: 500000, max: 1000000, rate: 0.04 },
    { min: 1000000, max: null, rate: 0.05 }
  ] as RFABracket[],
  /**
   * Calculer la RFA selon un barème progressif
   * Chaque tranche de revenu est taxée à son propre taux
   */
  calculateRFA(revenue: number, brackets: RFABracket[]): { total: number; details: Array<{ bracket: string; revenue: number; rate: number; rfa: number }> } {
    let totalRFA = 0;
    const details: Array<{ bracket: string; revenue: number; rate: number; rfa: number }> = [];
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const bracketMin = bracket.min;
      const bracketMax = bracket.max || Infinity;
      // Si le revenu n'atteint pas cette tranche, on s'arrête
      if (revenue <= bracketMin) break;
      // Calculer le revenu dans cette tranche
      const revenueInBracket = Math.min(revenue, bracketMax) - bracketMin;
      // Calculer la RFA pour cette tranche
      const rfaForBracket = revenueInBracket * bracket.rate;
      if (revenueInBracket > 0) {
        details.push({
          bracket: bracket.max
            ? `${formatCurrency(bracketMin)} - ${formatCurrency(bracketMax)}`
            : `> ${formatCurrency(bracketMin)}`,
          revenue: revenueInBracket,
          rate: bracket.rate * 100,
          rfa: rfaForBracket
        });
        totalRFA += rfaForBracket;
      }
    }
    return { total: totalRFA, details };
  },
  /**
   * Calculer toutes les métriques RFA pour un contrat
   */
  async calculateContractRFA(
    contractId: string,
    companyId: string
  ): Promise<ContractRFAData | null> {
    // 1. Récupérer le contrat avec les informations du client
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_name,
        contract_number,
        client_id,
        start_date,
        end_date,
        rfa_brackets,
        rfa_calculation_base
      `)
      .eq('id', contractId)
      .eq('company_id', companyId)
      .single();
    if (contractError || !contract) {
      logger.error('RfaCalculation', 'Contrat non trouvé:', contractError);
      return null;
    }
    if (!contract.client_id) {
      logger.warn('RfaCalculation', 'Contrat sans client_id - calcul RFA ignore');
      return null;
    }
    const { data: client } = await supabase
      .from('third_parties')
      .select('id, name')
      .eq('id', contract.client_id)
      .maybeSingle();

    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : new Date();
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const _yearEnd = new Date(today.getFullYear(), 11, 31);
    // 2. Récupérer le CA client depuis la comptabilité (écritures produits)
    const base = (contract.rfa_calculation_base as 'ht' | 'ttc') || 'ht';
    const includeVatCollected = base === 'ttc';
    const accountingRevenue = await this.getRevenueFromAccounting(
      companyId,
      contract.client_id,
      contract.start_date,
      today.toISOString().split('T')[0],
      includeVatCollected
    );
    const invoicedAmount = accountingRevenue;
    const paidAmount = accountingRevenue;
    const pendingQuotesTotal = 0;
    const conversionRate = 0;
    // 6. Calcul du prorata temporis
    const daysElapsedInPeriod = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDaysInPeriod = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const periodProgress = Math.min(daysElapsedInPeriod / totalDaysInPeriod, 1);
    const daysElapsedInYear = Math.max(0, Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDaysInYear = 365;
    const yearProgress = Math.min(daysElapsedInYear / totalDaysInYear, 1);
    // 7. Projections
    const projectedProrata = periodProgress > 0.01 ? invoicedAmount / periodProgress : invoicedAmount;
    const weightedQuotes = pendingQuotesTotal * conversionRate;
    const projectedWithQuotes = projectedProrata + weightedQuotes;
    // Projection fin d'année basée sur le rythme quotidien
    const remainingDaysInYear = Math.max(0, totalDaysInYear - daysElapsedInYear);
    const dailyRate = daysElapsedInYear > 0 ? invoicedAmount / daysElapsedInYear : 0;
    const projectedEndOfYear = invoicedAmount + (dailyRate * remainingDaysInYear) + weightedQuotes;
    // Projection fin de contrat
    const remainingDaysInContract = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const projectedEndOfContract = invoicedAmount + (dailyRate * remainingDaysInContract) + weightedQuotes;
    // 8. Calcul RFA selon barème
    const brackets = (contract.rfa_brackets as RFABracket[]) || this.DEFAULT_BRACKETS;
    const rfaCurrent = this.calculateRFA(invoicedAmount, brackets);
    const rfaEndOfYear = this.calculateRFA(projectedEndOfYear, brackets);
    const rfaEndOfContract = this.calculateRFA(projectedEndOfContract, brackets);
    // 9. Construire le résultat
    return {
      contract: {
        id: contract.id,
        name: contract.contract_name || `Contrat ${contract.contract_number || contract.id.slice(0, 8)}`,
        client_id: contract.client_id,
        client_name: client?.name || 'Client inconnu',
        start_date: startDate,
        end_date: endDate,
        rfa_brackets: brackets,
        rfa_calculation_base: base
      },
      currentRevenue: invoicedAmount,
      invoicedAmount,
      paidAmount,
      pendingQuotes: {
        total: pendingQuotesTotal,
        count: 0,
        conversionRate,
        weightedAmount: 0
      },
      periodProgress: {
        daysElapsed: daysElapsedInPeriod,
        totalDays: totalDaysInPeriod,
        percentage: periodProgress * 100
      },
      yearProgress: {
        daysElapsed: daysElapsedInYear,
        totalDays: totalDaysInYear,
        percentage: yearProgress * 100
      },
      projectedRevenue: {
        prorata: projectedProrata,
        withQuotes: projectedWithQuotes,
        endOfYear: projectedEndOfYear,
        endOfContract: projectedEndOfContract
      },
      rfa: {
        current: rfaCurrent.total,
        projectedEndOfYear: rfaEndOfYear.total,
        projectedEndOfContract: rfaEndOfContract.total
      },
      bracketDetails: rfaCurrent.details
    };
  },
  /**
   * Calculer les RFA pour tous les contrats actifs d'une entreprise
   */
  async calculateAllContractsRFA(companyId: string): Promise<ContractRFAData[]> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('rfa_enabled', true);
    if (!contracts || contracts.length === 0) return [];
    const results: ContractRFAData[] = [];
    for (const contract of contracts) {
      const data = await this.calculateContractRFA(contract.id, companyId);
      if (data) results.push(data);
    }
    return results;
  }
};