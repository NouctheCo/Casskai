/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Types communs pour les déclarations fiscales africaines
 */

export type FiscalStandard = 'SYSCOHADA' | 'IFRS' | 'SCF' | 'PCG';

export type DeclarationStatus = 'draft' | 'ready' | 'filed' | 'accepted' | 'rejected';

export interface FiscalDeclaration {
  id: string;
  type: string;
  standard: FiscalStandard;
  country: string;
  period: string;
  dueDate: Date;
  status: DeclarationStatus;
  companyId: string;
  data: Record<string, any>;
  validationErrors: string[];
  warnings: string[];
  filedAt?: Date;
  filedBy?: string;
  acceptanceDate?: Date;
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalance {
  debit: number;
  credit: number;
  balance: number;
}

export interface CountryConfig {
  name: string;
  currency: string;
  vatRate: number;
  vatReducedRates: number[];
  corporateTaxRate: number;
  fiscalYearEnd: string;
  taxFilingDeadline: string;
  taxAuthority: string;
  onlinePortal?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
