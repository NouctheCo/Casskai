// types/licensing.ts
export interface LicenseType {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly' | 'lifetime';
  features: LicenseFeatures;
  limits: LicenseLimits;
}

export interface LicenseFeatures {
  multiCompany: boolean;
  multiCurrency: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  mobileApp: boolean;
  cloudBackup: boolean;
  auditTrail: boolean;
  customFields: boolean;
}

export interface LicenseLimits {
  maxUsers: number;
  maxCompanies: number;
  maxTransactions: number;
  storageGB: number;
  supportLevel: 'basic' | 'standard' | 'premium';
}
