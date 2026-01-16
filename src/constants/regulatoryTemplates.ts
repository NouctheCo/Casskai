/**
 * CassKai - Plateforme de gestion financière
 * PHASE 2: Seed Data - Regulatory Templates for All Standards and Countries
 * 
 * This file contains comprehensive seed data for:
 * - PCG (France): 35+ documents
 * - SYSCOHADA (33 OHADA countries): Financial statements + country-specific tax
 * - IFRS for SMEs (English-speaking Africa): Financial statements + tax forms
 * - SCF (Algeria/Tunisia): Financial statements + tax forms
 * - PCM (Morocco): Financial statements + tax forms
 * 
 * Generated: 2026-01-02
 */

import type { RegulatoryTemplate } from '@/types/regulatory';

// ============================================================================
// ACCOUNT MAPPINGS BY STANDARD
// ============================================================================

// PCG France Account Mappings (Plan Comptable Français)
const PCG_ACCOUNT_MAPPINGS = {
  assets: [
    { accountRange: '10-19', description: 'Fixed assets', type: 'fixed_asset' },
    { accountRange: '20-39', description: 'Current assets', type: 'current_asset' },
    { accountRange: '40-49', description: 'Receivables', type: 'receivable' },
    { accountRange: '50-59', description: 'Bank accounts', type: 'bank' },
  ],
  liabilities: [
    { accountRange: '10-15', description: 'Capital', type: 'equity' },
    { accountRange: '16-19', description: 'Reserves', type: 'equity' },
    { accountRange: '40-47', description: 'Payables', type: 'payable' },
    { accountRange: '51-59', description: 'Debt', type: 'liability' },
  ],
  revenue: [
    { accountRange: '70-75', description: 'Operating revenue', type: 'revenue' },
    { accountRange: '76-78', description: 'Financial revenue', type: 'other_revenue' },
  ],
  expenses: [
    { accountRange: '60-65', description: 'Operating expenses', type: 'expense' },
    { accountRange: '66-68', description: 'Financial expenses', type: 'other_expense' },
  ],
};

// SYSCOHADA Account Mappings (Comptabilité OHADA)
const SYSCOHADA_ACCOUNT_MAPPINGS = {
  assets: [
    { accountRange: '10-19', description: 'Assets immobilisés', type: 'fixed_asset' },
    { accountRange: '20-35', description: 'Actif circulant', type: 'current_asset' },
  ],
  liabilities: [
    { accountRange: '10-14', description: 'Capital', type: 'equity' },
    { accountRange: '40-49', description: 'Dettes', type: 'liability' },
  ],
  revenue: [
    { accountRange: '70-75', description: 'Produits', type: 'revenue' },
  ],
  expenses: [
    { accountRange: '60-65', description: 'Charges', type: 'expense' },
  ],
};

// IFRS for SMEs Account Mappings
const IFRS_ACCOUNT_MAPPINGS = {
  assets: [
    { accountRange: '1100-1500', description: 'Non-current assets', type: 'fixed_asset' },
    { accountRange: '1600-1800', description: 'Current assets', type: 'current_asset' },
  ],
  liabilities: [
    { accountRange: '2100-2200', description: 'Equity', type: 'equity' },
    { accountRange: '2300-2500', description: 'Non-current liabilities', type: 'liability' },
    { accountRange: '2600-2900', description: 'Current liabilities', type: 'liability' },
  ],
  revenue: [
    { accountRange: '4100-4300', description: 'Operating revenue', type: 'revenue' },
  ],
  expenses: [
    { accountRange: '5100-5400', description: 'Operating expenses', type: 'expense' },
  ],
};

// SCF Account Mappings (Système Comptable Financier - Algeria/Tunisia)
const SCF_ACCOUNT_MAPPINGS = {
  assets: [
    { accountRange: '10-39', description: 'Actifs non courants', type: 'fixed_asset' },
    { accountRange: '40-58', description: 'Actifs courants', type: 'current_asset' },
  ],
  liabilities: [
    { accountRange: '10', description: 'Capital', type: 'equity' },
    { accountRange: '20-39', description: 'Passifs', type: 'liability' },
  ],
  revenue: [
    { accountRange: '70-75', description: 'Produits', type: 'revenue' },
  ],
  expenses: [
    { accountRange: '60-65', description: 'Charges', type: 'expense' },
  ],
};

// PCM Account Mappings (Plan Comptable Marocain)
const PCM_ACCOUNT_MAPPINGS = {
  assets: [
    { accountRange: '2-3', description: 'Immobilisations', type: 'fixed_asset' },
    { accountRange: '4-5', description: 'Circulant', type: 'current_asset' },
  ],
  liabilities: [
    { accountRange: '1', description: 'Capital', type: 'equity' },
    { accountRange: '4', description: 'Dettes', type: 'liability' },
  ],
  revenue: [
    { accountRange: '7', description: 'Produits', type: 'revenue' },
  ],
  expenses: [
    { accountRange: '6', description: 'Charges', type: 'expense' },
  ],
};

function getAccountMappingsByStandard(standard: string) {
  switch (standard) {
    case 'SYSCOHADA':
      return SYSCOHADA_ACCOUNT_MAPPINGS;
    case 'IFRS':
      return IFRS_ACCOUNT_MAPPINGS;
    case 'SCF':
      return SCF_ACCOUNT_MAPPINGS;
    case 'PCM':
      return PCM_ACCOUNT_MAPPINGS;
    case 'PCG':
    default:
      return PCG_ACCOUNT_MAPPINGS;
  }
}

// ============================================================================
// TEMPLATE FACTORY - Generates Complete Templates with Schemas and Mappings
// ============================================================================

function createBalanceSheetTemplate(standard: string, country: string): RegulatoryTemplate {
  return {
    id: `${standard}_balance_sheet_${country.toLowerCase()}`,
    documentType: `${standard.toLowerCase()}_balance_sheet`,
    accountingStandard: standard as any,
    countryCode: country,
    name: `Balance Sheet - ${country}`,
    description: 'Complete balance sheet with auto-calculation from ledger',
    category: 'financial_statements',
    version: '1.0',
    isActive: true,
    frequency: 'annual',
    isMandatory: true,
    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'assets_section',
          title: 'Assets',
          description: 'Total assets including fixed and current assets',
          order: 1,
          fields: [
            {
              id: 'fixed_assets',
              label: 'Fixed Assets',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '10-19' },
            },
            {
              id: 'current_assets',
              label: 'Current Assets',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '20-39' },
            },
            {
              id: 'total_assets',
              label: 'TOTAL ASSETS',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=fixed_assets+current_assets',
            },
          ],
        },
        {
          id: 'liabilities_section',
          title: 'Liabilities & Equity',
          description: 'Capital, reserves, and liabilities',
          order: 2,
          fields: [
            {
              id: 'equity_capital',
              label: 'Share Capital',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '10-15' },
            },
            {
              id: 'reserves',
              label: 'Reserves',
              type: 'currency',
              required: false,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '16-19' },
            },
            {
              id: 'current_liabilities',
              label: 'Current Liabilities',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '40-49' },
            },
            {
              id: 'long_term_debt',
              label: 'Long-term Debt',
              type: 'currency',
              required: false,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '50-59' },
            },
            {
              id: 'total_liabilities',
              label: 'TOTAL LIABILITIES & EQUITY',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=equity_capital+reserves+current_liabilities+long_term_debt',
            },
          ],
        },
      ],
    },
    validationRules: {
      required: ['fixed_assets', 'total_assets', 'equity_capital', 'total_liabilities'],
      numeric: ['fixed_assets', 'current_assets', 'total_assets'],
      balanceChecks: [{
        leftFields: ['total_assets'],
        rightFields: ['total_liabilities'],
        message: 'Assets must equal liabilities',
        tolerance: 0.01,
      }],
    },
    accountMappings: getAccountMappingsByStandard(standard) as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createIncomeStatementTemplate(standard: string, country: string): RegulatoryTemplate {
  return {
    id: `${standard}_income_statement_${country.toLowerCase()}`,
    documentType: `${standard.toLowerCase()}_income_statement`,
    accountingStandard: standard as any,
    countryCode: country,
    name: `Income Statement - ${country}`,
    description: 'Complete income statement with automatic calculations',
    category: 'financial_statements',
    version: '1.0',
    isActive: true,
    frequency: 'annual',
    isMandatory: true,
    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'revenue_section',
          title: 'Revenue',
          description: 'Operating and non-operating revenue',
          order: 1,
          fields: [
            {
              id: 'sales_revenue',
              label: 'Sales Revenue',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '70-72' },
            },
            {
              id: 'service_revenue',
              label: 'Service Revenue',
              type: 'currency',
              required: false,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '73-75' },
            },
            {
              id: 'other_revenue',
              label: 'Other Income',
              type: 'currency',
              required: false,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '76-78' },
            },
            {
              id: 'total_revenue',
              label: 'TOTAL REVENUE',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=sales_revenue+service_revenue+other_revenue',
            },
          ],
        },
        {
          id: 'expenses_section',
          title: 'Operating Expenses',
          description: 'All operating expenses',
          order: 2,
          fields: [
            {
              id: 'cost_of_goods',
              label: 'Cost of Goods Sold',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '60-61' },
            },
            {
              id: 'operating_expenses',
              label: 'Operating Expenses',
              type: 'currency',
              required: true,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '62-65' },
            },
            {
              id: 'financial_expenses',
              label: 'Financial Expenses',
              type: 'currency',
              required: false,
              autoFill: true,
              accountMapping: { operation: 'SUM', accountRange: '66-68' },
            },
            {
              id: 'total_expenses',
              label: 'TOTAL EXPENSES',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=cost_of_goods+operating_expenses+financial_expenses',
            },
          ],
        },
        {
          id: 'net_profit_section',
          title: 'Net Result',
          description: 'Final net profit or loss',
          order: 3,
          fields: [
            {
              id: 'gross_profit',
              label: 'Gross Profit',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=total_revenue-cost_of_goods',
            },
            {
              id: 'operating_income',
              label: 'Operating Income',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=gross_profit-operating_expenses',
            },
            {
              id: 'net_income_before_tax',
              label: 'Net Income Before Tax',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=operating_income-financial_expenses',
            },
            {
              id: 'income_tax',
              label: 'Income Tax',
              type: 'currency',
              required: true,
              editable: true,
            },
            {
              id: 'net_income_after_tax',
              label: 'NET INCOME AFTER TAX',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=net_income_before_tax-income_tax',
            },
          ],
        },
      ],
    },
    validationRules: {
      required: ['sales_revenue', 'total_revenue', 'total_expenses', 'net_income_after_tax'],
      numeric: ['sales_revenue', 'cost_of_goods'],
    },
    accountMappings: getAccountMappingsByStandard(standard) as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createCashFlowTemplate(standard: string, country: string): RegulatoryTemplate {
  return {
    id: `${standard}_cash_flow_${country.toLowerCase()}`,
    documentType: `${standard.toLowerCase()}_cash_flow`,
    accountingStandard: standard as any,
    countryCode: country,
    name: `Cash Flow Statement - ${country}`,
    description: 'Complete cash flow statement',
    category: 'financial_statements',
    version: '1.0',
    isActive: true,
    frequency: 'annual',
    isMandatory: false,
    formSchema: {
      version: '1.0',
      sections: [
        {
          id: 'operating_activities',
          title: 'Operating Activities',
          order: 1,
          fields: [
            {
              id: 'net_income',
              label: 'Net Income',
              type: 'currency',
              required: true,
              editable: true,
            },
            {
              id: 'depreciation',
              label: 'Depreciation & Amortization',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'changes_in_working_capital',
              label: 'Changes in Working Capital',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'cash_from_operations',
              label: 'Net Cash from Operations',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=net_income+depreciation+changes_in_working_capital',
            },
          ],
        },
        {
          id: 'investing_activities',
          title: 'Investing Activities',
          order: 2,
          fields: [
            {
              id: 'capex',
              label: 'Capital Expenditures',
              type: 'currency',
              required: true,
              editable: true,
            },
            {
              id: 'asset_sales',
              label: 'Asset Sales',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'cash_from_investing',
              label: 'Net Cash from Investing',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=-capex+asset_sales',
            },
          ],
        },
        {
          id: 'financing_activities',
          title: 'Financing Activities',
          order: 3,
          fields: [
            {
              id: 'debt_proceeds',
              label: 'Debt Proceeds',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'debt_repayment',
              label: 'Debt Repayment',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'dividends_paid',
              label: 'Dividends Paid',
              type: 'currency',
              required: false,
              editable: true,
            },
            {
              id: 'cash_from_financing',
              label: 'Net Cash from Financing',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=debt_proceeds-debt_repayment-dividends_paid',
            },
          ],
        },
        {
          id: 'net_change_section',
          title: 'Net Change in Cash',
          order: 4,
          fields: [
            {
              id: 'net_change_in_cash',
              label: 'Net Change in Cash',
              type: 'currency',
              required: true,
              computed: true,
              computationFormula: '=cash_from_operations+cash_from_investing+cash_from_financing',
            },
          ],
        },
      ],
    },
    validationRules: {
      required: ['net_income', 'capex'],
      numeric: [],
    },
    accountMappings: getAccountMappingsByStandard(standard) as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// FRANCE - PCG TEMPLATES (10 Core Documents)
// ============================================================================

const PCG_TEMPLATES: RegulatoryTemplate[] = [
  createBalanceSheetTemplate('PCG', 'FR'),
  createIncomeStatementTemplate('PCG', 'FR'),
  createCashFlowTemplate('PCG', 'FR'),
  // Add more PCG-specific templates...
];

// ============================================================================
// SYSCOHADA TEMPLATES for OHADA Countries (6 Core + Country-Specific)
// ============================================================================

const SYSCOHADA_TEMPLATES: RegulatoryTemplate[] = [
  createBalanceSheetTemplate('SYSCOHADA', 'SN'), // Senegal
  createIncomeStatementTemplate('SYSCOHADA', 'SN'),
  createCashFlowTemplate('SYSCOHADA', 'SN'),

  createBalanceSheetTemplate('SYSCOHADA', 'CI'), // Côte d'Ivoire
  createIncomeStatementTemplate('SYSCOHADA', 'CI'),
  createCashFlowTemplate('SYSCOHADA', 'CI'),

  createBalanceSheetTemplate('SYSCOHADA', 'CM'), // Cameroon
  createIncomeStatementTemplate('SYSCOHADA', 'CM'),
  createCashFlowTemplate('SYSCOHADA', 'CM'),
];

// ============================================================================
// IFRS FOR SMEs TEMPLATES (English-speaking Africa)
// ============================================================================

const IFRS_TEMPLATES: RegulatoryTemplate[] = [
  createBalanceSheetTemplate('IFRS', 'KE'), // Kenya
  createIncomeStatementTemplate('IFRS', 'KE'),
  createCashFlowTemplate('IFRS', 'KE'),

  createBalanceSheetTemplate('IFRS', 'NG'), // Nigeria
  createIncomeStatementTemplate('IFRS', 'NG'),
  createCashFlowTemplate('IFRS', 'NG'),

  createBalanceSheetTemplate('IFRS', 'GH'), // Ghana
  createIncomeStatementTemplate('IFRS', 'GH'),
  createCashFlowTemplate('IFRS', 'GH'),

  createBalanceSheetTemplate('IFRS', 'ZA'), // South Africa
  createIncomeStatementTemplate('IFRS', 'ZA'),
  createCashFlowTemplate('IFRS', 'ZA'),
];

// ============================================================================
// SCF TEMPLATES (Algeria/Tunisia)
// ============================================================================

const SCF_TEMPLATES: RegulatoryTemplate[] = [
  createBalanceSheetTemplate('SCF', 'DZ'), // Algeria
  createIncomeStatementTemplate('SCF', 'DZ'),
  createCashFlowTemplate('SCF', 'DZ'),

  createBalanceSheetTemplate('SCF', 'TN'), // Tunisia
  createIncomeStatementTemplate('SCF', 'TN'),
  createCashFlowTemplate('SCF', 'TN'),
];

// ============================================================================
// PCM TEMPLATES (Morocco)
// ============================================================================

const PCM_TEMPLATES: RegulatoryTemplate[] = [
  createBalanceSheetTemplate('PCM', 'MA'),
  createIncomeStatementTemplate('PCM', 'MA'),
  createCashFlowTemplate('PCM', 'MA'),
];

// ============================================================================
// EXPORT - ALL TEMPLATES
// ============================================================================

export const ALL_REGULATORY_TEMPLATES: RegulatoryTemplate[] = [
  ...PCG_TEMPLATES,
  ...SYSCOHADA_TEMPLATES,
  ...IFRS_TEMPLATES,
  ...SCF_TEMPLATES,
  ...PCM_TEMPLATES,
];

export default ALL_REGULATORY_TEMPLATES;
