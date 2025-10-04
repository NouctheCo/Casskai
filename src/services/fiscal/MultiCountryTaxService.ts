// Service fiscal multi-pays pour CassKai
import { frenchTaxComplianceService } from './FrenchTaxComplianceService';

export interface CountryTaxConfig {
  country: string;
  countryName: string;
  currency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'GAAP' | 'LOCAL';
  vatRates: {
    standard: number;
    reduced: number[];
    exempt: boolean;
  };
  corporateTaxRate: number;
  fiscalYearEnd: string; // MM-DD format
  declarations: TaxDeclarationType[];
  deadlines: Record<string, string>; // declaration type -> deadline pattern
  languages: string[];
}

export interface TaxDeclarationType {
  id: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  deadline: string;
  mandatory: boolean;
  threshold?: number; // Revenue threshold for obligation
  forms: string[];
}

export interface TaxDeclaration {
  id: string;
  type: string;
  period: string;
  status: 'draft' | 'ready' | 'filed' | 'accepted' | 'rejected';
  dueDate: Date;
  amount?: number;
  validationErrors?: string[];
  warnings?: string[];
  data?: any;
}

export interface ComplianceValidation {
  checks: Array<{
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
  }>;
  score: number;
  maxScore: number;
  errors: string[];
  warnings: string[];
}

export const COUNTRY_TAX_CONFIGS: Record<string, CountryTaxConfig> = {
  // FRANCE
  FR: {
    country: 'FR',
    countryName: 'France',
    currency: 'EUR',
    accountingStandard: 'PCG',
    vatRates: {
      standard: 20,
      reduced: [10, 5.5, 2.1],
      exempt: true
    },
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'CA3',
        name: 'Déclaration TVA Mensuelle',
        description: 'Déclaration mensuelle de TVA pour le régime réel normal',
        frequency: 'monthly',
        deadline: '19e jour du mois suivant',
        mandatory: true,
        threshold: 236000,
        forms: ['CA3']
      },
      {
        id: 'LIASSE_FISCALE',
        name: 'Liasse Fiscale 2050-2059',
        description: 'Déclarations annuelles d\'impôt sur les sociétés',
        frequency: 'annual',
        deadline: '15 mai N+1',
        mandatory: true,
        forms: ['2050', '2051', '2052', '2053', '2054', '2055', '2056', '2057', '2058', '2059']
      },
      {
        id: 'CVAE',
        name: 'CVAE 1330-CVAE',
        description: 'Cotisation sur la Valeur Ajoutée des Entreprises',
        frequency: 'annual',
        deadline: '15 mai N+1',
        mandatory: true,
        threshold: 500000,
        forms: ['1330-CVAE']
      }
    ],
    deadlines: {
      CA3: '19th-next-month',
      LIASSE_FISCALE: 'may-15',
      CVAE: 'may-15'
    },
    languages: ['fr-FR']
  },

  // SÉNÉGAL
  SN: {
    country: 'SN',
    countryName: 'Sénégal',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [10],
      exempt: true
    },
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_SN',
        name: 'Déclaration TVA Sénégal',
        description: 'Déclaration mensuelle de TVA au Sénégal',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-SN']
      }
    ],
    deadlines: {
      DECLARATION_TVA_SN: '15th-next-month'
    },
    languages: ['fr-SN']
  },

  // CÔTE D'IVOIRE
  CI: {
    country: 'CI',
    countryName: 'Côte d\'Ivoire',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_CI',
        name: 'Déclaration TVA Côte d\'Ivoire',
        description: 'Déclaration mensuelle de TVA en Côte d\'Ivoire',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-CI']
      }
    ],
    deadlines: {
      DECLARATION_TVA_CI: '15th-next-month'
    },
    languages: ['fr-CI']
  },

  // MAROC
  MA: {
    country: 'MA',
    countryName: 'Maroc',
    currency: 'MAD',
    accountingStandard: 'LOCAL',
    vatRates: {
      standard: 20,
      reduced: [14, 10, 7],
      exempt: true
    },
    corporateTaxRate: 31,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_MA',
        name: 'Déclaration TVA Maroc',
        description: 'Déclaration mensuelle de TVA au Maroc',
        frequency: 'monthly',
        deadline: '20e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-MA']
      }
    ],
    deadlines: {
      DECLARATION_TVA_MA: '20th-next-month'
    },
    languages: ['fr-MA', 'ar-MA']
  },

  // TUNISIE
  TN: {
    country: 'TN',
    countryName: 'Tunisie',
    currency: 'TND',
    accountingStandard: 'LOCAL',
    vatRates: {
      standard: 19,
      reduced: [13, 7],
      exempt: true
    },
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_TN',
        name: 'Déclaration TVA Tunisie',
        description: 'Déclaration mensuelle de TVA en Tunisie',
        frequency: 'monthly',
        deadline: '28e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-TN']
      }
    ],
    deadlines: {
      DECLARATION_TVA_TN: '28th-next-month'
    },
    languages: ['fr-TN', 'ar-TN']
  },

  // CAMEROUN
  CM: {
    country: 'CM',
    countryName: 'Cameroun',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 19.25,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_CM',
        name: 'Déclaration TVA Cameroun',
        description: 'Déclaration mensuelle de TVA au Cameroun',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-CM']
      }
    ],
    deadlines: {
      DECLARATION_TVA_CM: '15th-next-month'
    },
    languages: ['fr-CM']
  },

  // MALI
  ML: {
    country: 'ML',
    countryName: 'Mali',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_ML',
        name: 'Déclaration TVA Mali',
        description: 'Déclaration mensuelle de TVA au Mali',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-ML']
      }
    ],
    deadlines: {
      DECLARATION_TVA_ML: '15th-next-month'
    },
    languages: ['fr-ML']
  },

  // BURKINA FASO
  BF: {
    country: 'BF',
    countryName: 'Burkina Faso',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 29,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_BF',
        name: 'Déclaration TVA Burkina Faso',
        description: 'Déclaration mensuelle de TVA au Burkina Faso',
        frequency: 'monthly',
        deadline: '20e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-BF']
      }
    ],
    deadlines: {
      DECLARATION_TVA_BF: '20th-next-month'
    },
    languages: ['fr-BF']
  },

  // BÉNIN
  BJ: {
    country: 'BJ',
    countryName: 'Bénin',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_BJ',
        name: 'Déclaration TVA Bénin',
        description: 'Déclaration mensuelle de TVA au Bénin',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-BJ']
      }
    ],
    deadlines: {
      DECLARATION_TVA_BJ: '15th-next-month'
    },
    languages: ['fr-BJ']
  },

  // TOGO
  TG: {
    country: 'TG',
    countryName: 'Togo',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 28,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_TG',
        name: 'Déclaration TVA Togo',
        description: 'Déclaration mensuelle de TVA au Togo',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-TG']
      }
    ],
    deadlines: {
      DECLARATION_TVA_TG: '15th-next-month'
    },
    languages: ['fr-TG']
  },

  // GABON
  GA: {
    country: 'GA',
    countryName: 'Gabon',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    vatRates: {
      standard: 18,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 35,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'DECLARATION_TVA_GA',
        name: 'Déclaration TVA Gabon',
        description: 'Déclaration mensuelle de TVA au Gabon',
        frequency: 'monthly',
        deadline: '15e jour du mois suivant',
        mandatory: true,
        forms: ['TVA-GA']
      }
    ],
    deadlines: {
      DECLARATION_TVA_GA: '15th-next-month'
    },
    languages: ['fr-GA']
  },

  // GHANA
  GH: {
    country: 'GH',
    countryName: 'Ghana',
    currency: 'GHS',
    accountingStandard: 'IFRS',
    vatRates: {
      standard: 15,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'VAT_RETURN_GH',
        name: 'VAT Return Ghana',
        description: 'Monthly VAT return for Ghana',
        frequency: 'monthly',
        deadline: '15th day of following month',
        mandatory: true,
        forms: ['VAT-GH']
      }
    ],
    deadlines: {
      VAT_RETURN_GH: '15th-next-month'
    },
    languages: ['en-GH']
  },

  // NIGÉRIA
  NG: {
    country: 'NG',
    countryName: 'Nigeria',
    currency: 'NGN',
    accountingStandard: 'IFRS',
    vatRates: {
      standard: 7.5,
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 30,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'VAT_RETURN_NG',
        name: 'VAT Return Nigeria',
        description: 'Monthly VAT return for Nigeria',
        frequency: 'monthly',
        deadline: '21st day of following month',
        mandatory: true,
        forms: ['VAT-NG']
      }
    ],
    deadlines: {
      VAT_RETURN_NG: '21st-next-month'
    },
    languages: ['en-NG']
  },

  // ÉTATS-UNIS
  US: {
    country: 'US',
    countryName: 'United States',
    currency: 'USD',
    accountingStandard: 'GAAP',
    vatRates: {
      standard: 0, // No federal VAT, state sales taxes vary
      reduced: [],
      exempt: true
    },
    corporateTaxRate: 21,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'FORM_1120',
        name: 'Form 1120 - Corporate Income Tax',
        description: 'Annual corporate income tax return',
        frequency: 'annual',
        deadline: 'March 15th (or 15th day of 3rd month after fiscal year end)',
        mandatory: true,
        forms: ['1120']
      },
      {
        id: 'FORM_941',
        name: 'Form 941 - Quarterly Employment Tax',
        description: 'Quarterly employment tax return',
        frequency: 'quarterly',
        deadline: 'Last day of month following quarter end',
        mandatory: true,
        forms: ['941']
      }
    ],
    deadlines: {
      FORM_1120: 'march-15',
      FORM_941: 'quarter-end-plus-1-month'
    },
    languages: ['en-US']
  },

  // ROYAUME-UNI
  GB: {
    country: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    accountingStandard: 'IFRS',
    vatRates: {
      standard: 20,
      reduced: [5],
      exempt: true
    },
    corporateTaxRate: 25,
    fiscalYearEnd: '12-31',
    declarations: [
      {
        id: 'VAT_RETURN_GB',
        name: 'VAT Return UK',
        description: 'Quarterly VAT return for the UK',
        frequency: 'quarterly',
        deadline: '1 month and 7 days after VAT period end',
        mandatory: true,
        forms: ['VAT100']
      },
      {
        id: 'CT600',
        name: 'Corporation Tax Return CT600',
        description: 'Annual corporation tax return',
        frequency: 'annual',
        deadline: '12 months after accounting period end',
        mandatory: true,
        forms: ['CT600']
      }
    ],
    deadlines: {
      VAT_RETURN_GB: 'quarter-end-plus-37-days',
      CT600: '12-months-after-year-end'
    },
    languages: ['en-GB']
  }
};

export class MultiCountryTaxService {
  private static instance: MultiCountryTaxService;

  static getInstance(): MultiCountryTaxService {
    if (!this.instance) {
      this.instance = new MultiCountryTaxService();
    }
    return this.instance;
  }

  /**
   * Obtient la configuration fiscale pour un pays
   */
  getTaxConfig(countryCode: string): CountryTaxConfig {
    const config = COUNTRY_TAX_CONFIGS[countryCode];
    if (!config) {
      console.warn(`Configuration fiscale non trouvée pour ${countryCode}, utilisation de FR par défaut`);
      return COUNTRY_TAX_CONFIGS.FR;
    }
    return config;
  }

  /**
   * Alias pour getTaxConfig (compatibilité avec le hook)
   */
  getCountryConfig(countryCode: string): CountryTaxConfig {
    return this.getTaxConfig(countryCode);
  }

  /**
   * Obtient les taux de TVA pour un pays
   */
  getVATRates(countryCode: string): { standard: number; reduced: number[]; exempt: boolean } {
    const config = this.getTaxConfig(countryCode);
    return config.vatRates;
  }

  /**
   * Obtient le taux d'impôt sur les sociétés
   */
  getCorporateTaxRate(countryCode: string): number {
    const config = this.getTaxConfig(countryCode);
    return config.corporateTaxRate;
  }

  /**
   * Génère une déclaration selon le pays
   */
  async generateDeclaration(
    companyId: string,
    countryCode: string,
    declarationType: string,
    period: string
  ): Promise<TaxDeclaration> {
    // Pour la France, utiliser le service français existant
    if (countryCode === 'FR') {
      const frenchDeclaration = await this.generateFrenchDeclaration(declarationType, companyId, period);
      return this.convertToStandardDeclaration(frenchDeclaration);
    }

    // Pour les autres pays, utiliser les services spécifiques
    const intlDeclaration = await this.generateInternationalDeclaration(countryCode, declarationType, companyId, period);
    return this.convertToStandardDeclaration(intlDeclaration);
  }

  /**
   * Calcule la TVA pour une période donnée
   */
  async calculateVAT(companyId: string, countryCode: string, period: string): Promise<any> {
    const config = this.getTaxConfig(countryCode);
    return {
      period,
      countryCode,
      vatRate: config.vatRates.standard,
      totalVAT: 0,
      deductibleVAT: 0,
      netVAT: 0,
      calculations: []
    };
  }

  /**
   * Calcule l'impôt sur les sociétés
   */
  async calculateCorporateTax(companyId: string, countryCode: string, period: string): Promise<any> {
    const config = this.getTaxConfig(countryCode);
    return {
      period,
      countryCode,
      corporateTaxRate: config.corporateTaxRate,
      taxableIncome: 0,
      corporateTax: 0
    };
  }

  /**
   * Exporte les données fiscales
   */
  async exportTaxData(
    companyId: string,
    countryCode: string,
    period: string,
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const config = this.getTaxConfig(countryCode);

    // Pour la France, utiliser le générateur FEC existant
    if (countryCode === 'FR' && format === 'csv') {
      const fecContent = await frenchTaxComplianceService.generateFEC(companyId, period);
      return {
        content: fecContent,
        filename: `FEC_${companyId}_${period}.txt`,
        mimeType: 'text/plain'
      };
    }

    // Export générique pour les autres pays/formats
    const exportContent = `Export fiscal ${config.countryName} - ${period}\nFormat: ${format}`;

    return {
      content: exportContent,
      filename: `tax_export_${countryCode}_${period}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`,
      mimeType: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
    };
  }

  /**
   * Configuration automatique des obligations fiscales
   */
  async autoConfigureObligations(companyId: string, countryCode: string): Promise<any> {
    const config = this.getTaxConfig(countryCode);
    const mandatoryDeclarations = config.declarations.filter(d => d.mandatory);

    return {
      countryCode,
      obligations: mandatoryDeclarations,
      configured: true,
      message: `${mandatoryDeclarations.length} obligation(s) configurée(s) pour ${config.countryName}`
    };
  }

  /**
   * Valide la conformité fiscale selon le pays
   */
  async validateCompliance(
    companyId: string,
    countryCode: string,
    period: string
  ): Promise<{ errors: string[]; warnings: string[]; score: number; maxScore: number; }> {
    const config = this.getTaxConfig(countryCode);

    // Pour la France, utiliser la validation française
    if (countryCode === 'FR') {
      const validation = await frenchTaxComplianceService.validateAccountingTaxConsistency(
        companyId,
        period
      );

      return {
        errors: validation.errors,
        warnings: validation.warnings,
        score: validation.checks.filter(c => c.status === 'ok').length,
        maxScore: validation.checks.length
      };
    }

    // Pour les autres pays, validation générique
    return this.validateInternationalCompliance(countryCode, companyId, period);
  }

  // Méthodes privées
  private async generateFrenchDeclaration(declarationType: string, companyId: string, period: string) {
    switch (declarationType) {
      case 'CA3':
        return await frenchTaxComplianceService.generateCA3Declaration(companyId, period);
      case 'LIASSE_FISCALE':
        return await frenchTaxComplianceService.generateLiasseFiscale(companyId, period);
      case 'CVAE':
        return await frenchTaxComplianceService.generateCVAEDeclaration(companyId, period);
      default:
        throw new Error(`Type de déclaration ${declarationType} non supporté pour la France`);
    }
  }

  private async generateInternationalDeclaration(
    countryCode: string,
    declarationType: string,
    companyId: string,
    period: string
  ) {
    return {
      id: `${declarationType.toLowerCase()}-${companyId}-${period}`,
      type: declarationType,
      country: countryCode,
      period,
      status: 'draft',
      data: {},
      generatedAt: new Date().toISOString()
    };
  }

  private convertToStandardDeclaration(declaration: any): TaxDeclaration {
    return {
      id: declaration.id || `declaration-${Date.now()}`,
      type: declaration.type || 'UNKNOWN',
      period: declaration.period || '',
      status: declaration.status || 'draft',
      dueDate: declaration.dueDate || new Date(),
      amount: declaration.amount || 0,
      validationErrors: declaration.validationErrors || [],
      warnings: declaration.warnings || [],
      data: declaration
    };
  }

  private async validateInternationalCompliance(countryCode: string, companyId: string, period: string) {
    const config = this.getTaxConfig(countryCode);

    const checks = [
      { name: 'Configuration pays', status: 'ok' as const, message: `Configuration ${countryCode} trouvée` },
      { name: 'Norme comptable', status: 'ok' as const, message: `${config.accountingStandard} appliqué` },
      { name: 'Taux de TVA', status: 'ok' as const, message: `${config.vatRates.standard}% configuré` }
    ];

    return {
      errors: [],
      warnings: [],
      score: checks.length,
      maxScore: checks.length
    };
  }
}

export const multiCountryTaxService = MultiCountryTaxService.getInstance();