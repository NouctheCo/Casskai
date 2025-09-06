// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import {
  formatError,
  safeGet,
  debounce,
  cn,
  validateRequired,
  truncate,
  formatCurrency,
  formatPercentage,
  sleep,
  isEmpty
} from '../componentHelpers';

describe('componentHelpers', () => {
  describe('formatError', () => {
    it('should format Error objects correctly', () => {
      const error = new Error('Test error');
      const result = formatError(error, 'Test context');
      expect(result).toBe('Test context: Test error');
    });

    it('should format Error objects without context', () => {
      const error = new Error('Test error');
      const result = formatError(error);
      expect(result).toBe('Test error');
    });

    it('should handle unknown errors with context', () => {
      const result = formatError('string error', 'Test context');
      expect(result).toBe('Test context: Erreur inconnue');
    });

    it('should handle unknown errors without context', () => {
      const result = formatError('string error');
      expect(result).toBe('Erreur inconnue');
    });
  });

  describe('safeGet', () => {
    const testObject = {
      level1: {
        level2: {
          level3: 'deep value'
        },
        array: [1, 2, 3]
      },
      string: 'test'
    };

    it('should get nested properties correctly', () => {
      const result = safeGet(testObject, 'level1.level2.level3', 'default');
      expect(result).toBe('deep value');
    });

    it('should return default value for missing properties', () => {
      const result = safeGet(testObject, 'level1.missing.property', 'default');
      expect(result).toBe('default');
    });

    it('should return default value for null object', () => {
      const result = safeGet(null as any, 'level1.level2', 'default');
      expect(result).toBe('default');
    });

    it('should get top-level properties', () => {
      const result = safeGet(testObject, 'string', 'default');
      expect(result).toBe('test');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('arg1');
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should cancel previous calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('cn', () => {
    it('should combine valid class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      const result = cn('class1', null, undefined, false, '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle all falsy values', () => {
      const result = cn(null, undefined, false, '');
      expect(result).toBe('');
    });
  });

  describe('validateRequired', () => {
    it('should return empty array for valid fields', () => {
      const fields = {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      };
      
      const errors = validateRequired(fields);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing fields', () => {
      const fields = {
        name: '',
        age: null,
        email: undefined,
        valid: 'test'
      };
      
      const errors = validateRequired(fields);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('name est requis');
      expect(errors).toContain('age est requis');
      expect(errors).toContain('email est requis');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const result = truncate('This is a very long text', 10);
      expect(result).toBe('This is a ...');
    });

    it('should not truncate short text', () => {
      const result = truncate('Short', 10);
      expect(result).toBe('Short');
    });

    it('should handle exact length', () => {
      const result = truncate('Exactly10!', 10);
      expect(result).toBe('Exactly10!');
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR currency correctly', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234,56');
      expect(result).toContain('€');
    });

    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('1');
      expect(result).toContain('234,56');
      expect(result).toContain('$');
    });

    it('should handle zero values', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
      expect(result).toContain('€');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-123.45);
      expect(result).toContain('-');
      expect(result).toContain('123,45');
      expect(result).toContain('€');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      const result = formatPercentage(85.67);
      expect(result).toBe('85.7%');
    });

    it('should format percentage with custom decimals', () => {
      const result = formatPercentage(85.6789, 3);
      expect(result).toBe('85.679%');
    });

    it('should handle zero decimals', () => {
      const result = formatPercentage(85.67, 0);
      expect(result).toBe('86%');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(50);
      expect(end - start).toBeLessThan(100); // Allow some tolerance
    });
  });

  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });
});