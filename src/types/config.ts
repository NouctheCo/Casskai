// src/types/config.ts

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  validated: boolean;
}

export interface CompanyConfig {
  id: string; // ✅ Déjà présent
  name: string;
  country: string;
  currency: string;
  timezone: string;
  fiscalYearStart?: string; // Format: MM-DD (ex: "01-01")
  taxNumber?: string;
  address?: CompanyAddress;
  accountingStandard: string; // ✅ Déjà présent
}

export interface CompanyAddress {
  street: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
}

export interface AppConfig {
  supabase: SupabaseConfig;
  company: CompanyConfig;
  setupCompleted: boolean;
  setupDate: string;
  version: string; // Version de l'app lors de la config
}

// Types pour les pays supportés
export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  fiscalYearStart: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'BELGIAN' | 'BASIC';
  taxRates: TaxRate[];
}

export interface TaxRate {
  name: string;
  rate: number;
  type: 'VAT' | 'SALES_TAX' | 'GST';
  isDefault: boolean;
}

// Status de configuration
export type ConfigStatus = 
  | 'not_configured'
  | 'configuring'
  | 'configured'
  | 'error';

export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Types pour les étapes du wizard
export type SetupStep = 1 | 2 | 3;

export interface SetupProgress {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  canProceed: boolean;
}

// Types pour les erreurs de configuration
export interface ConfigError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}