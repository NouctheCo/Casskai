/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';
import type { DashboardMetric, DashboardChart } from '@/types/enterprise-dashboard.types';

export interface RealKPIData {
  revenue_ytd: number;
  revenue_growth: number;
  profit_margin: number;
  cash_runway_days: number;
  total_invoices: number;
  total_purchases: number;
  pending_invoices: number;
  cash_balance: number;
  monthly_revenue: { month: string; amount: number }[];
  top_clients: { name: string; amount: number }[];
  expense_breakdown: { category: string; amount: number }[];
}

/**
 * Service de calcul des KPIs réels depuis la base de données
 */
export class RealDashboardKpiService {
  /**
   * Calcule tous les KPIs réels pour le dashboard
   */
  async calculateRealKPIs(companyId: string, fiscalYear?: number): Promise<RealKPIData> {
    const year = fiscalYear || new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    // Calculer en parallèle pour optimiser les performances
    const [
      revenueData,
      previousRevenueData,
      purchasesData,
      invoicesCount,
      pendingInvoicesData,
      cashData,
      monthlyRevenue,
      topClients,
      expenseBreakdown,
    ] = await Promise.all([
      this.calculateRevenue(companyId, startOfYear, endOfYear),
      this.calculateRevenue(companyId, `${year - 1}-01-01`, `${year - 1}-12-31`),
      this.calculatePurchases(companyId, startOfYear, endOfYear),
      this.countInvoices(companyId, startOfYear, endOfYear),
      this.countPendingInvoices(companyId),
      this.calculateCashBalance(companyId),
      this.calculateMonthlyRevenue(companyId, year),
      this.getTopClients(companyId, startOfYear, endOfYear),
      this.getExpenseBreakdown(companyId, startOfYear, endOfYear),
    ]);

    // Calculer le taux de croissance
    const revenue_growth = previousRevenueData > 0
      ? ((revenueData - previousRevenueData) / previousRevenueData) * 100
      : 0;

    // Calculer la marge bénéficiaire
    const profit_margin = revenueData > 0
      ? ((revenueData - purchasesData) / revenueData) * 100
      : 0;

    // Calculer le runway (en jours)
    const monthlyBurn = purchasesData / 12;
    const dailyBurn = monthlyBurn / 30;
    const cash_runway_days = dailyBurn > 0 ? Math.floor(cashData / dailyBurn) : 999;

    return {
      revenue_ytd: revenueData,
      revenue_growth,
      profit_margin,
      cash_runway_days,
      total_invoices: invoicesCount,
      total_purchases: purchasesData,
      pending_invoices: pendingInvoicesData,
      cash_balance: cashData,
      monthly_revenue: monthlyRevenue,
      top_clients: topClients,
      expense_breakdown: expenseBreakdown,
    };
  }

  /**
   * Calcule le chiffre d'affaires sur une période
   * SOURCE: Écritures comptables (comptes de classe 7) via chart_of_accounts.current_balance
   */
  private async calculateRevenue(
    companyId: string,
    _startDate: string,
    _endDate: string
  ): Promise<number> {
    try {
      // NOUVELLE APPROCHE: Lire depuis les écritures comptables (source de vérité)
      // Les comptes de classe 7 = Produits (CA)
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('current_balance, account_number')
        .eq('company_id', companyId)
        .eq('account_class', 7)
        .eq('is_active', true);

      if (error) {
        console.error('Error calculating revenue from accounting:', error);
        return 0;
      }

      // Le current_balance est automatiquement mis à jour par le trigger
      // Pour les comptes de produits (classe 7), le solde = Crédit - Débit
      const totalRevenue = data?.reduce((sum, account) => {
        return sum + Math.abs(account.current_balance || 0);
      }, 0) || 0;

      console.log(`[realDashboardKpiService] Revenue calculated from ${data?.length || 0} revenue accounts: ${totalRevenue} €`);

      return totalRevenue;
    } catch (error) {
      console.error('Exception calculating revenue:', error);
      return 0;
    }
  }

  /**
   * Calcule le total des achats/charges sur une période
   * SOURCE: Écritures comptables (comptes de classe 6) via chart_of_accounts.current_balance
   */
  private async calculatePurchases(
    companyId: string,
    _startDate: string,
    _endDate: string
  ): Promise<number> {
    try {
      // NOUVELLE APPROCHE: Lire depuis les écritures comptables (source de vérité)
      // Les comptes de classe 6 = Charges (achats, dépenses)
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('current_balance, account_number')
        .eq('company_id', companyId)
        .eq('account_class', 6)
        .eq('is_active', true);

      if (error) {
        console.error('Error calculating expenses from accounting:', error);
        return 0;
      }

      // Le current_balance est automatiquement mis à jour par le trigger
      // Pour les comptes de charges (classe 6), le solde = Débit - Crédit
      const totalExpenses = data?.reduce((sum, account) => {
        return sum + Math.abs(account.current_balance || 0);
      }, 0) || 0;

      console.log(`[realDashboardKpiService] Expenses calculated from ${data?.length || 0} expense accounts: ${totalExpenses} €`);

      return totalExpenses;
    } catch (error) {
      console.error('Exception calculating expenses:', error);
      return 0;
    }
  }

  /**
   * Compte le nombre de factures sur une période
   */
  private async countInvoices(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (error) {
        console.error('Error counting invoices:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Exception counting invoices:', error);
      return 0;
    }
  }

  /**
   * Compte le nombre de factures en attente de paiement
   */
  private async countPendingInvoices(companyId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['draft', 'sent', 'overdue']);

      if (error) {
        console.error('Error counting pending invoices:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Exception counting pending invoices:', error);
      return 0;
    }
  }

  /**
   * Calcule le solde de trésorerie actuel
   * SOURCE: Écritures comptables (comptes de classe 5) via chart_of_accounts.current_balance
   */
  private async calculateCashBalance(companyId: string): Promise<number> {
    try {
      // NOUVELLE APPROCHE: Lire depuis les écritures comptables (source de vérité)
      // Les comptes de classe 5 = Trésorerie (banques, caisses)
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('current_balance, account_number, account_name')
        .eq('company_id', companyId)
        .eq('account_class', 5)
        .eq('is_active', true);

      if (error) {
        console.error('Error calculating cash balance from accounting:', error);
        return 0;
      }

      // Le current_balance est automatiquement mis à jour par le trigger
      // Pour les comptes de trésorerie (classe 5), le solde = Débit - Crédit
      const totalCash = data?.reduce((sum, account) => {
        return sum + (account.current_balance || 0);
      }, 0) || 0;

      console.log(`[realDashboardKpiService] Cash balance calculated from ${data?.length || 0} cash accounts: ${totalCash} €`);

      return totalCash;
    } catch (error) {
      console.error('Exception calculating cash balance:', error);
      return 0;
    }
  }

  /**
   * Calcule le CA mensuel pour les graphiques
   * SOURCE: Écritures comptables (comptes de classe 7) agrégées par mois
   */
  private async calculateMonthlyRevenue(
    companyId: string,
    year: number
  ): Promise<{ month: string; amount: number }[]> {
    try {
      const monthlyData: { month: string; amount: number }[] = [];

      for (let month = 1; month <= 12; month++) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Lire depuis les écritures comptables pour ce mois
        const { data, error } = await supabase
          .from('journal_entry_lines')
          .select(`
            credit_amount,
            debit_amount,
            account_number,
            journal_entries!inner (
              entry_date,
              status,
              company_id
            ),
            chart_of_accounts!inner (
              account_class
            )
          `)
          .eq('journal_entries.company_id', companyId)
          .gte('journal_entries.entry_date', startDate)
          .lte('journal_entries.entry_date', endDate)
          .in('journal_entries.status', ['posted', 'imported'])
          .eq('chart_of_accounts.account_class', 7);

        if (error) {
          console.error(`Error calculating revenue for month ${month}:`, error);
          monthlyData.push({ month: month.toString(), amount: 0 });
        } else {
          // Pour les comptes de classe 7 (produits), CA = Crédit - Débit
          const amount = data?.reduce((sum, line) => {
            return sum + ((line.credit_amount || 0) - (line.debit_amount || 0));
          }, 0) || 0;

          monthlyData.push({ month: month.toString(), amount: Math.abs(amount) });
        }
      }

      return monthlyData;
    } catch (error) {
      console.error('Exception calculating monthly revenue:', error);
      return Array.from({ length: 12 }, (_, i) => ({ month: (i + 1).toString(), amount: 0 }));
    }
  }

  /**
   * Récupère les top clients par CA
   */
  private async getTopClients(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ name: string; amount: number }[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          total_incl_tax,
          third_parties!inner(name)
        `)
        .eq('company_id', companyId)
        .in('status', ['paid', 'partially_paid'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (error) {
        console.error('Error fetching top clients:', error);
        return [];
      }

      // Agréger par client
      const clientMap = new Map<string, number>();
      data?.forEach((invoice: any) => {
        const clientName = invoice.third_parties?.name || 'Client inconnu';
        const amount = invoice.total_incl_tax || 0;
        clientMap.set(clientName, (clientMap.get(clientName) || 0) + amount);
      });

      // Convertir en tableau et trier
      return Array.from(clientMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 clients
    } catch (error) {
      console.error('Exception fetching top clients:', error);
      return [];
    }
  }

  /**
   * Récupère la répartition des dépenses par catégorie
   */
  private async getExpenseBreakdown(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ category: string; amount: number }[]> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('total_amount, description')
        .eq('company_id', companyId)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

      if (error) {
        console.error('Error fetching expense breakdown:', error);
        return [];
      }

      // Agréger par catégorie (utiliser description comme proxy pour la catégorie)
      const categoryMap = new Map<string, number>();
      data?.forEach((purchase: any) => {
        const category = purchase.description || 'Non catégorisé';
        const amount = purchase.total_amount || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });

      // Convertir en tableau et trier
      return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Exception fetching expense breakdown:', error);
      return [];
    }
  }

  /**
   * Génère les métriques pour le dashboard
   */
  generateMetrics(kpiData: RealKPIData): DashboardMetric[] {
    return [
      {
        id: 'revenue_ytd',
        label: 'Chiffre d\'affaires YTD',
        value: kpiData.revenue_ytd,
        unit: 'currency',
        trend: kpiData.revenue_growth > 0 ? 'up' : kpiData.revenue_growth < 0 ? 'down' : 'stable',
        change: Math.abs(kpiData.revenue_growth),
        period: 'vs année précédente',
        importance: 'high',
      },
      {
        id: 'profit_margin',
        label: 'Marge bénéficiaire',
        value: kpiData.profit_margin,
        unit: 'percentage',
        trend: kpiData.profit_margin > 15 ? 'up' : kpiData.profit_margin < 5 ? 'down' : 'stable',
        importance: 'high',
      },
      {
        id: 'cash_runway',
        label: 'Runway trésorerie',
        value: kpiData.cash_runway_days,
        unit: 'days',
        trend: kpiData.cash_runway_days > 90 ? 'up' : kpiData.cash_runway_days < 30 ? 'down' : 'stable',
        importance: 'high',
      },
      {
        id: 'total_invoices',
        label: 'Factures émises',
        value: kpiData.total_invoices,
        unit: 'number',
        importance: 'medium',
      },
      {
        id: 'pending_invoices',
        label: 'Factures en attente',
        value: kpiData.pending_invoices,
        unit: 'number',
        trend: kpiData.pending_invoices > 10 ? 'down' : 'stable',
        importance: 'medium',
      },
      {
        id: 'cash_balance',
        label: 'Solde de trésorerie',
        value: kpiData.cash_balance,
        unit: 'currency',
        importance: 'high',
      },
    ];
  }

  /**
   * Génère les graphiques pour le dashboard
   */
  generateCharts(kpiData: RealKPIData): DashboardChart[] {
    return [
      {
        id: 'monthly_revenue',
        type: 'line',
        title: 'Évolution du CA mensuel',
        data: kpiData.monthly_revenue.map((item) => ({
          label: `Mois ${item.month}`,
          value: item.amount,
        })),
        color: '#3b82f6',
      },
      {
        id: 'top_clients',
        type: 'bar',
        title: 'Top 5 clients',
        data: kpiData.top_clients.map((client) => ({
          label: client.name,
          value: client.amount,
        })),
        color: '#10b981',
      },
      {
        id: 'expense_breakdown',
        type: 'pie',
        title: 'Répartition des dépenses',
        data: kpiData.expense_breakdown.map((expense) => ({
          label: expense.category,
          value: expense.amount,
        })),
      },
    ];
  }
}

// Export singleton instance
export const realDashboardKpiService = new RealDashboardKpiService();
