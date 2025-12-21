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

import { supabase } from '../lib/supabase';

/**
 * Service de calcul des ratios financiers pour l'analyse de gestion
 * Conforme aux normes d'analyse financière PCG/IFRS
 */

export interface FinancialRatios {
  // Ratios de liquidité
  currentRatio: number;              // Ratio de liquidité générale (Actif circulant / Dettes CT)
  quickRatio: number;                // Ratio de liquidité réduite (AC - Stocks) / Dettes CT
  cashRatio: number;                 // Ratio de liquidité immédiate (Trésorerie / Dettes CT)

  // Ratios de rentabilité
  roe: number;                       // Return on Equity (Résultat net / Capitaux propres)
  roa: number;                       // Return on Assets (Résultat net / Total actif)
  netProfitMargin: number;           // Marge nette (Résultat net / CA)
  grossProfitMargin: number;         // Marge brute (Marge commerciale / CA)
  operatingMargin: number;           // Marge d'exploitation (Résultat exploitation / CA)
  ebitdaMargin: number;              // Marge EBE (EBE / CA)

  // Ratios de structure financière
  debtRatio: number;                 // Ratio d'endettement (Dettes totales / Total actif)
  equityRatio: number;               // Ratio d'autonomie financière (Capitaux propres / Total actif)
  debtToEquityRatio: number;         // Dettes / Capitaux propres
  interestCoverageRatio: number;     // Couverture des intérêts (EBE / Charges financières)

  // Ratios d'activité
  assetTurnover: number;             // Rotation de l'actif (CA / Total actif)
  workingCapital: number;            // Fonds de roulement (Actif circulant - Dettes CT)
  workingCapitalRatio: number;       // BFR / CA

  // Données brutes pour référence
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  currentAssets: number;
  currentLiabilities: number;
}

export interface RatioStatus {
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  benchmark: string;
  interpretation: string;
}

class FinancialRatiosService {
  private static instance: FinancialRatiosService;

  private constructor() {}

  static getInstance(): FinancialRatiosService {
    if (!FinancialRatiosService.instance) {
      FinancialRatiosService.instance = new FinancialRatiosService();
    }
    return FinancialRatiosService.instance;
  }

  /**
   * Calcule tous les ratios financiers pour une période donnée
   */
  async calculateRatios(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<FinancialRatios> {
    try {
      // Récupérer toutes les écritures comptables
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['posted', 'validated', 'imported'])
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) throw error;

      // Agréger les montants par classe de comptes
      let totalRevenue = 0;          // Classe 7
      let totalExpenses = 0;         // Classe 6
      let fixedAssets = 0;           // Classe 2
      let currentAssets = 0;         // Classes 3, 4, 5
      let equity = 0;                // Classe 1 (sauf dettes)
      let longTermLiabilities = 0;   // Comptes 16, 17, 18
      let currentLiabilities = 0;    // Comptes 4x (passif)
      let cash = 0;                  // Compte 5
      let inventory = 0;             // Compte 3
      let financialExpenses = 0;     // Compte 66
      let commercialMargin = 0;      // 707 - 607
      let operatingIncome = 0;       // Résultat d'exploitation
      let ebe = 0;                   // EBE calculé

      let ventes707 = 0;
      let achats607 = 0;

      entries?.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          const account = line.account_number;
          const debit = line.debit_amount || 0;
          const credit = line.credit_amount || 0;
          const balance = credit - debit;

          // Produits (classe 7)
          if (account.startsWith('7')) {
            totalRevenue += balance;
            if (account.startsWith('707')) {
              ventes707 += balance;
            }
          }
          // Charges (classe 6)
          else if (account.startsWith('6')) {
            totalExpenses += Math.abs(balance);
            if (account.startsWith('607')) {
              achats607 += Math.abs(balance);
            }
            if (account.startsWith('66')) {
              financialExpenses += Math.abs(balance);
            }
          }
          // Actif immobilisé (classe 2)
          else if (account.startsWith('2')) {
            fixedAssets += debit - credit;
          }
          // Stocks (classe 3)
          else if (account.startsWith('3')) {
            inventory += debit - credit;
            currentAssets += debit - credit;
          }
          // Créances et autres actifs circulants (classe 4 actif, 5)
          else if (account.startsWith('4') || account.startsWith('5')) {
            const actifBalance = debit - credit;
            if (actifBalance > 0) {
              currentAssets += actifBalance;
              if (account.startsWith('5')) {
                cash += actifBalance;
              }
            } else {
              // Passif classe 4
              currentLiabilities += Math.abs(actifBalance);
            }
          }
          // Capitaux propres (classe 1 sauf dettes)
          else if (account.startsWith('1')) {
            if (account.startsWith('16') || account.startsWith('17') || account.startsWith('18')) {
              longTermLiabilities += credit - debit;
            } else {
              equity += credit - debit;
            }
          }
        });
      });

      commercialMargin = ventes707 - achats607;
      operatingIncome = totalRevenue - totalExpenses;
      ebe = operatingIncome; // Simplification (devrait inclure dotations amortissements)

      const totalAssets = fixedAssets + currentAssets;
      const totalLiabilities = longTermLiabilities + currentLiabilities;
      const netIncome = totalRevenue - totalExpenses;

      // Calcul des ratios
      const ratios: FinancialRatios = {
        // Liquidité
        currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
        quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
        cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,

        // Rentabilité
        roe: equity > 0 ? (netIncome / equity) * 100 : 0,
        roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
        netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        grossProfitMargin: totalRevenue > 0 ? (commercialMargin / totalRevenue) * 100 : 0,
        operatingMargin: totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0,
        ebitdaMargin: totalRevenue > 0 ? (ebe / totalRevenue) * 100 : 0,

        // Structure financière
        debtRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
        equityRatio: totalAssets > 0 ? (equity / totalAssets) * 100 : 0,
        debtToEquityRatio: equity > 0 ? totalLiabilities / equity : 0,
        interestCoverageRatio: financialExpenses > 0 ? ebe / financialExpenses : 0,

        // Activité
        assetTurnover: totalAssets > 0 ? totalRevenue / totalAssets : 0,
        workingCapital: currentAssets - currentLiabilities,
        workingCapitalRatio: totalRevenue > 0 ? ((currentAssets - currentLiabilities) / totalRevenue) * 100 : 0,

        // Données brutes
        totalRevenue,
        totalExpenses,
        netIncome,
        totalAssets,
        totalLiabilities,
        equity,
        currentAssets,
        currentLiabilities
      };

      return ratios;
    } catch (error) {
      console.error('Error calculating financial ratios:', error);
      throw error;
    }
  }

  /**
   * Évalue un ratio et retourne son statut avec interprétation
   */
  evaluateRatio(ratioName: keyof FinancialRatios, value: number): RatioStatus {
    const evaluations: Record<string, (val: number) => RatioStatus> = {
      currentRatio: (val) => ({
        value: val,
        status: val >= 2 ? 'excellent' : val >= 1.5 ? 'good' : val >= 1 ? 'warning' : 'critical',
        benchmark: '≥ 2.0 (excellent), ≥ 1.5 (bon)',
        interpretation: val >= 2
          ? 'Excellente liquidité, capacité à honorer les dettes court terme'
          : val >= 1.5
          ? 'Bonne liquidité'
          : val >= 1
          ? 'Liquidité juste suffisante'
          : 'Risque de difficultés de trésorerie'
      }),

      roe: (val) => ({
        value: val,
        status: val >= 15 ? 'excellent' : val >= 10 ? 'good' : val >= 5 ? 'warning' : 'critical',
        benchmark: '≥ 15% (excellent), ≥ 10% (bon)',
        interpretation: val >= 15
          ? 'Excellente rentabilité des capitaux propres'
          : val >= 10
          ? 'Bonne rentabilité'
          : val >= 5
          ? 'Rentabilité moyenne'
          : 'Rentabilité insuffisante'
      }),

      netProfitMargin: (val) => ({
        value: val,
        status: val >= 10 ? 'excellent' : val >= 5 ? 'good' : val >= 2 ? 'warning' : 'critical',
        benchmark: '≥ 10% (excellent), ≥ 5% (bon)',
        interpretation: val >= 10
          ? 'Excellente marge nette'
          : val >= 5
          ? 'Bonne marge nette'
          : val >= 2
          ? 'Marge correcte'
          : 'Marge insuffisante'
      }),

      debtRatio: (val) => ({
        value: val,
        status: val <= 50 ? 'excellent' : val <= 70 ? 'good' : val <= 85 ? 'warning' : 'critical',
        benchmark: '≤ 50% (excellent), ≤ 70% (acceptable)',
        interpretation: val <= 50
          ? 'Endettement faible, bonne solidité financière'
          : val <= 70
          ? 'Endettement modéré'
          : val <= 85
          ? 'Endettement élevé'
          : 'Endettement excessif, risque financier'
      }),

      assetTurnover: (val) => ({
        value: val,
        status: val >= 2 ? 'excellent' : val >= 1.5 ? 'good' : val >= 1 ? 'warning' : 'critical',
        benchmark: '≥ 2.0 (excellent), ≥ 1.5 (bon)',
        interpretation: val >= 2
          ? 'Excellente utilisation des actifs'
          : val >= 1.5
          ? 'Bonne rotation des actifs'
          : val >= 1
          ? 'Rotation correcte'
          : 'Actifs sous-utilisés'
      })
    };

    const evaluator = evaluations[ratioName];
    if (evaluator) {
      return evaluator(value);
    }

    // Retour par défaut
    return {
      value,
      status: 'good',
      benchmark: 'N/A',
      interpretation: 'Ratio non évalué'
    };
  }

  /**
   * Formate un ratio pour l'affichage
   */
  formatRatio(value: number, type: 'percentage' | 'ratio' | 'currency' = 'ratio'): string {
    if (!Number.isFinite(value)) return 'N/A';

    switch (type) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
        }).format(value);
      case 'ratio':
      default:
        return value.toFixed(2);
    }
  }
}

export const financialRatiosService = FinancialRatiosService.getInstance();
