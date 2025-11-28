/**
 * Service pour calculer dynamiquement le score de santé financière
 * Basé sur des métriques réelles extraites de la base de données
 */

import { supabase } from '@/lib/supabase';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';
import type { FinancialHealthScore } from '@/types/enterprise-dashboard.types';

interface FinancialData {
  revenue: number;
  expenses: number;
  assets: number;
  liabilities: number;
  currentAssets: number;
  currentLiabilities: number;
  cashBalance: number;
}

class FinancialHealthService {
  private static instance: FinancialHealthService;

  static getInstance(): FinancialHealthService {
    if (!this.instance) {
      this.instance = new FinancialHealthService();
    }
    return this.instance;
  }

  /**
   * Calcule le score de santé financière global
   */
  async calculateHealthScore(companyId: string): Promise<FinancialHealthScore | null> {
    try {
      // Récupérer les données financières
      const financialData = await this.getFinancialData(companyId);

      // Si aucune donnée n'est disponible, retourner null au lieu de valeurs mockées
      if (!financialData || this.isDataEmpty(financialData)) {
        console.log('No financial data available for company:', companyId);
        return null;
      }

      // Calculer chaque score individuellement
      const liquidityScore = this.calculateLiquidityScore(financialData);
      const profitabilityScore = this.calculateProfitabilityScore(financialData);
      const efficiencyScore = this.calculateEfficiencyScore(financialData);
      const growthScore = await this.calculateGrowthScore(companyId, financialData);
      const riskScore = this.calculateRiskScore(financialData);
      const sustainabilityScore = this.calculateSustainabilityScore(financialData);

      // Score global pondéré
      const overallScore = Math.round(
        liquidityScore * 0.20 +
        profitabilityScore * 0.25 +
        efficiencyScore * 0.20 +
        growthScore * 0.15 +
        riskScore * 0.10 +
        sustainabilityScore * 0.10
      );

      // Générer des recommandations basées sur les scores
      const recommendations = this.generateRecommendations({
        liquidity: liquidityScore,
        profitability: profitabilityScore,
        efficiency: efficiencyScore,
        growth: growthScore,
        risk: riskScore,
        sustainability: sustainabilityScore
      });

      // Identifier les alertes critiques
      const criticalAlerts = this.identifyCriticalAlerts({
        liquidity: liquidityScore,
        profitability: profitabilityScore,
        risk: riskScore
      }, financialData);

      return {
        overall_score: overallScore,
        liquidity_score: liquidityScore,
        profitability_score: profitabilityScore,
        efficiency_score: efficiencyScore,
        growth_score: growthScore,
        risk_score: riskScore,
        sustainability_score: sustainabilityScore,
        recommendations: recommendations as any,
        critical_alerts: criticalAlerts,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error calculating health score:', error);
      return null;
    }
  }

  /**
   * Vérifie si les données financières sont vides
   */
  private isDataEmpty(data: FinancialData): boolean {
    return data.revenue === 0 &&
           data.expenses === 0 &&
           data.assets === 0 &&
           data.liabilities === 0;
  }

  /**
   * Récupère les données financières depuis la base
   */
  private async getFinancialData(companyId: string): Promise<FinancialData | null> {
    try {
      // Période : 12 derniers mois
      const endDate = new Date();
      const startDate = subMonths(endDate, 12);

      // D'abord, récupérer les IDs des écritures dans la période
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0]);

      if (!journalEntries || journalEntries.length === 0) {
        return null;
      }

      const entryIds = journalEntries.map(e => e.id);

      // Récupérer les lignes d'écritures comptables avec les comptes
      const { data: entries, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          account:chart_of_accounts!journal_entry_lines_account_id_fkey(account_number)
        `)
        .in('journal_entry_id', entryIds);

      if (error) {
        console.error('Error fetching journal entries:', error);
        return null;
      }

      if (!entries || entries.length === 0) {
        return null;
      }

      // Calculer les métriques par classe de compte
      let revenue = 0;        // Classe 7
      let expenses = 0;       // Classe 6
      let assets = 0;         // Classe 2 (immobilisations)
      let currentAssets = 0;  // Classe 3, 4 (stocks, créances)
      let liabilities = 0;    // Classe 1 (capitaux permanents)
      let currentLiabilities = 0; // Classe 4 (dettes)
      let cashBalance = 0;    // Classe 5 (comptes financiers)

      entries.forEach(entry => {
        if (!(entry as any).account?.account_number) return;

        const accountClass = (entry as any).account.account_number.charAt(0);
        const debit = Number((entry as any).debit_amount) || 0;
        const credit = Number((entry as any).credit_amount) || 0;
        const netAmount = debit - credit;

        switch (accountClass) {
          case '7': // Produits
            revenue += credit - debit;
            break;
          case '6': // Charges
            expenses += debit - credit;
            break;
          case '2': // Immobilisations
            assets += netAmount;
            break;
          case '3': // Stocks
          case '4': // Tiers (créances + dettes)
            if (netAmount > 0) {
              currentAssets += netAmount;
            } else {
              currentLiabilities += Math.abs(netAmount);
            }
            break;
          case '1': // Capitaux
            liabilities += Math.abs(netAmount);
            break;
          case '5': // Financier
            cashBalance += netAmount;
            break;
        }
      });

      return {
        revenue: Math.abs(revenue),
        expenses: Math.abs(expenses),
        assets: Math.abs(assets),
        liabilities: Math.abs(liabilities),
        currentAssets: Math.abs(currentAssets),
        currentLiabilities: Math.abs(currentLiabilities),
        cashBalance
      };

    } catch (error) {
      console.error('Error in getFinancialData:', error);
      return null;
    }
  }

  /**
   * Score de liquidité (capacité à couvrir les dettes court terme)
   * Ratio de liquidité = Actifs courants / Passifs courants
   */
  private calculateLiquidityScore(data: FinancialData): number {
    if (data.currentLiabilities === 0) {
      return data.currentAssets > 0 ? 100 : 50;
    }

    const liquidityRatio = (data.currentAssets + data.cashBalance) / data.currentLiabilities;

    // Ratio idéal : > 2.0 (100%), Acceptable: 1.0-2.0, Critique: < 1.0
    if (liquidityRatio >= 2.0) return 100;
    if (liquidityRatio >= 1.5) return 85;
    if (liquidityRatio >= 1.0) return 65;
    if (liquidityRatio >= 0.5) return 40;
    return 20;
  }

  /**
   * Score de rentabilité (capacité à générer des bénéfices)
   * Marge nette = (Revenus - Dépenses) / Revenus
   */
  private calculateProfitabilityScore(data: FinancialData): number {
    if (data.revenue === 0) {
      return 0; // Pas de revenus = pas de rentabilité
    }

    const netIncome = data.revenue - data.expenses;
    const profitMargin = (netIncome / data.revenue) * 100;

    // Marge > 20% = Excellent, 10-20% = Bon, 0-10% = Acceptable, < 0% = Perte
    if (profitMargin >= 20) return 100;
    if (profitMargin >= 15) return 85;
    if (profitMargin >= 10) return 70;
    if (profitMargin >= 5) return 55;
    if (profitMargin >= 0) return 40;
    if (profitMargin >= -10) return 25;
    return 10;
  }

  /**
   * Score d'efficacité (gestion des ressources)
   * ROA = Résultat net / Total actifs
   */
  private calculateEfficiencyScore(data: FinancialData): number {
    const totalAssets = data.assets + data.currentAssets + data.cashBalance;

    if (totalAssets === 0) {
      return 50; // Score neutre si pas d'actifs
    }

    const netIncome = data.revenue - data.expenses;
    const roa = (netIncome / totalAssets) * 100;

    // ROA > 10% = Excellent, 5-10% = Bon, 0-5% = Moyen, < 0% = Faible
    if (roa >= 10) return 100;
    if (roa >= 7) return 80;
    if (roa >= 5) return 65;
    if (roa >= 2) return 50;
    if (roa >= 0) return 35;
    return 20;
  }

  /**
   * Score de croissance (évolution du CA sur 3 mois)
   */
  private async calculateGrowthScore(companyId: string, currentData: FinancialData): Promise<number> {
    try {
      // Comparer avec il y a 3 mois
      const endDate3MonthsAgo = subMonths(new Date(), 3);
      const startDate3MonthsAgo = subMonths(endDate3MonthsAgo, 12);

      // D'abord, récupérer les IDs des écritures de la période précédente
      const { data: oldJournalEntries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
        .gte('entry_date', startDate3MonthsAgo.toISOString().split('T')[0])
        .lte('entry_date', endDate3MonthsAgo.toISOString().split('T')[0]);

      if (!oldJournalEntries || oldJournalEntries.length === 0) {
        return 50; // Pas assez d'historique
      }

      const oldEntryIds = oldJournalEntries.map(e => e.id);

      const { data: oldEntries } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          account:chart_of_accounts!journal_entry_lines_account_id_fkey(account_number)
        `)
        .in('journal_entry_id', oldEntryIds);

      let oldRevenue = 0;
      (oldEntries || []).forEach(entry => {
        if ((entry as any).account?.account_number?.charAt(0) === '7') {
          const credit = Number((entry as any).credit_amount) || 0;
          const debit = Number((entry as any).debit_amount) || 0;
          oldRevenue += credit - debit;
        }
      });

      if (oldRevenue === 0) {
        return currentData.revenue > 0 ? 100 : 0;
      }

      const growthRate = ((currentData.revenue - Math.abs(oldRevenue)) / Math.abs(oldRevenue)) * 100;

      // Croissance > 20% = Excellent, 10-20% = Bon, 0-10% = Stable, < 0% = Déclin
      if (growthRate >= 20) return 100;
      if (growthRate >= 15) return 85;
      if (growthRate >= 10) return 70;
      if (growthRate >= 5) return 60;
      if (growthRate >= 0) return 50;
      if (growthRate >= -5) return 40;
      if (growthRate >= -10) return 25;
      return 10;

    } catch (error) {
      console.error('Error calculating growth score:', error);
      return 50;
    }
  }

  /**
   * Score de risque (endettement et solvabilité)
   * Ratio d'endettement = Dettes / Actifs
   */
  private calculateRiskScore(data: FinancialData): number {
    const totalAssets = data.assets + data.currentAssets + data.cashBalance;

    if (totalAssets === 0) {
      return data.liabilities > 0 ? 0 : 100;
    }

    const debtRatio = (data.liabilities + data.currentLiabilities) / totalAssets;

    // Moins d'endettement = Moins de risque = Score élevé
    // Ratio < 0.3 = Excellent, 0.3-0.5 = Bon, 0.5-0.7 = Acceptable, > 0.7 = Risqué
    if (debtRatio <= 0.3) return 100;
    if (debtRatio <= 0.4) return 80;
    if (debtRatio <= 0.5) return 65;
    if (debtRatio <= 0.7) return 45;
    if (debtRatio <= 0.9) return 25;
    return 10;
  }

  /**
   * Score de durabilité (réserves de trésorerie)
   * Runway = Trésorerie / (Dépenses mensuelles moyennes)
   */
  private calculateSustainabilityScore(data: FinancialData): number {
    const monthlyExpenses = data.expenses / 12;

    if (monthlyExpenses === 0) {
      return data.cashBalance > 0 ? 100 : 50;
    }

    const runway = data.cashBalance / monthlyExpenses;

    // Runway > 12 mois = Excellent, 6-12 = Bon, 3-6 = Acceptable, < 3 = Critique
    if (runway >= 12) return 100;
    if (runway >= 9) return 85;
    if (runway >= 6) return 70;
    if (runway >= 3) return 50;
    if (runway >= 1) return 30;
    return 15;
  }

  /**
   * Génère des recommandations basées sur les scores
   */
  private generateRecommendations(scores: {
    liquidity: number;
    profitability: number;
    efficiency: number;
    growth: number;
    risk: number;
    sustainability: number;
  }): Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high'; impact: string }> {
    const recommendations = [];

    if (scores.liquidity < 50) {
      recommendations.push({
        title: 'Améliorer la liquidité',
        description: 'Vos actifs courants ne couvrent pas suffisamment vos dettes à court terme. Envisagez de réduire les dépenses ou d\'augmenter les liquidités.',
        priority: 'high' as const,
        impact: 'Critique pour la solvabilité à court terme'
      });
    }

    if (scores.profitability < 50) {
      recommendations.push({
        title: 'Optimiser la rentabilité',
        description: 'Votre marge bénéficiaire est faible. Analysez vos coûts et cherchez des opportunités d\'augmenter vos revenus.',
        priority: 'high' as const,
        impact: 'Impact direct sur la viabilité long terme'
      });
    }

    if (scores.growth < 40) {
      recommendations.push({
        title: 'Relancer la croissance',
        description: 'Votre chiffre d\'affaires stagne ou décline. Explorez de nouveaux marchés ou produits.',
        priority: 'medium' as const,
        impact: 'Nécessaire pour la compétitivité'
      });
    }

    if (scores.sustainability < 50) {
      recommendations.push({
        title: 'Renforcer les réserves de trésorerie',
        description: 'Vos réserves de trésorerie sont limitées. Planifiez une stratégie de préservation du cash.',
        priority: 'high' as const,
        impact: 'Essentiel pour la résilience'
      });
    }

    return recommendations;
  }

  /**
   * Identifie les alertes critiques
   */
  private identifyCriticalAlerts(scores: {
    liquidity: number;
    profitability: number;
    risk: number;
  }, data: FinancialData): string[] {
    const alerts = [];

    if (scores.liquidity < 30) {
      alerts.push('⚠️ Risque de liquidité critique - Actifs courants insuffisants');
    }

    if (scores.profitability < 20) {
      alerts.push('⚠️ Pertes importantes détectées - Révision du modèle économique nécessaire');
    }

    if (scores.risk < 30) {
      alerts.push('⚠️ Endettement élevé - Risque de solvabilité');
    }

    if (data.cashBalance < 0) {
      alerts.push('⚠️ Trésorerie négative - Action immédiate requise');
    }

    return alerts;
  }
}

export const financialHealthService = FinancialHealthService.getInstance();
