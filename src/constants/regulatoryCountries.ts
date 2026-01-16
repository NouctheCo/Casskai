/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Configuration des pays et standards comptables supportés
 */

import type {
  CountryConfig,
  DocumentTypeConfig
} from '@/types/regulatory';

// ============================================================================
// AUTORITÉS FISCALES ET COMPTABLES
// ============================================================================

const FR_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts',
    nameEn: 'French Tax Authority',
    website: 'https://www.impots.gouv.fr',
    phone: '+33 (0)1 57 33 83 83',
    email: 'contact@dgfip.gouv.fr',
    address: '73-77 rue de Rivoli, 75004 Paris, France',
    onlinePortal: 'https://pro.impots.gouv.fr'
  },
  accountingAuthority: {
    name: 'Ordre des Experts-Comptables',
    nameEn: 'Order of Chartered Accountants',
    website: 'https://www.oec-paris.fr',
    phone: '+33 (0)1 44 88 57 00',
    email: 'contact@oec-paris.fr'
  }
};

const SENEGAL_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts et Domaines',
    nameEn: 'Senegal Tax Authority',
    website: 'https://www.impots.sn',
    phone: '+221 33 889 66 00',
    address: 'Dakar, Senegal',
    onlinePortal: 'https://e-tax.sn'
  }
};

const COTE_DIVOIRE_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts',
    nameEn: 'Côte d\'Ivoire Tax Authority',
    website: 'https://www.impots.ci',
    address: 'Abidjan, Côte d\'Ivoire'
  }
};

const CAMEROON_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts',
    nameEn: 'Cameroon Tax Authority',
    website: 'https://www.dgi.cm',
    address: 'Yaoundé, Cameroon'
  }
};

const KENYA_AUTORITES = {
  taxAuthority: {
    name: 'Kenya Revenue Authority',
    nameEn: 'Kenya Revenue Authority',
    website: 'https://www.kra.go.ke',
    phone: '+254 20 419 4000',
    address: 'Nairobi, Kenya',
    onlinePortal: 'https://itax.kra.go.ke'
  }
};

const NIGERIA_AUTORITES = {
  taxAuthority: {
    name: 'Federal Inland Revenue Service',
    nameEn: 'Federal Inland Revenue Service',
    website: 'https://www.firs.gov.ng',
    address: 'Lagos, Nigeria'
  }
};

const ALGERIA_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts',
    nameEn: 'Algeria Tax Authority',
    website: 'https://www.mfdgi.gov.dz',
    address: 'Algiers, Algeria'
  }
};

const TUNISIA_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Finances',
    nameEn: 'Tunisia Tax Authority',
    website: 'https://www.finances.gov.tn',
    address: 'Tunis, Tunisia'
  }
};

const MOROCCO_AUTORITES = {
  taxAuthority: {
    name: 'Direction Générale des Impôts',
    nameEn: 'Morocco Tax Authority',
    website: 'https://www.tax.gov.ma',
    address: 'Rabat, Morocco',
    onlinePortal: 'https://www.tax.gov.ma'
  }
};

const SOUTH_AFRICA_AUTORITES = {
  taxAuthority: {
    name: 'South African Revenue Service',
    nameEn: 'South African Revenue Service',
    website: 'https://www.sars.gov.za',
    address: 'Pretoria, South Africa'
  }
};

// ============================================================================
// DOCUMENTS PAR STANDARD COMPTABLE
// ============================================================================

const PCG_DOCUMENTS: DocumentTypeConfig[] = [
  // États financiers obligatoires
  {
    id: 'pcg_balance_sheet',
    name: 'Bilan',
    nameEn: 'Balance Sheet',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'pcg_income_statement',
    name: 'Compte de Résultat',
    nameEn: 'Income Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'pcg_trial_balance',
    name: 'Balance Générale',
    nameEn: 'Trial Balance',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  },
  {
    id: 'pcg_cash_flow',
    name: 'Tableau de Flux de Trésorerie',
    nameEn: 'Cash Flow Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  },
  // Déclarations fiscales - Impôt sur le revenu
  {
    id: 'pcg_2033_a',
    name: 'Déclaration 2033-A (Amortissements)',
    nameEn: 'Form 2033-A (Depreciation)',
    category: 'tax_returns',
    frequency: 'annual',
    mandatory: true,
    filingDeadline: '31/05',
    templateId: undefined
  },
  {
    id: 'pcg_2033_b',
    name: 'Déclaration 2033-B (Plus-values)',
    nameEn: 'Form 2033-B (Capital Gains)',
    category: 'tax_returns',
    frequency: 'annual',
    mandatory: false,
    filingDeadline: '31/05',
    templateId: undefined
  },
  // Déclarations de TVA
  {
    id: 'pcg_ca3',
    name: 'Déclaration CA 3 (TVA)',
    nameEn: 'VAT Return CA 3',
    category: 'tax_returns',
    frequency: 'monthly',
    mandatory: true,
    filingDeadline: '15',
    templateId: undefined
  },
  // Liasse fiscale
  {
    id: 'pcg_2050',
    name: 'Bilan Simplifié (2050)',
    nameEn: 'Simplified Balance Sheet',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    filingDeadline: '30/06',
    templateId: undefined
  },
  {
    id: 'pcg_2051',
    name: 'Compte de Résultat Simplifié (2051)',
    nameEn: 'Simplified Income Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    filingDeadline: '30/06',
    templateId: undefined
  },
  // Déclaration sociale
  {
    id: 'pcg_dads',
    name: 'Déclaration Annuelle de Données Sociales',
    nameEn: 'Annual Social Data Declaration',
    category: 'social_declarations',
    frequency: 'annual',
    mandatory: true,
    filingDeadline: '31/01',
    templateId: undefined
  }
];

const SYSCOHADA_DOCUMENTS: DocumentTypeConfig[] = [
  // États financiers SYSCOHADA
  {
    id: 'syscohada_balance_sheet',
    name: 'Bilan',
    nameEn: 'Balance Sheet',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'syscohada_income_statement',
    name: 'Compte de Résultat',
    nameEn: 'Income Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'syscohada_trial_balance',
    name: 'Balance Générale',
    nameEn: 'Trial Balance',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  },
  {
    id: 'syscohada_cash_flow',
    name: 'Tableau de Flux de Trésorerie',
    nameEn: 'Cash Flow Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  }
];

const IFRS_DOCUMENTS: DocumentTypeConfig[] = [
  // États financiers IFRS for SMEs
  {
    id: 'ifrs_sme_balance_sheet',
    name: 'Statement of Financial Position',
    nameEn: 'Statement of Financial Position',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'ifrs_sme_income_statement',
    name: 'Statement of Comprehensive Income',
    nameEn: 'Statement of Comprehensive Income',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'ifrs_sme_cash_flow',
    name: 'Statement of Cash Flows',
    nameEn: 'Statement of Cash Flows',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  },
  {
    id: 'ifrs_sme_equity_changes',
    name: 'Statement of Changes in Equity',
    nameEn: 'Statement of Changes in Equity',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  }
];

const SCF_DOCUMENTS: DocumentTypeConfig[] = [
  // États financiers SCF (Algérie/Tunisie)
  {
    id: 'scf_balance_sheet',
    name: 'Bilan',
    nameEn: 'Balance Sheet',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'scf_income_statement',
    name: 'Compte de Résultat',
    nameEn: 'Income Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'scf_cash_flow',
    name: 'Tableau de Flux de Trésorerie',
    nameEn: 'Cash Flow Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  }
];

const PCM_DOCUMENTS: DocumentTypeConfig[] = [
  // États financiers PCM (Maroc)
  {
    id: 'pcm_balance_sheet',
    name: 'Bilan',
    nameEn: 'Balance Sheet',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'pcm_income_statement',
    name: 'Compte de Résultat',
    nameEn: 'Income Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: true,
    templateId: undefined
  },
  {
    id: 'pcm_cash_flow',
    name: 'Tableau de Flux de Trésorerie',
    nameEn: 'Cash Flow Statement',
    category: 'financial_statements',
    frequency: 'annual',
    mandatory: false,
    templateId: undefined
  }
];

// ============================================================================
// CONFIGURATIONS PAR PAYS
// ============================================================================

export const COUNTRIES: Record<string, CountryConfig> = {
  // ========== FRANCE (PCG) ==========
  FR: {
    code: 'FR',
    name: 'France',
    nameEn: 'France',
    flag: '🇫🇷',
    accountingStandard: 'PCG',
    alternativeStandards: ['IFRS'],
    availableDocuments: PCG_DOCUMENTS,
    taxAuthority: FR_AUTORITES.taxAuthority,
    accountingAuthority: FR_AUTORITES.accountingAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'pcg_2033_a',
        frequency: 'annual',
        deadline: '31/05',
        description: 'Impôt sur le Revenu'
      },
      {
        documentType: 'pcg_ca3',
        frequency: 'monthly',
        deadline: '15',
        description: 'TVA'
      },
      {
        documentType: 'pcg_dads',
        frequency: 'annual',
        deadline: '31/01',
        description: 'Données Sociales'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'EUR',
    currencySymbol: ' EUR',
    onlineFilingAvailable: true,
    onlineFilingUrl: 'https://pro.impots.gouv.fr'
  },

  // ========== OHADA - PAYS FRANCOPHONES AFRICAINS ==========
  SN: {
    code: 'SN',
    name: 'Sénégal',
    nameEn: 'Senegal',
    flag: '🇸🇳',
    accountingStandard: 'SYSCOHADA',
    alternativeStandards: ['IFRS'],
    availableDocuments: SYSCOHADA_DOCUMENTS,
    taxAuthority: SENEGAL_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'syscohada_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    onlineFilingAvailable: true,
    onlineFilingUrl: 'https://e-tax.sn'
  },

  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    nameEn: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    accountingStandard: 'SYSCOHADA',
    alternativeStandards: ['IFRS'],
    availableDocuments: SYSCOHADA_DOCUMENTS,
    taxAuthority: COTE_DIVOIRE_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'syscohada_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    onlineFilingAvailable: false
  },

  CM: {
    code: 'CM',
    name: 'Cameroun',
    nameEn: 'Cameroon',
    flag: '🇨🇲',
    accountingStandard: 'SYSCOHADA',
    alternativeStandards: ['IFRS'],
    availableDocuments: SYSCOHADA_DOCUMENTS,
    taxAuthority: CAMEROON_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'syscohada_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'XAF',
    currencySymbol: 'CFA',
    onlineFilingAvailable: false
  },

  // ========== AFRIQUE ANGLOPHONE (IFRS for SMEs) ==========
  KE: {
    code: 'KE',
    name: 'Kenya',
    nameEn: 'Kenya',
    flag: '🇰🇪',
    accountingStandard: 'IFRS',
    alternativeStandards: [],
    availableDocuments: IFRS_DOCUMENTS,
    taxAuthority: KENYA_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'ifrs_sme_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'Financial Statements'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    onlineFilingAvailable: true,
    onlineFilingUrl: 'https://itax.kra.go.ke'
  },

  NG: {
    code: 'NG',
    name: 'Nigeria',
    nameEn: 'Nigeria',
    flag: '🇳🇬',
    accountingStandard: 'IFRS',
    alternativeStandards: [],
    availableDocuments: IFRS_DOCUMENTS,
    taxAuthority: NIGERIA_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'ifrs_sme_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'Financial Statements'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    onlineFilingAvailable: false
  },

  GH: {
    code: 'GH',
    name: 'Ghana',
    nameEn: 'Ghana',
    flag: '🇬🇭',
    accountingStandard: 'IFRS',
    alternativeStandards: [],
    availableDocuments: IFRS_DOCUMENTS,
    taxAuthority: {
      name: 'Ghana Revenue Authority',
      nameEn: 'Ghana Revenue Authority',
      website: 'https://www.gra.gov.gh',
      address: 'Accra, Ghana'
    },
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'ifrs_sme_balance_sheet',
        frequency: 'annual',
        deadline: '31/03',
        description: 'Financial Statements'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'GHS',
    currencySymbol: 'GH₵',
    onlineFilingAvailable: false
  },

  ZA: {
    code: 'ZA',
    name: 'Afrique du Sud',
    nameEn: 'South Africa',
    flag: '🇿🇦',
    accountingStandard: 'IFRS',
    alternativeStandards: [],
    availableDocuments: IFRS_DOCUMENTS,
    taxAuthority: SOUTH_AFRICA_AUTORITES.taxAuthority,
    fiscalYearEnd: '02-28',
    taxFilingDeadlines: [
      {
        documentType: 'ifrs_sme_balance_sheet',
        frequency: 'annual',
        deadline: '31/05',
        description: 'Financial Statements'
      }
    ],
    dateFormat: 'yyyy/MM/dd',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    onlineFilingAvailable: true,
    onlineFilingUrl: 'https://www.sars.gov.za'
  },

  // ========== MAGHREB (SCF/PCM) ==========
  DZ: {
    code: 'DZ',
    name: 'Algérie',
    nameEn: 'Algeria',
    flag: '🇩🇿',
    accountingStandard: 'SCF',
    alternativeStandards: ['IFRS'],
    availableDocuments: SCF_DOCUMENTS,
    taxAuthority: ALGERIA_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'scf_balance_sheet',
        frequency: 'annual',
        deadline: '30/04',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'DZD',
    currencySymbol: 'د.ج',
    onlineFilingAvailable: false
  },

  TN: {
    code: 'TN',
    name: 'Tunisie',
    nameEn: 'Tunisia',
    flag: '🇹🇳',
    accountingStandard: 'SCF',
    alternativeStandards: ['IFRS'],
    availableDocuments: SCF_DOCUMENTS,
    taxAuthority: TUNISIA_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'scf_balance_sheet',
        frequency: 'annual',
        deadline: '30/04',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'TND',
    currencySymbol: 'د.ت',
    onlineFilingAvailable: false
  },

  MA: {
    code: 'MA',
    name: 'Maroc',
    nameEn: 'Morocco',
    flag: '🇲🇦',
    accountingStandard: 'PCM',
    alternativeStandards: ['IFRS'],
    availableDocuments: PCM_DOCUMENTS,
    taxAuthority: MOROCCO_AUTORITES.taxAuthority,
    fiscalYearEnd: '12-31',
    taxFilingDeadlines: [
      {
        documentType: 'pcm_balance_sheet',
        frequency: 'annual',
        deadline: '31/05',
        description: 'États Financiers'
      }
    ],
    dateFormat: 'dd/MM/yyyy',
    currencyCode: 'MAD',
    currencySymbol: 'د.م.',
    onlineFilingAvailable: true,
    onlineFilingUrl: 'https://www.tax.gov.ma'
  }
};

// Liste complète des pays OHADA (33 pays)
export const OHADA_COUNTRIES = [
  'SN', // Sénégal
  'CI', // Côte d'Ivoire
  'CM', // Cameroun
  'ML', // Mali
  'BF', // Burkina Faso
  'NE', // Niger
  'TG', // Togo
  'BJ', // Bénin
  'GW', // Guinée-Bissau
  'GN', // Guinée
  'CF', // République Centrafricaine
  'CG', // Congo
  'CD', // RD Congo
  'GA', // Gabon
  'EQ', // Guinée Équatoriale
  'KM', // Comores
  'DJ', // Djibouti
  'MR', // Mauritanie
  // Autres pays africains...
];

export const ALL_COUNTRIES = Object.keys(COUNTRIES).map(code => COUNTRIES[code]);
