/**
 * CassKai - Country-Specific Workflows Configuration
 * PHASE 3: Validations, Calculations, and Formats by Country
 * 
 * Defines:
 * - Country-specific validation rules
 * - Automatic calculation rules (financial ratios, tax calculations)
 * - File format specifications
 * - Tax authority requirements
 * - Regulatory thresholds
 */

// ============================================================================
// FRANCE - PCG WORKFLOWS
// ============================================================================

export const FR_VALIDATIONS = {
  // TVA Rules
  vat: {
    standardRate: 0.20,
    reducedRate: 0.055,
    superReducedRate: 0.021,
    zeroDRate: 0,
    thresholdForVATRegistration: 85000, // EUR
    thresholdForIntracommunitySales: 100000, // EUR
    declaration: {
      frequency: 'MONTHLY', // CA3, CA12
      dueDate: 'by 21st of month following reporting period',
      latePenalty: 0.005, // 0.5% per month
    },
  },

  // Balance Sheet Validation Rules
  balanceSheet: {
    requiredFields: [
      'fixed_assets',
      'current_assets',
      'inventories',
      'receivables',
      'cash',
      'equity',
      'short_term_debt',
      'long_term_debt',
    ],
    equalityTolerance: 0.01, // Assets = Liabilities + Equity (1% tolerance)
    minEquityRatio: 0.1, // Equity must be at least 10% of assets
    assetTurnaroundWarning: 0.5, // If current assets < 50% total assets
  },

  // Income Statement Rules
  incomeStatement: {
    requiredFields: ['sales_revenue', 'total_expenses', 'net_income'],
    profitMarginThresholdWarning: -0.1, // Warning if margin < -10%
    depreciationWarning: 0.15, // Warning if depreciation > 15% of fixed assets
  },

  // EBITDA Calculation
  ebitda: {
    formula: 'netIncome + interestExpense + taxExpense + depreciation + amortization',
    warningIfNegative: true,
  },

  // Format Specifications
  formats: {
    dateFormat: 'DD/MM/YYYY',
    numberDecimalSeparator: ',',
    numberThousandsSeparator: ' ',
    currencyCode: 'EUR',
    language: 'FR',
    xmlSchema: 'INFOGREFFE-2024',
  },

  // Filing Requirements
  filingRequirements: {
    annualReportFiling: {
      deadline: '2024-05-31', // 5 months after fiscal year end
      documents: ['balance_sheet', 'income_statement', 'management_report'],
      penalties: {
        late1to30days: 100,
        late31to60days: 200,
        late60plus: 500,
      },
    },
    quarterlyVATReturn: {
      dueDate: 'by 21st of month following quarter',
    },
  },
};

// ============================================================================
// SENEGAL - SYSCOHADA WORKFLOWS
// ============================================================================

export const SN_VALIDATIONS = {
  // OHADA Tax Rules
  taxRules: {
    corporateIncomeTaxRate: 0.30, // 30%
    vatRate: 0.18, // 18%
    thresholdForMandatorySCAAN: 300000000, // CFA francs
  },

  // SYSCOHADA Balance Sheet Structure
  balanceSheet: {
    requiredChapters: [
      'CHAPITRE_1_ASSETS', // Class 1-3
      'CHAPITRE_2_LIABILITIES', // Class 4-5
      'CHAPITRE_3_EQUITY', // Class 1-1, 11-1
    ],
    accountRangeValidation: [
      { range: '10*', description: 'Capital' },
      { range: '11*', description: 'Retained earnings' },
      { range: '12*', description: 'Provisions' },
      { range: '2*', description: 'Fixed assets' },
      { range: '3*', description: 'Current assets' },
      { range: '4*', description: 'Current liabilities' },
      { range: '5*', description: 'Long-term liabilities' },
    ],
    balanceCheckTolerance: 0.01,
  },

  // SCAAN Rules (Senegal Tax Authority)
  scaan: {
    name: 'Direction Générale des Impôts et Domaines (DGID)',
    mandatoryForCompaniesOver: 300000000, // CFA francs
    declaration: {
      frequency: 'ANNUAL',
      dueDate: 'by March 31st following fiscal year',
      format: 'XML + Paper',
    },
  },

  // Format Specifications
  formats: {
    dateFormat: 'DD/MM/YYYY',
    numberDecimalSeparator: '.',
    numberThousandsSeparator: ' ',
    currencyCode: 'XOF', // West African CFA franc
    language: 'FR',
    xmlSchema: 'OHADA-SYSCOHADA-v2024',
  },

  // Filing Requirements
  filingRequirements: {
    annualFilingRequirements: {
      documents: ['balance_sheet', 'income_statement', 'cash_flow', 'notes_to_accounts'],
      deadline: 'by March 31st',
      penalties: {
        lateSubmission: { amount: 50000, currency: 'XOF' }, // 50,000 CFA
        withoutImprimatur: 100000, // 100,000 CFA
      },
    },
  },
};

// ============================================================================
// CÔTE D'IVOIRE - SYSCOHADA WORKFLOWS
// ============================================================================

export const CI_VALIDATIONS = {
  // Tax Rules
  taxRules: {
    corporateIncomeTaxRate: 0.25, // 25%
    vatRate: 0.18, // 18%
  },

  // DGI (Direction Générale des Impôts)
  dgi: {
    name: 'Direction Générale des Impôts',
    filingRequirements: {
      annualFiling: {
        deadline: 'by March 31st',
        format: 'SYSCOHADA + Digital signature',
      },
      monthlyVATReturn: {
        deadline: 'by 20th of month following reporting',
      },
    },
  },

  // Format Specifications
  formats: {
    dateFormat: 'DD/MM/YYYY',
    numberDecimalSeparator: '.',
    numberThousandsSeparator: ' ',
    currencyCode: 'XOF',
    language: 'FR',
    digitalSignatureRequired: true,
  },
};

// ============================================================================
// CAMEROON - SYSCOHADA WORKFLOWS
// ============================================================================

export const CM_VALIDATIONS = {
  // DGI Cameroon
  tax: {
    corporateIncomeTaxRate: 0.30, // 30%
    vatRate: 0.195, // 19.5%
    minimumTaxRate: 0.005, // 0.5% on turnover
  },

  // DGED (Direction Générale des Douanes)
  filingRequirements: {
    annualSubmission: {
      deadline: 'by March 31st',
    },
  },

  formats: {
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'XAF', // Central African CFA franc
    language: 'FR',
  },
};

// ============================================================================
// KENYA - IFRS for SMEs WORKFLOWS
// ============================================================================

export const KE_VALIDATIONS = {
  // KRA Rules (Kenya Revenue Authority)
  tax: {
    corporateIncomeTaxRate: 0.30, // 30%
    vatRate: 0.16, // 16%
    thresholdForVATRegistration: 5000000, // KES
    thresholdForAudit: 40000000, // KES
  },

  // IFRS for SMEs Requirements
  ifrs: {
    standard: 'IFRS for SMEs',
    impairmentTesting: true,
    leaseAccounting: 'IFRS 16',
    requiredFinancialStatements: [
      'statement_of_financial_position',
      'statement_of_comprehensive_income',
      'statement_of_changes_in_equity',
      'statement_of_cash_flows',
      'notes',
    ],
  },

  // KRA Filing Requirements
  kra: {
    name: 'Kenya Revenue Authority',
    monthlyVATReturn: {
      dueDate: 'by 20th of month following reporting',
      penalties: {
        lateSubmission: 1000, // KES per day
        late30days: 100000, // KES
      },
    },
    annualTaxReturn: {
      dueDate: 'by June 30th',
      documents: ['financial_statements', 'tax_computation'],
    },
  },

  // Format Specifications
  formats: {
    dateFormat: 'DD/MM/YYYY',
    numberDecimalSeparator: '.',
    numberThousandsSeparator: ',',
    currencyCode: 'KES',
    language: 'EN',
  },
};

// ============================================================================
// NIGERIA - IFRS for SMEs WORKFLOWS
// ============================================================================

export const NG_VALIDATIONS = {
  // FIRS Rules (Federal Inland Revenue Service)
  tax: {
    corporateIncomeTaxRate: 0.30, // 30%
    vatRate: 0.075, // 7.5%
    thresholdForCIT: 25000000, // NGN
  },

  // FIRS Filing Requirements
  firs: {
    name: 'Federal Inland Revenue Service',
    annualTaxReturn: {
      dueDate: '90 days after fiscal year end',
      format: 'Digital (eForms)',
      penalties: {
        late: 0.0025, // 0.25% per day up to 50%
      },
    },
  },

  // Format Specifications
  formats: {
    dateFormat: 'DD/MM/YYYY',
    numberDecimalSeparator: '.',
    numberThousandsSeparator: ',',
    currencyCode: 'NGN',
    language: 'EN',
  },
};

// ============================================================================
// ALGERIA - SCF WORKFLOWS
// ============================================================================

export const DZ_VALIDATIONS = {
  // Tax Rules
  tax: {
    corporateIncomeTaxRate: 0.26, // 26%
    vatRate: 0.19, // 19%
  },

  // DGI Algeria
  dgi: {
    name: 'Direction Générale des Impôts',
    filingRequirements: {
      annualFiling: {
        deadline: 'by April 15th',
        format: 'SCF + Digital',
      },
    },
  },

  formats: {
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'DZD',
    language: 'AR/FR',
  },
};

// ============================================================================
// TUNISIA - SCF WORKFLOWS
// ============================================================================

export const TN_VALIDATIONS = {
  // Tax Rules
  tax: {
    corporateIncomeTaxRate: 0.25, // 25%
    vatRate: 0.19, // 19%
  },

  // DGI Tunisia
  dgi: {
    name: 'Direction Générale des Impôts',
    filingRequirements: {
      annualFiling: {
        deadline: 'by March 31st',
      },
    },
  },

  formats: {
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'TND',
    language: 'AR/FR',
  },
};

// ============================================================================
// MOROCCO - PCM WORKFLOWS
// ============================================================================

export const MA_VALIDATIONS = {
  // Tax Rules
  tax: {
    corporateIncomeTaxRate: 0.30, // 30%
    vatRate: 0.20, // 20%
    minimumTaxRate: 0.005, // 0.5% on turnover
  },

  // DGI Morocco
  dgi: {
    name: 'Direction Générale des Impôts',
    filingRequirements: {
      annualFiling: {
        deadline: 'by March 31st',
        format: 'PCM + Digital signature',
      },
    },
  },

  formats: {
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'MAD',
    language: 'AR/FR',
  },
};

// ============================================================================
// CONSOLIDATED COUNTRY WORKFLOWS MAP
// ============================================================================

export const COUNTRY_WORKFLOWS = {
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    standard: 'PCG',
    validations: FR_VALIDATIONS,
    taxAuthority: 'DGFiP',
    defaultLanguage: 'FR',
  },
  SN: {
    countryCode: 'SN',
    countryName: 'Senegal',
    standard: 'SYSCOHADA',
    validations: SN_VALIDATIONS,
    taxAuthority: 'DGID',
    defaultLanguage: 'FR',
  },
  CI: {
    countryCode: 'CI',
    countryName: 'Côte d\'Ivoire',
    standard: 'SYSCOHADA',
    validations: CI_VALIDATIONS,
    taxAuthority: 'DGI',
    defaultLanguage: 'FR',
  },
  CM: {
    countryCode: 'CM',
    countryName: 'Cameroon',
    standard: 'SYSCOHADA',
    validations: CM_VALIDATIONS,
    taxAuthority: 'DGED',
    defaultLanguage: 'FR',
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    standard: 'IFRS',
    validations: KE_VALIDATIONS,
    taxAuthority: 'KRA',
    defaultLanguage: 'EN',
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    standard: 'IFRS',
    validations: NG_VALIDATIONS,
    taxAuthority: 'FIRS',
    defaultLanguage: 'EN',
  },
  DZ: {
    countryCode: 'DZ',
    countryName: 'Algeria',
    standard: 'SCF',
    validations: DZ_VALIDATIONS,
    taxAuthority: 'DGI',
    defaultLanguage: 'AR',
  },
  TN: {
    countryCode: 'TN',
    countryName: 'Tunisia',
    standard: 'SCF',
    validations: TN_VALIDATIONS,
    taxAuthority: 'DGI',
    defaultLanguage: 'AR',
  },
  MA: {
    countryCode: 'MA',
    countryName: 'Morocco',
    standard: 'PCM',
    validations: MA_VALIDATIONS,
    taxAuthority: 'DGI',
    defaultLanguage: 'AR',
  },
};

// ============================================================================
// FINANCIAL RATIO CALCULATIONS
// ============================================================================

export const FINANCIAL_RATIOS = {
  // Liquidity Ratios
  currentRatio: {
    formula: 'current_assets / current_liabilities',
    optimalRange: { min: 1.5, max: 3.0 },
    warningThreshold: 1.0,
    criticalThreshold: 0.5,
  },

  quickRatio: {
    formula: '(current_assets - inventories) / current_liabilities',
    optimalRange: { min: 0.8, max: 1.5 },
    warningThreshold: 0.5,
  },

  cashRatio: {
    formula: 'cash / current_liabilities',
    optimalRange: { min: 0.2, max: 0.5 },
  },

  // Solvency Ratios
  debtToEquity: {
    formula: 'total_debt / total_equity',
    optimalRange: { min: 0.5, max: 2.0 },
    warningThreshold: 3.0,
  },

  debtToAssets: {
    formula: 'total_debt / total_assets',
    optimalRange: { min: 0.3, max: 0.6 },
  },

  equityRatio: {
    formula: 'total_equity / total_assets',
    optimalRange: { min: 0.4, max: 0.8 },
    warningThreshold: 0.2,
  },

  // Profitability Ratios
  grossProfitMargin: {
    formula: '(sales_revenue - cost_of_goods) / sales_revenue',
    optimalRange: { min: 0.2, max: 0.6 },
  },

  operatingProfitMargin: {
    formula: 'operating_income / sales_revenue',
    optimalRange: { min: 0.1, max: 0.3 },
  },

  netProfitMargin: {
    formula: 'net_income / sales_revenue',
    optimalRange: { min: 0.05, max: 0.15 },
    warningThreshold: 0.0,
  },

  returnOnAssets: {
    formula: 'net_income / total_assets',
    optimalRange: { min: 0.05, max: 0.15 },
  },

  returnOnEquity: {
    formula: 'net_income / total_equity',
    optimalRange: { min: 0.1, max: 0.3 },
  },

  // Efficiency Ratios
  assetTurnover: {
    formula: 'sales_revenue / total_assets',
    optimalRange: { min: 0.5, max: 2.0 },
  },

  receivablesTurnover: {
    formula: 'sales_revenue / accounts_receivable',
    optimalRange: { min: 4.0, max: 12.0 },
  },

  inventoryTurnover: {
    formula: 'cost_of_goods / inventories',
    optimalRange: { min: 2.0, max: 8.0 },
  },

  daysInInventory: {
    formula: '365 / inventory_turnover',
    optimalRange: { min: 45, max: 182 },
  },

  daysInReceivables: {
    formula: '365 / receivables_turnover',
    optimalRange: { min: 30, max: 60 },
  },
};
