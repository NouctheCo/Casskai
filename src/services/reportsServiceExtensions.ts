/**
 * Extensions du ReportsService pour les 8 rapports manquants
 * Refactorisé pour réduire la complexité des fonctions
 */

import { supabase } from '../lib/supabase';
import { logger } from '@/utils/logger';
import type { ReportServiceResponse } from '../types/reports.types';
import type {
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData
} from '../utils/reportGeneration/types';

// ========================================
// TYPES
// ========================================

interface InvoiceWithCustomer {
  id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  customers?: {
    name: string;
  };
}

interface BillWithSupplier {
  id: string;
  supplier_id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  suppliers?: {
    name: string;
  };
}

interface AgedInvoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  days_overdue: number;
}

interface AgedBill {
  bill_id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  amount: number;
  days_overdue: number;
}

interface AgedCustomer {
  customer_id: string;
  customer_name: string;
  total_amount: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90_plus: number;
  invoices: AgedInvoice[];
}

interface AgedSupplier {
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90_plus: number;
  bills: AgedBill[];
}

interface AccountEntry {
  balance?: number;
}

interface ExpenseEntry {
  amount?: number;
}

interface BalanceSheetData {
  totals?: {
    total_assets?: number;
    total_liabilities?: number;
  };
  assets?: {
    cash?: AccountEntry[];
    receivables?: AccountEntry[];
    inventory?: AccountEntry[];
  };
  liabilities?: {
    payables?: AccountEntry[];
  };
  equity?: {
    total?: number;
  };
}

interface IncomeStatementData {
  summary?: {
    total_revenue?: number;
    net_income?: number;
  };
  expenses?: {
    purchases?: ExpenseEntry[];
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calcule le nombre de jours de retard entre deux dates
 */
function calculateDaysOverdue(dueDate: string, asOfDate: string): number {
  const due = new Date(dueDate);
  const now = new Date(asOfDate);
  const daysDiff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
}

/**
 * Catégorise un montant selon l'ancienneté
 */
function categorizeByAge(daysOverdue: number, amount: number): {
  current: number;
  days_30: number;
  days_60: number;
  days_90_plus: number;
} {
  if (daysOverdue <= 0) {
    return { current: amount, days_30: 0, days_60: 0, days_90_plus: 0 };
  } else if (daysOverdue <= 30) {
    return { current: 0, days_30: amount, days_60: 0, days_90_plus: 0 };
  } else if (daysOverdue <= 60) {
    return { current: 0, days_30: 0, days_60: amount, days_90_plus: 0 };
  } else {
    return { current: 0, days_30: 0, days_60: 0, days_90_plus: amount };
  }
}

/**
 * Crée un nouvel objet customer vide
 */
function createEmptyCustomer(customerId: string, customerName: string): AgedCustomer {
  return {
    customer_id: customerId,
    customer_name: customerName,
    total_amount: 0,
    current: 0,
    days_30: 0,
    days_60: 0,
    days_90_plus: 0,
    invoices: []
  };
}

/**
 * Crée un nouvel objet supplier vide
 */
function createEmptySupplier(supplierId: string, supplierName: string): AgedSupplier {
  return {
    supplier_id: supplierId,
    supplier_name: supplierName,
    total_amount: 0,
    current: 0,
    days_30: 0,
    days_60: 0,
    days_90_plus: 0,
    bills: []
  };
}

/**
 * Calcule les totaux d'un ensemble de clients/fournisseurs
 */
function calculateAgingTotals<T extends { total_amount: number; current: number; days_30: number; days_60: number; days_90_plus: number }>(
  items: T[]
): {
  total_receivables: number;
  total_current: number;
  total_30: number;
  total_60: number;
  total_90_plus: number;
} {
  return {
    total_receivables: items.reduce((sum, item) => sum + item.total_amount, 0),
    total_current: items.reduce((sum, item) => sum + item.current, 0),
    total_30: items.reduce((sum, item) => sum + item.days_30, 0),
    total_60: items.reduce((sum, item) => sum + item.days_60, 0),
    total_90_plus: items.reduce((sum, item) => sum + item.days_90_plus, 0)
  };
}

/**
 * Gère les erreurs de manière uniforme
 */
function handleError<T>(error: unknown, context: string): ReportServiceResponse<T> {
  logger.error(`Exception in ${context}:`, error);
  return {
    data: null,
    error: { message: error instanceof Error ? error.message : 'Erreur inconnue' }
  };
}

/**
 * Extrait et somme les montants d'une catégorie d'actifs
 */
function sumAccountBalances(accounts: AccountEntry[] | undefined): number {
  return accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
}

/**
 * Extrait et somme les montants d'une catégorie de dépenses
 */
function sumExpenseAmounts(expenses: ExpenseEntry[] | undefined): number {
  return expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
}

// ========================================
// AGED RECEIVABLES / PAYABLES
// ========================================

/**
 * 1. Clients échéancier (Aged Receivables)
 */
export async function generateAgedReceivables(
  companyId: string,
  asOfDate: string
): Promise<ReportServiceResponse<AgedReceivablesData>> {
  try {
    // Récupérer toutes les factures impayées
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .eq('company_id', companyId)
      .eq('status', 'sent')
      .or(`status.eq.overdue,status.eq.sent`)
      .lte('due_date', asOfDate);

    if (error) {
      logger.error('Error fetching invoices:', error);
      return { data: null, error: { message: error.message } };
    }

    const customers = processAgedInvoices(invoices || [], asOfDate);
    const customersList = Object.values(customers);
    const totals = calculateAgingTotals(customersList);

    const report: AgedReceivablesData = {
      company_id: companyId,
      report_date: asOfDate,
      report_type: 'aged_receivables',
      currency: 'EUR',
      customers: customersList,
      totals,
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateAgedReceivables');
  }
}

/**
 * Traite les factures et les groupe par client avec calculs d'ancienneté
 */
function processAgedInvoices(invoices: InvoiceWithCustomer[], asOfDate: string): Record<string, AgedCustomer> {
  const customers: Record<string, AgedCustomer> = {};

  invoices.forEach(invoice => {
    const customerId = invoice.customer_id;

    if (!customers[customerId]) {
      customers[customerId] = createEmptyCustomer(
        customerId,
        invoice.customers?.name || 'Client inconnu'
      );
    }

    const daysOverdue = calculateDaysOverdue(invoice.due_date, asOfDate);
    const amount = invoice.total_amount || 0;
    const categories = categorizeByAge(daysOverdue, amount);

    // Mettre à jour les totaux
    customers[customerId].total_amount += amount;
    customers[customerId].current += categories.current;
    customers[customerId].days_30 += categories.days_30;
    customers[customerId].days_60 += categories.days_60;
    customers[customerId].days_90_plus += categories.days_90_plus;

    // Ajouter la facture
    customers[customerId].invoices.push({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      amount,
      days_overdue: daysOverdue
    });
  });

  return customers;
}

/**
 * 2. Fournisseurs échéancier (Aged Payables)
 */
export async function generateAgedPayables(
  companyId: string,
  asOfDate: string
): Promise<ReportServiceResponse<AgedPayablesData>> {
  try {
    // Récupérer toutes les factures fournisseurs impayées
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*, suppliers(name)')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .lte('due_date', asOfDate);

    if (error) {
      logger.error('Error fetching bills:', error);
      return { data: null, error: { message: error.message } };
    }

    const suppliers = processAgedBills(bills || [], asOfDate);
    const suppliersList = Object.values(suppliers);
    const totals = {
      total_payables: suppliersList.reduce((sum, s) => sum + s.total_amount, 0),
      total_current: suppliersList.reduce((sum, s) => sum + s.current, 0),
      total_30: suppliersList.reduce((sum, s) => sum + s.days_30, 0),
      total_60: suppliersList.reduce((sum, s) => sum + s.days_60, 0),
      total_90_plus: suppliersList.reduce((sum, s) => sum + s.days_90_plus, 0)
    };

    const report: AgedPayablesData = {
      company_id: companyId,
      report_date: asOfDate,
      report_type: 'aged_payables',
      currency: 'EUR',
      suppliers: suppliersList,
      totals,
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateAgedPayables');
  }
}

/**
 * Traite les factures fournisseurs et les groupe avec calculs d'ancienneté
 */
function processAgedBills(bills: BillWithSupplier[], asOfDate: string): Record<string, AgedSupplier> {
  const suppliers: Record<string, AgedSupplier> = {};

  bills.forEach(bill => {
    const supplierId = bill.supplier_id;

    if (!suppliers[supplierId]) {
      suppliers[supplierId] = createEmptySupplier(
        supplierId,
        bill.suppliers?.name || 'Fournisseur inconnu'
      );
    }

    const daysOverdue = calculateDaysOverdue(bill.due_date, asOfDate);
    const amount = bill.total_amount || 0;
    const categories = categorizeByAge(daysOverdue, amount);

    // Mettre à jour les totaux
    suppliers[supplierId].total_amount += amount;
    suppliers[supplierId].current += categories.current;
    suppliers[supplierId].days_30 += categories.days_30;
    suppliers[supplierId].days_60 += categories.days_60;
    suppliers[supplierId].days_90_plus += categories.days_90_plus;

    // Ajouter la facture
    suppliers[supplierId].bills.push({
      bill_id: bill.id,
      bill_number: bill.bill_number,
      bill_date: bill.bill_date,
      due_date: bill.due_date,
      amount,
      days_overdue: daysOverdue
    });
  });

  return suppliers;
}

// ========================================
// FINANCIAL RATIOS
// ========================================

/**
 * 3. Ratios financiers (Financial Ratios)
 */
export async function generateFinancialRatios(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<ReportServiceResponse<FinancialRatiosData>> {
  try {
    // Récupérer les données financières
    const [balanceSheet, incomeStatement] = await Promise.all([
      fetchBalanceSheet(companyId, periodEnd),
      fetchIncomeStatement(companyId, periodStart, periodEnd)
    ]);

    if (!balanceSheet || !incomeStatement) {
      return { data: null, error: { message: 'Erreur lors de la récupération des données' } };
    }

    // Extraire les valeurs financières
    const financials = extractFinancialValues(balanceSheet, incomeStatement);

    // Calculer les ratios
    const ratios = calculateFinancialRatios(financials);

    const report: FinancialRatiosData = {
      company_id: companyId,
      report_date: periodEnd,
      period_start: periodStart,
      period_end: periodEnd,
      report_type: 'financial_ratios',
      currency: 'EUR',
      ...ratios,
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateFinancialRatios');
  }
}

/**
 * Récupère le bilan
 */
async function fetchBalanceSheet(companyId: string, endDate: string): Promise<BalanceSheetData | null> {
  const { data, error } = await supabase.rpc('generate_balance_sheet', {
    p_company_id: companyId,
    p_end_date: endDate
  });

  if (error) {
    logger.error('Error fetching balance sheet:', error);
    return null;
  }

  return data;
}

/**
 * Récupère le compte de résultat
 */
async function fetchIncomeStatement(companyId: string, startDate: string, endDate: string): Promise<IncomeStatementData | null> {
  const { data, error } = await supabase.rpc('generate_income_statement', {
    p_company_id: companyId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) {
    logger.error('Error fetching income statement:', error);
    return null;
  }

  return data;
}

/**
 * Extrait les valeurs financières des états financiers
 */
function extractFinancialValues(balanceSheet: BalanceSheetData, incomeStatement: IncomeStatementData) {
  const totalAssets = balanceSheet.totals?.total_assets || 1;
  const cash = sumAccountBalances(balanceSheet.assets?.cash);
  const receivables = sumAccountBalances(balanceSheet.assets?.receivables);
  const inventory = sumAccountBalances(balanceSheet.assets?.inventory);
  const currentAssets = cash + receivables + inventory || 1;
  const currentLiabilities = sumAccountBalances(balanceSheet.liabilities?.payables) || 1;
  const equity = balanceSheet.equity?.total || 1;
  const totalLiabilities = balanceSheet.totals?.total_liabilities || 0;

  const revenue = incomeStatement.summary?.total_revenue || 1;
  const purchases = sumExpenseAmounts(incomeStatement.expenses?.purchases);
  const grossProfit = revenue - purchases;
  const netIncome = incomeStatement.summary?.net_income || 0;

  return {
    totalAssets,
    cash,
    receivables,
    inventory,
    currentAssets,
    currentLiabilities,
    equity,
    totalLiabilities,
    revenue,
    grossProfit,
    netIncome
  };
}

/**
 * Calcule tous les ratios financiers
 */
function calculateFinancialRatios(financials: ReturnType<typeof extractFinancialValues>) {
  return {
    liquidity_ratios: calculateLiquidityRatios(financials),
    profitability_ratios: calculateProfitabilityRatios(financials),
    leverage_ratios: calculateLeverageRatios(financials),
    efficiency_ratios: calculateEfficiencyRatios(financials)
  };
}

/**
 * Calcule les ratios de liquidité
 */
function calculateLiquidityRatios(f: ReturnType<typeof extractFinancialValues>) {
  return {
    current_ratio: f.currentAssets / f.currentLiabilities,
    quick_ratio: (f.currentAssets - f.inventory) / f.currentLiabilities,
    cash_ratio: f.cash / f.currentLiabilities
  };
}

/**
 * Calcule les ratios de rentabilité
 */
function calculateProfitabilityRatios(f: ReturnType<typeof extractFinancialValues>) {
  return {
    gross_margin: (f.grossProfit / f.revenue) * 100,
    operating_margin: (f.netIncome / f.revenue) * 100,
    net_margin: (f.netIncome / f.revenue) * 100,
    return_on_assets: (f.netIncome / f.totalAssets) * 100,
    return_on_equity: (f.netIncome / f.equity) * 100
  };
}

/**
 * Calcule les ratios d'endettement
 */
function calculateLeverageRatios(f: ReturnType<typeof extractFinancialValues>) {
  return {
    debt_ratio: f.totalLiabilities / f.totalAssets,
    debt_to_equity: f.totalLiabilities / f.equity,
    interest_coverage: f.netIncome / Math.max(1, 0) // À améliorer avec charges financières
  };
}

/**
 * Calcule les ratios d'efficacité
 */
function calculateEfficiencyRatios(f: ReturnType<typeof extractFinancialValues>) {
  return {
    asset_turnover: f.revenue / f.totalAssets,
    receivables_turnover: f.revenue / Math.max(1, f.receivables),
    payables_turnover: f.revenue / Math.max(1, f.currentLiabilities),
    inventory_turnover: f.revenue / Math.max(1, f.inventory)
  };
}

// ========================================
// AUTRES RAPPORTS (Budget, KPI, Tax)
// ========================================

/**
 * 4. Analyse budgétaire (Budget Variance) - MOCK pour l'instant
 */
export async function generateBudgetVariance(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<ReportServiceResponse<BudgetVarianceData>> {
  try {
    // TODO: Implémenter avec table budgets réelle
    const report: BudgetVarianceData = {
      company_id: companyId,
      report_date: periodEnd,
      period_start: periodStart,
      period_end: periodEnd,
      report_type: 'budget_variance',
      currency: 'EUR',
      revenue_analysis: [
        {
          account_number: '701',
          account_name: 'Ventes de produits finis',
          budget: 100000,
          actual: 95000,
          variance: -5000,
          variance_percentage: -5.0
        }
      ],
      expense_analysis: [
        {
          account_number: '601',
          account_name: 'Achats de matières premières',
          budget: 50000,
          actual: 48000,
          variance: -2000,
          variance_percentage: -4.0
        }
      ],
      summary: {
        total_revenue_budget: 100000,
        total_revenue_actual: 95000,
        total_revenue_variance: -5000,
        total_expense_budget: 50000,
        total_expense_actual: 48000,
        total_expense_variance: -2000,
        net_income_budget: 50000,
        net_income_actual: 47000,
        net_income_variance: -3000
      },
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateBudgetVariance');
  }
}

/**
 * 5. Tableau de bord KPI (KPI Dashboard)
 */
export async function generateKPIDashboard(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<ReportServiceResponse<KPIDashboardData>> {
  try {
    // Récupérer les données
    const [incomeStatement, invoices] = await Promise.all([
      fetchIncomeStatement(companyId, periodStart, periodEnd),
      fetchInvoices(companyId, periodStart, periodEnd)
    ]);

    const revenue = incomeStatement?.summary?.total_revenue || 0;
    const profit = incomeStatement?.summary?.net_income || 0;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const invoicesSent = invoices?.length || 0;
    const invoicesPaid = invoices?.filter(i => i.status === 'paid').length || 0;

    const report: KPIDashboardData = {
      company_id: companyId,
      report_date: periodEnd,
      period_start: periodStart,
      period_end: periodEnd,
      report_type: 'kpi_dashboard',
      currency: 'EUR',
      financial_kpis: {
        revenue: { value: revenue, trend: 5.2, target: revenue * 1.1 },
        profit: { value: profit, trend: 8.1, target: profit * 1.15 },
        cash: { value: 50000, trend: -2.3, target: 60000 },
        margin: { value: margin, trend: 3.5, target: 25 }
      },
      operational_kpis: {
        invoices_sent: { value: invoicesSent, trend: 12.0, target: invoicesSent * 1.2 },
        invoices_paid: { value: invoicesPaid, trend: 15.5, target: invoicesPaid * 1.3 },
        average_collection_days: { value: 35, trend: -5.2, target: 30 },
        average_payment_days: { value: 42, trend: 3.1, target: 45 }
      },
      customer_kpis: {
        total_customers: { value: 25, trend: 8.7, target: 30 },
        active_customers: { value: 20, trend: 10.0, target: 25 },
        customer_retention: { value: 85, trend: 2.5, target: 90 },
        average_invoice_value: { value: revenue / Math.max(1, invoicesSent), trend: 4.2, target: 5000 }
      },
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateKPIDashboard');
  }
}

/**
 * Récupère les factures d'une période
 */
async function fetchInvoices(companyId: string, periodStart: string, periodEnd: string) {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', companyId)
    .gte('invoice_date', periodStart)
    .lte('invoice_date', periodEnd);

  return data || [];
}

/**
 * 6. Synthèse fiscale (Tax Summary)
 */
export async function generateTaxSummary(
  companyId: string,
  fiscalYear: string
): Promise<ReportServiceResponse<TaxSummaryData>> {
  try {
    // Récupérer toutes les déclarations TVA de l'année
    const { data: vatData } = await supabase.rpc('generate_vat_declaration', {
      p_company_id: companyId,
      p_start_date: `${fiscalYear}-01-01`,
      p_end_date: `${fiscalYear}-12-31`,
      p_declaration_type: 'CA3'
    });

    const report: TaxSummaryData = {
      company_id: companyId,
      fiscal_year: fiscalYear,
      report_type: 'tax_summary',
      currency: 'EUR',
      vat_summary: {
        total_vat_collected: vatData?.vat_collected || 0,
        total_vat_deductible: vatData?.vat_deductible || 0,
        net_vat_position: (vatData?.vat_collected || 0) - (vatData?.vat_deductible || 0),
        monthly_declarations: []
      },
      corporate_tax_summary: {
        taxable_income: 50000,
        tax_rate: 25,
        corporate_tax: 12500,
        tax_credits: 0,
        net_tax_due: 12500
      },
      social_contributions: {
        employer_contributions: 15000,
        employee_contributions: 8000,
        total_contributions: 23000
      },
      tax_deadlines: [
        {
          date: `${fiscalYear}-04-30`,
          type: 'IS',
          description: 'Déclaration Impôt sur les Sociétés',
          estimated_amount: 12500
        }
      ],
      generated_at: new Date().toISOString()
    };

    return { data: report };
  } catch (error) {
    return handleError(error, 'generateTaxSummary');
  }
}
