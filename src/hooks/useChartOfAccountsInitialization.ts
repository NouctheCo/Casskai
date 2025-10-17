import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export function useChartOfAccountsInitialization(companyId?: string) {
  const [hasChartOfAccounts, setHasChartOfAccounts] = useState<boolean | null>(null);
  const [initializingChart, setInitializingChart] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const checkAndInitializeChart = async () => {
      try {
        // Vérifier s'il y a déjà des comptes dans chart_of_accounts
        const { data: chartAccounts, error: chartError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        if (chartError) {
          logger.warn('Erreur vérification chart_of_accounts:', chartError)
        }

        // Vérifier aussi dans la table accounts (legacy)
        const { data: legacyAccounts, error: legacyError } = await supabase
          .from('accounts')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        if (legacyError) {
          logger.warn('Erreur vérification accounts:', legacyError)
        }

        const hasChart = (chartAccounts && chartAccounts.length > 0) || (legacyAccounts && legacyAccounts.length > 0);
        setHasChartOfAccounts(hasChart);

        // Si aucun plan comptable n'existe, l'initialiser automatiquement
        if (!hasChart) {
          logger.info('🔧 Plan comptable vide détecté, initialisation automatique...');
          setInitializingChart(true);

          // Récupérer le pays de l'entreprise
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('country_code')
            .eq('id', companyId)
            .single();

          if (companyError) {
            logger.warn('Erreur récupération pays entreprise:', companyError);
            setInitializingChart(false);
            return;
          }

          const countryCode = companyData?.country_code || 'FR';

          // Initialiser automatiquement le plan comptable
          const { data: initResult, error: initError } = await supabase.rpc('initialize_company_chart_of_accounts', {
            p_company_id: companyId,
            p_country_code: countryCode
          });

          if (initError) {
            logger.error('Erreur initialisation automatique:', initError);
            setInitializingChart(false);
            return;
          }

          logger.info(`✅ Plan comptable initialisé automatiquement: ${initResult || 0} comptes créés`);
          setHasChartOfAccounts(true);
          setInitializingChart(false);
        }
      } catch (err) {
        logger.error('Erreur vérification/initialisation plan comptable:', err);
        setInitializingChart(false);
      }
    };

    checkAndInitializeChart();
  }, [companyId]);

  return {
    hasChartOfAccounts,
    initializingChart,
    setHasChartOfAccounts
  };
}