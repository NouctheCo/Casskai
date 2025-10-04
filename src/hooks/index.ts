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

// Types exports
export type { UseConfigReturn } from '@/contexts/ConfigContext';

// Hook personnalisé combiné pour faciliter l'usage
// import { useConfigContext } from '@/contexts/ConfigContext';
import { useSupabase } from './useSupabase';
import { useConfig } from './useConfig';

export const useAppState = () => {
  const config = useConfig();
  const supabase = useSupabase();

  return {
    config,
    supabase,
    hasError: !!config.error // Correction de la propriété error
  };
};
