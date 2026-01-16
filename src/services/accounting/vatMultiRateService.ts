/**
 * VAT Multi-Rate Service
 *
 * Gestion intelligente de la TVA multi-taux dans les écritures comptables.
 * Génère des lignes de TVA séparées par taux au lieu d'une seule ligne globale.
 *
 * Problème résolu:
 * - Avant: 1 ligne TVA globale même si 3 produits à taux différents
 * - Après: 1 ligne TVA par taux (44571-20%, 44571-5.5%, 44571-2.1%)
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// ============================================================================
// TYPES
// ============================================================================
export interface VATLine {
  rate: number;
  base_amount: number;
  vat_amount: number;
  account_number: string;
  description: string;
}
export interface VATBreakdown {
  lines: VATLine[];
  total_base: number;
  total_vat: number;
  total_ttc: number;
}
export interface InvoiceLineWithVAT {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal_excl_tax: number;
  tax_rate: number;
  tax_amount: number;
  subtotal_incl_tax: number;
}
// ============================================================================
// VAT RATES CONFIGURATION
// ============================================================================
export const VAT_RATES = {
  FR: {
    NORMAL: 20.0,
    INTERMEDIATE: 10.0,
    REDUCED: 5.5,
    SUPER_REDUCED: 2.1,
    ZERO: 0.0,
  },
  BE: {
    NORMAL: 21.0,
    INTERMEDIATE: 12.0,
    REDUCED: 6.0,
    ZERO: 0.0,
  },
  LU: {
    NORMAL: 17.0,
    INTERMEDIATE: 14.0,
    REDUCED: 8.0,
    SUPER_REDUCED: 3.0,
    ZERO: 0.0,
  },
  CH: {
    NORMAL: 7.7,
    REDUCED: 2.5,
    SPECIAL: 3.7,
    ZERO: 0.0,
  },
} as const;
// Account numbers for VAT by rate
export const VAT_ACCOUNTS = {
  // TVA collectée (ventes)
  collected: {
    '20.0': '44571-20',
    '10.0': '44571-10',
    '5.5': '44571-055',
    '2.1': '44571-021',
    '0.0': '44571-0',
    default: '44571',
  },
  // TVA déductible (achats)
  deductible: {
    '20.0': '44566-20',
    '10.0': '44566-10',
    '5.5': '44566-055',
    '2.1': '44566-021',
    '0.0': '44566-0',
    default: '44566',
  },
} as const;
// ============================================================================
// CALCULATE VAT BREAKDOWN BY RATE
// ============================================================================
/**
 * Calculate VAT breakdown by rate from invoice lines
 */
export function calculateVATBreakdown(
  lines: InvoiceLineWithVAT[],
  type: 'sale' | 'purchase'
): VATBreakdown {
  // Group by tax rate
  const byRate = new Map<number, { base: number; vat: number }>();
  for (const line of lines) {
    const rate = line.tax_rate || 0;
    const existing = byRate.get(rate) || { base: 0, vat: 0 };
    byRate.set(rate, {
      base: existing.base + line.subtotal_excl_tax,
      vat: existing.vat + line.tax_amount,
    });
  }
  // Convert to VATLine array
  const vatLines: VATLine[] = [];
  let total_base = 0;
  let total_vat = 0;
  for (const [rate, amounts] of byRate.entries()) {
    const accountMap = type === 'sale' ? VAT_ACCOUNTS.collected : VAT_ACCOUNTS.deductible;
    const rateKey = rate.toFixed(1);
    const account = accountMap[rateKey as keyof typeof accountMap] || accountMap.default;
    vatLines.push({
      rate,
      base_amount: amounts.base,
      vat_amount: amounts.vat,
      account_number: account,
      description: `TVA ${rate}%`,
    });
    total_base += amounts.base;
    total_vat += amounts.vat;
  }
  return {
    lines: vatLines,
    total_base,
    total_vat,
    total_ttc: total_base + total_vat,
  };
}
// ============================================================================
// GENERATE JOURNAL ENTRY WITH MULTI-RATE VAT
// ============================================================================
/**
 * Generate journal entry lines with multi-rate VAT for a sale invoice
 */
export async function generateSaleJournalEntryWithVAT(
  invoice: {
    id: string;
    invoice_number: string;
    customer_id: string;
    total_excl_tax: number;
    total_tax: number;
    total_incl_tax: number;
  },
  invoiceLines: InvoiceLineWithVAT[],
  _companyId: string
): Promise<any[]> {
  const vatBreakdown = calculateVATBreakdown(invoiceLines, 'sale');
  const journalEntryLines = [];
  // Line 1: Debit customer (411)
  journalEntryLines.push({
    account_number: '411',
    account_name: 'Clients',
    description: `Facture ${invoice.invoice_number}`,
    debit_amount: invoice.total_incl_tax,
    credit_amount: 0,
  });
  // Lines for sales by product/service (707, 706, etc.)
  // Group invoice lines by account (if you have product categories)
  const salesByAccount = new Map<string, number>();
  for (const line of invoiceLines) {
    // Default to 707 (sales of goods/services)
    // In real implementation, you'd determine account from product category
    const account = '707';
    const existing = salesByAccount.get(account) || 0;
    salesByAccount.set(account, existing + line.subtotal_excl_tax);
  }
  for (const [account, amount] of salesByAccount.entries()) {
    journalEntryLines.push({
      account_number: account,
      account_name: 'Ventes de marchandises',
      description: `Facture ${invoice.invoice_number}`,
      debit_amount: 0,
      credit_amount: amount,
    });
  }
  // Lines for VAT - ONE PER RATE (this is the key improvement!)
  for (const vatLine of vatBreakdown.lines) {
    journalEntryLines.push({
      account_number: vatLine.account_number,
      account_name: `TVA collectée ${vatLine.rate}%`,
      description: vatLine.description,
      debit_amount: 0,
      credit_amount: vatLine.vat_amount,
    });
  }
  return journalEntryLines;
}
/**
 * Generate journal entry lines with multi-rate VAT for a purchase invoice
 */
export async function generatePurchaseJournalEntryWithVAT(
  invoice: {
    id: string;
    invoice_number: string;
    supplier_id: string;
    total_excl_tax: number;
    total_tax: number;
    total_incl_tax: number;
  },
  invoiceLines: InvoiceLineWithVAT[],
  _companyId: string
): Promise<any[]> {
  const vatBreakdown = calculateVATBreakdown(invoiceLines, 'purchase');
  const journalEntryLines = [];
  // Lines for purchases by category (607, 601, etc.)
  const purchasesByAccount = new Map<string, number>();
  for (const line of invoiceLines) {
    // Default to 607 (purchases of goods)
    // In real implementation, you'd determine account from product category
    const account = '607';
    const existing = purchasesByAccount.get(account) || 0;
    purchasesByAccount.set(account, existing + line.subtotal_excl_tax);
  }
  for (const [account, amount] of purchasesByAccount.entries()) {
    journalEntryLines.push({
      account_number: account,
      account_name: 'Achats de marchandises',
      description: `Facture ${invoice.invoice_number}`,
      debit_amount: amount,
      credit_amount: 0,
    });
  }
  // Lines for VAT deductible - ONE PER RATE
  for (const vatLine of vatBreakdown.lines) {
    journalEntryLines.push({
      account_number: vatLine.account_number,
      account_name: `TVA déductible ${vatLine.rate}%`,
      description: vatLine.description,
      debit_amount: vatLine.vat_amount,
      credit_amount: 0,
    });
  }
  // Line: Credit supplier (401)
  journalEntryLines.push({
    account_number: '401',
    account_name: 'Fournisseurs',
    description: `Facture ${invoice.invoice_number}`,
    debit_amount: 0,
    credit_amount: invoice.total_incl_tax,
  });
  return journalEntryLines;
}
// ============================================================================
// VAT DECLARATION PREPARATION
// ============================================================================
/**
 * Get VAT data for declaration (CA3/CA12) with breakdown by rate
 */
export async function getVATDeclarationData(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<{
  collected: VATLine[];
  deductible: VATLine[];
  total_collected: number;
  total_deductible: number;
  vat_to_pay: number;
}> {
  // Get all VAT lines in period
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      id,
      account_number,
      account_name,
      debit_amount,
      credit_amount,
      journal_entry:journal_entries!inner(
        entry_date,
        status
      )
    `)
    .eq('company_id', companyId)
    .or('account_number.like.44571%,account_number.like.44566%')
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate)
    .eq('journal_entry.status', 'posted');
  if (error) {
    logger.error('VatMultiRate', 'Error fetching VAT data:', error);
    throw error;
  }
  // Group by rate
  const collected: Map<number, VATLine> = new Map();
  const deductible: Map<number, VATLine> = new Map();
  for (const line of lines || []) {
    const accountNum = line.account_number;
    // Extract rate from account (44571-20 -> 20%)
    const rateMatch = accountNum.match(/(\d+)$/);
    const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
    if (accountNum.startsWith('44571')) {
      // TVA collectée (credit side)
      const existing = collected.get(rate) || {
        rate,
        base_amount: 0,
        vat_amount: 0,
        account_number: accountNum,
        description: `TVA collectée ${rate}%`,
      };
      existing.vat_amount += line.credit_amount || 0;
      collected.set(rate, existing);
    } else if (accountNum.startsWith('44566')) {
      // TVA déductible (debit side)
      const existing = deductible.get(rate) || {
        rate,
        base_amount: 0,
        vat_amount: 0,
        account_number: accountNum,
        description: `TVA déductible ${rate}%`,
      };
      existing.vat_amount += line.debit_amount || 0;
      deductible.set(rate, existing);
    }
  }
  const collectedArray = Array.from(collected.values());
  const deductibleArray = Array.from(deductible.values());
  const total_collected = collectedArray.reduce((sum, l) => sum + l.vat_amount, 0);
  const total_deductible = deductibleArray.reduce((sum, l) => sum + l.vat_amount, 0);
  return {
    collected: collectedArray,
    deductible: deductibleArray,
    total_collected,
    total_deductible,
    vat_to_pay: total_collected - total_deductible,
  };
}
// ============================================================================
// VALIDATE VAT CONSISTENCY
// ============================================================================
/**
 * Validate that VAT amounts match calculated amounts from base
 */
export function validateVATCalculation(vatLine: VATLine): {
  isValid: boolean;
  expected_vat: number;
  actual_vat: number;
  difference: number;
} {
  const expected_vat = (vatLine.base_amount * vatLine.rate) / 100;
  const difference = Math.abs(expected_vat - vatLine.vat_amount);
  return {
    isValid: difference < 0.02, // Tolerance 2 cents
    expected_vat,
    actual_vat: vatLine.vat_amount,
    difference,
  };
}