/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * 
 * NORMES COMPTABLES INTERNATIONALES - SOURCE UNIQUE DE VÉRITÉ
 * 
 * Document d'autorité pour la cohérence comptable et fiscale
 * À respecter strictement par tous les modules (Dashboard, Reports, RFA, etc.)
 */

// ============================================================================
// 1. PRINCIPES FONDAMENTAUX
// ============================================================================

/**
 * HIÉRARCHIE DES SOURCES COMPTABLES (ordre de priorité)
 * 
 * NIVEAU 1 (PRIMAIRE) - Journal entries (Écritures comptables postées)
 * ├─ Source officielle de vérité comptable
 * ├─ Seules les écritures en statut 'posted' ou 'validated' sont utilisées
 * ├─ Formule: Crédit - Débit pour comptes de revenues/assets
 * └─ Formule: Débit - Crédit pour comptes de charges/passifs
 * 
 * NIVEAU 2 (SECONDAIRE) - Chart of accounts (Cumul des soldes)
 * ├─ Utilisé pour vérifier/réconcilier les journal entries
 * ├─ Peut être utilisé si journal entries incomplet
 * └─ Rafraîchi après chaque posting d'écriture
 * 
 * NIVEAU 3 (TERTIAIRE) - Source documents (Invoices, Quotes, Stock movements)
 * ├─ Factures & devis (invoices, quotes tables)
 * ├─ Mouvements de stock (inventory_movements)
 * ├─ Paiements (payments)
 * └─ Fallback si Niveaux 1-2 incomplets
 */

// ============================================================================
// 2. CLASSIFICATION DE REVENUS PAR STANDARD
// ============================================================================

export const REVENUE_STANDARDS = {
  
  /**
   * FRANCE - Plan Comptable Général (PCG)
   * Référence: Plan Comptable Général, avec modifications pour IFRS optionnel
   */
  PCG: {
    name: 'Plan Comptable Général (France)',
    countries: ['FR'],
    revenue_classes: {
      '70': 'Ventes de marchandises',
      '71': 'Ventes de produits finis',
      '72': 'Ventes de services',
      '74': 'Travaux, études et prestations de services',
      '75': 'Autres activités',
      // Optionnel dans certains secteurs:
      '708': 'Retours analysés'
    },
    expense_classes: {
      '60': 'Achats de marchandises',
      '61': 'Services extérieurs',
      '62': 'Autres services extérieurs',
      '63': 'Fournitures et matières',
      '64': 'Rémunérations du personnel',
      '65': 'Autres charges',
      '66': 'Charges financières',
      '67': 'Charges exceptionnelles'
    },
    tax_accounts: {
      '44571': 'TVA collectée (Chargeabilité)',
      '44551': 'TVA déductible', 
      '44131': 'Acomptes impôt sur résultats'
    },
    net_income_account: '120', // Résultat de l'exercice
    balance_sheet_match: true,
    vat_handling: true,
    asset_classes: ['1', '2', '3'],
    liability_classes: ['4', '5']
  },

  /**
   * AFRIQUE - Union Monétaire Ouest Africaine (UEMOA/SYSCOHADA)
   * Référence: Système Comptable Ouest Africain Harmonisé
   * Pays: Sénégal, Côte d'Ivoire, Cameroun, etc.
   */
  SYSCOHADA: {
    name: 'SYSCOHADA (WAEMU - West Africa)',
    countries: ['SN', 'CI', 'CM', 'GA', 'ML', 'BJ', 'BF', 'TG'],
    revenue_classes: {
      '701': 'Ventes de marchandises',
      '702': 'Ventes de produits finis',
      '703': 'Ventes de produits résiduels',
      '704': 'Travaux facturés',
      '705': 'Services facturés',
      '706': 'Prestations de services',
      '707': 'Variation des stocks'
    },
    expense_classes: {
      '601': 'Achats de marchandises',
      '602': 'Variations de stocks marchandises',
      '611': 'Sous-traitance générale',
      '612': 'Redevances de crédit-bail',
      '613': 'Locations et loyers'
    },
    tax_accounts: {
      '4457': 'TVA collectée',
      '4455': 'TVA déductible sur achats',
      '4456': 'TVA déductible sur immobilisations'
    },
    net_income_account: '130', // Résultat de l'exercice
    balance_sheet_match: true,
    vat_handling: true,
    asset_classes: ['1', '2', '3'],
    liability_classes: ['4', '5']
  },

  /**
   * INTERNATIONAL - IFRS (International Financial Reporting Standards)
   * Référence: IAS 18 / IFRS 15 Revenue from Contracts with Customers
   */
  IFRS: {
    name: 'IFRS (International Standards)',
    countries: ['*'], // Global
    revenue_classes: {
      '6100': 'Operating revenues - Sales of goods',
      '6110': 'Operating revenues - Services', 
      '6120': 'Operating revenues - Contracts with customers',
      '6200': 'Other operating revenues'
    },
    expense_classes: {
      '5100': 'Cost of goods sold',
      '5200': 'Operating expenses',
      '5300': 'Administrative expenses'
    },
    tax_accounts: {
      '2100': 'Current tax liabilities',
      '2110': 'Deferred tax liabilities'
    },
    net_income_account: '3100', // Profit/(Loss)
    balance_sheet_match: true,
    vat_handling: false, // IFRS uses net amounts
    asset_classes: ['1', '2'],
    liability_classes: ['3', '4']
  },

  /**
   * AFRIQUE CENTRALE - SCF (Symon Comtable Francophone)
   * Référence: Système Comptable Francophone (utilisé dans certains pays francophones)
   */
  SCF: {
    name: 'SCF (Francophone Accounting)',
    countries: ['GA', 'CM', 'DJ', 'TD'],
    revenue_classes: {
      '70': 'Ventes de marchandises',
      '71': 'Ventes de produits finis',
      '72': 'Ventes de services'
    },
    expense_classes: {
      '60': 'Achats de marchandises',
      '61': 'Services',
      '62': 'Autres achats'
    },
    tax_accounts: {
      '445': 'Taxes collectées/déductibles'
    },
    net_income_account: '120',
    balance_sheet_match: true,
    vat_handling: true,
    asset_classes: ['1', '2', '3'],
    liability_classes: ['4', '5']
  }
};

// ============================================================================
// 3. RÈGLES DE CALCUL DU CHIFFRE D'AFFAIRES (CA / REVENUE)
// ============================================================================

export const REVENUE_CALCULATION_RULES = {
  
  /**
   * RÈGLE 1 : Source primaire - Journal entries
   */
  from_journal_entries: {
    description: 'Sum of posted journal entries on revenue accounts',
    methodology: `
      SELECT SUM(CASE WHEN jel.account_id IN (revenue_account_ids)
                     THEN (jel.credit_amount - jel.debit_amount)
                     ELSE 0 END) as revenue
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE je.company_id = :company_id
        AND je.status IN ('posted', 'validated')
        AND je.entry_date BETWEEN :start_date AND :end_date
    `,
    formula: 'CREDIT - DEBIT (for revenue accounts)',
    journal_entry_statuses: ['posted', 'validated'], // Never include draft
    notes: 'This is the OFFICIAL accounting record'
  },

  /**
   * RÈGLE 2 : Traitement TVA
   */
  vat_treatment: {
    'HT (Hors Taxes)': {
      description: 'Revenue excluding VAT (Default for accounting)',
      usage: 'Primary journal entry calculation, RFA, fiscal reports',
      method: 'Sum revenue accounts only (typically class 70)',
      vat_accounts_excluded: true,
      appropriate_for: ['accounting', 'rfa', 'fiscal_reports']
    },
    'TTC (Toutes Taxes Comprises)': {
      description: 'Revenue including VAT (For invoicing/comparison)',
      usage: 'Dashboard for total billing, invoice reconciliation',
      method: 'Sum revenue + VAT collected accounts (class 70 + 4457)',
      vat_accounts_included: true,
      appropriate_for: ['dashboard', 'invoice_comparison', 'management']
    }
  },

  /**
   * RÈGLE 3 : Par client vs Agrégé
   */
  client_filtering: {
    aggregated: {
      description: 'Total CA across all customers',
      query_filter: 'WHERE journal_entry_lines.client_id IS NOT NULL (any)',
      usage: 'Dashboard totals, fiscal reports, company KPIs'
    },
    by_client: {
      description: 'CA for specific customer',
      query_filter: 'WHERE journal_entry_lines.client_id = :client_id',
      usage: 'Customer profitability, RFA per contract, client statement'
    }
  },

  /**
   * RÈGLE 4 : Date range
   */
  date_ranges: {
    fiscal_year: {
      description: 'Calendar or fiscal year (Jan-Dec or custom)',
      usage: 'Annual reports, fiscal declarations',
      example: '2026-01-01 to 2026-12-31'
    },
    month: {
      description: 'Monthly reporting (latest vs prior)',
      usage: 'Dashboard trends, management accounts',
      example: 'Current month to date'
    },
    contract_year: {
      description: 'Contract period (start_date to end_date)',
      usage: 'RFA calculations per contract',
      example: '2025-01-15 to 2026-01-14'
    },
    custom_period: {
      description: 'User-defined date range',
      usage: 'Ad hoc reports',
      example: '2025-06-01 to 2025-12-31'
    }
  }
};

// ============================================================================
// 4. AUDIT TRAIL - TRAÇABILITÉ COMPTABLE
// ============================================================================

export const AUDIT_REQUIREMENTS = {
  
  /**
   * Chaque calcul de CA doit enregistrer:
   */
  mandatory_fields: [
    'calculation_id (unique identifier)',
    'company_id',
    'period_start',
    'period_end',
    'client_id (if applicable)',
    'standard (PCG/SYSCOHADA/IFRS/SCF)',
    'vat_treatment (HT or TTC)',
    'journal_entry_status_filter',
    'calculation_method (journal/chart/invoices)',
    'source_accounts (which revenue accounts)',
    'total_debit',
    'total_credit',
    'final_revenue',
    'reconciliation_vs_invoices',
    'confidence_score (0-100)',
    'warnings (if any)',
    'calculated_by (user/system)',
    'calculated_at (timestamp)',
    'hash (for integrity)'
  ],

  /**
   * Alignement avec standards internatuonaux
   */
  international_standards: {
    'IAASB': 'International Auditing and Assurance Standards Board',
    'IFAC': 'International Federation of Accountants',
    'AICPA': 'American Institute of CPAs (IRS compliance)',
    'FCA': 'French Ordre des Experts-Comptables',
    'OHADA': '17-country African harmonized accounting'
  }
};

// ============================================================================
// 5. RÉCONCILIATION & VALIDATION
// ============================================================================

export const RECONCILIATION_RULES = {
  
  /**
   * Variance acceptable entre sources
   */
  acceptable_variance: {
    journal_vs_chart: 'Must match (< 0.01 rounding tolerance)',
    accounting_vs_invoices: 'Usually < 2% if journal complete',
    explanation_required_if: 'Variance > 1% or > 1000 units'
  },

  /**
   * Actions si incohérence
   */
  correction_workflow: {
    detect: 'Run acceptedAccountingService.calculateRevenueWithAudit()',
    investigate: 'Check warnings and reconciliation_status',
    resolve: [
      'Post missing journal entries',
      'Verify draft/cancelled invoices excluded',
      'Check date ranges match period',
      'Confirm client filters applied correctly',
      'Validate accounting standard detection'
    ],
    audit_log: 'Record correction in audit_trail table'
  }
};

// ============================================================================
// 6. MODULE-SPECIFIC OVERRIDES (Non-final - all should use acceptedAccountingService)
// ============================================================================

export const MODULE_STANDARDS = {
  
  dashboard: {
    description: 'Real-time financial overview',
    revenue_source: 'acceptedAccountingService.calculateRevenueWithAudit()',
    vat_treatment: 'ttc', // Show total billing
    client_filter: 'aggregated',
    date_range: 'current_year',
    refresh_frequency: 'hourly',
    deprecation_note: 'dashboardStatsService & realDashboardKpiService → migrate to acceptedAccountingService'
  },

  rfa: {
    description: 'Year-end rebace calculations',
    revenue_source: 'acceptedAccountingService.calculateRevenueWithAudit()',
    vat_treatment: 'ht', // RFA typically on HT sales
    client_filter: 'by_client', // Per contract
    date_range: 'contract_period',
    deprecation_note: 'rfaCalculationService → migrate to acceptedAccountingService'
  },

  reports: {
    description: 'Fiscal/management reports',
    revenue_source: 'acceptedAccountingService.calculateRevenueWithAudit()',
    vat_treatment: 'ht', // Accounting standard
    client_filter: 'aggregated',
    date_range: 'fiscal_year',
    deprecation_note: 'All report services → use acceptedAccountingService'
  },

  invoicing: {
    description: 'Customer invoices',
    revenue_source: 'invoices table + journal reconciliation',
    vat_treatment: 'ttc', // Invoice includes VAT
    validation: 'Must reconcile with journal entries'
  }
};

// ============================================================================
// 7. VERIFICATION CHECKLIST
// ============================================================================

export const VERIFICATION_CHECKLIST = {
  
  before_reporting: {
    '1_journal_entries_posted': 'All revenue journal entries posted (not draft)',
    '2_accounting_standard_correct': 'Correct accounting standard selected for company',
    '3_date_range_defined': 'Report period clearly defined',
    '4_client_scope_defined': 'Understand if report is for 1 client or all',
    '5_vat_treatment_specified': 'Know if reporting HT or TTC',
    '6_reconciliation_ok': 'Invoices vs accounting entries within tolerance',
    '7_no_duplicate_entries': 'No duplicate journal entries',
    '8_status_correct': 'All entries in correct status (posted/validated)'
  },

  if_variance_detected: {
    '1_check_drafts': 'Are draft invoices/entries included?',
    '2_check_dates': 'Are all date ranges consistent?',
    '3_check_clients': 'Are all clients in scope?',
    '4_check_standards': 'Is accounting standard correctly detected?',
    '5_check_cancellations': 'Are cancelled/reversed entries properly handled?',
    '6_check_vat': 'Is VAT treatment consistent?',
    '7_run_audit': 'Execute calculateRevenueWithAudit() with full breakdown'
  }
};

export default {
  REVENUE_STANDARDS,
  REVENUE_CALCULATION_RULES,
  AUDIT_REQUIREMENTS,
  RECONCILIATION_RULES,
  MODULE_STANDARDS,
  VERIFICATION_CHECKLIST
};
