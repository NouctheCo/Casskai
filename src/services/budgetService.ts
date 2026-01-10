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
// Service pour la gestion budgétaire complète de CassKai
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  Budget,
  BudgetCategory,
  BudgetFormData,
  BudgetTemplate,
  BudgetImportData,
  BudgetFilter,
  BudgetValidationResult,
  BudgetStatus,
  BudgetVarianceAnalysis
} from '@/types/budget.types';
export class BudgetService {
  private static instance: BudgetService;
  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }
  // =============================================
  // CRUD Operations - Budgets
  // =============================================
  /**
   * Récupère tous les budgets d'une entreprise
   */
  async getBudgets(
    companyId: string,
    filter?: BudgetFilter
  ): Promise<{ data: Budget[] | null; error: unknown | null }> {
    try {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          budget_categories(*),
          budget_assumptions(*)
        `)
        .eq('company_id', companyId)
        .order('budget_year', { ascending: false });
      // Appliquer les filtres
      if (filter?.years?.length) {
        query = query.in('budget_year', filter.years);
      }
      if (filter?.status?.length) {
        query = query.in('status', filter.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Budget', 'Error fetching budgets:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Récupère un budget spécifique avec toutes ses données
   */
  async getBudgetById(budgetId: string): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_categories(*),
          budget_assumptions(*)
        `)
        .eq('id', budgetId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Budget', 'Error fetching budget:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Récupère le budget actif pour une année donnée
   */
  async getActiveBudget(
    companyId: string,
    year: number
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_categories(*),
          budget_assumptions(*)
        `)
        .eq('company_id', companyId)
        .eq('budget_year', year)
        .eq('status', 'active')
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      logger.error('Budget', 'Error fetching active budget:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Crée un nouveau budget
   */
  async createBudget(
    companyId: string,
    budgetData: BudgetFormData
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      // Validation des données
      const validation = this.validateBudgetData(budgetData);
      if (!validation.isValid) {
        return {
          data: null,
          error: { message: 'Données invalides', details: validation.errors }
        };
      }
      // Calculer les totaux
      const totals = this.calculateBudgetTotals(budgetData.categories as unknown as BudgetCategory[]);
      // Créer le budget principal
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          company_id: companyId,
          budget_year: budgetData.year,
          version: 1,
          status: 'draft',
          total_revenue_budget: totals.revenue,
          total_expense_budget: totals.expense,
          total_capex_budget: totals.capex,
          net_profit_budget: totals.revenue - totals.expense
        })
        .select()
        .single();
      if (budgetError) throw budgetError;
      // Créer les catégories
      if (budgetData.categories.length > 0) {
        const categoriesData = budgetData.categories.map(cat => ({
          budget_id: budget.id,
          account_id: cat.account_id, // Lien vers chart_of_accounts
          category: cat.category,
          subcategory: cat.subcategory,
          category_type: cat.category_type,
          account_codes: cat.account_codes,
          annual_amount: cat.annual_amount,
          monthly_amounts: cat.monthly_amounts,
          growth_rate: cat.growth_rate,
          driver_type: cat.driver_type,
          base_value: cat.base_value,
          variable_rate: cat.variable_rate,
          formula: cat.formula,
          notes: cat.notes,
          responsible_person: cat.responsible_person,
          approval_status: 'pending'
        }));
        const { error: categoriesError } = await supabase
          .from('budget_categories')
          .insert(categoriesData);
        if (categoriesError) throw categoriesError;
      }
      // Créer les hypothèses
      if (budgetData.assumptions.length > 0) {
        const assumptionsData = budgetData.assumptions.map(ass => ({
          budget_id: budget.id,
          key: ass.key,
          description: ass.description,
          value: ass.value,
          unit: ass.unit,
          category: ass.category,
          impact_description: ass.impact_description,
          confidence_level: ass.confidence_level,
          source: ass.source
        }));
        const { error: assumptionsError } = await supabase
          .from('budget_assumptions')
          .insert(assumptionsData);
        if (assumptionsError) throw assumptionsError;
      }
      // Récupérer le budget complet créé
      return this.getBudgetById(budget.id);
    } catch (error) {
      logger.error('Budget', 'Error creating budget:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Met à jour un budget existant
   */
  async updateBudget(
    budgetId: string,
    budgetData: Partial<BudgetFormData>
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      let updateData: Record<string, unknown> = {};
      // Recalculer les totaux si les catégories ont changé
      if (budgetData.categories) {
        const totals = this.calculateBudgetTotals(budgetData.categories as unknown as BudgetCategory[]);
        updateData = {
          total_revenue_budget: totals.revenue,
          total_expense_budget: totals.expense,
          total_capex_budget: totals.capex,
          net_profit_budget: totals.revenue - totals.expense,
          updated_at: new Date().toISOString()
        };
      }
      if (budgetData.year) {
        updateData.budget_year = budgetData.year;
      }
      // Mettre à jour le budget principal
      const { error: budgetError } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budgetId);
      if (budgetError) throw budgetError;
      // Mettre à jour les catégories si fournies
      if (budgetData.categories) {
        // Supprimer les anciennes catégories
        await supabase
          .from('budget_categories')
          .delete()
          .eq('budget_id', budgetId);
        // Créer les nouvelles catégories
        if (budgetData.categories.length > 0) {
          const categoriesData = budgetData.categories.map(cat => ({
            budget_id: budgetId,
            account_id: cat.account_id, // Lien vers chart_of_accounts
            category: cat.category,
            subcategory: cat.subcategory,
            category_type: cat.category_type,
            account_codes: cat.account_codes,
            annual_amount: cat.annual_amount,
            monthly_amounts: cat.monthly_amounts,
            growth_rate: cat.growth_rate,
            driver_type: cat.driver_type,
            base_value: cat.base_value,
            variable_rate: cat.variable_rate,
            formula: cat.formula,
            notes: cat.notes,
            responsible_person: cat.responsible_person,
            approval_status: 'pending'
          }));
          const { error: categoriesError } = await supabase
            .from('budget_categories')
            .insert(categoriesData);
          if (categoriesError) throw categoriesError;
        }
      }
      // Mettre à jour les hypothèses si fournies
      if (budgetData.assumptions) {
        // Supprimer les anciennes hypothèses
        await supabase
          .from('budget_assumptions')
          .delete()
          .eq('budget_id', budgetId);
        // Créer les nouvelles hypothèses
        if (budgetData.assumptions.length > 0) {
          const assumptionsData = budgetData.assumptions.map(ass => ({
            budget_id: budgetId,
            key: ass.key,
            description: ass.description,
            value: ass.value,
            unit: ass.unit,
            category: ass.category,
            impact_description: ass.impact_description,
            confidence_level: ass.confidence_level,
            source: ass.source
          }));
          const { error: assumptionsError } = await supabase
            .from('budget_assumptions')
            .insert(assumptionsData);
          if (assumptionsError) throw assumptionsError;
        }
      }
      return this.getBudgetById(budgetId);
    } catch (error) {
      logger.error('Budget', 'Error updating budget:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Change le statut d'un budget
   */
  async updateBudgetStatus(
    budgetId: string,
    status: BudgetStatus,
    approvedBy?: string
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      };
      if (status === 'approved' && approvedBy) {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = approvedBy;
      }
      const { error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budgetId);
      if (error) throw error;
      return this.getBudgetById(budgetId);
    } catch (error) {
      logger.error('Budget', 'Error updating budget status:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Supprime un budget
   */
  async deleteBudget(budgetId: string): Promise<{ error: unknown | null }> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      logger.error('Budget', 'Error deleting budget:', error instanceof Error ? error.message : String(error));
      return { error };
    }
  }
  // =============================================
  // Analyse et comparaisons
  // =============================================
  /**
   * Analyse les écarts budgétaires
   */
  async analyzeBudgetVariances(
    companyId: string,
    budgetId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{ data: BudgetVarianceAnalysis[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('analyze_budget_variances', {
        p_company_id: companyId,
        p_budget_id: budgetId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      logger.error('Budget', 'Error analyzing budget variances:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Compare les budgets (N vs N-1)
   */
  async compareBudgets(
    currentBudgetId: string,
    previousBudgetId: string
  ): Promise<{ data: Record<string, unknown> | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase.rpc('compare_budgets', {
        p_current_budget_id: currentBudgetId,
        p_previous_budget_id: previousBudgetId
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Budget', 'Error comparing budgets:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  // =============================================
  // Templates et import/export
  // =============================================
  /**
   * Récupère les templates de budget disponibles
   */
  async getBudgetTemplates(): Promise<{ data: BudgetTemplate[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      logger.error('Budget', 'Error fetching budget templates:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Crée un budget à partir d'un template
   */
  async createBudgetFromTemplate(
    companyId: string,
    templateId: string,
    year: number
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      // Récupérer le template
      const { data: template, error: templateError } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (templateError) throw templateError;
      // Créer les données de budget basées sur le template
      const budgetData: BudgetFormData = {
        year,
        categories: template.categories?.map((cat: Record<string, unknown>) => ({
          category: cat.category,
          subcategory: cat.subcategory,
          category_type: cat.category_type,
          account_codes: cat.account_codes || [],
          annual_amount: 0, // À remplir par l'utilisateur
          monthly_amounts: Array(12).fill(0),
          growth_rate: 0,
          driver_type: cat.driver_type,
          notes: cat.description
        })) || [],
        assumptions: template.assumptions?.map((ass: Record<string, unknown>) => ({
          key: ass.key,
          description: ass.description,
          value: ass.default_value || 0,
          unit: ass.unit,
          category: ass.category,
          confidence_level: 80
        })) || []
      };
      return this.createBudget(companyId, budgetData);
    } catch (error) {
      logger.error('Budget', 'Error creating budget from template:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  /**
   * Duplique un budget existant pour une nouvelle année
   */
  async duplicateBudget(
    budgetId: string,
    newYear: number,
    growthRate: number = 0
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      // Récupérer le budget source
      const { data: sourceBudget, error: sourceError } = await this.getBudgetById(budgetId);
      if (sourceError || !sourceBudget) {
        throw sourceError || new Error('Budget source introuvable');
      }
      // Créer les nouvelles données avec ajustement de croissance
      const budgetData: BudgetFormData = {
        year: newYear,
        categories: sourceBudget.budget_categories?.map(cat => ({
          category: cat.category,
          subcategory: cat.subcategory,
          category_type: cat.category_type,
          account_codes: cat.account_codes || [],
          annual_amount: cat.annual_amount * (1 + growthRate / 100),
          monthly_amounts: cat.monthly_amounts.map(amount => amount * (1 + growthRate / 100)),
          growth_rate: growthRate,
          driver_type: cat.driver_type,
          base_value: cat.base_value,
          variable_rate: cat.variable_rate,
          formula: cat.formula,
          notes: cat.notes,
          responsible_person: cat.responsible_person
        })) || [],
        assumptions: sourceBudget.budget_assumptions?.map(ass => ({
          key: ass.key,
          description: ass.description,
          value: ass.value,
          unit: ass.unit,
          category: ass.category,
          impact_description: ass.impact_description,
          confidence_level: ass.confidence_level,
          source: ass.source
        })) || []
      };
      return this.createBudget(sourceBudget.company_id, budgetData);
    } catch (error) {
      logger.error('Budget', 'Error duplicating budget:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
  // =============================================
  // Méthodes utilitaires privées
  // =============================================
  private calculateBudgetTotals(categories: BudgetCategory[]): {
    revenue: number;
    expense: number;
    capex: number;
  } {
    return categories.reduce(
      (totals, cat) => {
        switch (cat.category_type) {
          case 'revenue':
            totals.revenue += cat.annual_amount;
            break;
          case 'expense':
            totals.expense += cat.annual_amount;
            break;
          case 'capex':
            totals.capex += cat.annual_amount;
            break;
        }
        return totals;
      },
      { revenue: 0, expense: 0, capex: 0 }
    );
  }
  private validateBudgetData(budgetData: BudgetFormData): BudgetValidationResult {
    const errors: Array<{ field: string; category?: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: Array<{ field: string; category?: string; message: string; suggestion?: string }> = [];
    // Validation de l'année
    const currentYear = new Date().getFullYear();
    if (budgetData.year < currentYear - 1 || budgetData.year > currentYear + 5) {
      errors.push({
        field: 'year',
        message: `L'année doit être comprise entre ${  currentYear - 1  } et ${  currentYear + 5}`,
        severity: 'error'
      });
    }
    // Validation des catégories
    if (budgetData.categories.length === 0) {
      errors.push({
        field: 'categories',
        message: 'Au moins une catégorie budgétaire est requise',
        severity: 'error'
      });
    }
    // Validation des montants mensuels
    budgetData.categories.forEach((cat, index) => {
      if (cat.monthly_amounts.length !== 12) {
        errors.push({
          field: `categories[${index}].monthly_amounts`,
          category: cat.category,
          message: 'Exactement 12 montants mensuels sont requis',
          severity: 'error'
        });
      }
      const monthlyTotal = cat.monthly_amounts.reduce((sum, amount) => sum + amount, 0);
      const annualAmount = cat.annual_amount;
      if (Math.abs(monthlyTotal - annualAmount) > 0.01) {
        warnings.push({
          field: `categories[${index}].amounts`,
          category: cat.category,
          message: 'Le total mensuel ne correspond pas au montant annuel',
          suggestion: 'Vérifiez la cohérence entre les montants mensuels et annuels'
        });
      }
    });
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Crée un budget à partir de données importées (Excel/CSV)
   */
  async createBudgetFromImport(
    companyId: string,
    importData: BudgetImportData
  ): Promise<{ data: Budget | null; error: unknown | null }> {
    try {
      // Convertir les données importées au format BudgetFormData
      const budgetData: BudgetFormData = {
        year: importData.year,
        categories: importData.categories.map(cat => ({
          category: cat.category,
          subcategory: cat.subcategory,
          category_type: cat.category_type,
          account_codes: [],
          monthly_amounts: [
            cat.jan, cat.feb, cat.mar, cat.apr, cat.may, cat.jun,
            cat.jul, cat.aug, cat.sep, cat.oct, cat.nov, cat.dec
          ],
          annual_amount: cat.jan + cat.feb + cat.mar + cat.apr + cat.may + cat.jun +
                        cat.jul + cat.aug + cat.sep + cat.oct + cat.nov + cat.dec,
          driver_type: 'fixed',
          notes: cat.notes,
        })),
        assumptions: importData.assumptions?.map(ass => ({
          key: ass.key,
          description: ass.description,
          value: ass.value,
          unit: ass.unit,
          category: ass.category,
          confidence_level: 80,
        })) || []
      };
      // Créer le budget
      return this.createBudget(companyId, budgetData);
    } catch (error) {
      logger.error('Budget', 'Error creating budget from import:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }
}
// Export de l'instance singleton
export const budgetService = BudgetService.getInstance();