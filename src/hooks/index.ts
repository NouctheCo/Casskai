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

// src/hooks/index.ts

// export { useConfigContext as useConfig } from '@/contexts/ConfigContext'; // Supprimé pour éviter conflit
export { useSupabase } from './useSupabase';
export { useAccounting } from './useAccounting';
export { useJournals } from './useJournals';
export { useJournalEntries } from './useJournalEntries';
export { useThirdParties } from './useThirdParties';
export { useCompanies } from './useCompanies';
export { useEnterprise } from './useEnterprise';
export { useReports } from './useReports';
export { useFECImport } from './useFECImport';
export { useUserManagement } from './useUserManagement';
export { useHR } from './useHR';
export { useHRPayroll } from './useHRPayroll';
export { useCrm } from './useCrm';
export { useCRMAnalytics } from './useCRMAnalytics';
export { useIsSuperAdmin, useSuperAdminList } from './useSuperAdmin';

// Types exports
type _UseConfigReturn = any;

// Hook personnalisé combiné pour faciliter l'usage
// import { useConfigContext } from '@/contexts/ConfigContext';
import { useSupabase } from './useSupabase';
import { useConfig } from './useConfig';

export const useAppState = () => {
  const config = useConfig();
  const supabase = useSupabase('companies', undefined);

  return {
    config,
    supabase,
    hasError: !!config.error // Correction de la propriété error
  };
};
