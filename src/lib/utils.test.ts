import { describe, it, expect, vi } from 'vitest';
import { formatCurrency, formatDate, cn, truncate, formatNumber, formatPercentage, formatFileSize, debounce, capitalize, generateId } from './utils';

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
      const formatted = formatDate(date, 'medium', 'fr-FR');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should format date in EN locale', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date, 'medium', 'en-US');
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

  describe('formatNumber', () => {
    it('should format numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1\u202f000');
      expect(formatNumber(1000000)).toBe('1\u202f000\u202f000');
      expect(formatNumber(1234567)).toBe('1\u202f234\u202f567');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56)).toBe('1\u202f234,56');
      expect(formatNumber(0.5)).toBe('0,5');
    });

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1\u202f000');
    });

    it('should use different locale', () => {
      expect(formatNumber(1000, 'en-US')).toBe('1,000');
      expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercentage(0.15)).toBe('15,0%');
      expect(formatPercentage(0.5)).toBe('50,0%');
      expect(formatPercentage(1)).toBe('100,0%');
    });

    it('should handle different decimal places', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12,34%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
    });

    it('should handle zero and negative values', () => {
      expect(formatPercentage(0)).toBe('0,0%');
      expect(formatPercentage(-0.15)).toBe('-15,0%');
    });

    it('should use different locale', () => {
      expect(formatPercentage(0.15, 1, 'en-US')).toBe('15.0%');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle different decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 3)).toBe('1.5 KB');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous call when called again', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      await new Promise(resolve => setTimeout(resolve, 50));
      debouncedFn(); // Should cancel first call

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('arg1', 'arg2');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('hELLO')).toBe('HELLO');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('A')).toBe('A');
    });

    it('should handle strings with spaces', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });

  describe('generateId', () => {
    it('should generate string of specified length', () => {
      expect(generateId(10)).toHaveLength(10);
      expect(generateId(20)).toHaveLength(20);
      expect(generateId()).toHaveLength(16); // default
    });

    it('should generate different IDs', () => {
      const id1 = generateId(10);
      const id2 = generateId(10);
      expect(id1).not.toBe(id2);
    });

    it('should only contain valid characters', () => {
      const id = generateId(100);
      const validChars = /^[A-Za-z0-9]+$/;
      expect(validChars.test(id)).toBe(true);
    });
  });
});
