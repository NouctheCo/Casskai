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
 * 
 * ✅ MIGRATED TO: acceptedAccountingService pour la cohérence globale
 */
import { supabase } from '@/lib/supabase';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, format } from 'date-fns';
import { logger } from '@/lib/logger';
import { acceptedAccountingService } from './acceptedAccountingService';
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
    const periodStart = startDate || format(startOfYear(new Date()), 'yyyy-MM-dd');
    const periodEnd = endDate || format(endOfYear(new Date()), 'yyyy-MM-dd');
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
      format(previousPeriodStart, 'yyyy-MM-dd'),
      format(previousPeriodEnd, 'yyyy-MM-dd')
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
   * 
   * ✅ REVENUE: Utilise acceptedAccountingService pour cohérence globa
   * ✅ EXPENSES: Utilise still journal_entry_lines (source unique, pas de variation)
   */
  private async getFinancialData(companyId: string, startDate: string, endDate: string) {
    // 1️⃣ REVENUE: Utiliser la source unique (acceptedAccountingService)
    let revenue = 0;
    try {
      const { revenue: calculatedRevenue, audit } = await acceptedAccountingService.calculateRevenueWithAudit(
        companyId,
        startDate,
        endDate,
        undefined,
        {
          vatTreatment: 'ttc', // Dashboard uses total (with VAT)
          includeBreakdown: false,
          includeReconciliation: false
        }
      );
      revenue = calculatedRevenue;

      // Async audit trail
      void supabase
        .from('accounting_calculations_audit')
        .insert({
          company_id: companyId,
          calculation_type: 'revenue',
          purpose: 'dashboard_stats',
          period_start: startDate,
          period_end: endDate,
          accounting_standard: audit.standard,
          vat_treatment: 'ttc',
          calculation_method: audit.calculation_method,
          journal_lines_count: audit.journal_lines_count,
          final_amount: revenue,
          confidence_score: audit.confidence_score,
          warnings: audit.warnings,
          calculated_at: new Date().toISOString()
        })
        .then(({ error: insertError }) => {
          if (insertError) {
            logger.warn('DashboardStats', 'Failed to record audit trail:', insertError);
          }
        });
    } catch (error) {
      logger.warn('DashboardStats', 'Failed to calculate revenue from acceptedAccountingService, using fallback');
      // Fallback: Direct journal_entry_lines query (safety net)
      // ✅ Statuts harmonisés : posted/validated uniquement (les écritures 'imported' doivent être validées)
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('credit_amount, debit_amount, chart_of_accounts!inner(account_number), journal_entries!inner(status)')
        .eq('journal_entries.company_id', companyId)
        .in('journal_entries.status', ['posted', 'validated'])
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate);

      if (lines) {
        revenue = Math.abs(
          lines
            .filter((line: any) => line.chart_of_accounts?.account_number?.charAt(0) === '7')
            .reduce((sum: number, line: any) => sum + ((line.credit_amount || 0) - (line.debit_amount || 0)), 0)
        );
      }
    }

    // 2️⃣ EXPENSES: Utiliser journal_entry_lines (source unique, pas d'ambiguïté)
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
      .in('journal_entries.status', ['posted', 'validated'])
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);

    if (error) {
      logger.error('DashboardStats', 'Error fetching journal entry lines for expenses:', error);
      return { revenue, expenses: 0, netIncome: revenue, netMargin: 0 };
    }

    let expenses = 0;
    lines?.forEach(line => {
      const accountNumber = (line as any).chart_of_accounts?.account_number;
      if (!accountNumber) return;
      const accountClass = accountNumber.charAt(0);
      const debit = (line as any).debit_amount || 0;
      const credit = (line as any).credit_amount || 0;

      // Classe 6 = Charges (expenses)
      if (accountClass === '6') {
        expenses += debit - credit;
      }
    });

    const netIncome = revenue - expenses;
    const netMargin = revenue > 0 ? Math.round(((netIncome / revenue) * 100) * 100) / 100 : 0;

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
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    return this.calculateStats(companyId, startDate, endDate);
  }
  /**
   * Calcule les statistiques pour l'année en cours
   */
  async getCurrentYearStats(companyId: string): Promise<DashboardStats> {
    const startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfYear(new Date()), 'yyyy-MM-dd');
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
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
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
    const startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfYear(new Date()), 'yyyy-MM-dd');
    const { data: lines, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        chart_of_accounts!inner (
          account_number,
          account_name
        ),
        journal_entries!inner (
          company_id,
          entry_date,
          status
        )
      `)
      .eq('journal_entries.company_id', companyId)
      .in('journal_entries.status', ['posted', 'validated'])
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