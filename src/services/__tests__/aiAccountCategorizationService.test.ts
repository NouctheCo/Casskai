/**
 * CassKai - Tests Unitaires Service Auto-Catégorisation IA
 * Tests du service aiAccountCategorizationService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiAccountCategorizationService } from '../aiAccountCategorizationService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) }))
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AIAccountCategorizationService', () => {
  const TEST_COMPANY_ID = 'test-company-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: Suggestion depuis cache DB
   */
  describe('suggestAccount()', () => {
    it('should return suggestions from DB cache when available', async () => {
      // Mock RPC response
      const mockSuggestions = [
        {
          account_code: '641000',
          account_name: 'Rémunérations du personnel',
          confidence_score: 95.0,
          usage_count: 10,
          last_used_at: new Date().toISOString()
        }
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockSuggestions,
        error: null
      });

      // Appel service
      const result = await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'VIR SALAIRES JANVIER 2024'
      );

      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0].account_code).toBe('641000');
      expect(result[0].confidence_score).toBe(95.0);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'get_ai_account_suggestion',
        expect.objectContaining({
          p_company_id: TEST_COMPANY_ID,
          p_description: 'VIR SALAIRES JANVIER 2024'
        })
      );
    });

    it('should fallback to keywords when DB cache is empty', async () => {
      // Mock RPC response vide
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock Edge Function unavailable
      vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(
        new Error('Edge Function unavailable')
      );

      // Appel service avec mot-clé connu
      const result = await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'PRLV EDF JANVIER'
      );

      // Assertions: doit retourner suggestion basée sur keywords
      expect(result).toHaveLength(1);
      expect(result[0].account_code).toBe('606100'); // Eau et énergie
      expect(result[0].reason).toContain('electricite');
    });

    it('should return fallback suggestion for unknown description', async () => {
      // Mock RPC response vide
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock Edge Function unavailable
      vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(
        new Error('Edge Function unavailable')
      );

      // Appel avec description inconnue
      const result = await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'TRANSACTION INCONNUE XYZ123'
      );

      // Assertions: doit retourner compte d'attente
      expect(result).toHaveLength(1);
      expect(result[0].account_code).toBe('471000'); // Compte d'attente
      expect(result[0].confidence_score).toBeLessThan(50);
    });
  });

  /**
   * Test 2: Enregistrement feedback utilisateur
   */
  describe('recordFeedback()', () => {
    it('should call RPC to record positive feedback', async () => {
      // Mock RPC success
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Appel service
      await aiAccountCategorizationService.recordFeedback(
        TEST_COMPANY_ID,
        'VIR SALAIRES',
        '641000', // Suggéré
        '641000', // Validé (même chose)
        true // Accepté
      );

      // Assertions
      expect(supabase.rpc).toHaveBeenCalledWith(
        'record_categorization_feedback',
        expect.objectContaining({
          p_company_id: TEST_COMPANY_ID,
          p_description: 'VIR SALAIRES',
          p_suggested_account: '641000',
          p_actual_account: '641000',
          p_validated: true
        })
      );
    });

    it('should record negative feedback when suggestion rejected', async () => {
      // Mock RPC success
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Appel service avec rejet
      await aiAccountCategorizationService.recordFeedback(
        TEST_COMPANY_ID,
        'PAIEMENT AMAZON',
        '606400', // Suggéré (fournitures)
        '606100', // Réel (énergie - incorrect)
        false // Rejeté
      );

      // Assertions
      expect(supabase.rpc).toHaveBeenCalledWith(
        'record_categorization_feedback',
        expect.objectContaining({
          p_validated: false
        })
      );
    });

    it('should handle RPC errors gracefully', async () => {
      // Mock RPC error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      // Appel service (ne doit pas throw)
      await expect(
        aiAccountCategorizationService.recordFeedback(
          TEST_COMPANY_ID,
          'TEST',
          '641000',
          '641000',
          true
        )
      ).resolves.not.toThrow();
    });
  });

  /**
   * Test 3: Statistiques d'utilisation
   */
  describe('getStats()', () => {
    it('should return statistics with accuracy rate', async () => {
      // Mock RPC response
      const mockStats = [{
        total_suggestions: 100,
        validated_suggestions: 85,
        rejected_suggestions: 10,
        avg_confidence_score: 87.5,
        most_used_accounts: [
          { account_code: '641000', usage_count: 20 },
          { account_code: '606100', usage_count: 15 }
        ]
      }];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockStats,
        error: null
      });

      // Appel service
      const result = await aiAccountCategorizationService.getStats(TEST_COMPANY_ID);

      // Assertions
      expect(result).not.toBeNull();
      expect(result!.total_suggestions).toBe(100);
      expect(result!.validated_suggestions).toBe(85);
      expect(result!.accuracy_rate).toBeCloseTo(89.47, 1); // 85/(85+10) * 100
      expect(result!.avg_confidence_score).toBe(87.5);
      expect(result!.most_used_accounts).toHaveLength(2);
    });

    it('should return default stats when no data', async () => {
      // Mock RPC response vide
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Appel service
      const result = await aiAccountCategorizationService.getStats(TEST_COMPANY_ID);

      // Assertions
      expect(result).not.toBeNull();
      expect(result!.total_suggestions).toBe(0);
      expect(result!.accuracy_rate).toBe(0);
    });

    it('should handle RPC errors and return null', async () => {
      // Mock RPC error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      // Appel service
      const result = await aiAccountCategorizationService.getStats(TEST_COMPANY_ID);

      // Assertions
      expect(result).toBeNull();
    });
  });

  /**
   * Test 4: Apprentissage depuis historique
   */
  describe('learnFromHistory()', () => {
    it('should learn from historical journal entries', async () => {
      // Mock journal entries
      const mockEntries = [
        {
          description: 'VIR SALAIRES DECEMBRE',
          journal_entry_lines: [
            { account_number: '641000', account_id: 'acc-1' }
          ]
        },
        {
          description: 'VIR SALAIRES NOVEMBRE',
          journal_entry_lines: [
            { account_number: '641000', account_id: 'acc-1' }
          ]
        },
        {
          description: 'VIR SALAIRES OCTOBRE',
          journal_entry_lines: [
            { account_number: '641000', account_id: 'acc-1' }
          ]
        }
      ];

      // Mock Supabase query
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            not: vi.fn(() => ({
              limit: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockEntries,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect
      } as any);

      // Appel service
      const learnedCount = await aiAccountCategorizationService.learnFromHistory(
        TEST_COMPANY_ID,
        100
      );

      // Assertions
      expect(learnedCount).toBeGreaterThan(0);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  /**
   * Test 5: Mapping mots-clés (fallback)
   */
  describe('Keyword-based suggestions', () => {
    const testCases = [
      { description: 'VIR SALAIRES', expectedAccount: '641000' },
      { description: 'URSSAF JANVIER', expectedAccount: '645000' },
      { description: 'PRLV EDF', expectedAccount: '606100' },
      { description: 'PAIEMENT CB AMAZON', expectedAccount: '606400' },
      { description: 'VIR CLIENT ABC', expectedAccount: '411000' },
      { description: 'CHEQUE FOURNISSEUR XYZ', expectedAccount: '401000' },
      { description: 'AGIOS BANCAIRES', expectedAccount: '661100' },
      { description: 'LOYER BUREAU', expectedAccount: '613200' },
      { description: 'FACTURE ORANGE', expectedAccount: '626100' }
    ];

    testCases.forEach(({ description, expectedAccount }) => {
      it(`should suggest ${expectedAccount} for "${description}"`, async () => {
        // Mock RPC vide (forcer fallback)
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: [],
          error: null
        });

        // Mock Edge Function unavailable
        vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(
          new Error('Unavailable')
        );

        // Appel service
        const result = await aiAccountCategorizationService.suggestAccount(
          TEST_COMPANY_ID,
          description
        );

        // Assertions
        expect(result).toHaveLength(1);
        expect(result[0].account_code).toBe(expectedAccount);
      });
    });
  });

  /**
   * Test 6: Performance et cache
   */
  describe('Performance', () => {
    it('should return suggestions quickly (<100ms from cache)', async () => {
      // Mock RPC avec délai minimal
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          account_code: '641000',
          account_name: 'Salaires',
          confidence_score: 95.0,
          usage_count: 10,
          last_used_at: new Date().toISOString()
        }],
        error: null
      });

      const startTime = performance.now();

      // Appel service
      await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'VIR SALAIRES'
      );

      const duration = performance.now() - startTime;

      // Assertions
      expect(duration).toBeLessThan(100);
    });
  });

  /**
   * Test 7: Gestion des erreurs
   */
  describe('Error handling', () => {
    it('should not throw on RPC failure', async () => {
      // Mock RPC error
      vi.mocked(supabase.rpc).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Appel service (ne doit pas throw)
      await expect(
        aiAccountCategorizationService.suggestAccount(
          TEST_COMPANY_ID,
          'TEST'
        )
      ).resolves.not.toThrow();
    });

    it('should return fallback suggestions on Edge Function failure', async () => {
      // Mock RPC vide
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock Edge Function failure
      vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(
        new Error('Function timeout')
      );

      // Appel service
      const result = await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'VIR SALAIRES'
      );

      // Assertions: doit retourner fallback
      expect(result).toHaveLength(1);
      expect(result[0].account_code).toBeTruthy();
    });
  });

  /**
   * Test 8: Contexte transactionnel
   */
  describe('Transaction context', () => {
    it('should use amount context for better suggestions', async () => {
      // Mock RPC vide
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock Edge Function avec contexte
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: {
          response: JSON.stringify({
            account_code: '641000',
            account_name: 'Salaires',
            confidence: 90,
            reason: 'Montant et description correspondent à des salaires'
          })
        },
        error: null
      });

      // Appel avec contexte
      const result = await aiAccountCategorizationService.suggestAccount(
        TEST_COMPANY_ID,
        'VIR PERSONNEL',
        { amount: -25000, transaction_type: 'debit' }
      );

      // Assertions
      expect(result).toHaveLength(1);
      expect(supabase.functions.invoke).toHaveBeenCalled();
    });
  });
});
