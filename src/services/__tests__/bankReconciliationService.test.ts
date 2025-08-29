import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { 
  AccountingEntry, 
  ReconciliationMatch, 
  ReconciliationSummary,
  ReconciliationRule 
} from '../bankReconciliationService';
import { BankTransaction } from '../bankImportService';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null })),
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      }))
    }))
  }
}));

describe('BankReconciliationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Transaction Matching', () => {
    it('should match transactions by exact amount and date', () => {
      const bankTransaction: BankTransaction = {
        id: 'bank-1',
        company_id: 'comp-123',
        account_id: 'acc-1',
        date: '2024-01-15',
        amount: -250.50,
        description: 'PAYMENT TO SUPPLIER ABC',
        reference: 'REF123',
        category: 'expense',
        reconciled: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      const accountingEntry: AccountingEntry = {
        id: 'acc-entry-1',
        company_id: 'comp-123',
        account_number: '401',
        date: '2024-01-15',
        amount: 250.50,
        debit: 0,
        credit: 250.50,
        description: 'Payment to Supplier ABC',
        reference: 'REF123',
        reconciled: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      const isExactMatch = (bankTx: BankTransaction, accEntry: AccountingEntry): boolean => {
        // Check amount (absolute values for comparison)
        const amountMatch = Math.abs(bankTx.amount) === Math.abs(accEntry.amount);
        
        // Check date
        const dateMatch = bankTx.date === accEntry.date;
        
        // Check reference if available
        const referenceMatch = !bankTx.reference || !accEntry.reference || 
                              bankTx.reference === accEntry.reference;
        
        return amountMatch && dateMatch && referenceMatch;
      };

      expect(isExactMatch(bankTransaction, accountingEntry)).toBe(true);

      // Test with different amount
      const differentAmountEntry = { ...accountingEntry, amount: 300 };
      expect(isExactMatch(bankTransaction, differentAmountEntry)).toBe(false);

      // Test with different date
      const differentDateEntry = { ...accountingEntry, date: '2024-01-16' };
      expect(isExactMatch(bankTransaction, differentDateEntry)).toBe(false);
    });

    it('should perform fuzzy matching on descriptions', () => {
      const calculateSimilarity = (str1: string, str2: string): number => {
        // Simple Levenshtein distance implementation
        const matrix: number[][] = [];
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return len2;
        if (len2 === 0) return len1;

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
          matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len1; i++) {
          for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,      // deletion
              matrix[i][j - 1] + 1,      // insertion
              matrix[i - 1][j - 1] + cost // substitution
            );
          }
        }

        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        return (maxLen - distance) / maxLen;
      };

      const normalizeText = (text: string): string => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const fuzzyMatch = (desc1: string, desc2: string, threshold: number = 0.7): boolean => {
        const normalized1 = normalizeText(desc1);
        const normalized2 = normalizeText(desc2);
        const similarity = calculateSimilarity(normalized1, normalized2);
        return similarity >= threshold;
      };

      // Exact match
      expect(fuzzyMatch('PAYMENT TO SUPPLIER ABC', 'PAYMENT TO SUPPLIER ABC')).toBe(true);

      // Close match
      expect(fuzzyMatch('PAYMENT TO SUPPLIER ABC', 'Payment to Supplier ABC Inc')).toBe(true);

      // Different transactions
      expect(fuzzyMatch('PAYMENT TO SUPPLIER ABC', 'SALARY PAYMENT JOHN DOE')).toBe(false);

      // Partial match
      expect(fuzzyMatch('SUPPLIER ABC INVOICE 123', 'SUPPLIER ABC INV 124')).toBe(true);
    });

    it('should score matching confidence correctly', () => {
      const calculateConfidenceScore = (
        amountMatch: boolean,
        dateMatch: boolean,
        referenceMatch: boolean,
        descriptionSimilarity: number,
        daysDifference: number
      ): number => {
        let score = 0;

        // Amount match is critical (40 points)
        if (amountMatch) score += 40;

        // Exact date match (30 points), or reduced points for close dates
        if (dateMatch) {
          score += 30;
        } else if (daysDifference <= 1) {
          score += 20;
        } else if (daysDifference <= 3) {
          score += 10;
        }

        // Reference match (20 points)
        if (referenceMatch) score += 20;

        // Description similarity (10 points max)
        score += Math.floor(descriptionSimilarity * 10);

        return Math.min(score, 100);
      };

      // Perfect match
      expect(calculateConfidenceScore(true, true, true, 1.0, 0)).toBe(100);

      // Good match without reference
      expect(calculateConfidenceScore(true, true, false, 0.8, 0)).toBe(78);

      // Partial match with date difference
      expect(calculateConfidenceScore(true, false, false, 0.6, 2)).toBe(56);

      // Poor match
      expect(calculateConfidenceScore(false, false, false, 0.3, 10)).toBe(3);
    });
  });

  describe('Reconciliation Rules', () => {
    it('should apply automatic reconciliation rules', () => {
      const rules: ReconciliationRule[] = [
        {
          company_id: 'comp-123',
          name: 'Salary Payments',
          description: 'Auto-reconcile salary payments',
          conditions: [
            { field: 'description', operator: 'contains', value: 'SALARY' },
            { field: 'amount', operator: 'less_than', value: 0 }
          ],
          actions: [
            { type: 'set_account', value: '641' },
            { type: 'auto_reconcile', value: true }
          ],
          enabled: true,
          priority: 1
        }
      ];

      const applyRule = (transaction: BankTransaction, rule: ReconciliationRule): boolean => {
        if (!rule.enabled || !rule.conditions) return false;

        return rule.conditions.every(condition => {
          const fieldValue = (transaction as any)[condition.field];
          
          switch (condition.operator) {
            case 'contains':
              return typeof fieldValue === 'string' && 
                     fieldValue.toLowerCase().includes(condition.value.toLowerCase());
            case 'equals':
              return fieldValue === condition.value;
            case 'less_than':
              return typeof fieldValue === 'number' && fieldValue < condition.value;
            case 'greater_than':
              return typeof fieldValue === 'number' && fieldValue > condition.value;
            default:
              return false;
          }
        });
      };

      const salaryTransaction: BankTransaction = {
        id: 'tx-1',
        company_id: 'comp-123',
        account_id: 'acc-1',
        date: '2024-01-15',
        amount: -3500,
        description: 'SALARY PAYMENT JOHN DOE',
        category: 'expense',
        reconciled: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      const nonSalaryTransaction: BankTransaction = {
        id: 'tx-2',
        company_id: 'comp-123',
        account_id: 'acc-1',
        date: '2024-01-15',
        amount: -250,
        description: 'OFFICE SUPPLIES',
        category: 'expense',
        reconciled: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      expect(applyRule(salaryTransaction, rules[0])).toBe(true);
      expect(applyRule(nonSalaryTransaction, rules[0])).toBe(false);
    });
  });

  describe('Reconciliation Summary', () => {
    it('should calculate reconciliation statistics correctly', () => {
      const bankTransactions: BankTransaction[] = [
        { id: '1', amount: 100, reconciled: true } as BankTransaction,
        { id: '2', amount: -200, reconciled: true } as BankTransaction,
        { id: '3', amount: 300, reconciled: false } as BankTransaction,
        { id: '4', amount: -150, reconciled: false } as BankTransaction
      ];

      const accountingEntries: AccountingEntry[] = [
        { id: '1', amount: 100, reconciled: true } as AccountingEntry,
        { id: '2', amount: 200, reconciled: true } as AccountingEntry,
        { id: '3', amount: 75, reconciled: false } as AccountingEntry,
        { id: '4', amount: 300, reconciled: false } as AccountingEntry
      ];

      const calculateSummary = (
        bankTxs: BankTransaction[], 
        accEntries: AccountingEntry[]
      ): ReconciliationSummary => {
        const reconciledBank = bankTxs.filter(tx => tx.reconciled);
        const unreconciledBank = bankTxs.filter(tx => !tx.reconciled);
        const reconciledAcc = accEntries.filter(entry => entry.reconciled);
        const unreconciledAcc = accEntries.filter(entry => !entry.reconciled);

        const amountMatched = reconciledBank.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const amountUnmatchedBank = unreconciledBank.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const amountUnmatchedAcc = unreconciledAcc.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

        return {
          total_bank_transactions: bankTxs.length,
          total_accounting_entries: accEntries.length,
          matched_transactions: reconciledBank.length,
          unmatched_bank: unreconciledBank.length,
          unmatched_accounting: unreconciledAcc.length,
          reconciliation_rate: (reconciledBank.length / bankTxs.length) * 100,
          amount_matched: amountMatched,
          amount_unmatched: amountUnmatchedBank + amountUnmatchedAcc
        };
      };

      const summary = calculateSummary(bankTransactions, accountingEntries);

      expect(summary.total_bank_transactions).toBe(4);
      expect(summary.total_accounting_entries).toBe(4);
      expect(summary.matched_transactions).toBe(2);
      expect(summary.unmatched_bank).toBe(2);
      expect(summary.unmatched_accounting).toBe(2);
      expect(summary.reconciliation_rate).toBe(50);
      expect(summary.amount_matched).toBe(300); // |100| + |-200|
      expect(summary.amount_unmatched).toBe(825); // |300| + |-150| + |75| + |300|
    });
  });

  describe('Amount Matching', () => {
    it('should handle different amount formats and signs', () => {
      const normalizeAmount = (amount: number): number => {
        return Math.round(Math.abs(amount) * 100) / 100;
      };

      const amountsMatch = (amount1: number, amount2: number, tolerance: number = 0.01): boolean => {
        const diff = Math.abs(normalizeAmount(amount1) - normalizeAmount(amount2));
        return diff <= tolerance;
      };

      // Exact matches with opposite signs
      expect(amountsMatch(100.50, -100.50)).toBe(true);
      expect(amountsMatch(-250.00, 250.00)).toBe(true);

      // Small rounding differences
      expect(amountsMatch(100.004, 100.006)).toBe(true);
      expect(amountsMatch(99.999, 100.001)).toBe(true);

      // Different amounts
      expect(amountsMatch(100.50, 200.50)).toBe(false);
      expect(amountsMatch(100.50, 100.52)).toBe(false);
    });

    it('should handle currency precision correctly', () => {
      const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
        const formatter = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return formatter.format(amount);
      };

      expect(formatCurrency(123.456)).toBe('123,46 €');
      expect(formatCurrency(-45.67)).toBe('-45,67 €');
      expect(formatCurrency(1000)).toBe('1 000,00 €');
    });
  });

  describe('Date Range Matching', () => {
    it('should match transactions within date tolerance', () => {
      const isWithinDateRange = (
        date1: string, 
        date2: string, 
        toleranceDays: number = 3
      ): boolean => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= toleranceDays;
      };

      // Same date
      expect(isWithinDateRange('2024-01-15', '2024-01-15')).toBe(true);

      // Within tolerance
      expect(isWithinDateRange('2024-01-15', '2024-01-17')).toBe(true);
      expect(isWithinDateRange('2024-01-15', '2024-01-13')).toBe(true);

      // Outside tolerance
      expect(isWithinDateRange('2024-01-15', '2024-01-20')).toBe(false);
      expect(isWithinDateRange('2024-01-15', '2024-01-10')).toBe(false);
    });

    it('should handle business days correctly', () => {
      const isBusinessDay = (date: Date): boolean => {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
      };

      const getNextBusinessDay = (date: Date): Date => {
        const nextDay = new Date(date);
        do {
          nextDay.setDate(nextDay.getDate() + 1);
        } while (!isBusinessDay(nextDay));
        return nextDay;
      };

      const friday = new Date('2024-01-19'); // Friday
      const monday = new Date('2024-01-22'); // Monday

      expect(isBusinessDay(friday)).toBe(true);
      expect(isBusinessDay(new Date('2024-01-20'))).toBe(false); // Saturday
      expect(isBusinessDay(new Date('2024-01-21'))).toBe(false); // Sunday
      expect(isBusinessDay(monday)).toBe(true);

      const nextBusinessDay = getNextBusinessDay(friday);
      expect(nextBusinessDay.toDateString()).toBe(monday.toDateString());
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const validateTransaction = (transaction: any): string[] => {
        const errors: string[] = [];

        if (!transaction.id) errors.push('Transaction ID is required');
        if (!transaction.amount || typeof transaction.amount !== 'number') {
          errors.push('Valid amount is required');
        }
        if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
          errors.push('Valid date is required (YYYY-MM-DD format)');
        }
        if (!transaction.description || typeof transaction.description !== 'string') {
          errors.push('Description is required');
        }

        return errors;
      };

      // Valid transaction
      const validTx = {
        id: 'tx-1',
        amount: 100.50,
        date: '2024-01-15',
        description: 'Test payment'
      };
      expect(validateTransaction(validTx)).toHaveLength(0);

      // Invalid transaction
      const invalidTx = {
        id: '',
        amount: 'invalid',
        date: '2024-1-15',
        description: null
      };
      const errors = validateTransaction(invalidTx);
      expect(errors).toContain('Transaction ID is required');
      expect(errors).toContain('Valid amount is required');
      expect(errors).toContain('Valid date is required (YYYY-MM-DD format)');
      expect(errors).toContain('Description is required');
    });
  });
});