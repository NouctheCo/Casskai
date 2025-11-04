// types/enterprise.types.ts
import { TaxDocument } from './tax.types';

export interface Enterprise {
  id: string;
  name: string;
  registrationNumber: string; // SIRET, TVA Intra, etc.
  vatNumber?: string;
  countryCode: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  taxRegime: TaxRegime;
  fiscalYearStart: number; // Mois (1-12)
  fiscalYearEnd: number;
  currency: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  isActive: boolean;
  logo?: string;
  settings: EnterpriseSettings;
}

export interface TaxRegime {
  id: string;
  code: string;
  name: string;
  type: 'realNormal' | 'realSimplified' | 'microEnterprise' | 'other';
  vatPeriod: 'monthly' | 'quarterly' | 'yearly' | 'none';
  corporateTaxRate?: number;
  specialRules?: string[];
}

export interface EnterpriseSettings {
  defaultVATRate?: string;
  defaultPaymentTerms: number; // jours
  taxReminderDays: number;
  autoCalculateTax: boolean;
  roundingRule: 'up' | 'down' | 'nearest';
  emailNotifications: boolean;
  language: string;
  timezone: string;
}

export interface EnterpriseTaxConfiguration {
  enterpriseId: string;
  taxRates: TaxRate[];
  declarations: TaxDeclaration[];
  payments: TaxPayment[];
  documents: TaxDocument[];
}

export interface TaxRate {
  id: string;
  enterpriseId: string;
  name: string;
  rate: number;
  type: 'VAT' | 'IS' | 'IR' | 'OTHER';
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
}

export interface TaxDeclaration {
  id: string;
  enterpriseId: string;
  type: string;
  period: {
    start: Date;
    end: Date;
  };
  dueDate: Date;
  status: 'draft' | 'pending' | 'submitted' | 'completed' | 'overdue';
  amount?: number;
  submittedDate?: Date;
  submittedBy?: string;
}

export interface TaxPayment {
  id: string;
  enterpriseId: string;
  declarationId: string;
  amount: number;
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
}
