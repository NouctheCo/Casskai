import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

interface BudgetCategory {
  id: string;
  category: string;
  subcategory: string | null;
  category_type: 'revenue' | 'expense' | 'capex';
}

export function useBudgetCategories(companyId?: string) {
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const loadBudgetCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from('budget_categories')
          .select('id, category, subcategory, category_type')
          .eq('company_id', companyId)
          .order('category', { ascending: true });

        if (error) {
          logger.warn('Erreur chargement catégories budgétaires:', error);
          return;
        }

        setBudgetCategories(data || []);
      } catch (err) {
        logger.error('Erreur chargement catégories budgétaires:', err)
      } finally {
        setLoadingCategories(false);
      }
    };

    loadBudgetCategories();
  }, [companyId]);

  return {
    budgetCategories,
    loadingCategories,
    setBudgetCategories
  };
}