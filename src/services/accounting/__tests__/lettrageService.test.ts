/**
 * Tests for Lettrage Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateLettrageCode,
  applyLettrage,
  deleteLettrage,
  getLettrageStats,
} from '../lettrageService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Lettrage Service', () => {
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '223e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateLettrageCode', () => {
    it('should generate AA as first code when no previous lettrage exists', async () => {
      // Mock Supabase response - no previous lettrage
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const code = await generateLettrageCode(mockCompanyId);

      expect(code).toBe('AA');
    });

    it('should increment from AA to AB', async () => {
      // Mock previous code = AA
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { lettrage_code: 'AA' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const code = await generateLettrageCode(mockCompanyId);

      expect(code).toBe('AB');
    });

    it('should increment from AZ to BA', async () => {
      // Mock previous code = AZ
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { lettrage_code: 'AZ' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const code = await generateLettrageCode(mockCompanyId);

      expect(code).toBe('BA');
    });

    it('should reset to AA after ZZ', async () => {
      // Mock previous code = ZZ
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { lettrage_code: 'ZZ' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const code = await generateLettrageCode(mockCompanyId);

      expect(code).toBe('AA');
    });
  });

  describe('applyLettrage', () => {
    it('should successfully apply lettrage to balanced lines', async () => {
      const mockLines = [
        { id: '1', debit_amount: 100, credit_amount: 0, lettrage_code: null },
        { id: '2', debit_amount: 0, credit_amount: 100, lettrage_code: null },
      ];

      // First call: fetch lines
      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLines, error: null }),
      };

      // Second call: generateLettrageCode - get last code
      const mockCodeQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { lettrage_code: 'AA' },
          error: null,
        }),
      };

      // Third call: update lines
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockCodeQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      // Mock get user
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const result = await applyLettrage(mockCompanyId, ['1', '2']);

      expect(result.success).toBe(true);
      expect(result.lines_count).toBe(2);
      expect(result.total_amount).toBe(100);
    });

    it('should fail on unbalanced lines', async () => {
      const mockLines = [
        { id: '1', debit_amount: 100, credit_amount: 0, lettrage_code: null },
        { id: '2', debit_amount: 0, credit_amount: 50, lettrage_code: null },
      ];

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLines, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockFetchQuery);

      const result = await applyLettrage(mockCompanyId, ['1', '2']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('déséquilibrées');
    });

    it('should fail if line already lettraged', async () => {
      const mockLines = [
        { id: '1', debit_amount: 100, credit_amount: 0, lettrage_code: 'AA' },
        { id: '2', debit_amount: 0, credit_amount: 100, lettrage_code: null },
      ];

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLines, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockFetchQuery);

      const result = await applyLettrage(mockCompanyId, ['1', '2']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('déjà lettrée');
    });

    it('should accept small rounding differences (tolerance 0.05)', async () => {
      const mockLines = [
        { id: '1', debit_amount: 100.02, credit_amount: 0, lettrage_code: null },
        { id: '2', debit_amount: 0, credit_amount: 100, lettrage_code: null },
      ];

      // First call: fetch lines
      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLines, error: null }),
      };

      // Second call: generateLettrageCode
      const mockCodeQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { lettrage_code: 'AA' },
          error: null,
        }),
      };

      // Third call: update
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockCodeQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const result = await applyLettrage(mockCompanyId, ['1', '2']);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteLettrage', () => {
    it('should successfully remove lettrage', async () => {
      const mockLines = [
        { id: '1' },
        { id: '2' },
      ];

      // Create chainable mock that resolves on final call
      let selectCallCount = 0;
      let updateCallCount = 0;

      const mockSelectChain: any = {
        select: vi.fn(function(this: any) { return this; }),
        eq: vi.fn(function(this: any) {
          selectCallCount++;
          if (selectCallCount >= 2) {
            return Promise.resolve({ data: mockLines, error: null });
          }
          return this;
        }),
      };

      const mockUpdateChain: any = {
        update: vi.fn(function(this: any) { return this; }),
        eq: vi.fn(function(this: any) {
          updateCallCount++;
          if (updateCallCount >= 2) {
            return Promise.resolve({ error: null });
          }
          return this;
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain);

      const result = await deleteLettrage(mockCompanyId, 'AA');

      expect(result.success).toBe(true);
      expect(result.lines_count).toBe(2);
    });

    it('should fail if lettrage code not found', async () => {
      let selectCallCount = 0;

      const mockSelectChain: any = {
        select: vi.fn(function(this: any) { return this; }),
        eq: vi.fn(function(this: any) {
          selectCallCount++;
          if (selectCallCount >= 2) {
            return Promise.resolve({ data: [], error: null });
          }
          return this;
        }),
      };

      (supabase.from as any).mockReturnValue(mockSelectChain);

      const result = await deleteLettrage(mockCompanyId, 'XX');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Aucune ligne');
    });
  });

  describe('getLettrageStats', () => {
    it('should calculate correct statistics', async () => {
      const mockLines = [
        { id: '1', lettrage_code: 'AA', created_at: '2024-01-01' },
        { id: '2', lettrage_code: 'AA', created_at: '2024-01-02' },
        { id: '3', lettrage_code: null, created_at: '2024-01-03' },
        { id: '4', lettrage_code: 'AB', created_at: '2024-01-04' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: mockLines }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const stats = await getLettrageStats(mockCompanyId, '411%');

      expect(stats.total).toBe(4);
      expect(stats.lettraged).toBe(3);
      expect(stats.unlettraged).toBe(1);
      expect(stats.percentLettraged).toBe(75);
    });

    it('should handle empty result', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const stats = await getLettrageStats(mockCompanyId, '411%');

      expect(stats.total).toBe(0);
      expect(stats.lettraged).toBe(0);
      expect(stats.unlettraged).toBe(0);
      expect(stats.percentLettraged).toBe(0);
    });
  });
});
