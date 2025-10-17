import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export function useBudgetMappings(companyId: string | undefined) {
  const [budgetCategories, setBudgetCategories] = useState<Array<{
    id: string;
    category: string;
    subcategory: string | null;
    category_type: 'revenue' | 'expense' | 'capex';
  }>>([]);
  const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());

  // Charger les catégories budgétaires disponibles
  useEffect(() => {
    if (!companyId) return;

    const loadBudgetCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('budget_categories')
          .select('id, category, subcategory, category_type')
          .eq('company_id', companyId);

        if (error) throw error;
        setBudgetCategories(data || []);
      } catch (err) {
        logger.error('Error loading budget categories:', err)
      }
    };

    loadBudgetCategories();
  }, [companyId]);

  // Charger les mappings existants
  useEffect(() => {
    if (!companyId) return;

    const loadExistingMappings = async () => {
      try {
        const { data, error } = await supabase
          .from('category_account_map')
          .select('account_code, category_id')
          .eq('company_id', companyId);

        if (error) throw error;

        const mappingsMap = new Map<string, string>();
        data?.forEach(mapping => {
          mappingsMap.set(mapping.account_code, mapping.category_id);
        });
        setAccountMappings(mappingsMap);
      } catch (err) {
        logger.error('Error loading mappings:', err)
      }
    };

    loadExistingMappings();
  }, [companyId]);

  const saveMapping = async (accountNumber: string, categoryId: string | null) => {
    if (!companyId) return false;

    try {
      if (categoryId) {
        // Créer ou mettre à jour le mapping
        const { error } = await supabase
          .from('category_account_map')
          .upsert({
            company_id: companyId,
            account_code: accountNumber,
            category_id: categoryId
          });

        if (error) throw error;
      } else {
        // Supprimer le mapping
        const { error } = await supabase
          .from('category_account_map')
          .delete()
          .eq('company_id', companyId)
          .eq('account_code', accountNumber);

        if (error) throw error;
      }

      // Mettre à jour l'état local
      const newMappings = new Map(accountMappings);
      if (categoryId) {
        newMappings.set(accountNumber, categoryId);
      } else {
        newMappings.delete(accountNumber);
      }
      setAccountMappings(newMappings);

      return true;
    } catch (err) {
      logger.error('Error saving mapping:', err);
      return false;
    }
  };

  return {
    budgetCategories,
    accountMappings,
    saveMapping
  };
}