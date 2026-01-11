// taxConfigurations.ts - Multi-country tax rates and fiscal configurations
// Supports France, Belgium, SYSCOHADA countries, Maghreb countries, and IFRS countries

export interface VATRate {
  standard: number;
  reduced: number[];
  zeroRated: string[]; // List of goods/services with 0% VAT
  exemptions: string[];
}

export interface CorporateTaxConfig {
  standardRate: number;
  thresholds?: Array<{
    maxRevenue: number;
    rate: number;
    description: string;
  }>;
  reducedRates?: Array<{
    condition: string;
    rate: number;
  }>;
}

export interface TaxType {
  id: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  deadline: string; // e.g., "20 du mois suivant", "15 mai N+1"
  mandatory: boolean;
  applicableIf?: string; // Conditions for applicability
}

export interface DeclarationFormat {
  name: string;
  description: string;
  fileFormat: string; // e.g., "XML", "PDF", "Excel"
  submissionMethod: 'online' | 'paper' | 'both';
}

export interface CountryTaxConfiguration {
  countryCode: string;
  countryName: string;
  currency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'SCF' | 'IFRS';
  fiscalYearEnd: string; // e.g., "31/12", "30/06"

  vat: VATRate;
  corporateTax: CorporateTaxConfig;

  otherTaxes: Array<{
    id: string;
    name: string;
    rate?: number;
    description: string;
    calculationBase: string;
  }>;

  taxTypes: TaxType[];
  declarationFormats: DeclarationFormat[];

  // Compliance requirements
  complianceRequirements: {
    bookkeepingRetention: number; // years
    invoiceNumbering: 'sequential' | 'chronological' | 'any';
    electronicInvoicing: boolean;
    digitalBookkeeping: boolean;
  };
}

// ===========================
// FRANCE (PCG)
// ===========================
export const FRANCE_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'FR',
  countryName: 'France',
  currency: 'EUR',
  accountingStandard: 'PCG',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 20,
    reduced: [10, 5.5, 2.1],
    zeroRated: [
      'Exports hors UE',
      'Livraisons intracommunautaires',
      'Transport international'
    ],
    exemptions: [
      'Services médicaux',
      'Éducation',
      'Assurance',
      'Services financiers'
    ]
  },

  corporateTax: {
    standardRate: 25,
    thresholds: [
      {
        maxRevenue: 10000000,
        rate: 15,
        description: 'Taux réduit pour PME (sur les premiers 42 500€ de bénéfices)'
      }
    ],
    reducedRates: [
      {
        condition: 'Entreprises innovantes (JEI)',
        rate: 10
      }
    ]
  },

  otherTaxes: [
    {
      id: 'CFE',
      name: 'Cotisation Foncière des Entreprises',
      description: 'Taxe locale basée sur la valeur locative des biens immobiliers',
      calculationBase: 'Valeur locative cadastrale'
    },
    {
      id: 'CVAE',
      name: 'Cotisation sur la Valeur Ajoutée des Entreprises',
      rate: 0.75,
      description: 'Taxe sur la valeur ajoutée pour CA > 500k EUR',
      calculationBase: 'Valeur ajoutée'
    },
    {
      id: 'TAXE_APPRENTISSAGE',
      name: 'Taxe d\'apprentissage',
      rate: 0.68,
      description: 'Contribution au financement de la formation professionnelle',
      calculationBase: 'Masse salariale'
    },
    {
      id: 'FORMATION_CONTINUE',
      name: 'Contribution à la formation professionnelle',
      rate: 1,
      description: 'Obligatoire pour toutes les entreprises',
      calculationBase: 'Masse salariale'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_CA3',
      name: 'Déclaration TVA (CA3)',
      description: 'Régime réel normal - Déclaration mensuelle de TVA',
      frequency: 'monthly',
      deadline: '19 du mois suivant',
      mandatory: true,
      applicableIf: 'CA > 238 000€ (services) ou 789 000€ (ventes)'
    },
    {
      id: 'TVA_CA12',
      name: 'Déclaration TVA (CA12)',
      description: 'Régime réel simplifié - Déclaration annuelle de TVA',
      frequency: 'annual',
      deadline: '2ème jour ouvré suivant le 1er mai',
      mandatory: true,
      applicableIf: 'CA < 238 000€ (services) ou 789 000€ (ventes)'
    },
    {
      id: 'TVA_CA12E',
      name: 'Déclaration TVA (CA12E)',
      description: 'Régime réel simplifié - Déclaration trimestrielle de TVA avec acomptes',
      frequency: 'quarterly',
      deadline: 'Dernier jour du mois suivant le trimestre',
      mandatory: false,
      applicableIf: 'Option pour le régime simplifié avec acomptes trimestriels'
    },
    {
      id: 'IS',
      name: 'Impôt sur les Sociétés',
      description: 'Déclaration annuelle de résultat',
      frequency: 'annual',
      deadline: '15 mai N+1',
      mandatory: true
    },
    {
      id: 'LIASSE_FISCALE',
      name: 'Liasse Fiscale',
      description: 'Ensemble des déclarations fiscales annuelles',
      frequency: 'annual',
      deadline: '15 mai N+1',
      mandatory: true
    },
    {
      id: 'CFE',
      name: 'CFE - Cotisation Foncière des Entreprises',
      description: 'Déclaration de la taxe locale',
      frequency: 'annual',
      deadline: '15 décembre',
      mandatory: true
    },
    {
      id: 'CVAE',
      name: 'CVAE - Cotisation sur la Valeur Ajoutée',
      description: 'Pour entreprises avec CA > 500 000 EUR',
      frequency: 'annual',
      deadline: '3 mai N+1',
      mandatory: true,
      applicableIf: 'CA > 500 000 EUR'
    },
    {
      id: 'DSN',
      name: 'Déclaration Sociale Nominative',
      description: 'Déclaration mensuelle des cotisations sociales',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'FEC',
      description: 'Fichier des Écritures Comptables',
      fileFormat: 'CSV/TXT',
      submissionMethod: 'online'
    },
    {
      name: 'EDI-TVA',
      description: 'Échange de Données Informatisé pour la TVA',
      fileFormat: 'XML',
      submissionMethod: 'online'
    },
    {
      name: 'TD-Bilan',
      description: 'Télé-déclaration du Bilan',
      fileFormat: 'XML',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: true,
    digitalBookkeeping: true
  }
};

// ===========================
// BELGIUM (PCG Belge)
// ===========================
export const BELGIUM_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'BE',
  countryName: 'Belgique',
  currency: 'EUR',
  accountingStandard: 'PCG',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 21,
    reduced: [12, 6],
    zeroRated: ['Exports hors UE', 'Publications périodiques'],
    exemptions: ['Services médicaux', 'Éducation', 'Services financiers']
  },

  corporateTax: {
    standardRate: 25,
    thresholds: [
      {
        maxRevenue: 500000,
        rate: 20,
        description: 'Taux réduit pour PME'
      }
    ]
  },

  otherTaxes: [
    {
      id: 'COTISATION_SOCIALE',
      name: 'Cotisations sociales',
      rate: 25,
      description: 'Cotisations patronales',
      calculationBase: 'Salaire brut'
    }
  ],

  taxTypes: [
    {
      id: 'VAT_LISTING',
      name: 'Listing TVA',
      description: 'Déclaration mensuelle ou trimestrielle de TVA',
      frequency: 'monthly',
      deadline: '20 du mois suivant',
      mandatory: true
    },
    {
      id: 'CORPORATE_TAX',
      name: 'Impôt des Sociétés',
      description: 'Déclaration annuelle',
      frequency: 'annual',
      deadline: '30 septembre N+1',
      mandatory: true
    }
  ],

  declarationFormats: [
    {
      name: 'INTERVAT',
      description: 'Système de déclaration électronique TVA',
      fileFormat: 'XML',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 7,
    invoiceNumbering: 'sequential',
    electronicInvoicing: true,
    digitalBookkeeping: true
  }
};

// ===========================
// CÔTE D'IVOIRE (SYSCOHADA)
// ===========================
export const COTE_IVOIRE_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'CI',
  countryName: 'Côte d\'Ivoire',
  currency: 'XOF',
  accountingStandard: 'SYSCOHADA',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 18,
    reduced: [],
    zeroRated: ['Exports'],
    exemptions: ['Produits pharmaceutiques', 'Éducation', 'Services financiers']
  },

  corporateTax: {
    standardRate: 25,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'PATENTE',
      name: 'Contribution des Patentes',
      description: 'Taxe professionnelle annuelle',
      calculationBase: 'Chiffre d\'affaires'
    },
    {
      id: 'TSA',
      name: 'Taxe sur les Salaires',
      rate: 1.5,
      description: 'Taxe patronale sur les salaires',
      calculationBase: 'Masse salariale'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_MENSUELLE',
      name: 'Déclaration TVA',
      description: 'Déclaration mensuelle de TVA',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true
    },
    {
      id: 'BIC',
      name: 'Bénéfices Industriels et Commerciaux',
      description: 'Déclaration annuelle de résultats',
      frequency: 'annual',
      deadline: '30 avril N+1',
      mandatory: true
    },
    {
      id: 'CNPS',
      name: 'Déclaration CNPS',
      description: 'Cotisations sociales mensuelles',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'e-impots',
      description: 'Plateforme de télédéclaration DGI',
      fileFormat: 'PDF/Online',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// SENEGAL (SYSCOHADA)
// ===========================
export const SENEGAL_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'SN',
  countryName: 'Sénégal',
  currency: 'XOF',
  accountingStandard: 'SYSCOHADA',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 18,
    reduced: [],
    zeroRated: ['Exports'],
    exemptions: ['Produits de première nécessité', 'Médicaments', 'Éducation']
  },

  corporateTax: {
    standardRate: 30,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'CFE',
      name: 'Contribution Forfaitaire à la Charge des Employeurs',
      rate: 3,
      description: 'Taxe sur masse salariale',
      calculationBase: 'Masse salariale'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_MENSUELLE',
      name: 'Déclaration TVA',
      description: 'Déclaration mensuelle de TVA',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true
    },
    {
      id: 'IS',
      name: 'Impôt sur les Sociétés',
      description: 'Déclaration annuelle',
      frequency: 'annual',
      deadline: '30 avril N+1',
      mandatory: true
    },
    {
      id: 'CSS',
      name: 'Caisse de Sécurité Sociale',
      description: 'Déclaration mensuelle des cotisations',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'e-Tax',
      description: 'Système de télédéclaration DGID',
      fileFormat: 'Online/PDF',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// CAMEROON (SYSCOHADA)
// ===========================
export const CAMEROON_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'CM',
  countryName: 'Cameroun',
  currency: 'XAF',
  accountingStandard: 'SYSCOHADA',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 19.25,
    reduced: [],
    zeroRated: ['Exports'],
    exemptions: ['Produits alimentaires de base', 'Médicaments', 'Éducation']
  },

  corporateTax: {
    standardRate: 33,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'PATENTE',
      name: 'Contribution des Patentes',
      description: 'Taxe professionnelle',
      calculationBase: 'Chiffre d\'affaires'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_MENSUELLE',
      name: 'Déclaration TVA',
      description: 'Déclaration mensuelle de TVA',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true
    },
    {
      id: 'IS',
      name: 'Impôt sur les Sociétés',
      description: 'Déclaration annuelle',
      frequency: 'annual',
      deadline: '15 mars N+1',
      mandatory: true
    },
    {
      id: 'CNPS',
      name: 'Caisse Nationale de Prévoyance Sociale',
      description: 'Déclaration mensuelle',
      frequency: 'monthly',
      deadline: '15 du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'e-Tax Cameroun',
      description: 'Plateforme de télédéclaration',
      fileFormat: 'Online',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// MOROCCO (SCF)
// ===========================
export const MOROCCO_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'MA',
  countryName: 'Maroc',
  currency: 'MAD',
  accountingStandard: 'SCF',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 20,
    reduced: [14, 10, 7],
    zeroRated: ['Exports', 'Produits de première nécessité'],
    exemptions: ['Services médicaux', 'Éducation']
  },

  corporateTax: {
    standardRate: 31,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'PATENTE',
      name: 'Taxe Professionnelle',
      description: 'Taxe locale annuelle',
      calculationBase: 'Valeur locative'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_MENSUELLE',
      name: 'Déclaration TVA',
      description: 'Déclaration mensuelle ou trimestrielle',
      frequency: 'monthly',
      deadline: 'Fin du mois suivant',
      mandatory: true
    },
    {
      id: 'IS',
      name: 'Impôt sur les Sociétés',
      description: 'Déclaration annuelle',
      frequency: 'annual',
      deadline: '31 mars N+1',
      mandatory: true
    },
    {
      id: 'CNSS',
      name: 'Caisse Nationale de Sécurité Sociale',
      description: 'Déclaration mensuelle',
      frequency: 'monthly',
      deadline: 'Fin du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'SIMPL',
      description: 'Système d\'Information de la DGI',
      fileFormat: 'XML/Online',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: true,
    digitalBookkeeping: true
  }
};

// ===========================
// ALGERIA (SCF)
// ===========================
export const ALGERIA_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'DZ',
  countryName: 'Algérie',
  currency: 'DZD',
  accountingStandard: 'SCF',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 19,
    reduced: [9],
    zeroRated: ['Exports', 'Produits alimentaires de base'],
    exemptions: ['Services médicaux', 'Éducation']
  },

  corporateTax: {
    standardRate: 26,
    thresholds: [
      {
        maxRevenue: 10000000,
        rate: 19,
        description: 'Taux réduit pour activités de production'
      }
    ]
  },

  otherTaxes: [
    {
      id: 'TAP',
      name: 'Taxe sur l\'Activité Professionnelle',
      rate: 2,
      description: 'Taxe sur le CA',
      calculationBase: 'Chiffre d\'affaires'
    }
  ],

  taxTypes: [
    {
      id: 'TVA_MENSUELLE',
      name: 'Déclaration TVA',
      description: 'Déclaration mensuelle de TVA',
      frequency: 'monthly',
      deadline: '20 du mois suivant',
      mandatory: true
    },
    {
      id: 'IBS',
      name: 'Impôt sur les Bénéfices des Sociétés',
      description: 'Déclaration annuelle',
      frequency: 'annual',
      deadline: '30 avril N+1',
      mandatory: true
    },
    {
      id: 'CNAS',
      name: 'Caisse Nationale des Assurances Sociales',
      description: 'Déclaration mensuelle',
      frequency: 'monthly',
      deadline: 'Fin du mois suivant',
      mandatory: true,
      applicableIf: 'Présence de salariés'
    }
  ],

  declarationFormats: [
    {
      name: 'G50',
      description: 'Déclaration série G',
      fileFormat: 'PDF',
      submissionMethod: 'both'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 10,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// NIGERIA (IFRS)
// ===========================
export const NIGERIA_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'NG',
  countryName: 'Nigeria',
  currency: 'NGN',
  accountingStandard: 'IFRS',
  fiscalYearEnd: '31/12',

  vat: {
    standard: 7.5,
    reduced: [],
    zeroRated: ['Exports', 'Basic food items'],
    exemptions: ['Medical services', 'Education']
  },

  corporateTax: {
    standardRate: 30,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'WHT',
      name: 'Withholding Tax',
      rate: 5,
      description: 'Tax on certain payments',
      calculationBase: 'Payment amount'
    }
  ],

  taxTypes: [
    {
      id: 'VAT_MONTHLY',
      name: 'VAT Return',
      description: 'Monthly VAT declaration',
      frequency: 'monthly',
      deadline: '21st of following month',
      mandatory: true
    },
    {
      id: 'CIT',
      name: 'Companies Income Tax',
      description: 'Annual tax return',
      frequency: 'annual',
      deadline: '30 June N+1',
      mandatory: true
    }
  ],

  declarationFormats: [
    {
      name: 'FIRS e-Filing',
      description: 'Electronic filing system',
      fileFormat: 'Online',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 6,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// KENYA (IFRS)
// ===========================
export const KENYA_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'KE',
  countryName: 'Kenya',
  currency: 'KES',
  accountingStandard: 'IFRS',
  fiscalYearEnd: '30/06',

  vat: {
    standard: 16,
    reduced: [],
    zeroRated: ['Exports', 'Agricultural products'],
    exemptions: ['Medical services', 'Education', 'Financial services']
  },

  corporateTax: {
    standardRate: 30,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'PAYE',
      name: 'Pay As You Earn',
      description: 'Income tax on employment',
      calculationBase: 'Gross salary'
    }
  ],

  taxTypes: [
    {
      id: 'VAT_MONTHLY',
      name: 'VAT Return',
      description: 'Monthly VAT declaration',
      frequency: 'monthly',
      deadline: '20th of following month',
      mandatory: true
    },
    {
      id: 'CORPORATION_TAX',
      name: 'Corporation Tax',
      description: 'Annual tax return',
      frequency: 'annual',
      deadline: '6 months after year end',
      mandatory: true
    },
    {
      id: 'NSSF',
      name: 'National Social Security Fund',
      description: 'Monthly contributions',
      frequency: 'monthly',
      deadline: '9th of following month',
      mandatory: true,
      applicableIf: 'Presence of employees'
    }
  ],

  declarationFormats: [
    {
      name: 'iTax',
      description: 'KRA online tax system',
      fileFormat: 'Online',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 7,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// SOUTH AFRICA (IFRS)
// ===========================
export const SOUTH_AFRICA_TAX_CONFIG: CountryTaxConfiguration = {
  countryCode: 'ZA',
  countryName: 'South Africa',
  currency: 'ZAR',
  accountingStandard: 'IFRS',
  fiscalYearEnd: '28/02',

  vat: {
    standard: 15,
    reduced: [],
    zeroRated: ['Exports', 'Basic foodstuffs', '19 basic food items'],
    exemptions: ['Financial services', 'Residential rent', 'Education']
  },

  corporateTax: {
    standardRate: 27,
    thresholds: []
  },

  otherTaxes: [
    {
      id: 'SDL',
      name: 'Skills Development Levy',
      rate: 1,
      description: 'Training levy',
      calculationBase: 'Payroll'
    },
    {
      id: 'UIF',
      name: 'Unemployment Insurance Fund',
      rate: 2,
      description: 'Unemployment insurance',
      calculationBase: 'Payroll'
    }
  ],

  taxTypes: [
    {
      id: 'VAT_MONTHLY',
      name: 'VAT Return',
      description: 'Monthly or bi-monthly VAT return',
      frequency: 'monthly',
      deadline: '25th of following month',
      mandatory: true
    },
    {
      id: 'ITR14',
      name: 'Income Tax Return for Companies',
      description: 'Annual tax return',
      frequency: 'annual',
      deadline: '12 months after year end',
      mandatory: true
    },
    {
      id: 'PAYE',
      name: 'Pay As You Earn',
      description: 'Monthly employee tax',
      frequency: 'monthly',
      deadline: '7th of following month',
      mandatory: true,
      applicableIf: 'Presence of employees'
    }
  ],

  declarationFormats: [
    {
      name: 'eFiling',
      description: 'SARS electronic filing',
      fileFormat: 'Online/XML',
      submissionMethod: 'online'
    }
  ],

  complianceRequirements: {
    bookkeepingRetention: 5,
    invoiceNumbering: 'sequential',
    electronicInvoicing: false,
    digitalBookkeeping: true
  }
};

// ===========================
// CONFIGURATION MAP
// ===========================
export const TAX_CONFIGURATIONS: Record<string, CountryTaxConfiguration> = {
  FR: FRANCE_TAX_CONFIG,
  BE: BELGIUM_TAX_CONFIG,
  CI: COTE_IVOIRE_TAX_CONFIG,
  SN: SENEGAL_TAX_CONFIG,
  CM: CAMEROON_TAX_CONFIG,
  MA: MOROCCO_TAX_CONFIG,
  DZ: ALGERIA_TAX_CONFIG,
  NG: NIGERIA_TAX_CONFIG,
  KE: KENYA_TAX_CONFIG,
  ZA: SOUTH_AFRICA_TAX_CONFIG
};

// Helper function to get tax configuration by country code
export function getTaxConfiguration(countryCode: string): CountryTaxConfiguration | null {
  return TAX_CONFIGURATIONS[countryCode] || null;
}

// Helper function to get all available countries
export function getAvailableCountries(): Array<{ code: string; name: string }> {
  return Object.values(TAX_CONFIGURATIONS).map(config => ({
    code: config.countryCode,
    name: config.countryName
  }));
}

// Helper function to get VAT rate by type
export function getVATRate(countryCode: string, type: 'standard' | 'reduced' | 'zero'): number | number[] | null {
  const config = getTaxConfiguration(countryCode);
  if (!config) return null;

  switch (type) {
    case 'standard':
      return config.vat.standard;
    case 'reduced':
      return config.vat.reduced;
    case 'zero':
      return 0;
    default:
      return null;
  }
}

// Helper function to get corporate tax rate
export function getCorporateTaxRate(countryCode: string, revenue?: number): number | null {
  const config = getTaxConfiguration(countryCode);
  if (!config) return null;

  // Check if there are threshold-based rates
  if (config.corporateTax.thresholds && revenue !== undefined) {
    for (const threshold of config.corporateTax.thresholds) {
      if (revenue <= threshold.maxRevenue) {
        return threshold.rate;
      }
    }
  }

  return config.corporateTax.standardRate;
}
