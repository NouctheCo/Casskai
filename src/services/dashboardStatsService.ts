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
 * Service pour calculer les statistiques du dashboard à partir des données réelles
 */
import { supabase } from '@/lib/supabase';
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { logger } from '@/lib/logger';
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
    // ✅ Inclure 'posted', 'validated' ET 'imported' (pour import FEC)
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
          entry_date,
          status
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .in('journal_entries.status', ['posted', 'validated', 'imported'])
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);
    if (error) {
      logger.error('DashboardStats', 'Error fetching journal entry lines:', error);
      return { revenue: 0, expenses: 0, netIncome: 0, netMargin: 0 };
    }
    let revenue = 0;
    let expenses = 0;
    lines?.forEach(line => {
      const accountNumber = (line as any).chart_of_accounts?.account_number;
      if (!accountNumber) return;
      const accountClass = accountNumber.charAt(0);
      const debit = (line as any).debit_amount || 0;
      const credit = (line as any).credit_amount || 0;
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
  /**
   * Récupère les données de revenus mensuels sur les 6 derniers mois
   */
  async getMonthlyRevenueData(companyId: string): Promise<Array<{ month: string; montant: number }>> {
    const monthlyData: Array<{ month: string; montant: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = startOfMonth(monthDate).toISOString().split('T')[0];
      const endDate = endOfMonth(monthDate).toISOString().split('T')[0];
      const data = await this.getFinancialData(companyId, startDate, endDate);
      // Format month name
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      monthlyData.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        montant: data.revenue
      });
    }
    return monthlyData;
  }
  /**
   * Récupère les dépenses par catégorie (classes comptables)
   */
  async getExpensesByCategory(companyId: string): Promise<Array<{ name: string; value: number; color: string }>> {
    const startDate = startOfYear(new Date()).toISOString().split('T')[0];
    const endDate = endOfYear(new Date()).toISOString().split('T')[0];
    const { data: lines, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        chart_of_accounts!inner (
          account_number,
          name
        ),
        journal_entries!inner (
          company_id,
          entry_date,
          status
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .in('journal_entries.status', ['posted', 'validated', 'imported'])
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);
    if (error || !lines) {
      logger.error('DashboardStats', 'Error fetching expenses by category:', error);
      return [];
    }
    const categoryMap = new Map<string, number>();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    lines.forEach(line => {
      const accountNumber = (line as any).chart_of_accounts?.account_number;
      if (!accountNumber) return;
      const accountClass = accountNumber.charAt(0);
      const debit = (line as any).debit_amount || 0;
      const credit = (line as any).credit_amount || 0;
      // Classe 6 = Charges (expenses)
      if (accountClass === '6') {
        const subClass = accountNumber.substring(0, 2);
        const categoryName = this.getCategoryName(subClass);
        const amount = debit - credit;
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
      }
    });
    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Math.abs(value),
        color: colors[index % colors.length]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }
  /**
   * Récupère la comparaison mensuelle produits vs charges
   */
  async getMonthlyComparison(companyId: string): Promise<Array<{ month: string; produits: number; charges: number }>> {
    const monthlyData: Array<{ month: string; produits: number; charges: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = startOfMonth(monthDate).toISOString().split('T')[0];
      const endDate = endOfMonth(monthDate).toISOString().split('T')[0];
      const data = await this.getFinancialData(companyId, startDate, endDate);
      // Format month name
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      monthlyData.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        produits: data.revenue,
        charges: data.expenses
      });
    }
    return monthlyData;
  }
  /**
   * Récupère le nom de catégorie pour une sous-classe comptable
   */
  private getCategoryName(subClass: string): string {
    const categoryNames: Record<string, string> = {
      '60': 'Achats',
      '61': 'Services extérieurs',
      '62': 'Autres services',
      '63': 'Impôts et taxes',
      '64': 'Charges de personnel',
      '65': 'Autres charges',
      '66': 'Charges financières',
      '67': 'Charges exceptionnelles',
      '68': 'Dotations',
      '69': 'Participation'
    };
    return categoryNames[subClass] || 'Autres charges';
  }
}
export const dashboardStatsService = DashboardStatsService.getInstance();