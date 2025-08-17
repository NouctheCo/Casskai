// types/tenant.ts
export interface TenantConfig {
  id: string;
  name: string;
  domain?: string;
  supabaseUrl: string;
  supabaseKey: string;
  country: string;
  currency: string;
  accountingStandard: 'SYSCOHADA' | 'PCG' | 'GAAP';
  timezone: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  features: TenantFeatures;
  branding?: TenantBranding;
}

export interface TenantFeatures {
  maxUsers: number;
  maxCompanies: number;
  multiCurrency: boolean;
  advancedReporting: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
}

export interface TenantBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  favicon?: string;
}

// NOTE: TenantBranding is declared above; remove duplicate declaration.