/**
 * CassKai - Templates réglementaires IFRS for SMEs
 * Configurations pour Kenya, Nigeria, Ghana, Afrique du Sud
 */

import { createTemplatesFromConfigs, type TemplateConfig } from './templateFactory';

/**
 * TEMPLATES IFRS FOR SMEs
 *
 * ÉTATS FINANCIERS COMMUNS (5 documents):
 * - Statement of Financial Position (Balance Sheet)
 * - Statement of Comprehensive Income
 * - Statement of Changes in Equity
 * - Statement of Cash Flows
 * - Notes to Financial Statements
 *
 * DÉCLARATIONS FISCALES KENYA (4 documents):
 * - Monthly VAT Return
 * - Corporate Income Tax Return
 * - PAYE (Pay As You Earn)
 * - Withholding Tax Return
 *
 * DÉCLARATIONS FISCALES NIGERIA (4 documents):
 * - Monthly VAT Return
 * - Company Income Tax (CIT)
 * - PAYE Returns
 * - Withholding Tax Returns
 *
 * DÉCLARATIONS FISCALES GHANA (4 documents):
 * - Monthly VAT Return
 * - Corporate Tax Return
 * - PAYE Returns
 * - Withholding Tax
 *
 * DÉCLARATIONS FISCALES AFRIQUE DU SUD (4 documents):
 * - Monthly VAT Return (VAT201)
 * - Corporate Income Tax (IT14)
 * - PAYE (EMP201)
 * - Provisional Tax (IRP6)
 *
 * TOTAL: 21 documents IFRS
 */

export const IFRS_TEMPLATES_CONFIG: TemplateConfig[] = [
  // ========== ÉTATS FINANCIERS IFRS FOR SMEs (Communs) ==========

  // Statement of Financial Position
  {
    documentType: 'IFRS_FINANCIAL_POSITION',
    countryCode: 'XX', // Applicable KE, NG, GH, ZA
    accountingStandard: 'IFRS',
    name: 'Statement of Financial Position',
    description: 'Balance Sheet under IFRS for SMEs',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'non_current_assets',
        title: 'NON-CURRENT ASSETS',
        fields: [
          { id: 'property_plant_equipment', label: 'Property, Plant and Equipment', accounts: ['21', '22', '23', '24'], debitCredit: 'DEBIT' },
          { id: 'intangible_assets', label: 'Intangible Assets', accounts: ['20'], debitCredit: 'DEBIT' },
          { id: 'investment_property', label: 'Investment Property', accounts: ['25'], debitCredit: 'DEBIT' },
          { id: 'financial_assets', label: 'Financial Assets', accounts: ['26', '27'], debitCredit: 'DEBIT' },
          { id: 'deferred_tax_assets', label: 'Deferred Tax Assets', accounts: ['444'], debitCredit: 'DEBIT' },
          { id: 'total_non_current_assets', label: 'TOTAL NON-CURRENT ASSETS', formula: '=property_plant_equipment+intangible_assets+investment_property+financial_assets+deferred_tax_assets' }
        ]
      },
      {
        id: 'current_assets',
        title: 'CURRENT ASSETS',
        fields: [
          { id: 'inventories', label: 'Inventories', accounts: ['31', '32', '33', '34', '35', '37'], debitCredit: 'DEBIT' },
          { id: 'trade_receivables', label: 'Trade and Other Receivables', accounts: ['411', '413'], debitCredit: 'DEBIT' },
          { id: 'prepayments', label: 'Prepayments', accounts: ['486'], debitCredit: 'DEBIT' },
          { id: 'cash_equivalents', label: 'Cash and Cash Equivalents', accounts: ['51', '52', '53'], debitCredit: 'DEBIT' },
          { id: 'total_current_assets', label: 'TOTAL CURRENT ASSETS', formula: '=inventories+trade_receivables+prepayments+cash_equivalents' }
        ]
      },
      {
        id: 'total_assets',
        title: 'TOTAL ASSETS',
        fields: [
          { id: 'total_assets', label: 'TOTAL ASSETS', formula: '=total_non_current_assets+total_current_assets' }
        ]
      },
      {
        id: 'equity',
        title: 'EQUITY',
        fields: [
          { id: 'share_capital', label: 'Share Capital', accounts: ['101'], debitCredit: 'CREDIT' },
          { id: 'share_premium', label: 'Share Premium', accounts: ['104'], debitCredit: 'CREDIT' },
          { id: 'retained_earnings', label: 'Retained Earnings', accounts: ['11', '110'], debitCredit: 'CREDIT' },
          { id: 'other_reserves', label: 'Other Reserves', accounts: ['106'], debitCredit: 'CREDIT' },
          { id: 'current_year_profit', label: 'Profit for the Year', required: true },
          { id: 'total_equity', label: 'TOTAL EQUITY', formula: '=share_capital+share_premium+retained_earnings+other_reserves+current_year_profit' }
        ]
      },
      {
        id: 'non_current_liabilities',
        title: 'NON-CURRENT LIABILITIES',
        fields: [
          { id: 'long_term_borrowings', label: 'Long-term Borrowings', accounts: ['16', '17'], debitCredit: 'CREDIT' },
          { id: 'deferred_tax_liabilities', label: 'Deferred Tax Liabilities', accounts: ['445'], debitCredit: 'CREDIT' },
          { id: 'provisions', label: 'Provisions', accounts: ['15'], debitCredit: 'CREDIT' },
          { id: 'total_non_current_liabilities', label: 'TOTAL NON-CURRENT LIABILITIES', formula: '=long_term_borrowings+deferred_tax_liabilities+provisions' }
        ]
      },
      {
        id: 'current_liabilities',
        title: 'CURRENT LIABILITIES',
        fields: [
          { id: 'trade_payables', label: 'Trade and Other Payables', accounts: ['401', '403'], debitCredit: 'CREDIT' },
          { id: 'short_term_borrowings', label: 'Short-term Borrowings', accounts: ['164', '519'], debitCredit: 'CREDIT' },
          { id: 'tax_payable', label: 'Current Tax Payable', accounts: ['441', '442'], debitCredit: 'CREDIT' },
          { id: 'accruals', label: 'Accruals and Deferred Income', accounts: ['487'], debitCredit: 'CREDIT' },
          { id: 'total_current_liabilities', label: 'TOTAL CURRENT LIABILITIES', formula: '=trade_payables+short_term_borrowings+tax_payable+accruals' }
        ]
      },
      {
        id: 'total_equity_liabilities',
        title: 'TOTAL EQUITY AND LIABILITIES',
        fields: [
          { id: 'total_equity_liabilities', label: 'TOTAL EQUITY AND LIABILITIES', formula: '=total_equity+total_non_current_liabilities+total_current_liabilities' }
        ]
      }
    ],
    balanceChecks: [
      { left: ['total_assets'], right: ['total_equity_liabilities'], tolerance: 1.0 }
    ]
  },

  // Statement of Comprehensive Income
  {
    documentType: 'IFRS_COMPREHENSIVE_INCOME',
    countryCode: 'XX',
    accountingStandard: 'IFRS',
    name: 'Statement of Comprehensive Income',
    description: 'Income Statement under IFRS for SMEs',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'revenue',
        title: 'REVENUE AND COST OF SALES',
        fields: [
          { id: 'revenue', label: 'Revenue', accounts: ['70', '701', '706', '707'], debitCredit: 'CREDIT' },
          { id: 'cost_of_sales', label: 'Cost of Sales', accounts: ['60', '601', '602'], debitCredit: 'DEBIT' },
          { id: 'gross_profit', label: 'GROSS PROFIT', formula: '=revenue-cost_of_sales' }
        ]
      },
      {
        id: 'operating_expenses',
        title: 'OPERATING EXPENSES',
        fields: [
          { id: 'distribution_costs', label: 'Distribution Costs', accounts: ['61'], debitCredit: 'DEBIT' },
          { id: 'administrative_expenses', label: 'Administrative Expenses', accounts: ['62', '63', '64'], debitCredit: 'DEBIT' },
          { id: 'employee_costs', label: 'Employee Benefits Expense', accounts: ['66'], debitCredit: 'DEBIT' },
          { id: 'depreciation', label: 'Depreciation and Amortisation', accounts: ['681'], debitCredit: 'DEBIT' },
          { id: 'other_expenses', label: 'Other Operating Expenses', accounts: ['65'], debitCredit: 'DEBIT' },
          { id: 'total_operating_expenses', label: 'Total Operating Expenses', formula: '=distribution_costs+administrative_expenses+employee_costs+depreciation+other_expenses' }
        ]
      },
      {
        id: 'operating_profit',
        title: 'OPERATING PROFIT',
        fields: [
          { id: 'other_income', label: 'Other Income', accounts: ['75', '78'], debitCredit: 'CREDIT' },
          { id: 'operating_profit', label: 'OPERATING PROFIT', formula: '=gross_profit-total_operating_expenses+other_income' }
        ]
      },
      {
        id: 'finance_costs',
        title: 'FINANCE COSTS',
        fields: [
          { id: 'finance_income', label: 'Finance Income', accounts: ['76', '77'], debitCredit: 'CREDIT' },
          { id: 'finance_costs', label: 'Finance Costs', accounts: ['67'], debitCredit: 'DEBIT' },
          { id: 'profit_before_tax', label: 'PROFIT BEFORE TAX', formula: '=operating_profit+finance_income-finance_costs' }
        ]
      },
      {
        id: 'tax',
        title: 'INCOME TAX',
        fields: [
          { id: 'income_tax_expense', label: 'Income Tax Expense', accounts: ['89'], debitCredit: 'DEBIT' },
          { id: 'profit_for_year', label: 'PROFIT FOR THE YEAR', formula: '=profit_before_tax-income_tax_expense' }
        ]
      },
      {
        id: 'other_comprehensive_income',
        title: 'OTHER COMPREHENSIVE INCOME',
        fields: [
          { id: 'revaluation_surplus', label: 'Revaluation Surplus', required: false },
          { id: 'foreign_exchange', label: 'Foreign Exchange Differences', required: false },
          { id: 'total_comprehensive_income', label: 'TOTAL COMPREHENSIVE INCOME', formula: '=profit_for_year+revaluation_surplus+foreign_exchange' }
        ]
      }
    ]
  },

  // Statement of Changes in Equity
  {
    documentType: 'IFRS_CHANGES_EQUITY',
    countryCode: 'XX',
    accountingStandard: 'IFRS',
    name: 'Statement of Changes in Equity',
    description: 'Statement of Changes in Equity under IFRS for SMEs',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'opening_balance',
        title: 'BALANCE AT BEGINNING OF PERIOD',
        fields: [
          { id: 'opening_share_capital', label: 'Share Capital', required: true },
          { id: 'opening_reserves', label: 'Reserves', required: true },
          { id: 'opening_retained_earnings', label: 'Retained Earnings', required: true },
          { id: 'opening_total', label: 'Total Equity - Opening', formula: '=opening_share_capital+opening_reserves+opening_retained_earnings' }
        ]
      },
      {
        id: 'movements',
        title: 'MOVEMENTS DURING THE PERIOD',
        fields: [
          { id: 'profit_for_year', label: 'Profit for the Year', required: true },
          { id: 'dividends', label: 'Dividends Paid', required: false },
          { id: 'new_shares_issued', label: 'Issue of Share Capital', required: false },
          { id: 'transfer_to_reserves', label: 'Transfer to Reserves', required: false }
        ]
      },
      {
        id: 'closing_balance',
        title: 'BALANCE AT END OF PERIOD',
        fields: [
          { id: 'closing_share_capital', label: 'Share Capital', formula: '=opening_share_capital+new_shares_issued' },
          { id: 'closing_reserves', label: 'Reserves', formula: '=opening_reserves+transfer_to_reserves' },
          { id: 'closing_retained_earnings', label: 'Retained Earnings', formula: '=opening_retained_earnings+profit_for_year-dividends-transfer_to_reserves' },
          { id: 'closing_total', label: 'Total Equity - Closing', formula: '=closing_share_capital+closing_reserves+closing_retained_earnings' }
        ]
      }
    ]
  },

  // Statement of Cash Flows
  {
    documentType: 'IFRS_CASH_FLOWS',
    countryCode: 'XX',
    accountingStandard: 'IFRS',
    name: 'Statement of Cash Flows',
    description: 'Cash Flow Statement under IFRS for SMEs',
    category: 'financial_statements',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'operating_activities',
        title: 'CASH FLOWS FROM OPERATING ACTIVITIES',
        fields: [
          { id: 'profit_before_tax', label: 'Profit Before Tax', required: true },
          { id: 'depreciation_amortisation', label: 'Depreciation and Amortisation', required: false },
          { id: 'interest_expense', label: 'Interest Expense', required: false },
          { id: 'interest_income', label: 'Interest Income', required: false },
          { id: 'change_inventories', label: 'Change in Inventories', required: false },
          { id: 'change_receivables', label: 'Change in Trade Receivables', required: false },
          { id: 'change_payables', label: 'Change in Trade Payables', required: false },
          { id: 'tax_paid', label: 'Income Tax Paid', required: false },
          { id: 'net_cash_operating', label: 'NET CASH FROM OPERATING ACTIVITIES', formula: '=profit_before_tax+depreciation_amortisation+interest_expense-interest_income+change_inventories+change_receivables+change_payables-tax_paid' }
        ]
      },
      {
        id: 'investing_activities',
        title: 'CASH FLOWS FROM INVESTING ACTIVITIES',
        fields: [
          { id: 'purchase_ppe', label: 'Purchase of Property, Plant & Equipment', required: false },
          { id: 'sale_ppe', label: 'Proceeds from Sale of PPE', required: false },
          { id: 'interest_received', label: 'Interest Received', required: false },
          { id: 'net_cash_investing', label: 'NET CASH FROM INVESTING ACTIVITIES', formula: '=-purchase_ppe+sale_ppe+interest_received' }
        ]
      },
      {
        id: 'financing_activities',
        title: 'CASH FLOWS FROM FINANCING ACTIVITIES',
        fields: [
          { id: 'proceeds_borrowings', label: 'Proceeds from Borrowings', required: false },
          { id: 'repayment_borrowings', label: 'Repayment of Borrowings', required: false },
          { id: 'proceeds_share_issue', label: 'Proceeds from Issue of Shares', required: false },
          { id: 'dividends_paid', label: 'Dividends Paid', required: false },
          { id: 'interest_paid', label: 'Interest Paid', required: false },
          { id: 'net_cash_financing', label: 'NET CASH FROM FINANCING ACTIVITIES', formula: '=proceeds_borrowings-repayment_borrowings+proceeds_share_issue-dividends_paid-interest_paid' }
        ]
      },
      {
        id: 'net_change_cash',
        title: 'NET CHANGE IN CASH',
        fields: [
          { id: 'net_increase_cash', label: 'Net Increase in Cash and Cash Equivalents', formula: '=net_cash_operating+net_cash_investing+net_cash_financing' },
          { id: 'cash_beginning', label: 'Cash and Cash Equivalents - Beginning', required: true },
          { id: 'cash_ending', label: 'Cash and Cash Equivalents - Ending', formula: '=cash_beginning+net_increase_cash' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES KENYA ==========

  // VAT Return Kenya
  {
    documentType: 'KE_VAT',
    countryCode: 'KE',
    accountingStandard: 'IFRS',
    name: 'Monthly VAT Return - Kenya',
    description: 'Value Added Tax Return (KRA)',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'output_vat',
        title: 'OUTPUT VAT',
        fields: [
          { id: 'taxable_sales_16', label: 'Taxable Sales (16%)', required: true },
          { id: 'output_vat_16', label: 'Output VAT (16%)', formula: '=taxable_sales_16*0.16' },
          { id: 'zero_rated_sales', label: 'Zero-Rated Sales', required: false },
          { id: 'exempt_sales', label: 'Exempt Sales', required: false },
          { id: 'total_output_vat', label: 'TOTAL OUTPUT VAT', formula: '=output_vat_16' }
        ]
      },
      {
        id: 'input_vat',
        title: 'INPUT VAT',
        fields: [
          { id: 'input_vat_purchases', label: 'Input VAT on Purchases', required: false },
          { id: 'input_vat_capital', label: 'Input VAT on Capital Goods', required: false },
          { id: 'total_input_vat', label: 'TOTAL INPUT VAT', formula: '=input_vat_purchases+input_vat_capital' }
        ]
      },
      {
        id: 'net_vat',
        title: 'NET VAT',
        fields: [
          { id: 'net_vat_payable', label: 'Net VAT Payable', formula: '=total_output_vat-total_input_vat' }
        ]
      }
    ]
  },

  // Corporate Income Tax Kenya
  {
    documentType: 'KE_CIT',
    countryCode: 'KE',
    accountingStandard: 'IFRS',
    name: 'Corporate Income Tax Return - Kenya',
    description: 'Annual Corporate Income Tax Return',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'taxable_income',
        title: 'TAXABLE INCOME',
        fields: [
          { id: 'accounting_profit', label: 'Accounting Profit Before Tax', required: true },
          { id: 'add_back', label: 'Add Back: Non-Deductible Expenses', required: false },
          { id: 'deductions', label: 'Less: Tax Deductions', required: false },
          { id: 'taxable_income', label: 'TAXABLE INCOME', formula: '=accounting_profit+add_back-deductions' }
        ]
      },
      {
        id: 'tax_computation',
        title: 'TAX COMPUTATION',
        fields: [
          { id: 'tax_rate', label: 'Corporate Tax Rate (30%)', type: 'percentage', required: true },
          { id: 'tax_payable', label: 'Tax Payable', formula: '=taxable_income*tax_rate/100' },
          { id: 'tax_credits', label: 'Less: Tax Credits', required: false },
          { id: 'instalment_tax_paid', label: 'Less: Instalment Tax Paid', required: false },
          { id: 'balance_due', label: 'BALANCE DUE/(REFUND)', formula: '=tax_payable-tax_credits-instalment_tax_paid' }
        ]
      }
    ]
  },

  // PAYE Kenya
  {
    documentType: 'KE_PAYE',
    countryCode: 'KE',
    accountingStandard: 'IFRS',
    name: 'PAYE Return - Kenya',
    description: 'Pay As You Earn Monthly Return',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'payroll',
        title: 'PAYROLL SUMMARY',
        fields: [
          { id: 'gross_salaries', label: 'Gross Salaries', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'paye_deducted', label: 'PAYE Deducted', required: true },
          { id: 'nssf', label: 'NSSF Contributions', required: false },
          { id: 'nhif', label: 'NHIF Contributions', required: false },
          { id: 'housing_levy', label: 'Housing Levy (1.5%)', formula: '=gross_salaries*0.015' }
        ]
      }
    ]
  },

  // Withholding Tax Kenya
  {
    documentType: 'KE_WHT',
    countryCode: 'KE',
    accountingStandard: 'IFRS',
    name: 'Withholding Tax Return - Kenya',
    description: 'Monthly Withholding Tax Return',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'withholding_tax',
        title: 'WITHHOLDING TAX',
        fields: [
          { id: 'wht_professional_fees', label: 'WHT on Professional Fees (5%)', required: false },
          { id: 'wht_rent', label: 'WHT on Rent (10%)', required: false },
          { id: 'wht_dividends', label: 'WHT on Dividends (5%)', required: false },
          { id: 'wht_interest', label: 'WHT on Interest (15%)', required: false },
          { id: 'total_wht', label: 'TOTAL WHT PAYABLE', formula: '=wht_professional_fees+wht_rent+wht_dividends+wht_interest' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES NIGERIA ==========

  // VAT Return Nigeria
  {
    documentType: 'NG_VAT',
    countryCode: 'NG',
    accountingStandard: 'IFRS',
    name: 'Monthly VAT Return - Nigeria',
    description: 'Value Added Tax Return (FIRS)',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'output_vat',
        title: 'OUTPUT VAT',
        fields: [
          { id: 'taxable_supplies_75', label: 'Taxable Supplies (7.5%)', required: true },
          { id: 'output_vat_75', label: 'Output VAT (7.5%)', formula: '=taxable_supplies_75*0.075' },
          { id: 'zero_rated', label: 'Zero-Rated Supplies', required: false },
          { id: 'exempt_supplies', label: 'Exempt Supplies', required: false },
          { id: 'total_output_vat', label: 'TOTAL OUTPUT VAT', formula: '=output_vat_75' }
        ]
      },
      {
        id: 'input_vat',
        title: 'INPUT VAT',
        fields: [
          { id: 'input_vat_goods', label: 'Input VAT on Goods', required: false },
          { id: 'input_vat_services', label: 'Input VAT on Services', required: false },
          { id: 'total_input_vat', label: 'TOTAL INPUT VAT', formula: '=input_vat_goods+input_vat_services' }
        ]
      },
      {
        id: 'net_vat',
        title: 'NET VAT',
        fields: [
          { id: 'net_vat_payable', label: 'Net VAT Payable', formula: '=total_output_vat-total_input_vat' }
        ]
      }
    ]
  },

  // Company Income Tax Nigeria
  {
    documentType: 'NG_CIT',
    countryCode: 'NG',
    accountingStandard: 'IFRS',
    name: 'Company Income Tax - Nigeria',
    description: 'Annual Company Income Tax Return',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'assessable_profit',
        title: 'ASSESSABLE PROFIT',
        fields: [
          { id: 'profit_before_tax', label: 'Profit Before Tax', required: true },
          { id: 'add_disallowable', label: 'Add: Disallowable Expenses', required: false },
          { id: 'less_allowances', label: 'Less: Capital Allowances', required: false },
          { id: 'assessable_profit', label: 'ASSESSABLE PROFIT', formula: '=profit_before_tax+add_disallowable-less_allowances' }
        ]
      },
      {
        id: 'tax_computation',
        title: 'TAX COMPUTATION',
        fields: [
          { id: 'tax_rate', label: 'CIT Rate (30%)', type: 'percentage', required: true },
          { id: 'cit_due', label: 'Company Income Tax Due', formula: '=assessable_profit*tax_rate/100' },
          { id: 'tertiary_education_tax', label: 'Tertiary Education Tax (2.5%)', formula: '=assessable_profit*0.025' },
          { id: 'estimated_tax_paid', label: 'Less: Estimated Tax Paid', required: false },
          { id: 'balance_payable', label: 'BALANCE PAYABLE', formula: '=cit_due+tertiary_education_tax-estimated_tax_paid' }
        ]
      }
    ]
  },

  // PAYE Nigeria
  {
    documentType: 'NG_PAYE',
    countryCode: 'NG',
    accountingStandard: 'IFRS',
    name: 'PAYE Returns - Nigeria',
    description: 'Pay As You Earn Monthly Returns',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'payroll',
        title: 'PAYROLL SUMMARY',
        fields: [
          { id: 'gross_emoluments', label: 'Gross Emoluments', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'paye_deducted', label: 'PAYE Deducted', required: true },
          { id: 'nhf', label: 'National Housing Fund (2.5%)', formula: '=gross_emoluments*0.025' },
          { id: 'pension', label: 'Pension Contributions (8%)', formula: '=gross_emoluments*0.08' },
          { id: 'itf', label: 'Industrial Training Fund (1%)', formula: '=gross_emoluments*0.01' }
        ]
      }
    ]
  },

  // Withholding Tax Nigeria
  {
    documentType: 'NG_WHT',
    countryCode: 'NG',
    accountingStandard: 'IFRS',
    name: 'Withholding Tax Returns - Nigeria',
    description: 'Monthly Withholding Tax Returns',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'withholding_tax',
        title: 'WITHHOLDING TAX',
        fields: [
          { id: 'wht_contracts', label: 'WHT on Contracts (5%)', required: false },
          { id: 'wht_professional_services', label: 'WHT on Professional Services (10%)', required: false },
          { id: 'wht_rent', label: 'WHT on Rent (10%)', required: false },
          { id: 'wht_dividends', label: 'WHT on Dividends (10%)', required: false },
          { id: 'wht_interest', label: 'WHT on Interest (10%)', required: false },
          { id: 'total_wht', label: 'TOTAL WHT', formula: '=wht_contracts+wht_professional_services+wht_rent+wht_dividends+wht_interest' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES GHANA ==========

  // VAT Return Ghana
  {
    documentType: 'GH_VAT',
    countryCode: 'GH',
    accountingStandard: 'IFRS',
    name: 'Monthly VAT Return - Ghana',
    description: 'Value Added Tax Return (GRA)',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'output_vat',
        title: 'OUTPUT VAT',
        fields: [
          { id: 'standard_rated_supplies', label: 'Standard Rated Supplies (15%)', required: true },
          { id: 'output_vat_15', label: 'Output VAT (12.5% + NHIL 2.5%)', formula: '=standard_rated_supplies*0.15' },
          { id: 'zero_rated', label: 'Zero-Rated Supplies', required: false },
          { id: 'exempt_supplies', label: 'Exempt Supplies', required: false },
          { id: 'total_output_vat', label: 'TOTAL OUTPUT VAT', formula: '=output_vat_15' }
        ]
      },
      {
        id: 'input_vat',
        title: 'INPUT VAT',
        fields: [
          { id: 'input_vat_local', label: 'Input VAT - Local Purchases', required: false },
          { id: 'input_vat_imports', label: 'Input VAT - Imports', required: false },
          { id: 'total_input_vat', label: 'TOTAL INPUT VAT', formula: '=input_vat_local+input_vat_imports' }
        ]
      },
      {
        id: 'net_vat',
        title: 'NET VAT',
        fields: [
          { id: 'net_vat_payable', label: 'Net VAT Payable', formula: '=total_output_vat-total_input_vat' }
        ]
      }
    ]
  },

  // Corporate Tax Ghana
  {
    documentType: 'GH_CIT',
    countryCode: 'GH',
    accountingStandard: 'IFRS',
    name: 'Corporate Tax Return - Ghana',
    description: 'Annual Corporate Tax Return',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'chargeable_income',
        title: 'CHARGEABLE INCOME',
        fields: [
          { id: 'gross_income', label: 'Gross Income', required: true },
          { id: 'deductible_expenses', label: 'Less: Deductible Expenses', required: false },
          { id: 'capital_allowances', label: 'Less: Capital Allowances', required: false },
          { id: 'chargeable_income', label: 'CHARGEABLE INCOME', formula: '=gross_income-deductible_expenses-capital_allowances' }
        ]
      },
      {
        id: 'tax_computation',
        title: 'TAX COMPUTATION',
        fields: [
          { id: 'tax_rate', label: 'Corporate Tax Rate (25%)', type: 'percentage', required: true },
          { id: 'tax_payable', label: 'Tax Payable', formula: '=chargeable_income*tax_rate/100' },
          { id: 'tax_paid', label: 'Less: Tax Already Paid', required: false },
          { id: 'balance_due', label: 'BALANCE DUE', formula: '=tax_payable-tax_paid' }
        ]
      }
    ]
  },

  // PAYE Ghana
  {
    documentType: 'GH_PAYE',
    countryCode: 'GH',
    accountingStandard: 'IFRS',
    name: 'PAYE Returns - Ghana',
    description: 'Pay As You Earn Monthly Returns',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'payroll',
        title: 'PAYROLL SUMMARY',
        fields: [
          { id: 'gross_salaries', label: 'Gross Salaries', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'paye_deducted', label: 'PAYE Deducted', required: true },
          { id: 'ssnit_employee', label: 'SSNIT Employee (5.5%)', formula: '=gross_salaries*0.055' },
          { id: 'ssnit_employer', label: 'SSNIT Employer (13%)', formula: '=gross_salaries*0.13' }
        ]
      }
    ]
  },

  // Withholding Tax Ghana
  {
    documentType: 'GH_WHT',
    countryCode: 'GH',
    accountingStandard: 'IFRS',
    name: 'Withholding Tax - Ghana',
    description: 'Monthly Withholding Tax Returns',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'withholding_tax',
        title: 'WITHHOLDING TAX',
        fields: [
          { id: 'wht_services', label: 'WHT on Services (7.5%)', required: false },
          { id: 'wht_goods', label: 'WHT on Goods (3%)', required: false },
          { id: 'wht_dividends', label: 'WHT on Dividends (8%)', required: false },
          { id: 'wht_interest', label: 'WHT on Interest (8%)', required: false },
          { id: 'total_wht', label: 'TOTAL WHT', formula: '=wht_services+wht_goods+wht_dividends+wht_interest' }
        ]
      }
    ]
  },

  // ========== DÉCLARATIONS FISCALES AFRIQUE DU SUD ==========

  // VAT Return South Africa
  {
    documentType: 'ZA_VAT201',
    countryCode: 'ZA',
    accountingStandard: 'IFRS',
    name: 'VAT Return (VAT201) - South Africa',
    description: 'Value-Added Tax Return',
    category: 'tax_returns',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'output_tax',
        title: 'OUTPUT TAX',
        fields: [
          { id: 'standard_rated_supplies', label: 'Standard Rated Supplies (15%)', required: true },
          { id: 'output_tax_15', label: 'Output Tax (15%)', formula: '=standard_rated_supplies*0.15' },
          { id: 'zero_rated', label: 'Zero-Rated Supplies', required: false },
          { id: 'exempt_supplies', label: 'Exempt Supplies', required: false },
          { id: 'total_output_tax', label: 'TOTAL OUTPUT TAX', formula: '=output_tax_15' }
        ]
      },
      {
        id: 'input_tax',
        title: 'INPUT TAX',
        fields: [
          { id: 'input_tax_local', label: 'Input Tax - Local Purchases', required: false },
          { id: 'input_tax_imports', label: 'Input Tax - Imports', required: false },
          { id: 'total_input_tax', label: 'TOTAL INPUT TAX', formula: '=input_tax_local+input_tax_imports' }
        ]
      },
      {
        id: 'net_vat',
        title: 'NET VAT',
        fields: [
          { id: 'net_vat_payable', label: 'Net VAT Payable/(Refundable)', formula: '=total_output_tax-total_input_tax' }
        ]
      }
    ]
  },

  // Corporate Income Tax South Africa
  {
    documentType: 'ZA_IT14',
    countryCode: 'ZA',
    accountingStandard: 'IFRS',
    name: 'Corporate Income Tax (IT14) - South Africa',
    description: 'Annual Income Tax Return for Companies',
    category: 'tax_returns',
    frequency: 'ANNUAL',
    isMandatory: true,
    sections: [
      {
        id: 'taxable_income',
        title: 'TAXABLE INCOME',
        fields: [
          { id: 'accounting_profit', label: 'Accounting Profit', required: true },
          { id: 'permanent_differences', label: 'Permanent Differences', required: false },
          { id: 'temporary_differences', label: 'Temporary Differences', required: false },
          { id: 'taxable_income', label: 'TAXABLE INCOME', formula: '=accounting_profit+permanent_differences+temporary_differences' }
        ]
      },
      {
        id: 'tax_computation',
        title: 'TAX COMPUTATION',
        fields: [
          { id: 'tax_rate', label: 'Corporate Tax Rate (27%)', type: 'percentage', required: true },
          { id: 'normal_tax', label: 'Normal Tax', formula: '=taxable_income*tax_rate/100' },
          { id: 'sbc_tax_credit', label: 'Less: SBC Tax Credit', required: false },
          { id: 'provisional_tax', label: 'Less: Provisional Tax Paid', required: false },
          { id: 'balance_payable', label: 'BALANCE PAYABLE/(REFUND)', formula: '=normal_tax-sbc_tax_credit-provisional_tax' }
        ]
      }
    ]
  },

  // PAYE South Africa
  {
    documentType: 'ZA_EMP201',
    countryCode: 'ZA',
    accountingStandard: 'IFRS',
    name: 'PAYE Return (EMP201) - South Africa',
    description: 'Monthly Employer Return',
    category: 'social_declarations',
    frequency: 'MONTHLY',
    isMandatory: true,
    sections: [
      {
        id: 'payroll',
        title: 'PAYROLL DEDUCTIONS',
        fields: [
          { id: 'gross_remuneration', label: 'Gross Remuneration', accounts: ['661'], debitCredit: 'DEBIT' },
          { id: 'paye', label: 'PAYE Deducted', required: true },
          { id: 'uif_employee', label: 'UIF Employee (1%)', formula: '=gross_remuneration*0.01' },
          { id: 'uif_employer', label: 'UIF Employer (1%)', formula: '=gross_remuneration*0.01' },
          { id: 'sdl', label: 'Skills Development Levy (1%)', formula: '=gross_remuneration*0.01' },
          { id: 'total_payable', label: 'TOTAL PAYABLE TO SARS', formula: '=paye+uif_employee+uif_employer+sdl' }
        ]
      }
    ]
  },

  // Provisional Tax South Africa
  {
    documentType: 'ZA_IRP6',
    countryCode: 'ZA',
    accountingStandard: 'IFRS',
    name: 'Provisional Tax (IRP6) - South Africa',
    description: 'Provisional Tax Return',
    category: 'tax_returns',
    frequency: 'QUARTERLY',
    isMandatory: true,
    sections: [
      {
        id: 'estimated_taxable_income',
        title: 'ESTIMATED TAXABLE INCOME',
        fields: [
          { id: 'estimated_income', label: 'Estimated Taxable Income for Year', required: true },
          { id: 'tax_rate', label: 'Tax Rate (27%)', type: 'percentage', required: true },
          { id: 'estimated_tax', label: 'Estimated Tax for Year', formula: '=estimated_income*tax_rate/100' }
        ]
      },
      {
        id: 'provisional_payment',
        title: 'PROVISIONAL TAX PAYMENT',
        fields: [
          { id: 'first_payment_paid', label: 'First Provisional Payment (if applicable)', required: false },
          { id: 'second_payment_due', label: 'Second Provisional Payment Due', formula: '=estimated_tax-first_payment_paid' }
        ]
      }
    ]
  }
];

/**
 * Génère tous les templates IFRS
 */
export function generateAllIfrsTemplates(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return createTemplatesFromConfigs(IFRS_TEMPLATES_CONFIG);
}

/**
 * Récupère un template IFRS par son type
 */
export function getIfrsTemplateConfig(documentType: string): TemplateConfig | undefined {
  return IFRS_TEMPLATES_CONFIG.find(t => t.documentType === documentType);
}

/**
 * Liste des types de documents IFRS disponibles
 */
export const IFRS_DOCUMENT_TYPES = IFRS_TEMPLATES_CONFIG.map(t => t.documentType);

/**
 * Récupère les templates par pays
 */
export function getIfrsTemplatesByCountry(countryCode: string): TemplateConfig[] {
  return IFRS_TEMPLATES_CONFIG.filter(t =>
    t.countryCode === countryCode || t.countryCode === 'MULTI'
  );
}
