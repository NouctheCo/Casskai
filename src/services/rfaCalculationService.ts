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
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { rfaTurnoverService } from '@/services/rfa/rfaTurnoverService';

type DiscountTier = {
  min: number;
  max: number | null;
  rate: number;
};

const calculateProgressiveEffectiveRate = (turnover: number, tiers: DiscountTier[]) => {
  if (!turnover || turnover <= 0) return { rfaAmount: 0, effectiveRate: 0, breakdown: [] as any[] };
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let total = 0;
  const breakdown: any[] = [];
  sorted.forEach((tier, index) => {
    const tierMin = tier.min;
    const tierMax = tier.max ?? Number.MAX_SAFE_INTEGER;
    if (turnover <= tierMin) return;
    const tierAmount = Math.max(0, Math.min(turnover, tierMax) - tierMin);
    const tierRfa = tierAmount * tier.rate;
    total += tierRfa;
    breakdown.push({ tier_index: index, tier_min: tierMin, tier_max: tier.max ?? null, tier_rate: tier.rate, tier_amount: tierAmount, rfa_amount: tierRfa });
  });
  return { rfaAmount: total, effectiveRate: turnover > 0 ? total / turnover : 0, breakdown };
};

const resolvePeriod = (contract: any, todayIso: string) => {
  const periodType = contract.rfa_period_type || 'contract_period';
  if (periodType === 'calendar_year') {
    const y = new Date(todayIso).getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  if (periodType === 'custom') {
    const start = contract.rfa_custom_period_start || contract.start_date;
    const end = contract.rfa_custom_period_end || contract.end_date || todayIso;
    return { start, end };
  }
  return { start: contract.start_date, end: contract.end_date || todayIso };
};
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
            ? `${bracketMin.toLocaleString('fr-FR')} € - ${bracketMax.toLocaleString('fr-FR')} €`
            : `> ${bracketMin.toLocaleString('fr-FR')} €`,
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
        *,
        client:customers(id, name)
      `)
      .eq('id', contractId)
      .eq('company_id', companyId)
      .single();
    if (contractError || !contract) {
      logger.error('RfaCalculation', 'Contrat non trouvé:', contractError);
      return null;
    }
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date || contract.start_date);
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const _yearEnd = new Date(today.getFullYear(), 11, 31);
    const { start: periodStart, end: periodEnd } = resolvePeriod(contract, todayIso);

    // 2. Récupérer les factures du client sur la période
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, subtotal_excl_tax, total_incl_tax, status, invoice_date, paid_amount')
      .eq('company_id', companyId)
      .or(`customer_id.eq.${contract.client_id},third_party_id.eq.${contract.client_id}`)
      .eq('invoice_type', 'sale')
      .gte('invoice_date', periodStart)
      .lte('invoice_date', todayIso)
      .in('status', ['sent', 'paid', 'partially_paid']);
    // 3. Récupérer les devis en attente
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, total_ht, total_ttc, status, created_at')
      .eq('company_id', companyId)
      .eq('customer_id', contract.client_id)
      .eq('status', 'sent'); // Devis envoyés mais pas encore acceptés
    // 4. Calculer le taux de conversion historique des devis
    const { data: historicalQuotes } = await supabase
      .from('quotes')
      .select('status')
      .eq('company_id', companyId)
      .eq('customer_id', contract.client_id)
      .in('status', ['accepted', 'rejected', 'expired']);
    const acceptedCount = historicalQuotes?.filter(q => q.status === 'accepted').length || 0;
    const totalHistorical = historicalQuotes?.length || 0;
    const conversionRate = totalHistorical > 0 ? acceptedCount / totalHistorical : 0.5;
    // 5. Calculs des montants
    const base = (contract.rfa_calculation_base as 'ht' | 'ttc') || 'ht';

    // Montant facturé (fallback) à partir des totaux facture
    const invoicedAmountFromInvoices = invoices?.reduce((sum, inv: any) =>
      sum + (base === 'ht' ? Number(inv.subtotal_excl_tax || 0) : Number(inv.total_incl_tax || 0)), 0) || 0;

    const paidAmount = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
    const pendingQuotesTotal = quotes?.reduce((sum, q) =>
      sum + (base === 'ht' ? (q.total_ht || 0) : (q.total_ttc || 0)), 0) || 0;

    // Support RFA avancée: base/application par groupes + taux effectif (tiers/fixe)
    let baseTurnover = invoicedAmountFromInvoices;
    let applicationTurnover = invoicedAmountFromInvoices;

    try {
      const baseType = (contract as any).rfa_base_type || 'total_client';
      const baseGroupIds = ((contract as any).rfa_base_product_groups || []) as string[];
      const applicationType = (contract as any).rfa_application_type || 'same_as_base';
      const applicationGroupIds = ((contract as any).rfa_application_product_groups || []) as string[];

      const totalClientTurnover = await rfaTurnoverService.sumFromInvoices({
        companyId,
        thirdPartyId: contract.client_id,
        startDate: periodStart,
        endDate: todayIso,
        base
      });

      baseTurnover = baseType === 'product_groups'
        ? await rfaTurnoverService.sumFromInvoices({
          companyId,
          thirdPartyId: contract.client_id,
          startDate: periodStart,
          endDate: todayIso,
          base,
          groupIds: baseGroupIds
        })
        : totalClientTurnover;

      applicationTurnover = applicationType === 'total_client'
        ? totalClientTurnover
        : (applicationType === 'specific_groups'
          ? await rfaTurnoverService.sumFromInvoices({
            companyId,
            thirdPartyId: contract.client_id,
            startDate: periodStart,
            endDate: todayIso,
            base,
            groupIds: applicationGroupIds
          })
          : (baseType === 'product_groups'
            ? await rfaTurnoverService.sumFromInvoices({
              companyId,
              thirdPartyId: contract.client_id,
              startDate: periodStart,
              endDate: todayIso,
              base,
              groupIds: baseGroupIds
            })
            : totalClientTurnover));
    } catch (e) {
      logger.warn('RfaCalculation', 'Fallback invoice totals (turnover service error)', e);
    }

    // À partir d'ici, on projette sur la base de l'assiette d'application
    const invoicedAmount = applicationTurnover;
    // 6. Calcul du prorata temporis (sur la période RFA)
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);
    const daysElapsedInPeriod = Math.max(0, Math.floor((today.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDaysInPeriod = Math.max(1, Math.floor((periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)));
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

    // 8. Calcul RFA
    const calculationType = (contract as any).rfa_calculation_type || 'progressive';
    const tiers = (((contract as any).rfa_tiers || []) as DiscountTier[]).map(t => ({
      min: Number((t as any).min || 0),
      max: (t as any).max === null || (t as any).max === undefined ? null : Number((t as any).max),
      rate: Number((t as any).rate || 0)
    }));

    let rfaCurrentTotal = 0;
    let rfaEndOfYearTotal = 0;
    let rfaEndOfContractTotal = 0;
    let bracketDetails: ContractRFAData['bracketDetails'] = [];

    if (calculationType === 'fixed_percent') {
      const effectiveRate = Number((contract as any).rfa_base_percentage || 0) / 100;
      rfaCurrentTotal = invoicedAmount * effectiveRate;
      rfaEndOfYearTotal = projectedEndOfYear * effectiveRate;
      rfaEndOfContractTotal = projectedEndOfContract * effectiveRate;
    } else if (calculationType === 'fixed_amount') {
      const fixedAmount = Number((contract as any).rfa_base_amount || 0);
      const effectiveRate = baseTurnover > 0 ? fixedAmount / baseTurnover : 0;
      rfaCurrentTotal = invoicedAmount * effectiveRate;
      rfaEndOfYearTotal = projectedEndOfYear * effectiveRate;
      rfaEndOfContractTotal = projectedEndOfContract * effectiveRate;
    } else if (tiers.length > 0) {
      const r = calculateProgressiveEffectiveRate(baseTurnover, tiers);
      rfaCurrentTotal = invoicedAmount * r.effectiveRate;
      rfaEndOfYearTotal = projectedEndOfYear * r.effectiveRate;
      rfaEndOfContractTotal = projectedEndOfContract * r.effectiveRate;
      bracketDetails = r.breakdown.map(b => ({
        bracket: `${Number(b.tier_min).toLocaleString('fr-FR')} € - ${(b.tier_max ?? '∞').toString()}${b.tier_max ? ' €' : ''}`,
        revenue: Number(b.tier_amount || 0),
        rate: Number(b.tier_rate || 0) * 100,
        rfa: Number(b.rfa_amount || 0)
      }));
    } else {
      // fallback legacy brackets
      const brackets = (contract.rfa_brackets as RFABracket[]) || this.DEFAULT_BRACKETS;
      const rfaCurrent = this.calculateRFA(invoicedAmount, brackets);
      const rfaEndOfYear = this.calculateRFA(projectedEndOfYear, brackets);
      const rfaEndOfContract = this.calculateRFA(projectedEndOfContract, brackets);
      rfaCurrentTotal = rfaCurrent.total;
      rfaEndOfYearTotal = rfaEndOfYear.total;
      rfaEndOfContractTotal = rfaEndOfContract.total;
      bracketDetails = rfaCurrent.details;
    }
    // 9. Construire le résultat
    return {
      contract: {
        id: contract.id,
        name: contract.contract_name || `Contrat ${contract.contract_number || contract.id.slice(0, 8)}`,
        client_id: contract.client_id,
        client_name: contract.client?.name || 'Client inconnu',
        start_date: startDate,
        end_date: endDate,
        rfa_brackets: (contract.rfa_brackets as RFABracket[]) || this.DEFAULT_BRACKETS,
        rfa_calculation_base: base
      },
      currentRevenue: invoicedAmount,
      invoicedAmount,
      paidAmount,
      pendingQuotes: {
        total: pendingQuotesTotal,
        count: quotes?.length || 0,
        conversionRate,
        weightedAmount: weightedQuotes
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
        current: rfaCurrentTotal,
        projectedEndOfYear: rfaEndOfYearTotal,
        projectedEndOfContract: rfaEndOfContractTotal
      },
      bracketDetails
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