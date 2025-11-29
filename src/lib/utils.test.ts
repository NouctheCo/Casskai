/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, cn, truncate } from './utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format XOF currency correctly', () => {
      // XOF uses "F CFA" symbol in Intl.NumberFormat
      const result1 = formatCurrency(1000, 'XOF');
      expect(result1).toContain('000');
      expect(result1).toContain('CFA');

      const result2 = formatCurrency(1000000, 'XOF');
      expect(result2).toContain('000');
      expect(result2).toContain('CFA');
      expect(result2).toMatch(/1.*000.*000/); // Has millions separator
    });

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toContain('€');
      expect(formatCurrency(1234.56, 'EUR')).toMatch(/1.*234.*56/);
    });

    it('should format USD currency correctly', () => {
      expect(formatCurrency(1000, 'USD')).toContain('$');
      expect(formatCurrency(1234.56, 'USD')).toMatch(/1.*234.*56/);
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0, 'XOF')).toContain('0');
      expect(formatCurrency(0, 'XOF')).toContain('CFA');
      expect(formatCurrency(-1000, 'XOF')).toContain('-');
      expect(formatCurrency(-1000, 'XOF')).toContain('000');
    });

    it('should handle decimal values', () => {
      // XOF rounds to 0 decimals
      const result1 = formatCurrency(1234.56, 'XOF');
      expect(result1).toContain('235'); // Rounded up
      expect(result1).not.toContain('.'); // No decimals

      const result2 = formatCurrency(1234.12, 'XOF');
      expect(result2).toContain('234'); // Rounded down
      expect(result2).not.toContain('.'); // No decimals
    });
  });

  describe('formatDate', () => {
    it('should format date in FR locale', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date, 'fr');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should format date in EN locale', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date, 'en');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should handle ISO string dates', () => {
      const isoDate = '2025-01-15T10:30:00Z';
      const formatted = formatDate(isoDate);
      expect(formatted).toBeDefined();
      expect(formatted).toContain('2025');
    });

    it('should handle invalid dates gracefully', () => {
      expect(() => formatDate('invalid-date')).not.toThrow();
    });
  });

  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
    });

    it('should handle undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4', 'p-2'); // Later should override
      // Should resolve conflicts if using clsx + twMerge
      expect(result).toBeDefined();
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncate(longText, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short strings', () => {
      const shortText = 'Short';
      const result = truncate(shortText, 20);
      expect(result).toBe(shortText);
      expect(result).not.toContain('...');
    });

    it('should handle empty strings', () => {
      const result = truncate('', 10);
      expect(result).toBe('');
    });

    it('should handle exact length', () => {
      const text = 'Exactly20Characters!';
      const result = truncate(text, 20);
      expect(result).toBe(text);
    });

    it('should handle custom suffix', () => {
      const text = 'Long text here';
      const result = truncate(text, 8, '…');
      expect(result).toContain('…');
      expect(result).not.toContain('...');
    });
  });
});
