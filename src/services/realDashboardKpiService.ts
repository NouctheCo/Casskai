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
import { acceptedAccountingService } from './acceptedAccountingService';
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
  revenue?: number;
  expenses?: number;
  financialMetrics?: {
    cashPosition: number;
    daysOutstanding: number;
    currentRatio: number;
  };
  profitabilityMetrics?: {
    grossMargin: number;
  };
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
   * 
   * ✅ MIGRATED TO: acceptedAccountingService.calculateRevenueWithAudit()
   * 
   * Avantages:
   * - Source unique de vérité pour tous les modules
   * - Audit trail complet avec confidence scores
   * - Support multi-standards (PCG/SYSCOHADA/IFRS/SCF)
   * - Réconciliation automatique vs factures
   * - Fallback management centralisé
   */
  private async calculateRevenue(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      // Utiliser la source unique et centralisée
      const { revenue, audit } = await acceptedAccountingService.calculateRevenueWithAudit(
        companyId,
        startDate,
        endDate,
        undefined, // No client filter for aggregated dashboard
        {
          vatTreatment: 'ttc', // Dashboard shows total billing
          includeBreakdown: false,
          includeReconciliation: false
        }
      );

      // Enregistrer l'audit asynchronement (ne pas bloquer le calcul)
      void supabase
        .from('accounting_calculations_audit')
        .insert({
          company_id: companyId,
          calculation_type: 'revenue',
          purpose: 'dashboard',
          period_start: startDate,
          period_end: endDate,
          accounting_standard: audit.standard,
          vat_treatment: 'ttc',
          calculation_method: audit.calculation_method,
          journal_entries_included: audit.journal_entries_included,
          journal_lines_count: audit.journal_lines_count,
          final_amount: revenue,
          confidence_score: audit.confidence_score,
          warnings: audit.warnings,
          is_balanced: audit.is_balanced,
          all_entries_posted: audit.integrity_checks.journal_entries_posted,
          calculated_at: new Date().toISOString()
        })
        .then(({ error: insertError }) => {
          if (insertError) {
            logger.warn('RealDashboardKpi', 'Failed to record audit trail:', insertError);
          }
        });

      logger.debug('RealDashboardKpi', `[calculateRevenue] From ${audit.calculation_method}: ${formatCurrency(revenue)} (confidence: ${audit.confidence_score})`);
      return revenue;
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception calculating revenue:', error);
      // Fallback: return 0 (service.calculateRevenueWithAudit already has fallbacks)
      return 0;
    }
  }
  /**
   * Calcule le total des achats/charges sur une période
   * SOURCE UNIQUE: Comptabilité (journal_entry_lines sur comptes 6x)
   */
  private async calculatePurchases(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      // 1️⃣ Détecter le préfixe des comptes de charges selon le référentiel comptable
      let accountPrefix = '60'; // default PCG/SYSCOHADA
      try {
        const standard = await AccountMappingService.detectAccountingStandard(companyId) as AccountingStandard;
        const mapping = ACCOUNT_MAPPING[standard as keyof typeof ACCOUNT_MAPPING];
        const purchasesPattern = mapping?.[UniversalAccountType.PURCHASES] || '60%';
        accountPrefix = (purchasesPattern || '60').replace(/%/g, '');
      } catch (err) {
        logger.warn('RealDashboardKpi', 'Unable to detect accounting standard for purchases, using default prefix 60');
      }

      // 2️⃣ SOURCE UNIQUE: écritures comptables (journal_entry_lines)
      // ✅ Filtre de statut harmonisé : posted/validated uniquement
      const { data: journalLines, error: journalErr } = await supabase
        .from('journal_entry_lines')
        .select('debit_amount, credit_amount, account_number, journal_entry_id, journal_entries!inner(entry_date, company_id, status)')
        .eq('journal_entries.company_id', companyId)
        .in('journal_entries.status', ['posted', 'validated'])
        .ilike('account_number', `${accountPrefix}%`)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate);

      if (!journalErr && journalLines && journalLines.length > 0) {
        // Les charges sont au DÉBIT des comptes 6x (débit - crédit)
        const totalFromJournal = journalLines.reduce((sum: number, line: any) => {
          const debit = Number(line.debit_amount || 0);
          const credit = Number(line.credit_amount || 0);
          return sum + (debit - credit);
        }, 0);
        logger.debug('RealDashboardKpi', `[calculatePurchases] From journal_entry_lines (${accountPrefix}xxx): ${formatCurrency(totalFromJournal)} (${journalLines.length} lignes)`);
        return totalFromJournal;
      }

      logger.warn('RealDashboardKpi', '[calculatePurchases] Aucune écriture de charges trouvée (comptabilité)');
      return 0;
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
   *
   * ✅ MIGRATED TO: acceptedAccountingService avec breakdown mensuel
   * Utilise la même source unique que calculateRevenue()
   */
  private async calculateMonthlyRevenue(
    companyId: string,
    year: number
  ): Promise<{ month: string; amount: number }[]> {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Initialize months
      const monthlyData = new Map<number, number>();
      for (let i = 1; i <= 12; i++) monthlyData.set(i, 0);

      // Récupérer les données mensualisées via le service unifié
      const { revenue, breakdown, audit } = await acceptedAccountingService.calculateRevenueWithAudit(
        companyId,
        startDate,
        endDate,
        undefined,
        {
          vatTreatment: 'ttc',
          includeBreakdown: true,
          includeReconciliation: false
        }
      );

      // Si le breakdown mensuel est disponible, l'utiliser
      const monthlyBreakdown = (breakdown as { by_month?: Array<{ month: string; amount: number }> } | undefined)?.by_month;
      if (monthlyBreakdown && monthlyBreakdown.length > 0) {
        monthlyBreakdown.forEach((monthData) => {
          const monthNum = parseInt(monthData.month);
          if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            monthlyData.set(monthNum, monthData.amount);
          }
        });

        logger.debug('RealDashboardKpi', `[calculateMonthlyRevenue] From unified service with monthly breakdown: ${monthlyBreakdown.length} months`);
        
        return Array.from(monthlyData.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([month, amount]) => ({ month: String(month), amount }));
      }

      // Fallback: Si breakdown pas disponible, faire requête directe
      // (mais cela devrait rarement arriver avec acceptedAccountingService)
      logger.warn('RealDashboardKpi', '[calculateMonthlyRevenue] Breakdown not available from service, using fallback');

      // Récupérer les données du journal directement
      // ✅ Toute la classe 7 (revenus), pas seulement 70x
      const { data: journalLines, error: journalErr } = await supabase
        .from('journal_entry_lines')
        .select('credit_amount, debit_amount, journal_entries!inner(entry_date, company_id, status)')
        .eq('journal_entries.company_id', companyId)
        .ilike('account_number', '7%')
        .in('journal_entries.status', ['posted', 'validated'])
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate);

      if (!journalErr && journalLines && journalLines.length > 0) {
        journalLines.forEach((line: any) => {
          const entryDate = (line as any)?.journal_entries?.entry_date;
          if (!entryDate) return;
          const d = new Date(entryDate);
          const m = d.getMonth() + 1;
          const credit = Number(line.credit_amount || 0);
          const debit = Number(line.debit_amount || 0);
          const amount = credit - debit;
          monthlyData.set(m, (monthlyData.get(m) || 0) + amount);
        });
      }

      return Array.from(monthlyData.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([month, amount]) => ({ month: String(month), amount }));
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
   * 
   * SOURCE PRIORITAIRE: Écritures comptables (comptes 411xxx avec auxiliary_account)
   * FALLBACK: Factures de vente (invoices)
   * 
   * ⚠️ IMPORTANT pour les reprises comptables : les comptes auxiliaires 411xxx 
   * permettent d'identifier les clients même sans factures dans l'application.
   */
  private async getTopClients(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ name: string; amount: number }[]> {
    try {
      // 1️⃣ PRIORITÉ: Utiliser les comptes auxiliaires clients (411xxx)
      // Agréger les mouvements DÉBIT sur période (CA client = débit 411)
      const { data: clientLines, error: journalErr } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          account_number,
          account_name,
          auxiliary_account,
          description,
          journal_entry_id,
          journal_entries!inner(entry_date, company_id)
        `)
        .eq('journal_entries.company_id', companyId)
        .ilike('account_number', '411%')
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate);

      if (!journalErr && clientLines && clientLines.length > 0) {
        // Agréger par compte (account_number ou auxiliary_account)
        const amountByAccount = new Map<string, number>();
        const accountNumbers = new Set<string>();
        const auxAccounts = new Set<string>();
        
        for (const line of clientLines) {
          const accountKey = line.auxiliary_account || line.account_number;
          const debit = Number(line.debit_amount || 0);
          const credit = Number(line.credit_amount || 0);
          const amount = debit - credit; // CA client = débit net

          if (amount > 0) { // Ne garder que les débits nets positifs
            amountByAccount.set(accountKey, (amountByAccount.get(accountKey) || 0) + amount);
            accountNumbers.add(line.account_number);
            if (line.auxiliary_account) auxAccounts.add(line.auxiliary_account);
          }
        }

        if (amountByAccount.size > 0) {
          // 🔍 Récupérer les noms en une seule requête groupée
          const accountNumbersArray = Array.from(accountNumbers);
          const auxAccountsArray = Array.from(auxAccounts);

          // Récupérer les noms depuis third_parties (via auxiliary_account)
          const thirdParties = auxAccountsArray.length > 0
            ? (await supabase
              .from('third_parties')
              .select('auxiliary_account, name')
              .eq('company_id', companyId)
              .in('auxiliary_account', auxAccountsArray)).data
            : [];

          // Récupérer les noms depuis chart_of_accounts (fallback)
          const accounts = accountNumbersArray.length > 0
            ? (await supabase
              .from('chart_of_accounts')
              .select('account_number, account_name')
              .eq('company_id', companyId)
              .in('account_number', accountNumbersArray)).data
            : [];

          // Créer des maps pour lookup rapide
          const thirdPartyMap = new Map<string, string>();
          thirdParties?.forEach(tp => {
            if (tp.auxiliary_account) thirdPartyMap.set(tp.auxiliary_account, tp.name);
          });

          const accountMap = new Map<string, string>();
          accounts?.forEach(acc => {
            accountMap.set(acc.account_number, acc.account_name);
          });

          // Construire le résultat final avec les noms
          const clientList = Array.from(amountByAccount.entries()).map(([accountKey, amount]) => {
            // Priorité 1: Nom du tiers (via auxiliary_account)
            let clientName = thirdPartyMap.get(accountKey);
            
            // Priorité 2: Nom du compte (chart_of_accounts)
            if (!clientName) {
              clientName = accountMap.get(accountKey);
            }
            
            // Priorité 3: Nom de compte sur la ligne (si disponible)
            if (!clientName) {
              const lineWithAccountName = clientLines.find(
                l => (l.auxiliary_account || l.account_number) === accountKey && l.account_name
              );
              if (lineWithAccountName?.account_name) {
                clientName = lineWithAccountName.account_name;
              }
            }

            // Priorité 4: Description de ligne (si disponible)
            if (!clientName) {
              const lineWithDescription = clientLines.find(
                l => (l.auxiliary_account || l.account_number) === accountKey && l.description
              );
              if (lineWithDescription?.description) {
                clientName = lineWithDescription.description;
              }
            }
            
            // Fallback: Numéro de compte (en dernier recours)
            if (!clientName) {
              clientName = accountKey;
            }

            return { name: clientName, amount };
          });

          const topClients = clientList
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
          
          logger.debug('RealDashboardKpi', `[getTopClients] From journal_entry_lines (411xxx): ${topClients.length} clients`);
          return topClients;
        }
      }

      // 2️⃣ FALLBACK: Utiliser les factures (si comptabilité non alimentée)
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          total_incl_tax,
          customer_id,
          third_parties!invoices_customer_id_fkey(id, name)
        `)
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale')
        .in('status', ['sent', 'paid', 'partially_paid'])
        .neq('status', 'cancelled')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (!invoicesError && invoices && invoices.length > 0) {
        // Agréger par client
        const clientMap = new Map<string, number>();
        invoices.forEach((invoice: any) => {
          const clientName = invoice.third_parties?.name || 'Client inconnu';
          const amount = invoice.total_incl_tax || 0;
          clientMap.set(clientName, (clientMap.get(clientName) || 0) + amount);
        });

        const topClients = Array.from(clientMap.entries())
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        logger.debug('RealDashboardKpi', `[getTopClients] From invoices (fallback): ${topClients.length} clients`);
        return topClients;
      }

      logger.warn('RealDashboardKpi', '[getTopClients] Aucune source trouvée (ni écritures 411xxx, ni factures)');
      return [];
    } catch (error) {
      logger.error('RealDashboardKpi', 'Exception fetching top clients:', error);
      return [];
    }
  }
  /**
   * Récupère la répartition des dépenses par catégorie
   * SOURCE PRIMAIRE: Comptes de classe 6 (charges) via journal_entries
   * FALLBACK: purchases table, puis invoices
   */
  private async getExpenseBreakdown(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ category: string; amount: number }[]> {
    try {
      // 🎯 SOURCE PRIMAIRE: Journal entries avec comptes classe 6
      const { data: journalLines, error: journalError } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          description,
          chart_of_accounts!inner (
            account_number,
            account_name,
            account_class
          ),
          journal_entries!inner (
            entry_date,
            company_id
          )
        `)
        .eq('journal_entries.company_id', companyId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate);

      if (!journalError && journalLines && journalLines.length > 0) {
        const categoryMap = new Map<string, number>();
        
        journalLines.forEach((line: any) => {
          const accountNumber = line.chart_of_accounts?.account_number;
          const accountName = line.chart_of_accounts?.account_name;
          const accountClass = line.chart_of_accounts?.account_class;
          
          // Ne garder que les comptes de classe 6 (charges)
          if (accountClass !== 6 && !accountNumber?.startsWith('6')) {
            return;
          }

          // Montant = débit - crédit (les charges sont au débit)
          const amount = (line.debit_amount || 0) - (line.credit_amount || 0);
          if (amount <= 0) return;

          // Catégoriser par sous-classe de compte
          let category = 'Autres charges';
          if (accountNumber) {
            if (accountNumber.startsWith('60')) category = 'Achats de marchandises et matières';
            else if (accountNumber.startsWith('61')) category = 'Services extérieurs';
            else if (accountNumber.startsWith('62')) category = 'Autres services extérieurs';
            else if (accountNumber.startsWith('63')) category = 'Impôts et taxes';
            else if (accountNumber.startsWith('64')) category = 'Charges de personnel';
            else if (accountNumber.startsWith('65')) category = 'Autres charges de gestion courante';
            else if (accountNumber.startsWith('66')) category = 'Charges financières';
            else if (accountNumber.startsWith('67')) category = 'Charges exceptionnelles';
            else if (accountNumber.startsWith('68')) category = 'Dotations aux amortissements';
            else if (accountName) category = accountName;
          }

          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });

        if (categoryMap.size > 0) {
          return Array.from(categoryMap.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6); // Top 6 categories
        }
      }

      // 🔄 FALLBACK 1: Try purchases table
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('amount_ttc, description')
        .eq('company_id', companyId)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

      if (!purchasesError && purchasesData && purchasesData.length > 0) {
        const categoryMap = new Map<string, number>();
        purchasesData.forEach((purchase: any) => {
          const category = purchase.description || 'Non catégorisé';
          const amount = purchase.amount_ttc || 0;
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });
        return Array.from(categoryMap.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6);
      }

      // 🔄 FALLBACK 2: Use invoices with invoice_type='purchase'
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_incl_tax, third_party_id')
        .eq('company_id', companyId)
        .eq('invoice_type', 'purchase')
        .in('status', ['sent', 'paid', 'partially_paid'])
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (invoicesError || !invoicesData || invoicesData.length === 0) {
        logger.warn('RealDashboardKpi', 'No expense data found in any source');
        return [];
      }

      const supplierIds = Array.from(new Set((invoicesData as any[]).map(i => i.third_party_id).filter(Boolean)));
      const suppliersMap: Map<string, string> = new Map();
      if (supplierIds.length > 0) {
        const { data: suppliersRows } = await supabase
          .from('third_parties')
          .select('id, name')
          .in('id', supplierIds);
        (suppliersRows || []).forEach((s: any) => suppliersMap.set(s.id, s.name));
      }

      const categoryMap = new Map<string, number>();
      (invoicesData as any[]).forEach((invoice: any) => {
        const category = (invoice.third_party_id && suppliersMap.get(invoice.third_party_id)) || 'Fournisseur non spécifié';
        const amount = invoice.total_incl_tax || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });

      return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);
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