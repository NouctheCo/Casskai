/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import type { DashboardMetric, DashboardChart } from '@/types/enterprise-dashboard.types';
import { kpiCacheService } from './kpiCacheService';
import AccountMappingService, { ACCOUNT_MAPPING, UniversalAccountType } from './accountMappingService';
import { AccountingStandard } from './accountingRulesService';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
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
   * Utilise le cache si disponible et valide
   */
  async calculateRealKPIs(companyId: string, fiscalYear?: number): Promise<RealKPIData> {
    // 🎯 NOUVEAU: Vérifier le cache en premier
    const cachedData = kpiCacheService.getCache(companyId);
    if (cachedData && kpiCacheService.isCacheValid(companyId)) {
      logger.debug('RealDashboardKpi', '[RealDashboardKpiService] Cache KPI utilisé pour', companyId);
      return cachedData;
    }
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
    const result = {
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
    // 🎯 NOUVEAU: Sauvegarder en cache
    kpiCacheService.setCache(companyId, result);
    return result;
  }
  /**
   * Calcule le chiffre d'affaires sur une période
   * SOURCE PRIMAIRE: Factures de vente (invoices)
   * Les écritures comptables sont utilisées en fallback
   */
  private async calculateRevenue(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      // Lire à la fois les factures de vente ET les comptes classe 7,
      // puis retourner la somme des deux sources. Cela garantit que
      // le KPI prend en compte à la fois les écritures métier
      // (invoices) et les écritures comptables (chart_of_accounts).
      const [invoicesResult, accountsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_incl_tax')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sale')
          .in('status', ['sent', 'paid', 'partially_paid'])
          .neq('status', 'cancelled')
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate),
        supabase
          .from('chart_of_accounts')
          .select('current_balance')
          .eq('company_id', companyId)
          .eq('account_class', 7)
          .eq('is_active', true),
      ]);

      const invoices = invoicesResult.data;
      const invoicesError = invoicesResult.error;
      const accounts = accountsResult.data;
      const accountsError = accountsResult.error;

      let totalFromInvoices = 0;
      if (!invoicesError && invoices && invoices.length > 0) {
        totalFromInvoices = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_incl_tax || 0), 0);
        logger.debug('RealDashboardKpi', `[calculateRevenue] From invoices: ${formatCurrency(totalFromInvoices)} (${invoices.length} factures)`);
      }

      // Try to identify sales accounts using account mapping rules per company
      let totalFromAccounts = 0;
      try {
        const standard = await AccountMappingService.detectAccountingStandard(companyId) as AccountingStandard;
        const mapping = ACCOUNT_MAPPING[standard];
        const salesPattern = mapping?.[UniversalAccountType.SALES];
        if (standard === AccountingStandard.PCG || standard === AccountingStandard.SYSCOHADA) {
          const prefix = (salesPattern || '70').replace(/%/g, '');
          const { data: salesAccounts, error: salesErr } = await supabase
            .from('chart_of_accounts')
            .select('current_balance')
            .eq('company_id', companyId)
            .ilike('account_number', `${prefix}%`)
            .eq('is_active', true);
          if (!salesErr && salesAccounts && salesAccounts.length > 0) {
            totalFromAccounts = salesAccounts.reduce((sum: number, a: any) => sum + Math.abs(a.current_balance || 0), 0);
            logger.debug('RealDashboardKpi', `[calculateRevenue] From accounts (by prefix ${prefix}): ${formatCurrency(totalFromAccounts)}`);
          }
        } else {
          // IFRS/US_GAAP: fallback to account_class = 7
          if (!accountsError && accounts && accounts.length > 0) {
            totalFromAccounts = accounts.reduce((sum: number, account: any) => sum + Math.abs(account.current_balance || 0), 0);
            logger.debug('RealDashboardKpi', `[calculateRevenue] From accounts (class 7 fallback): ${formatCurrency(totalFromAccounts)}`);
          }
        }
      } catch (err) {
        // If mapping fails, fallback to previous behavior
        if (!accountsError && accounts && accounts.length > 0) {
          totalFromAccounts = accounts.reduce((sum: number, account: any) => sum + Math.abs(account.current_balance || 0), 0);
          logger.debug('RealDashboardKpi', `[calculateRevenue] From accounts (fallback): ${formatCurrency(totalFromAccounts)}`);
        }
      }

      const totalRevenue = totalFromInvoices + totalFromAccounts;
      return totalRevenue;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception calculating revenue:', error);
      return 0;
    }
  }
  /**
   * Calcule le total des achats/charges sur une période
   * SOURCE PRIMAIRE: Factures d'achat ou table purchases
   */
  private async calculatePurchases(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      // Lire les sources de charges en parallèle:
      // - table `purchases` (si utilisée)
      // - factures d'achat `invoices` (invoice_type = 'purchase')
      // - comptes comptables classe 6 (chart_of_accounts)
      const [purchasesResult, invoicesResult, accountsResult] = await Promise.all([
        supabase
          .from('purchases')
          .select('total_amount')
          .eq('company_id', companyId)
          .gte('purchase_date', startDate)
          .lte('purchase_date', endDate),
        supabase
          .from('invoices')
          .select('total_incl_tax')
          .eq('company_id', companyId)
          .eq('invoice_type', 'purchase')
          .in('status', ['sent', 'paid', 'partially_paid'])
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate),
        supabase
          .from('chart_of_accounts')
          .select('current_balance')
          .eq('company_id', companyId)
          .eq('account_class', 6)
          .eq('is_active', true),
      ]);

      const purchases = purchasesResult.data;
      const purchasesErr = purchasesResult.error;
      const invoices = invoicesResult.data;
      const invoicesErr = invoicesResult.error;
      const accounts = accountsResult.data;
      const accountsErr = accountsResult.error;

      let totalFromPurchases = 0;
      if (!purchasesErr && purchases && purchases.length > 0) {
        totalFromPurchases = purchases.reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
        logger.debug('RealDashboardKpi', `[calculatePurchases] From purchases table: ${formatCurrency(totalFromPurchases)}`);
      }

      let totalFromInvoicePurchases = 0;
      if (!invoicesErr && invoices && invoices.length > 0) {
        totalFromInvoicePurchases = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_incl_tax || 0), 0);
        logger.debug('RealDashboardKpi', `[calculatePurchases] From invoices: ${formatCurrency(totalFromInvoicePurchases)}`);
      }

      // Identify purchase accounts using account mapping rules
      let totalFromAccounts = 0;
      try {
        const standard = await AccountMappingService.detectAccountingStandard(companyId) as AccountingStandard;
        const mapping = ACCOUNT_MAPPING[standard];
        const purchasesPattern = mapping?.[UniversalAccountType.PURCHASES];
        if (standard === AccountingStandard.PCG || standard === AccountingStandard.SYSCOHADA) {
          const prefix = (purchasesPattern || '60').replace(/%/g, '');
          const { data: purchaseAccounts, error: purchaseAccErr } = await supabase
            .from('chart_of_accounts')
            .select('current_balance')
            .eq('company_id', companyId)
            .ilike('account_number', `${prefix}%`)
            .eq('is_active', true);
          if (!purchaseAccErr && purchaseAccounts && purchaseAccounts.length > 0) {
            totalFromAccounts = purchaseAccounts.reduce((sum: number, a: any) => sum + Math.abs(a.current_balance || 0), 0);
            logger.debug('RealDashboardKpi', `[calculatePurchases] From accounts (by prefix ${prefix}): ${formatCurrency(totalFromAccounts)}`);
          }
        } else {
          // IFRS/US_GAAP: fallback to account_class = 6
          if (!accountsErr && accounts && accounts.length > 0) {
            totalFromAccounts = accounts.reduce((sum: number, account: any) => sum + Math.abs(account.current_balance || 0), 0);
            logger.debug('RealDashboardKpi', `[calculatePurchases] From accounts (class 6 fallback): ${formatCurrency(totalFromAccounts)}`);
          }
        }
      } catch (err) {
        if (!accountsErr && accounts && accounts.length > 0) {
          totalFromAccounts = accounts.reduce((sum: number, account: any) => sum + Math.abs(account.current_balance || 0), 0);
          logger.debug('RealDashboardKpi', `[calculatePurchases] From accounts (fallback): ${formatCurrency(totalFromAccounts)}`);
        }
      }

      return totalFromPurchases + totalFromInvoicePurchases + totalFromAccounts;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception calculating purchases:', error);
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
        logger.error('RealDashboardKpi', 'Error counting invoices:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception counting invoices:', error);
      return 0;
    }
  }
  /**
   * Compte le nombre de factures en attente de paiement
   */
  private async countPendingInvoices(companyId: string): Promise<number> {
    try {
      const { count, error} = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale') // ✅ Seulement les factures de vente
        .in('status', ['draft', 'sent', 'overdue'])
        .neq('status', 'cancelled'); // ✅ Exclure les factures annulées
      if (error) {
        logger.error('RealDashboardKpi', 'Error counting pending invoices:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception counting pending invoices:', error);
      return 0;
    }
  }
  /**
   * Calcule le solde de trésorerie actuel
   * SOURCE: Comptes bancaires
   */
  private async calculateCashBalance(companyId: string): Promise<number> {
    try {
      // Lire depuis les comptes bancaires
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (!bankError && bankAccounts && bankAccounts.length > 0) {
        const totalCash = bankAccounts.reduce((sum, account) =>
          sum + Number(account.current_balance || 0), 0);
        logger.debug('RealDashboardKpi', `[calculateCashBalance] From bank_accounts: ${formatCurrency(totalCash)}`);
        return totalCash;
      }

      // Fallback: Comptes classe 5 (trésorerie comptable)
      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('company_id', companyId)
        .eq('account_class', 5)
        .eq('is_active', true);

      if (!error && accounts) {
        return accounts.reduce((sum, account) =>
          sum + Math.abs(account.current_balance || 0), 0);
      }

      return 0;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception calculating cash balance:', error);
      return 0;
    }
  }
  /**
   * Calcule le CA mensuel pour le graphique
   */
  private async calculateMonthlyRevenue(
    companyId: string,
    year: number
  ): Promise<{ month: string; amount: number }[]> {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('total_incl_tax, invoice_date')
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale')
        .in('status', ['sent', 'paid', 'partially_paid'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (error || !invoices) {
        logger.error('RealDashboardKpi', 'Error fetching monthly revenue:', error);
        // Retourner les 12 mois à 0
        return Array.from({ length: 12 }, (_, i) => ({
          month: String(i + 1),
          amount: 0
        }));
      }

      // Initialiser tous les mois à 0
      const monthlyData = new Map<number, number>();
      for (let i = 1; i <= 12; i++) {
        monthlyData.set(i, 0);
      }

      // Agréger par mois
      invoices.forEach((invoice) => {
        const date = new Date(invoice.invoice_date);
        const month = date.getMonth() + 1;
        const amount = Number(invoice.total_incl_tax || 0);
        monthlyData.set(month, (monthlyData.get(month) || 0) + amount);
      });

      // Convertir en tableau
      return Array.from(monthlyData.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([month, amount]) => ({
          month: String(month),
          amount
        }));
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception calculating monthly revenue:', error);
      return Array.from({ length: 12 }, (_, i) => ({
        month: String(i + 1),
        amount: 0
      }));
    }
  }
  /**
   * Récupère les top clients par CA
   * ✅ Utilise la table customers via la FK customer_id au lieu de la VIEW third_parties
   */
  private async getTopClients(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ name: string; amount: number }[]> {
    try {
      // ✅ Utiliser la table customers au lieu de la VIEW third_parties
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          total_incl_tax,
          customer_id,
          customers!inner(id, name)
        `)
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale') // ✅ Seulement les factures de vente
        .in('status', ['sent', 'paid', 'partially_paid']) // ✅ Inclure aussi 'sent'
        .neq('status', 'cancelled') // ✅ Exclure les factures annulées
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);
      if (error) {
        logger.error('RealDashboardKpi', 'Error fetching top clients:', error);
        return [];
      }
      // Agréger par client
      const clientMap = new Map<string, number>();
      data?.forEach((invoice: any) => {
        const clientName = invoice.customers?.name || 'Client inconnu';
        const amount = invoice.total_incl_tax || 0;
        clientMap.set(clientName, (clientMap.get(clientName) || 0) + amount);
      });
      // Convertir en tableau et trier
      return Array.from(clientMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 clients
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception fetching top clients:', error);
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
      // Try purchases table first
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('total_amount, description')
        .eq('company_id', companyId)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

      if (!purchasesError && purchasesData && purchasesData.length > 0) {
        // Agréger par catégorie (utiliser description comme proxy pour la catégorie)
        const categoryMap = new Map<string, number>();
        purchasesData.forEach((purchase: any) => {
          const category = purchase.description || 'Non catégorisé';
          const amount = purchase.total_amount || 0;
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });
        // Convertir en tableau et trier
        return Array.from(categoryMap.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5); // Top 5 categories
      }

      // Fallback: Use invoices with invoice_type='purchase'
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_incl_tax, description, supplier_id')
        .eq('company_id', companyId)
        .eq('invoice_type', 'purchase')
        .in('status', ['sent', 'paid', 'partially_paid'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (invoicesError || !invoicesData) {
        logger.error('RealDashboardKpi', 'Error fetching expense breakdown:', invoicesError);
        return [];
      }

      // Récupérer les fournisseurs référencés (si présents) puis agréger
      const supplierIds = Array.from(new Set((invoicesData as any[]).map(i => i.supplier_id).filter(Boolean)));
      const suppliersMap: Map<string, string> = new Map();
      if (supplierIds.length > 0) {
        const { data: suppliersRows } = await supabase
          .from('suppliers')
          .select('id, name')
          .in('id', supplierIds);
        (suppliersRows || []).forEach((s: any) => suppliersMap.set(s.id, s.name));
      }

      const categoryMap = new Map<string, number>();
      (invoicesData as any[]).forEach((invoice: any) => {
        const category = (invoice.supplier_id && suppliersMap.get(invoice.supplier_id)) || invoice.description || 'Non catégorisé';
        const amount = invoice.total_incl_tax || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });

      // Convertir en tableau et trier
      return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception fetching expense breakdown:', error);
      return [];
    }
  }
  /**
   * Génère les métriques pour le dashboard
   * @param kpiData Données KPI calculées
   * @param t Fonction de traduction i18next (optionnelle pour backward compatibility)
   */
  generateMetrics(kpiData: RealKPIData, t?: (key: string) => string): DashboardMetric[] {
    // Fonction par défaut si t n'est pas fourni (fallback en français)
    const translate = t || ((key: string) => {
      const fallbacks: Record<string, string> = {
        'dashboard.operational.metrics.revenue_ytd': 'Chiffre d\'affaires YTD',
        'dashboard.operational.metrics.profit_margin': 'Marge bénéficiaire',
        'dashboard.operational.metrics.cash_runway': 'Runway trésorerie',
        'dashboard.operational.metrics.total_invoices': 'Factures émises',
        'dashboard.operational.metrics.pending_invoices': 'Factures en attente',
        'dashboard.operational.metrics.cash_balance': 'Solde de trésorerie',
        'dashboard.operational.periods.vs_previous_year': 'vs année précédente',
      };
      return fallbacks[key] || key;
    });
    return [
      {
        id: 'revenue_ytd',
        label: translate('dashboard.operational.metrics.revenue_ytd'),
        value: kpiData.revenue_ytd,
        unit: 'currency',
        trend: kpiData.revenue_growth > 0 ? 'up' : kpiData.revenue_growth < 0 ? 'down' : 'stable',
        change: Math.abs(kpiData.revenue_growth),
        period: translate('dashboard.operational.periods.vs_previous_year'),
        importance: 'high',
      },
      {
        id: 'profit_margin',
        label: translate('dashboard.operational.metrics.profit_margin'),
        value: kpiData.profit_margin,
        unit: 'percentage',
        trend: kpiData.profit_margin > 15 ? 'up' : kpiData.profit_margin < 5 ? 'down' : 'stable',
        importance: 'high',
      },
      {
        id: 'cash_runway',
        label: translate('dashboard.operational.metrics.cash_runway'),
        value: kpiData.cash_runway_days,
        unit: 'days',
        trend: kpiData.cash_runway_days > 90 ? 'up' : kpiData.cash_runway_days < 30 ? 'down' : 'stable',
        importance: 'high',
      },
      {
        id: 'total_invoices',
        label: translate('dashboard.operational.metrics.total_invoices'),
        value: kpiData.total_invoices,
        unit: 'number',
        importance: 'medium',
      },
      {
        id: 'pending_invoices',
        label: translate('dashboard.operational.metrics.pending_invoices'),
        value: kpiData.pending_invoices,
        unit: 'number',
        trend: kpiData.pending_invoices > 10 ? 'down' : 'stable',
        importance: 'medium',
      },
      {
        id: 'cash_balance',
        label: translate('dashboard.operational.metrics.cash_balance'),
        value: kpiData.cash_balance,
        unit: 'currency',
        importance: 'high',
      },
    ];
  }
  /**
   * Génère les graphiques pour le dashboard
   * @param kpiData Données KPI calculées
   * @param t Fonction de traduction i18next (optionnelle pour backward compatibility)
   */
  generateCharts(kpiData: RealKPIData, t?: (key: string) => string): DashboardChart[] {
    // Fonction par défaut si t n'est pas fourni (fallback en français)
    const translate = t || ((key: string) => {
      const fallbacks: Record<string, string> = {
        'dashboard.operational.charts.monthly_revenue': 'Évolution du CA mensuel',
        'dashboard.operational.charts.top_clients': 'Top 5 clients',
        'dashboard.operational.charts.expense_breakdown': 'Répartition des dépenses',
        'dashboard.operational.periods.month': 'Mois',
      };
      return fallbacks[key] || key;
    });

    // Helper to get month names in French
    const getMonthName = (monthNumber: string | number): string => {
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const index = typeof monthNumber === 'string' ? parseInt(monthNumber) - 1 : monthNumber - 1;
      return monthNames[index] || `Mois ${monthNumber}`;
    };

    return [
      {
        id: 'monthly_revenue',
        type: 'line',
        title: translate('dashboard.operational.charts.monthly_revenue'),
        data: kpiData.monthly_revenue.map((item) => ({
          label: getMonthName(item.month),
          value: item.amount,
        })),
        color: '#3b82f6',
      },
      {
        id: 'top_clients',
        type: 'bar',
        title: translate('dashboard.operational.charts.top_clients'),
        data: kpiData.top_clients.map((client) => ({
          label: client.name,
          value: client.amount,
        })),
        color: '#10b981',
      },
      {
        id: 'expense_breakdown',
        type: 'pie',
        title: translate('dashboard.operational.charts.expense_breakdown'),
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