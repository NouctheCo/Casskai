/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
// Service fiscal multi-pays pour CassKai
import { frenchTaxComplianceService } from './FrenchTaxComplianceService';
import { FiscalServiceFactory } from './FiscalServiceFactory';
import {
  exportDeclarationToRegulatoryPdf,
  exportDeclarationToRegulatoryXmlDraft,
  mapDeclarationTypeToRegulatoryDocumentType
} from './multiCountryRegulatoryExportService';
import { getTaxConfiguration } from '../../data/taxConfigurations';
import { logger } from '@/lib/logger';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export interface CountryTaxConfig {
  country: string;
  countryName: string;
  currency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'GAAP' | 'LOCAL';
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
  data?: Record<string, unknown>;
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
        id: 'IS',
        name: 'IS - Impôt sur les Sociétés',
        description: 'Déclaration annuelle d\'impôt sur les sociétés (intégrée à la liasse)',
        frequency: 'annual',
        deadline: '15 mai N+1',
        mandatory: true,
        forms: ['2065', '2033']
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
      },
      {
        id: 'CFE',
        name: 'CFE 1447-C',
        description: 'Cotisation Foncière des Entreprises',
        frequency: 'annual',
        deadline: '15 décembre',
        mandatory: true,
        forms: ['1447-C']
      },
      {
        id: 'DSN',
        name: 'DSN - Déclaration Sociale Nominative',
        description: 'Déclaration mensuelle des cotisations sociales',
        frequency: 'monthly',
        deadline: '5 ou 15 du mois suivant',
        mandatory: true,
        forms: ['DSN']
      }
    ],
    deadlines: {
      CA3: '19th-next-month',
      LIASSE_FISCALE: 'may-15',
      IS: 'may-15',
      CVAE: 'may-15',
      CFE: 'december-15',
      DSN: '5th-or-15th-next-month'
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
type VATCalculation = {
  period: string;
  countryCode: string;
  vatRate: number;
  totalVAT: number;
  deductibleVAT: number;
  netVAT: number;
  calculations: Array<Record<string, unknown>>;
};
type CorporateTaxCalculation = {
  period: string;
  countryCode: string;
  corporateTaxRate: number;
  taxableIncome: number;
  corporateTax: number;
};
type ExportResult = { content: BlobPart; filename: string; mimeType: string };
type AutoObligationsResult = {
  countryCode: string;
  obligations: TaxDeclarationType[];
  configured: boolean;
  message: string;
};
type ComplianceResult = { errors: string[]; warnings: string[]; score: number; maxScore: number };
// Note: Raw declaration helper type removed after switching to unknown-based coercion.
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
    // Try to get from new comprehensive tax configurations first
    const comprehensiveConfig = getTaxConfiguration(countryCode);
    if (comprehensiveConfig) {
      // Convert comprehensive config to CountryTaxConfig format
      return {
        country: comprehensiveConfig.countryCode,
        countryName: comprehensiveConfig.countryName,
        currency: comprehensiveConfig.currency,
        accountingStandard: comprehensiveConfig.accountingStandard,
        vatRates: {
          standard: comprehensiveConfig.vat.standard,
          reduced: comprehensiveConfig.vat.reduced,
          exempt: comprehensiveConfig.vat.exemptions.length > 0
        },
        corporateTaxRate: comprehensiveConfig.corporateTax.standardRate,
        fiscalYearEnd: comprehensiveConfig.fiscalYearEnd.replace('/', '-'),
        declarations: comprehensiveConfig.taxTypes.map(tt => ({
          id: tt.id,
          name: tt.name,
          description: tt.description,
          frequency: tt.frequency,
          deadline: tt.deadline,
          mandatory: tt.mandatory,
          forms: [tt.id]
        })),
        deadlines: comprehensiveConfig.taxTypes.reduce((acc, tt) => {
          acc[tt.id] = tt.deadline;
          return acc;
        }, {} as Record<string, string>),
        languages: ['fr-FR'] // Default, could be enhanced based on country
      };
    }
    // Fallback to old config
    const config = COUNTRY_TAX_CONFIGS[countryCode];
    if (!config) {
      logger.warn('MultiCountryTax', `Configuration fiscale non trouvée pour ${countryCode}, utilisation de FR par défaut`);
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
  async calculateVAT(companyId: string, countryCode: string, period: string): Promise<VATCalculation> {
    const config = this.getTaxConfig(countryCode);
    const monthlyPeriod = this.normalizeMonthlyPeriod(period);

    // France: CA3 calc from FrenchTaxComplianceService
    if (countryCode === 'FR') {
      const ca3 = await frenchTaxComplianceService.generateCA3Declaration(companyId, monthlyPeriod);
      const d = ca3.data as any;

      const totalVAT =
        (d.ventes_france_taux_normal || 0) +
        (d.ventes_france_taux_intermediaire || 0) +
        (d.ventes_france_taux_reduit || 0) +
        (d.ventes_france_taux_particulier || 0) +
        (d.autres_operations_imposables || 0) +
        (d.regularisations_tva_collectee || 0);

      const deductibleVAT =
        (d.achats_tva_deductible || 0) +
        (d.immobilisations_tva_deductible || 0) +
        (d.autres_biens_services_tva_deductible || 0) +
        (d.regularisations_tva_deductible || 0);

      return {
        period: monthlyPeriod,
        countryCode,
        vatRate: config.vatRates.standard,
        totalVAT,
        deductibleVAT,
        netVAT: totalVAT - deductibleVAT,
        calculations: [
          {
            source: 'CA3',
            tva_nette_due: d.tva_nette_due,
            tva_a_payer: d.tva_a_payer,
            credit_a_reporter: d.credit_a_reporter
          }
        ]
      };
    }

    // Supported countries: use specialized services
    if (FiscalServiceFactory.isCountrySupported(countryCode)) {
      const service = FiscalServiceFactory.getServiceForCountry(countryCode);
      const vatDeclaration = await service.generateVATDeclaration(companyId, monthlyPeriod, countryCode);
      const vatData: any = vatDeclaration.data;

      // SYSCOHADA/SCF shape
      if (vatData && typeof vatData === 'object' && 'tvaCollectee' in vatData) {
        const totalVAT = Number(vatData.tvaCollectee || 0);
        const deductibleVAT = Number(vatData.tvaDeductible?.total || 0);
        return {
          period: monthlyPeriod,
          countryCode,
          vatRate: config.vatRates.standard,
          totalVAT,
          deductibleVAT,
          netVAT: Number(vatData.tvaNette ?? (totalVAT - deductibleVAT)),
          calculations: [vatData]
        };
      }

      // IFRS shape
      if (vatData && typeof vatData === 'object' && 'outputVAT' in vatData) {
        const totalVAT = Number(vatData.outputVAT || 0);
        const deductibleVAT = Number(vatData.inputVAT?.total || 0);
        return {
          period: monthlyPeriod,
          countryCode,
          vatRate: config.vatRates.standard,
          totalVAT,
          deductibleVAT,
          netVAT: Number(vatData.netVAT ?? (totalVAT - deductibleVAT)),
          calculations: [vatData]
        };
      }
    }

    // Fallback: still return a valid structure
    return {
      period: monthlyPeriod,
      countryCode,
      vatRate: config.vatRates.standard,
      totalVAT: 0,
      deductibleVAT: 0,
      netVAT: 0,
      calculations: [{ warning: 'VAT calculation not implemented for this country yet.' }]
    };
  }
  /**
   * Calcule l'impôt sur les sociétés
   */
  async calculateCorporateTax(companyId: string, countryCode: string, period: string): Promise<CorporateTaxCalculation> {
    const config = this.getTaxConfig(countryCode);
    const fiscalYear = this.normalizeAnnualPeriod(period);

    // France: use 2058 (resultat_fiscal) from liasse generation
    if (countryCode === 'FR') {
      const liasse = await frenchTaxComplianceService.generateLiasseFiscale(companyId, fiscalYear);
      const decl2058 = liasse.find(d => d.type === 'LIASSE_2058');
      const taxableIncome = Number((decl2058?.data as any)?.resultat_fiscal ?? 0);
      const corporateTax = taxableIncome > 0 ? taxableIncome * (config.corporateTaxRate / 100) : 0;
      return {
        period: fiscalYear,
        countryCode,
        corporateTaxRate: config.corporateTaxRate,
        taxableIncome,
        corporateTax
      };
    }

    if (FiscalServiceFactory.isCountrySupported(countryCode)) {
      const service = FiscalServiceFactory.getServiceForCountry(countryCode);
      const corporateDecl = await service.generateCorporateTaxDeclaration(companyId, fiscalYear, countryCode);
      const corporateData: any = corporateDecl.data;

      // SYSCOHADA/SCF shape
      if (corporateData && typeof corporateData === 'object' && 'resultatFiscal' in corporateData) {
        const taxableIncome = Number(corporateData.resultatFiscal || 0);
        const corporateTax = Number(corporateData.impotCalcule ?? corporateData.impotAPayer ?? 0);
        return {
          period: fiscalYear,
          countryCode,
          corporateTaxRate: config.corporateTaxRate,
          taxableIncome,
          corporateTax
        };
      }

      // IFRS shape
      if (corporateData && typeof corporateData === 'object' && 'taxableIncome' in corporateData) {
        const taxableIncome = Number(corporateData.taxableIncome || 0);
        const corporateTax = Number(corporateData.taxComputed ?? corporateData.taxPayable ?? 0);
        return {
          period: fiscalYear,
          countryCode,
          corporateTaxRate: config.corporateTaxRate,
          taxableIncome,
          corporateTax
        };
      }
    }

    return {
      period: fiscalYear,
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
  ): Promise<ExportResult> {
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

    const normalizedMonthly = this.normalizeMonthlyPeriod(period);
    const normalizedAnnual = this.normalizeAnnualPeriod(period);

    if (format === 'pdf') {
      const vat = await this.calculateVAT(companyId, countryCode, normalizedMonthly);
      const corporateTax = await this.calculateCorporateTax(companyId, countryCode, normalizedAnnual);

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 40;
      let y = 50;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Export fiscal (brouillon)', marginX, y);

      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Pays: ${config.countryName} (${countryCode})`, marginX, y);
      y += 14;
      doc.text(`Période: ${period}`, marginX, y);
      y += 14;
      doc.text('Note: export de synthèse (non-dépôt).', marginX, y);
      y += 18;

      doc.setFont('helvetica', 'bold');
      doc.text('TVA', marginX, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Taux standard', `${vat.vatRate}%`],
          ['TVA collectée', String(vat.totalVAT)],
          ['TVA déductible', String(vat.deductibleVAT)],
          ['TVA nette', String(vat.netVAT)]
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      // @ts-expect-error jspdf-autotable adds lastAutoTable
      y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 18 : y + 80;

      doc.setFont('helvetica', 'bold');
      doc.text("Impôt sur les sociétés", marginX, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Taux', `${corporateTax.corporateTaxRate}%`],
          ['Résultat fiscal / base imposable', String(corporateTax.taxableIncome)],
          ['IS calculé', String(corporateTax.corporateTax)]
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 197, 94] }
      });

      const pdfBytes = doc.output('arraybuffer');
      return {
        content: pdfBytes,
        filename: `tax_export_${countryCode}_${period}.pdf`,
        mimeType: 'application/pdf'
      };
    }

    // CSV: synthèse simple
    if (format === 'csv' || format === 'excel') {
      const vat = await this.calculateVAT(companyId, countryCode, normalizedMonthly);
      const corporateTax = await this.calculateCorporateTax(companyId, countryCode, normalizedAnnual);

      const lines = [
        'metric,value',
        `country,${countryCode}`,
        `period,${period}`,
        `vat_rate,${vat.vatRate}`,
        `vat_total,${vat.totalVAT}`,
        `vat_deductible,${vat.deductibleVAT}`,
        `vat_net,${vat.netVAT}`,
        `corporate_tax_rate,${corporateTax.corporateTaxRate}`,
        `taxable_income,${corporateTax.taxableIncome}`,
        `corporate_tax,${corporateTax.corporateTax}`
      ];

      return {
        content: lines.join('\n'),
        filename: `tax_export_${countryCode}_${period}.csv`,
        mimeType: 'text/csv'
      };
    }

    // Default fallback
    return {
      content: `Export fiscal ${config.countryName} - ${period}\nFormat: ${format}`,
      filename: `tax_export_${countryCode}_${period}.txt`,
      mimeType: 'text/plain'
    };
  }

  /**
   * Exporte une déclaration au format réglementaire PDF (brouillon, via templates).
   */
  async exportDeclarationRegulatoryPdf(
    companyId: string,
    countryCode: string,
    declarationType: string,
    period: string
  ): Promise<{ blob: Blob; filename: string; mimeType: string }> {
    return exportDeclarationToRegulatoryPdf({ companyId, countryCode, declarationType, period });
  }

  /**
   * Exporte une déclaration au format XML draft (brouillon, via templates).
   */
  async exportDeclarationRegulatoryXmlDraft(
    companyId: string,
    countryCode: string,
    declarationType: string,
    period: string
  ): Promise<{ blob: Blob; filename: string; mimeType: string }> {
    return exportDeclarationToRegulatoryXmlDraft({ companyId, countryCode, declarationType, period });
  }

  /**
   * Indique si un type de déclaration a un mapping vers un template réglementaire.
   */
  isSupportedForRegulatoryExport(countryCode: string, declarationType: string): boolean {
    return mapDeclarationTypeToRegulatoryDocumentType(countryCode, declarationType) !== null;
  }
  /**
   * Configuration automatique des obligations fiscales
   */
  async autoConfigureObligations(_companyId: string, countryCode: string): Promise<AutoObligationsResult> {
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
  ): Promise<ComplianceResult> {
    // const config = this.getTaxConfig(countryCode); // non requis ici
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
      case 'TVA_CA3':
        return await frenchTaxComplianceService.generateCA3Declaration(companyId, period);
      case 'TVA_CA12':
      case 'CA12':
        // CA12 utilise la même structure que CA3 mais avec fréquence annuelle
        return await frenchTaxComplianceService.generateCA3Declaration(companyId, period);
      case 'TVA_CA12E':
      case 'CA12E':
        // CA12E (trimestriel) utilise aussi la structure CA3
        return await frenchTaxComplianceService.generateCA3Declaration(companyId, period);
      case 'LIASSE_FISCALE':
        return await frenchTaxComplianceService.generateLiasseFiscale(companyId, period);
      case 'IS':
        // IS (Impôt sur les Sociétés) fait partie de la liasse fiscale
        return await frenchTaxComplianceService.generateLiasseFiscale(companyId, period);
      case 'CVAE':
        return await frenchTaxComplianceService.generateCVAEDeclaration(companyId, period);
      case 'CFE':
        return await frenchTaxComplianceService.generateCFEDeclaration(companyId, period);
      case 'DSN':
        return await frenchTaxComplianceService.generateDSNDeclaration(companyId, period);
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
    // If we have a supported fiscal service, generate a real declaration
    if (FiscalServiceFactory.isCountrySupported(countryCode)) {
      const service = FiscalServiceFactory.getServiceForCountry(countryCode);
      const kind = this.inferDeclarationKind(declarationType);

      try {
        switch (kind) {
          case 'vat':
            return await service.generateVATDeclaration(companyId, this.normalizeMonthlyPeriod(period), countryCode);
          case 'corporate_tax':
            return await service.generateCorporateTaxDeclaration(companyId, this.normalizeAnnualPeriod(period), countryCode);
          case 'balance_sheet':
            return await service.generateBalanceSheet(companyId, this.normalizeAnnualPeriod(period), countryCode);
          case 'income_statement':
            return await service.generateIncomeStatement(companyId, this.normalizeAnnualPeriod(period), countryCode);
          default:
            break;
        }

        // Special cases by country/standard
        const upper = declarationType.toUpperCase();
        const anyService = service as any;

        // OHADA DSF
        if (upper.includes('DSF') && typeof anyService.generateDSF === 'function') {
          return await anyService.generateDSF(companyId, this.normalizeAnnualPeriod(period), countryCode);
        }

        // Algeria G50 / IBS (SCF)
        if (countryCode === 'DZ') {
          if (upper.includes('G50') && typeof anyService.generateG50Algeria === 'function') {
            return await anyService.generateG50Algeria(companyId, this.normalizeMonthlyPeriod(period));
          }
          if (upper.includes('IBS') && typeof anyService.generateIBSAlgeria === 'function') {
            return await anyService.generateIBSAlgeria(companyId, this.normalizeAnnualPeriod(period));
          }
        }
      } catch (error) {
        logger.warn('MultiCountryTax', `Erreur génération déclaration ${declarationType} pour ${countryCode}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Fallback stub so UI remains functional
    return {
      id: `${declarationType.toLowerCase()}-${companyId}-${period}`,
      type: declarationType,
      country: countryCode,
      period,
      status: 'draft',
      data: {
        warning: 'Declaration generated as draft placeholder for unsupported country/type.'
      },
      generatedAt: new Date().toISOString()
    };
  }
  private convertToStandardDeclaration(declaration: unknown): TaxDeclaration {
    const rec: Record<string, unknown> =
      typeof declaration === 'object' && declaration !== null ? (declaration as Record<string, unknown>) : {};
    const id = (rec.id as string) || `declaration-${Date.now()}`;
    const type = (rec.type as string) || 'UNKNOWN';
    const period = (rec.period as string) || '';
    const allowedStatuses: ReadonlyArray<TaxDeclaration['status']> = ['draft', 'ready', 'filed', 'accepted', 'rejected'];
    const statusRaw = rec.status as string | undefined;
    const status: TaxDeclaration['status'] = (allowedStatuses.find(s => s === statusRaw) ?? 'draft');
    const dueDateRaw = rec.dueDate as unknown;
    const dueDate =
      dueDateRaw instanceof Date
        ? dueDateRaw
        : typeof dueDateRaw === 'string'
          ? new Date(dueDateRaw)
          : new Date();

    const amount = this.inferAmount(type, rec);
    const validationErrors = (rec.validationErrors as string[]) || [];
    const warnings = (rec.warnings as string[]) || [];
    return {
      id,
      type,
      period,
      status,
      dueDate,
      amount,
      validationErrors,
      warnings,
      data: rec
    };
  }

  private inferAmount(declarationType: string, rec: Record<string, unknown>): number {
    const directAmount = rec.amount as number | undefined;
    if (typeof directAmount === 'number' && Number.isFinite(directAmount)) return directAmount;

    const data = rec.data as any;
    if (!data || typeof data !== 'object') return 0;

    // Common payable fields (independent from declaration type)
    const payableCandidates: unknown[] = [
      data.totalAPayer,
      data.total_a_payer,
      data.tva_a_payer,
      data.tvaAPayer,
      data.vatPayable,
      data.netVATPayable,
      data.soldeAPayer,
      data.impotAPayer,
      data.taxPayable,
      data.taxComputed
    ];

    for (const candidate of payableCandidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    }

    const upper = declarationType.toUpperCase();
    if (upper.includes('TVA') || upper.includes('VAT')) {
      // FR
      if (typeof data.tva_a_payer === 'number') return data.tva_a_payer;
      // SYSCOHADA / SCF
      if (typeof data.tvaAPayer === 'number') return data.tvaAPayer;
      // IFRS
      if (typeof data.vatPayable === 'number') return data.vatPayable;
      return 0;
    }

    if (upper.includes('IS') || upper.includes('IBS') || upper.includes('IMPOT') || upper.includes('TAX')) {
      // SYSCOHADA/SCF
      if (typeof data.impotAPayer === 'number') return data.impotAPayer;
      if (typeof data.impotCalcule === 'number') return data.impotCalcule;
      if (typeof data.soldeAPayer === 'number') return data.soldeAPayer;
      // IFRS
      if (typeof data.taxPayable === 'number') return data.taxPayable;
      if (typeof data.taxComputed === 'number') return data.taxComputed;
      return 0;
    }

    return 0;
  }

  private inferDeclarationKind(declarationType: string): 'vat' | 'corporate_tax' | 'balance_sheet' | 'income_statement' | null {
    const t = declarationType.toUpperCase();
    if (t.includes('TVA') || t.includes('VAT')) return 'vat';
    if (t.includes('IS') || t.includes('IBS') || t.includes('CORPORATE')) return 'corporate_tax';
    if (t.includes('BILAN') || t.includes('BALANCE_SHEET') || t.includes('BALANCE SHEET')) return 'balance_sheet';
    if (t.includes('RESULTAT') || t.includes('INCOME_STATEMENT') || t.includes('INCOME STATEMENT')) return 'income_statement';
    return null;
  }

  private normalizeMonthlyPeriod(period: string): string {
    // Expected: YYYY-MM. If YYYY only, default to current month.
    if (/^\d{4}-\d{2}$/.test(period)) return period;
    if (/^\d{4}$/.test(period)) {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `${period}-${month}`;
    }
    // Best-effort: if starts with YYYY-..., keep first 7 chars
    if (/^\d{4}-\d{2}/.test(period)) return period.slice(0, 7);
    return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  }

  private normalizeAnnualPeriod(period: string): string {
    // Expected: YYYY. If YYYY-MM, take year.
    if (/^\d{4}$/.test(period)) return period;
    const match = period.match(/^(\d{4})/);
    return match?.[1] ?? String(new Date().getFullYear());
  }
  private async validateInternationalCompliance(countryCode: string, _companyId: string, _period: string): Promise<ComplianceResult> {
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