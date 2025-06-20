// types/tax.types.ts

export interface TaxRate {
  id: string | number;
  name: string;
  rate: number;
  type: 'TVA' | 'IS' | 'IR' | 'OTHER';
  description?: string;
  countryCode: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TaxDeclaration {
  id: string;
  type: 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE';
  name: string;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'completed' | 'submitted' | 'draft';
  amount?: number;
  description?: string;
  companyId: string;
  countryCode: string;
  period?: {
    start: Date;
    end: Date;
  };
  attachments?: string[];
  notes?: string;
  submittedDate?: Date;
  submittedBy?: string;
}

export interface TaxRegime {
  id: string | number;
  name: string;
  description: string;
  countryCode: string;
  conditions: string;
  obligations: string[];
  advantages?: string[];
  disadvantages?: string[];
  revenueThresholds?: {
    services?: number;
    sales?: number;
  };
  taxRates?: {
    corporate?: number;
    vat?: boolean;
  };
}

export interface TaxCalculation {
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  calculatedAt: Date;
}

export interface TaxPayment {
  id: string;
  declarationId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'direct_debit' | 'check' | 'card';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  receiptUrl?: string;
}

export interface TaxDocument {
  id: string;
  type: 'declaration' | 'receipt' | 'certificate' | 'report';
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  declarationId?: string;
}

export interface TaxSettings {
  companyId: string;
  countryCode: string;
  defaultRates: {
    vat?: string;
    corporate?: string;
  };
  reminderDays: number;
  autoCalculate: boolean;
  roundingRule: 'up' | 'down' | 'nearest';
  emailNotifications: boolean;
  fiscalYearStart: number; // Month (1-12)
}