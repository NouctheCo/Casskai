/**
 * Service pour calculer les statistiques du dashboard à partir des données réelles
 */

import { supabase } from '@/lib/supabase';
import { startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardStats {
  revenue: number;
  expenses: number;
  netIncome: number;
  netMargin: number;
  revenueTrend: number;
  expensesTrend: number;
  netIncomeTrend: number;
  netMarginTrend: number;
}

class DashboardStatsService {
  private static instance: DashboardStatsService;

  static getInstance(): DashboardStatsService {
    if (!this.instance) {
      this.instance = new DashboardStatsService();
    }
    return this.instance;
  }

  /**
   * Calcule les statistiques financières pour une période donnée
   */
  async calculateStats(
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardStats> {
    const periodStart = startDate || startOfYear(new Date()).toISOString().split('T')[0];
    const periodEnd = endDate || endOfYear(new Date()).toISOString().split('T')[0];

    // Calcul de la période précédente pour les tendances (même durée)
    const previousPeriodEnd = new Date(periodStart);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    const previousPeriodStart = new Date(periodStart);
    const daysDiff = Math.floor((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);

    // Récupérer les écritures de la période actuelle
    const currentPeriodData = await this.getFinancialData(companyId, periodStart, periodEnd);

    // Récupérer les écritures de la période précédente
    const previousPeriodData = await this.getFinancialData(
      companyId,
      previousPeriodStart.toISOString().split('T')[0],
      previousPeriodEnd.toISOString().split('T')[0]
    );

    // Calculer les tendances
    const revenueTrend = this.calculateTrend(currentPeriodData.revenue, previousPeriodData.revenue);
    const expensesTrend = this.calculateTrend(currentPeriodData.expenses, previousPeriodData.expenses);
    const netIncomeTrend = this.calculateTrend(currentPeriodData.netIncome, previousPeriodData.netIncome);
    const netMarginTrend = this.calculateTrend(currentPeriodData.netMargin, previousPeriodData.netMargin);

    return {
      revenue: currentPeriodData.revenue,
      expenses: currentPeriodData.expenses,
      netIncome: currentPeriodData.netIncome,
      netMargin: currentPeriodData.netMargin,
      revenueTrend,
      expensesTrend,
      netIncomeTrend,
      netMarginTrend
    };
  }

  /**
   * Récupère les données financières d'une période
   */
  private async getFinancialData(companyId: string, startDate: string, endDate: string) {
    // Utiliser journal_entry_lines avec join à chart_of_accounts
    const { data: lines, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        chart_of_accounts!inner (
          account_number
        ),
        journal_entries!inner (
          company_id,
          entry_date
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);

    if (error) {
      console.error('Error fetching journal entry lines:', error);
      return { revenue: 0, expenses: 0, netIncome: 0, netMargin: 0 };
    }

    let revenue = 0;
    let expenses = 0;

    lines?.forEach(line => {
      const accountNumber = line.chart_of_accounts?.account_number;
      if (!accountNumber) return;
      
      const accountClass = accountNumber.charAt(0);
      const debit = line.debit_amount || 0;
      const credit = line.credit_amount || 0;

      // Classe 7 = Produits (revenues)
      if (accountClass === '7') {
        revenue += credit - debit;
      }

      // Classe 6 = Charges (expenses)
      if (accountClass === '6') {
        expenses += debit - credit;
      }
    });

    const netIncome = revenue - expenses;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return {
      revenue: Math.abs(revenue),
      expenses: Math.abs(expenses),
      netIncome,
      netMargin
    };
  }

  /**
   * Calcule le pourcentage de tendance entre deux valeurs
   */
  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Calcule les statistiques pour le mois en cours
   */
  async getCurrentMonthStats(companyId: string): Promise<DashboardStats> {
    const startDate = startOfMonth(new Date()).toISOString().split('T')[0];
    const endDate = endOfMonth(new Date()).toISOString().split('T')[0];
    return this.calculateStats(companyId, startDate, endDate);
  }

  /**
   * Calcule les statistiques pour l'année en cours
   */
  async getCurrentYearStats(companyId: string): Promise<DashboardStats> {
    const startDate = startOfYear(new Date()).toISOString().split('T')[0];
    const endDate = endOfYear(new Date()).toISOString().split('T')[0];
    return this.calculateStats(companyId, startDate, endDate);
  }
}

export const dashboardStatsService = DashboardStatsService.getInstance();
