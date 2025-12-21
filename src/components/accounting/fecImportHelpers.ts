// Helper functions for FEC Import data transformation

import type { ParseResult, TransformedFECData } from './types';



/**

 * Calculate financial summary from entries

 */

export function calculateFinancialSummary(entries: Array<{ debit: number; credit: number }>) {

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);

  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  const balance = totalDebit - totalCredit;



  return {

    totalDebit: totalDebit.toLocaleString(),

    totalCredit: totalCredit.toLocaleString(),

    balance: balance.toFixed(2),

  };

}



/**

 * Extract unique values from entries

 */

export function extractUniqueValues<T, K extends keyof T>(

  entries: T[],

  key: K

): Array<T[K]> {

  return [...new Set(entries.map(e => e[key]))];

}



/**

 * Transform parser result to UI-compatible format

 */

export function transformParsedDataForUI(result: ParseResult): TransformedFECData {

  if (!result.success || !result.entries || result.entries.length === 0) {

    return {

      entries: [],

      accounts: new Map(),

      journals: [],

      summary: {

        errors: result.errors || [],

        numEntries: 0,

      },

    };

  }



  const entries = result.entries;

  const uniqueJournals = extractUniqueValues(entries, 'journalCode');

  const uniqueAccounts = extractUniqueValues(entries, 'accountNumber');

  const financialSummary = calculateFinancialSummary(entries);



  return {

    entries,

    accounts: new Map(),

    journals: uniqueJournals,

    summary: {

      errors: result.errors || [],

      warnings: result.warnings || [],

      numEntries: result.validRows || entries.length,

      numAccounts: uniqueAccounts.length,

      numJournals: uniqueJournals.length,

      ...financialSummary,

      unbalancedEntries: [],

    },

  };

}



/**

 * Create error data structure

 */

export function createErrorData(error: Error | unknown): TransformedFECData {

  const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';

  

  return {

    entries: [],

    accounts: new Map(),

    journals: [],

    summary: {

      errors: [{ message: errorMessage }],

      numEntries: 0,

    },

  };

}



/**

 * Simulate import progress

 */

export function createProgressSimulator(

  setProgress: (value: number | ((prev: number) => number)) => void,

  intervalMs: number = 500,

  maxProgress: number = 90,

  increment: number = 10

): () => void {

  const progressInterval = setInterval(() => {

    setProgress(prev => {

      if (prev >= maxProgress) {

        clearInterval(progressInterval);

        return maxProgress;

      }

      return prev + increment;

    });

  }, intervalMs);



  // Return cleanup function

  return () => clearInterval(progressInterval);

}
