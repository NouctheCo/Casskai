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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { budgetService, BudgetService } from './budgetService';
import { supabase } from '@/lib/supabase';
import type {
  Budget,
  BudgetFormData,
  BudgetStatus,
  BudgetFilter,
  BudgetTemplate,
  BudgetVarianceAnalysis
} from '@/types/budget.types';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('BudgetService', () => {
  const mockCompanyId = 'company-123';
  const mockBudgetId = 'budget-456';
  const mockUserId = 'user-789';

  // Mock data
  const currentYear = new Date().getFullYear();
  const mockBudget: Budget = {
    id: mockBudgetId,
    company_id: mockCompanyId,
    year: currentYear,
    version: 1,
    status: 'draft',
    created_at: `${currentYear}-01-01T00:00:00Z`,
    updated_at: `${currentYear}-01-01T00:00:00Z`,
    total_revenue_budget: 100000,
    total_expense_budget: 60000,
    total_capex_budget: 10000,
    net_profit_budget: 40000,
    budget_categories: [],
    budget_assumptions: []
  };

  const mockBudgetFormData: BudgetFormData = {
    year: currentYear,
    categories: [
      {
        category: 'Sales',
        category_type: 'revenue',
        annual_amount: 100000,
        monthly_amounts: Array(12).fill(8333.33),
        driver_type: 'fixed'
      },
      {
        category: 'Marketing',
        category_type: 'expense',
        annual_amount: 30000,
        monthly_amounts: Array(12).fill(2500),
        driver_type: 'variable'
      },
      {
        category: 'Equipment',
        category_type: 'capex',
        annual_amount: 10000,
        monthly_amounts: [10000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        driver_type: 'fixed'
      }
    ],
    assumptions: [
      {
        key: 'growth_rate',
        description: 'Annual growth rate',
        value: 10,
        unit: '%',
        category: 'revenue',
        confidence_level: 80
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BudgetService.getInstance();
      const instance2 = BudgetService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export budgetService as singleton instance', () => {
      expect(budgetService).toBeInstanceOf(BudgetService);
    });
  });

  describe('getBudgets', () => {
    it('should fetch budgets successfully without filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      };

      (supabase.from as any).mockReturnValue(mockQuery);
      mockQuery.order.mockResolvedValue({
        data: [mockBudget],
        error: null
      });

      const result = await budgetService.getBudgets(mockCompanyId);

      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('company_id', mockCompanyId);
      expect(mockQuery.order).toHaveBeenCalledWith('budget_year', { ascending: false });
      expect(result.data).toEqual([mockBudget]);
      expect(result.error).toBeNull();
    });

    it('should apply year filter when provided', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      };

      (supabase.from as any).mockReturnValue(mockQuery);
      mockQuery.in.mockResolvedValue({
        data: [mockBudget],
        error: null
      });

      const filter: BudgetFilter = {
        years: [2024, 2025]
      };

      await budgetService.getBudgets(mockCompanyId, filter);

      expect(mockQuery.in).toHaveBeenCalledWith('budget_year', [2024, 2025]);
    });

    it('should apply status filter when provided', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      };

      (supabase.from as any).mockReturnValue(mockQuery);
      mockQuery.in.mockResolvedValue({
        data: [mockBudget],
        error: null
      });

      const filter: BudgetFilter = {
        status: ['active', 'approved']
      };

      await budgetService.getBudgets(mockCompanyId, filter);

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['active', 'approved']);
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgets(mockCompanyId);

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('getBudgetById', () => {
    it('should fetch a single budget successfully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgetById(mockBudgetId);

      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockBudgetId);
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result.data).toEqual(mockBudget);
      expect(result.error).toBeNull();
    });

    it('should handle not found error (PGRST116) gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgetById(mockBudgetId);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should handle other database errors', async () => {
      const mockError = new Error('Database error');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgetById(mockBudgetId);

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('getActiveBudget', () => {
    it('should fetch active budget for a specific year', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBudget, status: 'active' },
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getActiveBudget(mockCompanyId, 2024);

      expect(mockQuery.eq).toHaveBeenCalledWith('company_id', mockCompanyId);
      expect(mockQuery.eq).toHaveBeenCalledWith('budget_year', 2024);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(result.data?.status).toBe('active');
    });

    it('should handle no active budget found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getActiveBudget(mockCompanyId, 2024);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('createBudget', () => {
    it('should create a budget successfully with all data', async () => {
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      const mockCategoriesQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      const mockAssumptionsQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockInsertQuery) // budgets insert
        .mockReturnValueOnce(mockCategoriesQuery) // budget_categories insert
        .mockReturnValueOnce(mockAssumptionsQuery) // budget_assumptions insert
        .mockReturnValueOnce(mockSelectQuery); // final select

      const result = await budgetService.createBudget(mockCompanyId, mockBudgetFormData);

      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(mockInsertQuery.insert).toHaveBeenCalled();
      expect(mockCategoriesQuery.insert).toHaveBeenCalled();
      expect(mockAssumptionsQuery.insert).toHaveBeenCalled();
      expect(result.data).toEqual(mockBudget);
      expect(result.error).toBeNull();
    });

    it('should validate budget data before creation', async () => {
      const invalidData: BudgetFormData = {
        year: 2030, // Too far in the future
        categories: [],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, invalidData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect((result.error as any).message).toBe('Données invalides');
    });

    it('should reject budget with invalid year range', async () => {
      const invalidYearData: BudgetFormData = {
        year: 2010, // Too old
        categories: [mockBudgetFormData.categories[0]],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, invalidYearData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should reject budget with no categories', async () => {
      const noCategoriesData: BudgetFormData = {
        year: currentYear,
        categories: [],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, noCategoriesData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      const errorObj = result.error as any;
      expect(errorObj.message).toBe('Données invalides');
      expect(errorObj.details).toBeDefined();
    });

    it('should calculate totals correctly', async () => {
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      // Mock subsequent calls
      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.createBudget(mockCompanyId, mockBudgetFormData);

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      expect(insertCall.total_revenue_budget).toBe(100000);
      expect(insertCall.total_expense_budget).toBe(30000);
      expect(insertCall.total_capex_budget).toBe(10000);
      expect(insertCall.net_profit_budget).toBe(70000); // 100000 - 30000
    });

    it('should handle database errors during creation', async () => {
      const mockError = new Error('Insert failed');
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const result = await budgetService.createBudget(mockCompanyId, mockBudgetFormData);

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });

    it('should handle categories insertion error', async () => {
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      const categoriesError = new Error('Categories insert failed');
      const mockCategoriesQuery = {
        insert: vi.fn().mockResolvedValue({ error: categoriesError })
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockInsertQuery)
        .mockReturnValueOnce(mockCategoriesQuery);

      const result = await budgetService.createBudget(mockCompanyId, mockBudgetFormData);

      expect(result.data).toBeNull();
      expect(result.error).toBe(categoriesError);
    });
  });

  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: { ...mockBudget, year: currentYear },
        error: null
      });

      const updateData: Partial<BudgetFormData> = {
        year: currentYear
      };

      const result = await budgetService.updateBudget(mockBudgetId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(mockUpdateQuery.update).toHaveBeenCalled();
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', mockBudgetId);
      expect(result.data?.year).toBe(currentYear);
    });

    it('should recalculate totals when categories are updated', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      const updateData: Partial<BudgetFormData> = {
        categories: mockBudgetFormData.categories
      };

      await budgetService.updateBudget(mockBudgetId, updateData);

      const updateCall = mockUpdateQuery.update.mock.calls[0][0];
      expect(updateCall.total_revenue_budget).toBe(100000);
      expect(updateCall.total_expense_budget).toBe(30000);
      expect(updateCall.net_profit_budget).toBe(70000);
    });

    it('should delete and recreate categories when updated', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      const updateData: Partial<BudgetFormData> = {
        categories: mockBudgetFormData.categories
      };

      await budgetService.updateBudget(mockBudgetId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('budget_categories');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockInsertQuery.insert).toHaveBeenCalled();
    });

    it('should delete and recreate assumptions when updated', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      const updateData: Partial<BudgetFormData> = {
        assumptions: mockBudgetFormData.assumptions
      };

      await budgetService.updateBudget(mockBudgetId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('budget_assumptions');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockInsertQuery.insert).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError })
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      const result = await budgetService.updateBudget(mockBudgetId, { year: currentYear });

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('updateBudgetStatus', () => {
    it('should update status to draft', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: { ...mockBudget, status: 'draft' },
        error: null
      });

      const result = await budgetService.updateBudgetStatus(mockBudgetId, 'draft');

      expect(mockUpdateQuery.update).toHaveBeenCalled();
      expect(result.data?.status).toBe('draft');
    });

    it('should set approval fields when status is approved', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: { ...mockBudget, status: 'approved' },
        error: null
      });

      await budgetService.updateBudgetStatus(mockBudgetId, 'approved', mockUserId);

      const updateCall = mockUpdateQuery.update.mock.calls[0][0];
      expect(updateCall.status).toBe('approved');
      expect(updateCall.approved_by).toBe(mockUserId);
      expect(updateCall.approved_at).toBeDefined();
    });

    it('should handle status update errors', async () => {
      const mockError = new Error('Status update failed');
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError })
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      const result = await budgetService.updateBudgetStatus(mockBudgetId, 'active');

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      (supabase.from as any).mockReturnValue(mockDeleteQuery);

      const result = await budgetService.deleteBudget(mockBudgetId);

      expect(supabase.from).toHaveBeenCalledWith('budgets');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', mockBudgetId);
      expect(result.error).toBeNull();
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError })
      };

      (supabase.from as any).mockReturnValue(mockDeleteQuery);

      const result = await budgetService.deleteBudget(mockBudgetId);

      expect(result.error).toBe(mockError);
    });
  });

  describe('analyzeBudgetVariances', () => {
    it('should analyze budget variances successfully', async () => {
      const mockVariances: BudgetVarianceAnalysis[] = [
        {
          category: 'Sales',
          budget_amount: 100000,
          actual_amount: 95000,
          variance_amount: -5000,
          variance_percentage: -5,
          ytd_budget: 100000,
          ytd_actual: 95000,
          ytd_variance_amount: -5000,
          ytd_variance_percentage: -5,
          trend: 'unfavorable'
        }
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockVariances,
        error: null
      });

      const result = await budgetService.analyzeBudgetVariances(
        mockCompanyId,
        mockBudgetId,
        '2024-01-01',
        '2024-12-31'
      );

      expect(supabase.rpc).toHaveBeenCalledWith('analyze_budget_variances', {
        p_company_id: mockCompanyId,
        p_budget_id: mockBudgetId,
        p_period_start: '2024-01-01',
        p_period_end: '2024-12-31'
      });
      expect(result.data).toEqual(mockVariances);
      expect(result.error).toBeNull();
    });

    it('should handle RPC errors', async () => {
      const mockError = new Error('RPC failed');
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await budgetService.analyzeBudgetVariances(
        mockCompanyId,
        mockBudgetId,
        '2024-01-01',
        '2024-12-31'
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('compareBudgets', () => {
    it('should compare two budgets successfully', async () => {
      const mockComparison = {
        revenue_change: 10000,
        expense_change: 5000,
        variance: 5000
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockComparison,
        error: null
      });

      const result = await budgetService.compareBudgets('budget-1', 'budget-2');

      expect(supabase.rpc).toHaveBeenCalledWith('compare_budgets', {
        p_current_budget_id: 'budget-1',
        p_previous_budget_id: 'budget-2'
      });
      expect(result.data).toEqual(mockComparison);
    });

    it('should handle comparison errors', async () => {
      const mockError = new Error('Comparison failed');
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await budgetService.compareBudgets('budget-1', 'budget-2');

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('getBudgetTemplates', () => {
    it('should fetch budget templates successfully', async () => {
      const mockTemplates: BudgetTemplate[] = [
        {
          id: 'template-1',
          name: 'Standard Template',
          description: 'A standard budget template',
          industry: 'technology',
          company_size: 'medium',
          categories: [],
          assumptions: [],
          is_default: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTemplates,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgetTemplates();

      expect(supabase.from).toHaveBeenCalledWith('budget_templates');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result.data).toEqual(mockTemplates);
    });

    it('should handle template fetch errors', async () => {
      const mockError = new Error('Fetch failed');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await budgetService.getBudgetTemplates();

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('createBudgetFromTemplate', () => {
    it('should create budget from template successfully', async () => {
      const mockTemplate: BudgetTemplate = {
        id: 'template-1',
        name: 'Standard Template',
        description: 'Standard budget template',
        industry: 'technology',
        company_size: 'medium',
        categories: [
          {
            category: 'Revenue',
            category_type: 'revenue',
            driver_type: 'fixed',
            is_mandatory: true
          }
        ],
        assumptions: [
          {
            key: 'growth',
            description: 'Growth rate',
            default_value: 10,
            unit: '%',
            category: 'revenue',
            is_mandatory: true
          }
        ],
        is_default: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTemplate,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockSelectQuery);

      vi.spyOn(budgetService, 'createBudget').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      const result = await budgetService.createBudgetFromTemplate(
        mockCompanyId,
        'template-1',
        2024
      );

      expect(result.data).toEqual(mockBudget);
      expect(budgetService.createBudget).toHaveBeenCalled();
    });

    it('should handle template not found', async () => {
      const mockError = new Error('Template not found');
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      (supabase.from as any).mockReturnValue(mockSelectQuery);

      const result = await budgetService.createBudgetFromTemplate(
        mockCompanyId,
        'template-1',
        2024
      );

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('duplicateBudget', () => {
    it('should duplicate budget successfully with growth rate', async () => {
      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: {
          ...mockBudget,
          budget_categories: [
            {
              id: 'cat-1',
              budget_id: mockBudgetId,
              category: 'Sales',
              category_type: 'revenue',
              annual_amount: 100000,
              monthly_amounts: Array(12).fill(8333.33),
              driver_type: 'fixed',
              approval_status: 'approved',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          budget_assumptions: [
            {
              id: 'ass-1',
              budget_id: mockBudgetId,
              key: 'growth',
              description: 'Growth rate',
              value: 10,
              category: 'revenue',
              confidence_level: 80,
              created_at: '2024-01-01T00:00:00Z'
            }
          ]
        },
        error: null
      });

      const targetYear = currentYear + 1;
      vi.spyOn(budgetService, 'createBudget').mockResolvedValue({
        data: { ...mockBudget, year: targetYear },
        error: null
      });

      const result = await budgetService.duplicateBudget(mockBudgetId, targetYear, 10);

      expect(budgetService.getBudgetById).toHaveBeenCalledWith(mockBudgetId);
      expect(budgetService.createBudget).toHaveBeenCalled();
      expect(result.data?.year).toBe(targetYear);
    });

    it('should handle source budget not found', async () => {
      const mockError = new Error('Budget not found');
      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await budgetService.duplicateBudget(mockBudgetId, 2025);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should use zero growth rate by default', async () => {
      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: {
          ...mockBudget,
          budget_categories: [],
          budget_assumptions: []
        },
        error: null
      });

      const createSpy = vi.spyOn(budgetService, 'createBudget').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.duplicateBudget(mockBudgetId, 2025);

      const budgetData = createSpy.mock.calls[0][1];
      expect(budgetData.categories).toEqual([]);
    });
  });

  describe('Data Validation', () => {
    it('should validate monthly amounts length', async () => {
      const invalidData: BudgetFormData = {
        year: currentYear,
        categories: [
          {
            category: 'Test',
            category_type: 'revenue',
            annual_amount: 12000,
            monthly_amounts: [1000, 1000], // Only 2 months instead of 12
            driver_type: 'fixed'
          }
        ],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, invalidData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      const errorObj = result.error as any;
      expect(errorObj.message).toBe('Données invalides');
      expect(errorObj.details).toBeDefined();
      // details is actually the errors array directly
      expect(Array.isArray(errorObj.details)).toBe(true);
      expect(errorObj.details.some((e: any) =>
        e.message.includes('12 montants mensuels')
      )).toBe(true);
    });

    it('should warn when monthly total does not match annual amount', async () => {
      const inconsistentData: BudgetFormData = {
        year: currentYear,
        categories: [
          {
            category: 'Test',
            category_type: 'revenue',
            annual_amount: 12000,
            monthly_amounts: Array(12).fill(1500), // Total: 18000, not 12000
            driver_type: 'fixed'
          }
        ],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, inconsistentData);

      // Should create but with warnings
      expect(result.data).toBeNull(); // Will fail validation
      expect(result.error).toBeDefined();
    });

    it('should validate year is within acceptable range', async () => {
      const futureData: BudgetFormData = {
        year: 2035, // Too far in future
        categories: [mockBudgetFormData.categories[0]],
        assumptions: []
      };

      const result = await budgetService.createBudget(mockCompanyId, futureData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      const errorObj = result.error as any;
      expect(errorObj.message).toBe('Données invalides');
      expect(errorObj.details).toBeDefined();
      // details is actually the errors array directly
      expect(Array.isArray(errorObj.details)).toBe(true);
      expect(errorObj.details.some((e: any) =>
        e.field === 'year'
      )).toBe(true);
    });
  });

  describe('Budget Totals Calculation', () => {
    it('should calculate revenue total correctly', async () => {
      const dataWithMultipleRevenue: BudgetFormData = {
        year: currentYear,
        categories: [
          {
            category: 'Product Sales',
            category_type: 'revenue',
            annual_amount: 100000,
            monthly_amounts: Array(12).fill(8333.33),
            driver_type: 'fixed'
          },
          {
            category: 'Service Revenue',
            category_type: 'revenue',
            annual_amount: 50000,
            monthly_amounts: Array(12).fill(4166.67),
            driver_type: 'fixed'
          }
        ],
        assumptions: []
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.createBudget(mockCompanyId, dataWithMultipleRevenue);

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      expect(insertCall.total_revenue_budget).toBe(150000);
    });

    it('should calculate expense total correctly', async () => {
      const dataWithMultipleExpenses: BudgetFormData = {
        year: currentYear,
        categories: [
          {
            category: 'Salaries',
            category_type: 'expense',
            annual_amount: 60000,
            monthly_amounts: Array(12).fill(5000),
            driver_type: 'fixed'
          },
          {
            category: 'Marketing',
            category_type: 'expense',
            annual_amount: 20000,
            monthly_amounts: Array(12).fill(1666.67),
            driver_type: 'variable'
          }
        ],
        assumptions: []
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.createBudget(mockCompanyId, dataWithMultipleExpenses);

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      expect(insertCall.total_expense_budget).toBe(80000);
    });

    it('should calculate capex total correctly', async () => {
      const dataWithCapex: BudgetFormData = {
        year: currentYear,
        categories: [
          {
            category: 'Equipment',
            category_type: 'capex',
            annual_amount: 15000,
            monthly_amounts: [15000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            driver_type: 'fixed'
          }
        ],
        assumptions: []
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.createBudget(mockCompanyId, dataWithCapex);

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      expect(insertCall.total_capex_budget).toBe(15000);
    });

    it('should calculate net profit correctly', async () => {
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      vi.spyOn(budgetService, 'getBudgetById').mockResolvedValue({
        data: mockBudget,
        error: null
      });

      await budgetService.createBudget(mockCompanyId, mockBudgetFormData);

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      // Revenue: 100000, Expense: 30000, Net: 70000
      expect(insertCall.net_profit_budget).toBe(70000);
    });
  });
});
