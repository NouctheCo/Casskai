import { supabase } from '@/lib/supabase';

interface CountryTaxConfig {
  country: string;
  countryName: string;
  currency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'US_GAAP';
  fiscalYearEnd: string;
  vatRates: {
    standard: number;
    reduced?: number;
    zero?: number;
    exempt?: boolean;
  };
  taxAccounts: {
    vatCollected: string;
    vatDeductible: string;
    corporateTax: string;
    payrollTax?: string;
    socialContributions?: string;
  };
  complianceRequirements: {
    monthlyVatReturn: boolean;
    quarterlyTaxReturn: boolean;
    annualFinancialStatements: boolean;
    auditRequired: boolean;
    minimumCapital?: number;
  };
  payrollTaxes: {
    incomeTaxRate: number;
    socialSecurityRate: number;
    employerContribution: number;
    pensionRate: number;
  };
  depreciation: {
    buildings: number;
    equipment: number;
    vehicles: number;
    software: number;
  };
}

export class InternationalTaxService {
  private static readonly TAX_CONFIGURATIONS: Record<string, CountryTaxConfig> = {
    // France - Plan Comptable Général (PCG)
    FR: {
      country: 'FR',
      countryName: 'France',
      currency: 'EUR',
      accountingStandard: 'PCG',
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 20,
        reduced: 10,
        zero: 5.5,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '445700',
        vatDeductible: '445660',
        corporateTax: '444000',
        payrollTax: '421000',
        socialContributions: '431000'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: true,
        annualFinancialStatements: true,
        auditRequired: true,
        minimumCapital: 37000
      },
      payrollTaxes: {
        incomeTaxRate: 45,
        socialSecurityRate: 22,
        employerContribution: 42,
        pensionRate: 6.9
      },
      depreciation: {
        buildings: 4,
        equipment: 10,
        vehicles: 20,
        software: 33.33
      }
    },

    // Sénégal - SYSCOHADA
    SN: {
      country: 'SN',
      countryName: 'Sénégal',
      currency: 'XOF',
      accountingStandard: 'SYSCOHADA',
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 18,
        zero: 0,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '4441',
        vatDeductible: '4454',
        corporateTax: '444',
        socialContributions: '422'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: false,
        annualFinancialStatements: true,
        auditRequired: false,
        minimumCapital: 1000000 // 1M XOF
      },
      payrollTaxes: {
        incomeTaxRate: 40,
        socialSecurityRate: 8.4,
        employerContribution: 21.7,
        pensionRate: 8.4
      },
      depreciation: {
        buildings: 5,
        equipment: 10,
        vehicles: 25,
        software: 33.33
      }
    },

    // Côte d'Ivoire - SYSCOHADA
    CI: {
      country: 'CI',
      countryName: 'Côte d\'Ivoire',
      currency: 'XOF',
      accountingStandard: 'SYSCOHADA',
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 18,
        zero: 0,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '4441',
        vatDeductible: '4454',
        corporateTax: '444',
        socialContributions: '422'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: false,
        annualFinancialStatements: true,
        auditRequired: false,
        minimumCapital: 1000000 // 1M XOF
      },
      payrollTaxes: {
        incomeTaxRate: 36,
        socialSecurityRate: 6.3,
        employerContribution: 16.5,
        pensionRate: 7.7
      },
      depreciation: {
        buildings: 5,
        equipment: 10,
        vehicles: 25,
        software: 33.33
      }
    },

    // Mali - SYSCOHADA
    ML: {
      country: 'ML',
      countryName: 'Mali',
      currency: 'XOF',
      accountingStandard: 'SYSCOHADA',
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 18,
        zero: 0,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '4441',
        vatDeductible: '4454',
        corporateTax: '444',
        socialContributions: '422'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: false,
        annualFinancialStatements: true,
        auditRequired: false,
        minimumCapital: 1000000 // 1M XOF
      },
      payrollTaxes: {
        incomeTaxRate: 40,
        socialSecurityRate: 9,
        employerContribution: 18.6,
        pensionRate: 9
      },
      depreciation: {
        buildings: 5,
        equipment: 10,
        vehicles: 25,
        software: 33.33
      }
    },

    // Maroc
    MA: {
      country: 'MA',
      countryName: 'Maroc',
      currency: 'MAD',
      accountingStandard: 'PCG', // Plan Comptable Marocain (basé sur PCG)
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 20,
        reduced: 14,
        zero: 10,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '4455',
        vatDeductible: '4456',
        corporateTax: '444',
        socialContributions: '421'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: true,
        annualFinancialStatements: true,
        auditRequired: true,
        minimumCapital: 300000 // 300k MAD
      },
      payrollTaxes: {
        incomeTaxRate: 38,
        socialSecurityRate: 6.37,
        employerContribution: 20.48,
        pensionRate: 11.89
      },
      depreciation: {
        buildings: 4,
        equipment: 10,
        vehicles: 20,
        software: 33.33
      }
    },

    // Tunisie
    TN: {
      country: 'TN',
      countryName: 'Tunisie',
      currency: 'TND',
      accountingStandard: 'PCG', // Système Comptable des Entreprises (SCE)
      fiscalYearEnd: '31/12',
      vatRates: {
        standard: 19,
        reduced: 13,
        zero: 7,
        exempt: true
      },
      taxAccounts: {
        vatCollected: '4367',
        vatDeductible: '4366',
        corporateTax: '444',
        socialContributions: '421'
      },
      complianceRequirements: {
        monthlyVatReturn: true,
        quarterlyTaxReturn: true,
        annualFinancialStatements: true,
        auditRequired: true,
        minimumCapital: 5000 // 5k TND
      },
      payrollTaxes: {
        incomeTaxRate: 35,
        socialSecurityRate: 9.18,
        employerContribution: 16.57,
        pensionRate: 15.5
      },
      depreciation: {
        buildings: 5,
        equipment: 10,
        vehicles: 33.33,
        software: 33.33
      }
    }
  };

  static getTaxConfiguration(country: string): CountryTaxConfig | null {
    return this.TAX_CONFIGURATIONS[country] || null;
  }

  static getAllSupportedCountries(): CountryTaxConfig[] {
    return Object.values(this.TAX_CONFIGURATIONS);
  }

  static async configureCompanyTaxSettings(
    companyId: string,
    country: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getTaxConfiguration(country);
      if (!config) {
        return { success: false, error: `Configuration fiscale non supportée pour le pays: ${country}` };
      }

      // 1. Mettre à jour la configuration de l'entreprise
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          country: config.country,
          default_currency: config.currency,
          fiscal_year_end: config.fiscalYearEnd,
          accounting_standard: config.accountingStandard,
          tax_configuration: {
            vatRates: config.vatRates,
            taxAccounts: config.taxAccounts,
            complianceRequirements: config.complianceRequirements,
            payrollTaxes: config.payrollTaxes,
            depreciation: config.depreciation
          }
        })
        .eq('id', companyId);

      if (companyError) throw companyError;

      // 2. Créer ou mettre à jour les paramètres fiscaux spécifiques
      const { error: fiscalError } = await supabase
        .from('company_fiscal_settings')
        .upsert({
          company_id: companyId,
          country_code: config.country,
          accounting_standard: config.accountingStandard,
          fiscal_year_end: config.fiscalYearEnd,
          default_currency: config.currency,

          // TVA
          vat_standard_rate: config.vatRates.standard,
          vat_reduced_rate: config.vatRates.reduced || 0,
          vat_zero_rate: config.vatRates.zero || 0,
          vat_exempt_available: config.vatRates.exempt || false,

          // Comptes TVA
          vat_collected_account: config.taxAccounts.vatCollected,
          vat_deductible_account: config.taxAccounts.vatDeductible,
          corporate_tax_account: config.taxAccounts.corporateTax,
          payroll_tax_account: config.taxAccounts.payrollTax,

          // Obligations déclaratives
          monthly_vat_return: config.complianceRequirements.monthlyVatReturn,
          quarterly_tax_return: config.complianceRequirements.quarterlyTaxReturn,
          annual_financial_statements: config.complianceRequirements.annualFinancialStatements,
          audit_required: config.complianceRequirements.auditRequired,
          minimum_capital: config.complianceRequirements.minimumCapital,

          // Charges sociales et paie
          income_tax_rate: config.payrollTaxes.incomeTaxRate,
          social_security_rate: config.payrollTaxes.socialSecurityRate,
          employer_contribution_rate: config.payrollTaxes.employerContribution,
          pension_rate: config.payrollTaxes.pensionRate,

          // Amortissements
          building_depreciation_rate: config.depreciation.buildings,
          equipment_depreciation_rate: config.depreciation.equipment,
          vehicle_depreciation_rate: config.depreciation.vehicles,
          software_depreciation_rate: config.depreciation.software,

          // Métadonnées
          configuration_date: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'company_id'
        });

      if (fiscalError) throw fiscalError;

      // 3. Créer les comptes comptables spécifiques au pays s'ils n'existent pas
      await this.createCountrySpecificAccounts(companyId, config);

      return { success: true };
    } catch (error) {
      console.error('Erreur configuration fiscale:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la configuration fiscale'
      };
    }
  }

  private static async createCountrySpecificAccounts(
    companyId: string,
    config: CountryTaxConfig
  ): Promise<void> {
    const taxAccounts = [
      {
        account_code: config.taxAccounts.vatCollected,
        account_name: 'TVA Collectée',
        account_type: 'liability',
        is_tax_account: true
      },
      {
        account_code: config.taxAccounts.vatDeductible,
        account_name: 'TVA Déductible',
        account_type: 'asset',
        is_tax_account: true
      },
      {
        account_code: config.taxAccounts.corporateTax,
        account_name: 'Impôt sur les Sociétés',
        account_type: 'liability',
        is_tax_account: true
      }
    ];

    if (config.taxAccounts.payrollTax) {
      taxAccounts.push({
        account_code: config.taxAccounts.payrollTax,
        account_name: 'Charges de Personnel',
        account_type: 'expense',
        is_tax_account: true
      });
    }

    if (config.taxAccounts.socialContributions) {
      taxAccounts.push({
        account_code: config.taxAccounts.socialContributions,
        account_name: 'Charges Sociales',
        account_type: 'liability',
        is_tax_account: true
      });
    }

    const accountsToInsert = taxAccounts.map(account => ({
      company_id: companyId,
      currency: config.currency,
      is_active: true,
      level: account.account_code.length <= 2 ? 1 : 2,
      ...account
    }));

    // Insérer les comptes en ignorant les doublons
    await supabase
      .from('accounts')
      .upsert(accountsToInsert, {
        onConflict: 'company_id,account_code',
        ignoreDuplicates: true
      });
  }

  static calculateVAT(
    amount: number,
    country: string,
    vatType: 'standard' | 'reduced' | 'zero' = 'standard'
  ): { vatAmount: number; totalAmount: number; vatRate: number } {
    const config = this.getTaxConfiguration(country);
    if (!config) {
      return { vatAmount: 0, totalAmount: amount, vatRate: 0 };
    }

    let vatRate = 0;
    switch (vatType) {
      case 'standard':
        vatRate = config.vatRates.standard;
        break;
      case 'reduced':
        vatRate = config.vatRates.reduced || 0;
        break;
      case 'zero':
        vatRate = config.vatRates.zero || 0;
        break;
    }

    const vatAmount = (amount * vatRate) / 100;
    const totalAmount = amount + vatAmount;

    return { vatAmount, totalAmount, vatRate };
  }

  static getDepreciationRate(country: string, assetType: 'buildings' | 'equipment' | 'vehicles' | 'software'): number {
    const config = this.getTaxConfiguration(country);
    return config?.depreciation[assetType] || 10; // Par défaut 10%
  }

  static getComplianceRequirements(country: string): CountryTaxConfig['complianceRequirements'] | null {
    const config = this.getTaxConfiguration(country);
    return config?.complianceRequirements || null;
  }
}