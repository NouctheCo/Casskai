
// types/accounting.ts
export interface AccountPlan {
  standard: 'SYSCOHADA' | 'PCG' | 'GAAP';
  country: string;
  classes: AccountClass[];
}

export interface AccountClass {
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accounts: Account[];
}

export interface Account {
  number: string;
  name: string;
  type: AccountType;
  isDebitNormal: boolean;
  subAccounts?: Account[];
}

export type AccountType = 
  | 'immobilisations'
  | 'stocks' 
  | 'creances'
  | 'tresorerie'
  | 'dettes'
  | 'capitaux'
  | 'charges'
  | 'produits';
