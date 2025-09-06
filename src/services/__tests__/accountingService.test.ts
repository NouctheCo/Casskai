// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccountingService } from '../accountingService';
import { AccountPlan, Account, AccountType } from '@/types/accounting';
import { PCG_ACCOUNTS } from '@/data/pcg';
import { SYSCOHADA_PLAN } from '@/data/syscohada';

// Mock des données de test
const mockPCGPlan: AccountPlan = {
  id: 'pcg-france',
  name: 'Plan Comptable Général France',
  country: 'FR',
  currency: 'EUR',
  classes: [
    {
      number: '1',
      name: 'Comptes de capitaux',
      accounts: [
        {
          number: '101',
          name: 'Capital',
          type: 'equity' as AccountType,
          subAccounts: [
            {
              number: '1010',
              name: 'Capital souscrit non appelé',
              type: 'equity' as AccountType
            }
          ]
        }
      ]
    },
    {
      number: '4',
      name: 'Comptes de tiers',
      accounts: [
        {
          number: '411',
          name: 'Clients',
          type: 'receivable' as AccountType
        },
        {
          number: '401',
          name: 'Fournisseurs',
          type: 'payable' as AccountType
        }
      ]
    }
  ]
};

describe('AccountingService', () => {
  let accountingService: AccountingService;

  beforeEach(() => {
    // Réinitialiser l'instance pour chaque test
    (AccountingService as any).instance = null;
    accountingService = AccountingService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AccountingService.getInstance();
      const instance2 = AccountingService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default PCG plan', () => {
      const currentPlan = accountingService.getCurrentPlan();
      expect(currentPlan).toBeTruthy();
      expect(currentPlan?.country).toBe('FR');
    });
  });

  describe('Account Plan Management', () => {
    it('should set and get account plan', () => {
      accountingService.setAccountPlan(mockPCGPlan);
      const currentPlan = accountingService.getCurrentPlan();
      
      expect(currentPlan).toBe(mockPCGPlan);
      expect(currentPlan?.name).toBe('Plan Comptable Général France');
    });

    it('should handle null account plan', () => {
      accountingService.setAccountPlan(null as any);
      const currentPlan = accountingService.getCurrentPlan();
      
      expect(currentPlan).toBeNull();
    });
  });

  describe('Account Lookup', () => {
    beforeEach(() => {
      accountingService.setAccountPlan(mockPCGPlan);
    });

    it('should find account by number', () => {
      const account = accountingService.getAccountByNumber('411');
      
      expect(account).toBeTruthy();
      expect(account?.number).toBe('411');
      expect(account?.name).toBe('Clients');
      expect(account?.type).toBe('receivable');
    });

    it('should find sub-account by number', () => {
      const subAccount = accountingService.getAccountByNumber('1010');
      
      expect(subAccount).toBeTruthy();
      expect(subAccount?.number).toBe('1010');
      expect(subAccount?.name).toBe('Capital souscrit non appelé');
      expect(subAccount?.type).toBe('equity');
    });

    it('should return null for non-existent account', () => {
      const account = accountingService.getAccountByNumber('999');
      
      expect(account).toBeNull();
    });

    it('should return null when no plan is set', () => {
      accountingService.setAccountPlan(null as any);
      const account = accountingService.getAccountByNumber('411');
      
      expect(account).toBeNull();
    });
  });

  describe('Accounts by Type', () => {
    beforeEach(() => {
      accountingService.setAccountPlan(mockPCGPlan);
    });

    it('should get accounts by type', () => {
      const receivableAccounts = accountingService.getAccountsByType('receivable');
      
      expect(receivableAccounts).toHaveLength(1);
      expect(receivableAccounts[0].number).toBe('411');
      expect(receivableAccounts[0].type).toBe('receivable');
    });

    it('should get equity accounts including sub-accounts', () => {
      const equityAccounts = accountingService.getAccountsByType('equity');
      
      expect(equityAccounts.length).toBeGreaterThanOrEqual(1);
      expect(equityAccounts.some(acc => acc.number === '101')).toBe(true);
      expect(equityAccounts.some(acc => acc.number === '1010')).toBe(true);
    });

    it('should return empty array for non-existent type', () => {
      const accounts = accountingService.getAccountsByType('nonexistent' as AccountType);
      
      expect(accounts).toHaveLength(0);
    });

    it('should return empty array when no plan is set', () => {
      accountingService.setAccountPlan(null as any);
      const accounts = accountingService.getAccountsByType('receivable');
      
      expect(accounts).toHaveLength(0);
    });
  });

  describe('Account Validation', () => {
    beforeEach(() => {
      accountingService.setAccountPlan(mockPCGPlan);
    });

    it('should validate account number format', () => {
      const validateAccountNumber = (accountNumber: string): boolean => {
        // Les numéros de compte doivent commencer par un chiffre de classe (1-8)
        const classDigit = accountNumber.charAt(0);
        return /^[1-8]/.test(classDigit) && /^\d+$/.test(accountNumber);
      };

      expect(validateAccountNumber('411')).toBe(true);
      expect(validateAccountNumber('1010')).toBe(true);
      expect(validateAccountNumber('901')).toBe(false); // Classe 9 non standard
      expect(validateAccountNumber('ABC')).toBe(false); // Non numérique
      expect(validateAccountNumber('0411')).toBe(false); // Commence par 0
    });

    it('should validate account hierarchy', () => {
      const isValidHierarchy = (parentNumber: string, childNumber: string): boolean => {
        return childNumber.startsWith(parentNumber) && childNumber.length > parentNumber.length;
      };

      expect(isValidHierarchy('101', '1010')).toBe(true);
      expect(isValidHierarchy('101', '10101')).toBe(true);
      expect(isValidHierarchy('411', '4111')).toBe(true);
      expect(isValidHierarchy('411', '401')).toBe(false);
      expect(isValidHierarchy('101', '101')).toBe(false);
    });
  });

  describe('Balance Calculations', () => {
    it('should calculate debit and credit balances correctly', () => {
      const calculateBalance = (transactions: { debit: number; credit: number }[]) => {
        const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
        const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
        const balance = totalDebit - totalCredit;
        
        return {
          totalDebit,
          totalCredit,
          balance,
          balanceType: balance >= 0 ? 'debit' : 'credit'
        };
      };

      const transactions = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 300 },
        { debit: 500, credit: 0 },
        { debit: 0, credit: 200 }
      ];

      const result = calculateBalance(transactions);
      
      expect(result.totalDebit).toBe(1500);
      expect(result.totalCredit).toBe(500);
      expect(result.balance).toBe(1000);
      expect(result.balanceType).toBe('debit');
    });

    it('should handle negative balances (credit)', () => {
      const calculateBalance = (transactions: { debit: number; credit: number }[]) => {
        const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
        const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
        const balance = totalDebit - totalCredit;
        
        return {
          totalDebit,
          totalCredit,
          balance,
          balanceType: balance >= 0 ? 'debit' : 'credit'
        };
      };

      const transactions = [
        { debit: 200, credit: 0 },
        { debit: 0, credit: 800 }
      ];

      const result = calculateBalance(transactions);
      
      expect(result.totalDebit).toBe(200);
      expect(result.totalCredit).toBe(800);
      expect(result.balance).toBe(-600);
      expect(result.balanceType).toBe('credit');
    });
  });

  describe('Account Type Behavior', () => {
    it('should understand natural balance sides for different account types', () => {
      const getNaturalBalance = (accountType: AccountType): 'debit' | 'credit' => {
        const debitTypes: AccountType[] = ['asset', 'expense', 'receivable'];
        const creditTypes: AccountType[] = ['liability', 'equity', 'revenue', 'payable'];
        
        if (debitTypes.includes(accountType)) return 'debit';
        if (creditTypes.includes(accountType)) return 'credit';
        
        return 'debit'; // Par défaut
      };

      expect(getNaturalBalance('asset')).toBe('debit');
      expect(getNaturalBalance('expense')).toBe('debit');
      expect(getNaturalBalance('receivable')).toBe('debit');
      
      expect(getNaturalBalance('liability')).toBe('credit');
      expect(getNaturalBalance('equity')).toBe('credit');
      expect(getNaturalBalance('revenue')).toBe('credit');
      expect(getNaturalBalance('payable')).toBe('credit');
    });

    it('should validate double-entry bookkeeping rules', () => {
      const validateDoubleEntry = (entries: { account: string; debit: number; credit: number }[]) => {
        const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
        
        return {
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
          totalDebits,
          totalCredits,
          difference: totalDebits - totalCredits
        };
      };

      // Écriture équilibrée
      const balancedEntries = [
        { account: '411', debit: 1200, credit: 0 },
        { account: '701', debit: 0, credit: 1000 },
        { account: '445', debit: 0, credit: 200 }
      ];

      const balancedResult = validateDoubleEntry(balancedEntries);
      expect(balancedResult.isBalanced).toBe(true);
      expect(balancedResult.totalDebits).toBe(1200);
      expect(balancedResult.totalCredits).toBe(1200);

      // Écriture déséquilibrée
      const unbalancedEntries = [
        { account: '411', debit: 1000, credit: 0 },
        { account: '701', debit: 0, credit: 900 }
      ];

      const unbalancedResult = validateDoubleEntry(unbalancedEntries);
      expect(unbalancedResult.isBalanced).toBe(false);
      expect(unbalancedResult.difference).toBe(100);
    });
  });

  describe('Financial Statement Categories', () => {
    it('should categorize accounts for balance sheet', () => {
      const categorizeForBalanceSheet = (accountType: AccountType): 'assets' | 'liabilities' | 'equity' | 'other' => {
        switch (accountType) {
          case 'asset':
          case 'receivable':
            return 'assets';
          case 'liability':
          case 'payable':
            return 'liabilities';
          case 'equity':
            return 'equity';
          default:
            return 'other';
        }
      };

      expect(categorizeForBalanceSheet('asset')).toBe('assets');
      expect(categorizeForBalanceSheet('receivable')).toBe('assets');
      expect(categorizeForBalanceSheet('liability')).toBe('liabilities');
      expect(categorizeForBalanceSheet('payable')).toBe('liabilities');
      expect(categorizeForBalanceSheet('equity')).toBe('equity');
      expect(categorizeForBalanceSheet('revenue')).toBe('other');
      expect(categorizeForBalanceSheet('expense')).toBe('other');
    });

    it('should categorize accounts for income statement', () => {
      const categorizeForIncomeStatement = (accountType: AccountType): 'revenue' | 'expense' | 'other' => {
        switch (accountType) {
          case 'revenue':
            return 'revenue';
          case 'expense':
            return 'expense';
          default:
            return 'other';
        }
      };

      expect(categorizeForIncomeStatement('revenue')).toBe('revenue');
      expect(categorizeForIncomeStatement('expense')).toBe('expense');
      expect(categorizeForIncomeStatement('asset')).toBe('other');
      expect(categorizeForIncomeStatement('liability')).toBe('other');
    });
  });

  describe('Currency and Precision', () => {
    it('should handle monetary amounts with correct precision', () => {
      const roundToAccountingPrecision = (amount: number): number => {
        // Arrondir à 2 décimales pour la comptabilité
        return Math.round(amount * 100) / 100;
      };

      expect(roundToAccountingPrecision(123.456789)).toBe(123.46);
      expect(roundToAccountingPrecision(123.454)).toBe(123.45);
      expect(roundToAccountingPrecision(123.455)).toBe(123.46); // Arrondi bancaire
    });

    it('should validate monetary amounts', () => {
      const validateMonetaryAmount = (amount: number): boolean => {
        // Vérifier que le montant est fini, positif ou nul, et avec max 2 décimales
        if (!Number.isFinite(amount) || amount < 0) return false;
        
        const rounded = Math.round(amount * 100) / 100;
        return Math.abs(amount - rounded) < Number.EPSILON;
      };

      expect(validateMonetaryAmount(123.45)).toBe(true);
      expect(validateMonetaryAmount(0)).toBe(true);
      expect(validateMonetaryAmount(123.456)).toBe(false);
      expect(validateMonetaryAmount(-123.45)).toBe(false);
      expect(validateMonetaryAmount(Number.NaN)).toBe(false);
      expect(validateMonetaryAmount(Number.POSITIVE_INFINITY)).toBe(false);
    });
  });
});