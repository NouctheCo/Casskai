import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIService } from './OpenAIService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    from: vi.fn()
  }
}));

// Mock fetch globalement
global.fetch = vi.fn();

describe('OpenAIService', () => {
  let service: OpenAIService;
  const mockCompanyId = 'company-123';
  const mockSession = {
    access_token: 'mock-token-123',
    user: { id: 'user-123' }
  };

  beforeEach(() => {
    service = OpenAIService.getInstance();
    vi.clearAllMocks();

    // Mock session par défaut
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = OpenAIService.getInstance();
      const instance2 = OpenAIService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('chat', () => {
    const mockChatRequest = {
      query: 'Quels sont mes revenus du mois?',
      context_type: 'dashboard' as const,
      company_id: mockCompanyId
    };

    it('should send chat request successfully', async () => {
      const mockResponse = {
        response: 'Vos revenus du mois sont de 50000€',
        sources: ['journal_entries', 'accounts'],
        suggestions: ['Analyser la croissance', 'Comparer avec le mois dernier']
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.chat(mockChatRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai-assistant'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockSession.access_token}`
          },
          body: JSON.stringify(mockChatRequest)
        })
      );
    });

    it('should handle authentication error', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await service.chat(mockChatRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await service.chat(mockChatRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network failure'));

      const result = await service.chat(mockChatRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network failure');
    });
  });

  describe('analyzeFinancialHealth', () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        entry_date: new Date().toISOString(),
        total_amount: 5000,
        description: 'Vente de produits',
        journal_entry_lines: [{ account_code: '707000', debit_amount: 5000, credit_amount: 0 }]
      },
      {
        id: 'txn-2',
        entry_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: -3000,
        description: 'Achat de fournitures',
        journal_entry_lines: [{ account_code: '601000', debit_amount: 0, credit_amount: 3000 }]
      }
    ];

    const mockAccounts = [
      { account_code: '512000', account_name: 'Banque', account_type: 'ASSET', current_balance: 3000, is_active: true },
      { account_code: '707000', account_name: 'Ventes', account_type: 'REVENUE', current_balance: 50000, is_active: true }
    ];

    beforeEach(() => {
      const mockFrom = vi.fn((table) => {
        if (table === 'journal_entries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
                }))
              }))
            }))
          };
        }
        // For 'accounts' table
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockAccounts, error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should analyze financial health successfully', async () => {
      const result = await service.analyzeFinancialHealth(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    it('should detect low liquidity', async () => {
      const lowCashAccounts = [
        { account_code: '512000', account_name: 'Banque', account_type: 'ASSET', current_balance: 2000, is_active: true }
      ];

      const mockFrom = vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: table === 'journal_entries' ? mockTransactions : lowCashAccounts, error: null }))
            })),
            order: vi.fn(() => Promise.resolve({ data: lowCashAccounts, error: null }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.analyzeFinancialHealth(mockCompanyId);

      expect(result.success).toBe(true);
      const liquidityAlert = result.data?.find(insight => insight.id === 'liquidity_low');
      expect(liquidityAlert).toBeDefined();
      expect(liquidityAlert?.priority).toBe('high');
    });

    it('should detect revenue growth', async () => {
      const growthTransactions = [
        {
          id: 'txn-1',
          entry_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: 5000,
          description: 'Vente',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 5000, credit_amount: 0 }]
        },
        {
          id: 'txn-2',
          entry_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: 3000,
          description: 'Vente',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 3000, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: table === 'journal_entries' ? growthTransactions : mockAccounts, error: null }))
            })),
            order: vi.fn(() => Promise.resolve({ data: mockAccounts, error: null }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.analyzeFinancialHealth(mockCompanyId);

      expect(result.success).toBe(true);
      const growthInsight = result.data?.find(insight => insight.id === 'revenue_growth');
      expect(growthInsight).toBeDefined();
    });

    it('should handle insufficient data', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: null }))
            })),
            order: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.analyzeFinancialHealth(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Données insuffisantes');
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.reject(new Error('Database error')))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.analyzeFinancialHealth(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de l\'analyse financière');
    });
  });

  describe('predictCashFlow', () => {
    const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
      id: `txn-${i}`,
      entry_date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: Math.random() > 0.5 ? 5000 : -3000,
      description: 'Transaction',
      journal_entry_lines: [
        { account_code: Math.random() > 0.5 ? '707000' : '601000', debit_amount: 5000, credit_amount: 0 }
      ]
    }));

    beforeEach(() => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should predict cash flow successfully', async () => {
      const result = await service.predictCashFlow(mockCompanyId, 6);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(6);
      expect(result.confidence).toBe(0.75);
    });

    it('should generate predictions with correct structure', async () => {
      const result = await service.predictCashFlow(mockCompanyId, 3);

      expect(result.success).toBe(true);
      result.data?.forEach((prediction, index) => {
        expect(prediction).toHaveProperty('id');
        expect(prediction).toHaveProperty('month');
        expect(prediction).toHaveProperty('date');
        expect(prediction).toHaveProperty('predictedValue');
        expect(prediction).toHaveProperty('predictedIncome');
        expect(prediction).toHaveProperty('predictedExpenses');
        expect(prediction).toHaveProperty('predictedBalance');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('factors');
        expect(prediction).toHaveProperty('trend');

        // La confiance doit diminuer avec le temps
        expect(prediction.confidence).toBeLessThanOrEqual(0.9 - (index * 0.1) + 0.01);
      });
    });

    it('should handle custom month parameter', async () => {
      const result1 = await service.predictCashFlow(mockCompanyId, 3);
      const result2 = await service.predictCashFlow(mockCompanyId, 12);

      expect(result1.data?.length).toBe(3);
      expect(result2.data?.length).toBe(12);
    });

    it('should handle insufficient history', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [{ id: '1', total_amount: 100 }], error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.predictCashFlow(mockCompanyId, 6);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Historique insuffisant');
    });

    it('should handle empty transactions', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.predictCashFlow(mockCompanyId, 6);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Historique insuffisant');
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.reject(new Error('Database error')))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.predictCashFlow(mockCompanyId, 6);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de la prédiction');
    });
  });

  describe('detectAnomalies', () => {
    const mockNormalTransactions = [
      {
        id: 'txn-1',
        entry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 1000,
        description: 'Vente normale',
        reference: 'INV-001',
        journal_entry_lines: [{ account_code: '707000', debit_amount: 1000, credit_amount: 0 }]
      },
      {
        id: 'txn-2',
        entry_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 1200,
        description: 'Vente normale',
        reference: 'INV-002',
        journal_entry_lines: [{ account_code: '707000', debit_amount: 1200, credit_amount: 0 }]
      }
    ];

    beforeEach(() => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockNormalTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should detect anomalies successfully', async () => {
      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.confidence).toBe(0.80);
    });

    it('should detect unusual amounts', async () => {
      // Créer un jeu de données avec un montant beaucoup plus élevé que la moyenne
      const normalAmount = 1000;
      const outlierAmount = 50000;

      const transactionsWithOutlier = [
        {
          id: 'txn-1',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount,
          description: 'Transaction normale 1',
          reference: 'INV-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount, credit_amount: 0 }]
        },
        {
          id: 'txn-2',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount,
          description: 'Transaction normale 2',
          reference: 'INV-002',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount, credit_amount: 0 }]
        },
        {
          id: 'txn-3',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount,
          description: 'Transaction normale 3',
          reference: 'INV-003',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount, credit_amount: 0 }]
        },
        {
          id: 'txn-outlier',
          entry_date: new Date().toISOString(),
          total_amount: outlierAmount, // Montant inhabituel
          description: 'Transaction importante',
          reference: 'INV-999',
          journal_entry_lines: [{ account_code: '707000', debit_amount: outlierAmount, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: transactionsWithOutlier, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
      const outlierAnomaly = result.data?.find(a => a.transaction.id === 'txn-outlier');
      expect(outlierAnomaly).toBeDefined();
      expect(outlierAnomaly?.reasons).toContain(expect.stringContaining('Montant inhabituel'));
    });

    it('should detect weekend transactions', async () => {
      const sunday = new Date();
      sunday.setDate(sunday.getDate() + (7 - sunday.getDay())); // Prochain dimanche

      const normalAmount = 1000;
      const weekendTransactions = [
        // Ajouter des transactions normales pour la comparaison
        {
          id: 'txn-normal-1',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount,
          description: 'Transaction normale',
          reference: 'INV-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount, credit_amount: 0 }]
        },
        {
          id: 'txn-weekend',
          entry_date: sunday.toISOString(),
          total_amount: normalAmount * 50, // Montant élevé pour déclencher l'anomalie
          description: 'Transaction weekend',
          reference: 'INV-WEEKEND',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount * 50, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: weekendTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      const weekendAnomaly = result.data?.find(a =>
        a.transaction.id === 'txn-weekend' && a.reasons.includes('Transaction un weekend')
      );
      expect(weekendAnomaly).toBeDefined();
    });

    it('should detect suspicious keywords', async () => {
      const suspiciousTransactions = [
        {
          id: 'txn-suspicious',
          entry_date: new Date().toISOString(),
          total_amount: 50000,
          description: 'Remboursement personnel en espèce',
          reference: 'CASH-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 50000, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: suspiciousTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      const suspiciousAnomaly = result.data?.find(a =>
        a.reasons.some(r => r.includes('mots-clés suspects'))
      );
      expect(suspiciousAnomaly).toBeDefined();
      expect(suspiciousAnomaly?.severity).toBe('high');
    });

    it('should detect urgent transactions', async () => {
      const normalAmount = 1000;
      const urgentTransactions = [
        {
          id: 'txn-normal',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount,
          description: 'Transaction normale',
          reference: 'INV-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount, credit_amount: 0 }]
        },
        {
          id: 'txn-urgent',
          entry_date: new Date().toISOString(),
          total_amount: normalAmount * 50, // Montant élevé = score 0.4
          description: 'Transaction URGENT', // Urgent = score 0.3 supplémentaire
          reference: 'URGENT-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: normalAmount * 50, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: urgentTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      // Le score combiné (montant élevé + URGENT) devrait créer une anomalie
      const urgentAnomaly = result.data?.find(a =>
        a.transaction.id === 'txn-urgent'
      );
      expect(urgentAnomaly).toBeDefined();
      if (urgentAnomaly) {
        expect(urgentAnomaly.reasons.some(r => r.includes('urgente'))).toBe(true);
      }
    });

    it('should return empty array for no transactions', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should sort anomalies by score', async () => {
      const mixedTransactions = [
        {
          id: 'txn-low',
          entry_date: new Date().toISOString(),
          total_amount: 5000,
          description: 'Transaction normale',
          reference: 'INV-001',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 5000, credit_amount: 0 }]
        },
        {
          id: 'txn-high',
          entry_date: new Date().toISOString(),
          total_amount: 100000,
          description: 'Remboursement personnel URGENT en espèce',
          reference: 'CASH-URGENT',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 100000, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mixedTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 1) {
        // Les anomalies doivent être triées par score décroissant
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].score).toBeGreaterThanOrEqual(result.data[i + 1].score);
        }
      }
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.reject(new Error('Database error')))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de la détection');
    });
  });

  describe('getTaxOptimizations', () => {
    const mockCompany = {
      id: mockCompanyId,
      country: 'FR',
      default_currency: 'EUR',
      accounting_standard: 'PCG'
    };

    const mockTransactions = [
      {
        entry_date: new Date().toISOString(),
        total_amount: 1000,
        description: 'Achat avec TVA',
        journal_entry_lines: [{ account_code: '445660', debit_amount: 200, credit_amount: 0 }]
      }
    ];

    beforeEach(() => {
      const mockFrom = vi.fn((table) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockCompany, error: null }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should get tax optimizations successfully', async () => {
      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.confidence).toBe(0.70);
    });

    it('should suggest VAT optimization', async () => {
      const manyVatTransactions = Array.from({ length: 15 }, (_, i) => ({
        entry_date: new Date().toISOString(),
        total_amount: 1000,
        description: `Transaction TVA ${i}`,
        journal_entry_lines: [{ account_code: '445660', debit_amount: 200, credit_amount: 0 }]
      }));

      const mockFrom = vi.fn((table) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockCompany, error: null }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: manyVatTransactions, error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(true);
      const vatOptimization = result.data?.find(opt => opt.id === 'vat_optimization');
      expect(vatOptimization).toBeDefined();
      expect(vatOptimization?.category).toBe('TVA');
      expect(vatOptimization?.potentialSavings).toBeGreaterThan(0);
    });

    it('should suggest depreciation optimization', async () => {
      const assetTransactions = [
        {
          entry_date: new Date().toISOString(),
          total_amount: 10000,
          description: 'Achat immobilisation',
          journal_entry_lines: [{ account_code: '218000', debit_amount: 10000, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn((table) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockCompany, error: null }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: assetTransactions, error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(true);
      const depreciationOpt = result.data?.find(opt => opt.id === 'depreciation_optimization');
      expect(depreciationOpt).toBeDefined();
      expect(depreciationOpt?.category).toBe('Amortissements');
      expect(depreciationOpt?.implementationSteps).toBeDefined();
      expect(depreciationOpt?.implementationSteps?.length).toBeGreaterThan(0);
    });

    it('should handle company not found', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Entreprise non trouvée');
    });

    it('should handle empty transactions', async () => {
      const mockFrom = vi.fn((table) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockCompany, error: null }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(new Error('Database error')))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.getTaxOptimizations(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de l\'analyse fiscale');
    });
  });

  describe('generateSmartAlerts', () => {
    beforeEach(() => {
      // Mock pour analyzeFinancialHealth
      vi.spyOn(service as any, 'analyzeFinancialHealth').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'critical-1',
            type: 'alert',
            title: 'Alerte critique',
            description: 'Problème détecté',
            priority: 'high',
            actions: [{ label: 'Action', action: 'do_something' }]
          }
        ]
      });

      // Mock pour predictCashFlow
      vi.spyOn(service as any, 'predictCashFlow').mockResolvedValue({
        success: true,
        data: [
          { predictedBalance: -5000 },
          { predictedBalance: 1000 }
        ]
      });

      // Mock pour detectAnomalies
      vi.spyOn(service as any, 'detectAnomalies').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'anomaly-1',
            severity: 'critical',
            description: 'Anomalie critique',
            transaction: { id: 'txn-1' }
          }
        ]
      });
    });

    it('should generate smart alerts successfully', async () => {
      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    it('should create alerts from financial health insights', async () => {
      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true);
      const healthAlert = result.data?.find(alert => alert.id.startsWith('health_'));
      expect(healthAlert).toBeDefined();
      expect(healthAlert?.type).toBe('risk');
    });

    it('should create alerts from negative cash flow predictions', async () => {
      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true);
      const cashflowAlert = result.data?.find(alert => alert.id === 'cashflow_negative');
      expect(cashflowAlert).toBeDefined();
      expect(cashflowAlert?.severity).toBe('error');
      expect(cashflowAlert?.actions).toBeDefined();
    });

    it('should create alerts from critical anomalies', async () => {
      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true);
      const anomalyAlert = result.data?.find(alert => alert.id.startsWith('anomaly_'));
      expect(anomalyAlert).toBeDefined();
      expect(anomalyAlert?.type).toBe('anomaly');
    });

    it('should handle partial failures gracefully', async () => {
      vi.spyOn(service as any, 'analyzeFinancialHealth').mockResolvedValue({
        success: false,
        error: 'Failed'
      });

      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true); // Should still succeed with partial data
      expect(result.data).toBeDefined();
    });

    it('should handle all services failing', async () => {
      vi.spyOn(service as any, 'analyzeFinancialHealth').mockResolvedValue({
        success: false
      });
      vi.spyOn(service as any, 'predictCashFlow').mockResolvedValue({
        success: false
      });
      vi.spyOn(service as any, 'detectAnomalies').mockResolvedValue({
        success: false
      });

      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle complete service failure', async () => {
      vi.spyOn(service as any, 'analyzeFinancialHealth').mockRejectedValue(new Error('Service error'));

      const result = await service.generateSmartAlerts(mockCompanyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur lors de la génération des alertes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null company_id', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: null }))
            })),
            order: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.analyzeFinancialHealth('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Données insuffisantes');
    });

    it('should handle undefined values in transactions', async () => {
      const transactionsWithUndefined = [
        {
          id: 'txn-1',
          entry_date: new Date().toISOString(),
          total_amount: undefined,
          description: undefined,
          journal_entry_lines: undefined
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: transactionsWithUndefined, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle very large numbers', async () => {
      const largeTransaction = [
        {
          id: 'txn-large',
          entry_date: new Date().toISOString(),
          total_amount: Number.MAX_SAFE_INTEGER,
          description: 'Large transaction',
          journal_entry_lines: [{ account_code: '707000', debit_amount: Number.MAX_SAFE_INTEGER, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: largeTransaction, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in descriptions', async () => {
      const specialCharsTransaction = [
        {
          id: 'txn-special',
          entry_date: new Date().toISOString(),
          total_amount: 1000,
          description: 'Transaction with special chars: <>&"\' éàù',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 1000, credit_amount: 0 }]
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: specialCharsTransaction, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.detectAnomalies(mockCompanyId);

      expect(result.success).toBe(true);
    });

    it('should handle zero values', async () => {
      const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
        id: `txn-${i}`,
        entry_date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 1000,
        description: 'Transaction',
        journal_entry_lines: [{ account_code: '707000', debit_amount: 1000, credit_amount: 0 }]
      }));

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.predictCashFlow(mockCompanyId, 0);

      // Le service génère des prédictions même pour 0 mois (comportement actuel)
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Note: Le service pourrait retourner un tableau vide ou quelques prédictions
    });

    it('should handle negative months parameter', async () => {
      const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
        id: `txn-${i}`,
        entry_date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 1000,
        description: 'Transaction',
        journal_entry_lines: [{ account_code: '707000', debit_amount: 1000, credit_amount: 0 }]
      }));

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
            }))
          }))
        }))
      }));
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await service.predictCashFlow(mockCompanyId, -5);

      // Le service accepte les valeurs négatives et génère un tableau vide
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should measure processing time for chat', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Test', sources: [] })
      });

      const result = await service.chat({
        query: 'Test query',
        company_id: mockCompanyId
      });

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent requests', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          entry_date: new Date().toISOString(),
          total_amount: 1000,
          description: 'Transaction',
          journal_entry_lines: [{ account_code: '707000', debit_amount: 1000, credit_amount: 0 }]
        }
      ];

      const mockAccounts = [
        {
          account_code: '512000',
          account_name: 'Banque',
          account_type: 'ASSET',
          current_balance: 10000,
          is_active: true
        }
      ];

      const mockCompany = {
        id: mockCompanyId,
        country: 'FR',
        default_currency: 'EUR',
        accounting_standard: 'PCG'
      };

      const mockFrom = vi.fn((table) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockCompany, error: null }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
              })),
              order: vi.fn(() => Promise.resolve({ data: mockAccounts, error: null }))
            }))
          }))
        };
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const promises = [
        service.analyzeFinancialHealth(mockCompanyId),
        service.detectAnomalies(mockCompanyId),
        service.getTaxOptimizations(mockCompanyId)
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      });
    });
  });
});
