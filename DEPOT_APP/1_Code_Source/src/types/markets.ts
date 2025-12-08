// Market configuration types
export interface MarketConfig {
  id: string;
  name: string;
  region: string;
  countries: string[];
  defaultCurrency: string;
  accountingStandard: string;
  taxSystem: {
    vatRate: number;
    vatNumber: string;
    socialCharges: number[];
    payrollTaxes: {
      name: string;
      rate: number;
      base: string;
      ceiling?: number;
    }[];
    fiscalYear: string;
  };
  pricing: {
    currency: string;
    starter: number;
    professional: number;
    enterprise: number;
    vatIncluded: boolean;
  };
  features: {
    bankingIntegration: string[];
    paymentMethods: string[];
    reportingStandards: string[];
    compliance: string[];
  };
  localization: {
    dateFormat: string;
    numberFormat: string;
    language: string;
    timezone: string;
    workingDays: number[];
  };
}

export interface CountryConfig {
  currency: string;
  accountingStandard: string;
  idLabel: string;
  idPlaceholder: string;
  vatFormat: string;
}
