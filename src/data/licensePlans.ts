// @ts-nocheck
// data/licensePlans.ts
export const LICENSE_PLANS: LicenseType[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15000, // 15 000 F CFA
    currency: 'XOF',
    duration: 'monthly',
    features: {
      multiCompany: false,
      multiCurrency: false,
      advancedReports: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      mobileApp: true,
      cloudBackup: true,
      auditTrail: false,
      customFields: false
    },
    limits: {
      maxUsers: 2,
      maxCompanies: 1,
      maxTransactions: 1000,
      storageGB: 1,
      supportLevel: 'basic'
    }
  },
  {
    id: 'professional',
    name: 'Professionnel',
    price: 35000, // 35 000 F CFA
    currency: 'XOF',
    duration: 'monthly',
    features: {
      multiCompany: true,
      multiCurrency: true,
      advancedReports: true,
      apiAccess: false,
      customBranding: false,
      prioritySupport: true,
      mobileApp: true,
      cloudBackup: true,
      auditTrail: true,
      customFields: true
    },
    limits: {
      maxUsers: 10,
      maxCompanies: 5,
      maxTransactions: 10000,
      storageGB: 10,
      supportLevel: 'standard'
    }
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 75000, // 75 000 F CFA
    currency: 'XOF',
    duration: 'monthly',
    features: {
      multiCompany: true,
      multiCurrency: true,
      advancedReports: true,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      mobileApp: true,
      cloudBackup: true,
      auditTrail: true,
      customFields: true
    },
    limits: {
      maxUsers: -1, // Illimité
      maxCompanies: -1, // Illimité
      maxTransactions: -1, // Illimité
      storageGB: 100,
      supportLevel: 'premium'
    }
  }
];
