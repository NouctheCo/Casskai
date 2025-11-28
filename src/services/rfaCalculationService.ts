/**
 * Service de calcul RFA (Remise de Fin d'Année)
 * Gère tous les calculs liés aux RFA des contrats :
 * - CA actuel, projeté, fin d'année, fin de contrat
 * - Calcul RFA selon barème progressif
 * - Intégration devis pondérés par taux de conversion
 */

import { supabase } from '@/lib/supabase';

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
        third_parties!contracts_third_party_id_fkey(id, name)
      `)
      .eq('id', contractId)
      .eq('company_id', companyId)
      .single();

    if (contractError || !contract) {
      console.error('Contrat non trouvé:', contractError);
      return null;
    }

    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);

    // 2. Récupérer les factures du client sur la période du contrat
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total_ht, total_ttc, status, invoice_date, paid_amount')
      .eq('company_id', companyId)
      .eq('third_party_id', contract.third_party_id)
      .gte('invoice_date', contract.start_date)
      .lte('invoice_date', today.toISOString().split('T')[0])
      .in('status', ['sent', 'paid', 'partial']);

    // 3. Récupérer les devis en attente
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, total_ht, total_ttc, status, created_at')
      .eq('company_id', companyId)
      .eq('customer_id', contract.third_party_id)
      .eq('status', 'sent'); // Devis envoyés mais pas encore acceptés

    // 4. Calculer le taux de conversion historique des devis
    const { data: historicalQuotes } = await supabase
      .from('quotes')
      .select('status')
      .eq('company_id', companyId)
      .eq('customer_id', contract.third_party_id)
      .in('status', ['accepted', 'rejected', 'expired']);

    const acceptedCount = historicalQuotes?.filter(q => q.status === 'accepted').length || 0;
    const totalHistorical = historicalQuotes?.length || 0;
    const conversionRate = totalHistorical > 0 ? acceptedCount / totalHistorical : 0.5;

    // 5. Calculs des montants
    const base = (contract.rfa_calculation_base as 'ht' | 'ttc') || 'ht';

    const invoicedAmount = invoices?.reduce((sum, inv) =>
      sum + (base === 'ht' ? (inv.total_ht || 0) : (inv.total_ttc || 0)), 0) || 0;

    const paidAmount = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;

    const pendingQuotesTotal = quotes?.reduce((sum, q) =>
      sum + (base === 'ht' ? (q.total_ht || 0) : (q.total_ttc || 0)), 0) || 0;

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
        name: contract.name || `Contrat ${contract.reference || contract.id.slice(0, 8)}`,
        client_id: contract.third_party_id,
        client_name: contract.third_parties?.name || 'Client inconnu',
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
