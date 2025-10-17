import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export function useAccountMappings(companyId?: string) {
  const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
  const [savingMapping, setSavingMapping] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const loadAccountMappings = async () => {
      try {
        const { data, error } = await supabase
          .from('account_budget_mappings')
          .select('account_id, budget_category_id')
          .eq('company_id', companyId);

        if (error) {
          logger.warn('Erreur chargement mappings comptes:', error);
          return;
        }

        const mappings = new Map<string, string>();
        data?.forEach(mapping => {
          mappings.set(mapping.account_id, mapping.budget_category_id);
        });
        setAccountMappings(mappings);
      } catch (err) {
        logger.error('Erreur chargement mappings comptes:', err)
      }
    };

    loadAccountMappings();
  }, [companyId]);

  const saveMapping = async (accountId: string, budgetCategoryId: string | null) => {
    if (!companyId) return;

    setSavingMapping(accountId);
    try {
      if (budgetCategoryId) {
        // Créer ou mettre à jour le mapping
        const { error } = await supabase
          .from('account_budget_mappings')
          .upsert({
            company_id: companyId,
            account_id: accountId,
            budget_category_id: budgetCategoryId
          }, {
            onConflict: 'company_id,account_id'
          });

        if (error) throw error;

        setAccountMappings(prev => new Map(prev.set(accountId, budgetCategoryId)));
      } else {
        // Supprimer le mapping
        const { error } = await supabase
          .from('account_budget_mappings')
          .delete()
          .eq('company_id', companyId)
          .eq('account_id', accountId);

        if (error) throw error;

        setAccountMappings(prev => {
          const newMap = new Map(prev);
          newMap.delete(accountId);
          return newMap;
        });
      }
    } catch (err) {
      logger.error('Erreur sauvegarde mapping:', err);
      throw err;
    } finally {
      setSavingMapping(null);
    }
  };

  return {
    accountMappings,
    savingMapping,
    saveMapping
  };
}