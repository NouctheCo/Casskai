/**
 * Tests for VAT Multi-Rate Service
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVATBreakdown,
  VAT_RATES,
  VAT_ACCOUNTS,
  type InvoiceLineWithVAT,
} from '../vatMultiRateService';

describe('VAT Multi-Rate Service', () => {
  describe('calculateVATBreakdown', () => {
    it('should calculate VAT for single rate (20%)', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Product A',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 100,
          tax_rate: 20.0,
          tax_amount: 20,
          subtotal_incl_tax: 120,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(100);
      expect(breakdown.total_vat).toBe(20);
      expect(breakdown.total_ttc).toBe(120);
      expect(breakdown.lines).toHaveLength(1);
      expect(breakdown.lines[0].rate).toBe(20.0);
      expect(breakdown.lines[0].base_amount).toBe(100);
      expect(breakdown.lines[0].vat_amount).toBe(20);
    });

    it('should separate VAT by different rates', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Product A',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 100,
          tax_rate: 20.0,
          tax_amount: 20,
          subtotal_incl_tax: 120,
        },
        {
          id: '2',
          description: 'Product B',
          quantity: 1,
          unit_price: 50,
          subtotal_excl_tax: 50,
          tax_rate: 5.5,
          tax_amount: 2.75,
          subtotal_incl_tax: 52.75,
        },
        {
          id: '3',
          description: 'Product C',
          quantity: 1,
          unit_price: 30,
          subtotal_excl_tax: 30,
          tax_rate: 2.1,
          tax_amount: 0.63,
          subtotal_incl_tax: 30.63,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.lines).toHaveLength(3);

      // Verify 20% rate
      const rate20 = breakdown.lines.find(r => r.rate === 20.0);
      expect(rate20).toBeDefined();
      expect(rate20?.base_amount).toBe(100);
      expect(rate20?.vat_amount).toBe(20);
      expect(rate20?.account_number).toBe('44571-20');

      // Verify 5.5% rate
      const rate55 = breakdown.lines.find(r => r.rate === 5.5);
      expect(rate55).toBeDefined();
      expect(rate55?.base_amount).toBe(50);
      expect(rate55?.vat_amount).toBe(2.75);
      expect(rate55?.account_number).toBe('44571-055');

      // Verify 2.1% rate
      const rate21 = breakdown.lines.find(r => r.rate === 2.1);
      expect(rate21).toBeDefined();
      expect(rate21?.base_amount).toBe(30);
      expect(rate21?.vat_amount).toBeCloseTo(0.63, 2);
      expect(rate21?.account_number).toBe('44571-021');
    });

    it('should aggregate same rates', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Product A',
          quantity: 2,
          unit_price: 100,
          subtotal_excl_tax: 200,
          tax_rate: 20.0,
          tax_amount: 40,
          subtotal_incl_tax: 240,
        },
        {
          id: '2',
          description: 'Product B',
          quantity: 1,
          unit_price: 50,
          subtotal_excl_tax: 50,
          tax_rate: 20.0,
          tax_amount: 10,
          subtotal_incl_tax: 60,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.lines).toHaveLength(1);
      expect(breakdown.lines[0].rate).toBe(20.0);
      expect(breakdown.lines[0].base_amount).toBe(250); // 200 + 50
      expect(breakdown.lines[0].vat_amount).toBe(50); // 40 + 10
    });

    it('should handle zero VAT rate', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Export',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 100,
          tax_rate: 0,
          tax_amount: 0,
          subtotal_incl_tax: 100,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(100);
      expect(breakdown.total_vat).toBe(0);
      expect(breakdown.total_ttc).toBe(100);
      expect(breakdown.lines).toHaveLength(1);
      expect(breakdown.lines[0].vat_amount).toBe(0);
    });

    it('should use correct account numbers for purchase', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Purchase',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 100,
          tax_rate: 20.0,
          tax_amount: 20,
          subtotal_incl_tax: 120,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'purchase');

      expect(breakdown.lines[0].account_number).toBe('44566-20'); // Deductible VAT
    });

    it('should handle discounts correctly', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Product with discount',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 90, // 100 - 10% discount
          tax_rate: 20.0,
          tax_amount: 18, // 90 * 0.20
          subtotal_incl_tax: 108,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(90);
      expect(breakdown.total_vat).toBe(18);
      expect(breakdown.total_ttc).toBe(108);
    });

    it('should round VAT amounts correctly', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Product',
          quantity: 1,
          unit_price: 33.33,
          subtotal_excl_tax: 33.33,
          tax_rate: 20.0,
          tax_amount: 6.67,
          subtotal_incl_tax: 40,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_vat).toBeCloseTo(6.67, 2);
    });
  });

  describe('VAT_RATES', () => {
    it('should have correct French VAT rates', () => {
      expect(VAT_RATES.FR.NORMAL).toBe(20.0);
      expect(VAT_RATES.FR.INTERMEDIATE).toBe(10.0);
      expect(VAT_RATES.FR.REDUCED).toBe(5.5);
      expect(VAT_RATES.FR.SUPER_REDUCED).toBe(2.1);
      expect(VAT_RATES.FR.ZERO).toBe(0.0);
    });
  });

  describe('VAT_ACCOUNTS', () => {
    it('should have correct collected VAT accounts', () => {
      expect(VAT_ACCOUNTS.collected['20.0']).toBe('44571-20');
      expect(VAT_ACCOUNTS.collected['10.0']).toBe('44571-10');
      expect(VAT_ACCOUNTS.collected['5.5']).toBe('44571-055');
      expect(VAT_ACCOUNTS.collected['2.1']).toBe('44571-021');
    });

    it('should have correct deductible VAT accounts', () => {
      expect(VAT_ACCOUNTS.deductible['20.0']).toBe('44566-20');
      expect(VAT_ACCOUNTS.deductible['10.0']).toBe('44566-10');
      expect(VAT_ACCOUNTS.deductible['5.5']).toBe('44566-055');
      expect(VAT_ACCOUNTS.deductible['2.1']).toBe('44566-021');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle mixed rates with multiple quantities', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'A',
          quantity: 3,
          unit_price: 10,
          subtotal_excl_tax: 30,
          tax_rate: 20.0,
          tax_amount: 6,
          subtotal_incl_tax: 36,
        },
        {
          id: '2',
          description: 'B',
          quantity: 2,
          unit_price: 15,
          subtotal_excl_tax: 30,
          tax_rate: 5.5,
          tax_amount: 1.65,
          subtotal_incl_tax: 31.65,
        },
        {
          id: '3',
          description: 'C',
          quantity: 1,
          unit_price: 100,
          subtotal_excl_tax: 100,
          tax_rate: 0,
          tax_amount: 0,
          subtotal_incl_tax: 100,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(160); // 30 + 30 + 100
      expect(breakdown.total_vat).toBeCloseTo(7.65, 2); // 6 + 1.65 + 0
      expect(breakdown.total_ttc).toBeCloseTo(167.65, 2);
      expect(breakdown.lines).toHaveLength(3);
    });

    it('should handle very small amounts correctly', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Tiny',
          quantity: 1,
          unit_price: 0.01,
          subtotal_excl_tax: 0.01,
          tax_rate: 20.0,
          tax_amount: 0.002,
          subtotal_incl_tax: 0.012,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(0.01);
      expect(breakdown.total_vat).toBeCloseTo(0.002, 3);
    });

    it('should handle large amounts without precision loss', () => {
      const lines: InvoiceLineWithVAT[] = [
        {
          id: '1',
          description: 'Big',
          quantity: 100,
          unit_price: 1000,
          subtotal_excl_tax: 100000,
          tax_rate: 20.0,
          tax_amount: 20000,
          subtotal_incl_tax: 120000,
        },
      ];

      const breakdown = calculateVATBreakdown(lines, 'sale');

      expect(breakdown.total_base).toBe(100000);
      expect(breakdown.total_vat).toBe(20000);
      expect(breakdown.total_ttc).toBe(120000);
    });
  });
});
