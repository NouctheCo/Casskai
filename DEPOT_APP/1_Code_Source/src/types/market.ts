// types/market.ts
export interface MarketConfig {
  id: string;
  name: string;
  region: 'europe' | 'africa' | 'americas';
  countries: string[];
  defaultCurrency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'GAAP' | 'IFRS';
  taxSystem: TaxSystemConfig;
  pricing: MarketPricing;
  features: MarketFeatures;
  localization: MarketLocalization;
}

export interface TaxSystemConfig {
  vatRate: number;
  vatNumber: string;
  socialCharges: number[];
  payrollTaxes: PayrollTax[];
  fiscalYear: 'calendar' | 'april' | 'july';
}

export interface PayrollTax {
  name: string;
  rate: number;
  base: 'gross' | 'net';
  ceiling?: number;
}

export interface MarketPricing {
  currency: string;
  starter: number;
  professional: number;
  enterprise: number;
  vatIncluded: boolean;
}

export interface MarketFeatures {
  bankingIntegration: string[];
  paymentMethods: string[];
  reportingStandards: string[];
  compliance: string[];
}

export interface MarketLocalization {
  dateFormat: string;
  numberFormat: string;
  language: string;
  timezone: string;
  workingDays: number[];
}
