// src/hooks/index.ts

export { useConfig } from './useConfig';
export { useSupabase } from './useSupabase';

// Types exports
export type { UseConfigReturn } from './useConfig';
export type { UseSupabaseReturn } from './useSupabase';

// Hook personnalisé combiné pour faciliter l'usage
import { useConfig } from './useConfig';
import { useSupabase } from './useSupabase';

export const useAppState = () => {
  const config = useConfig();
  const supabase = useSupabase();

  return {
    config,
    supabase,
    isReady: config.isConfigured && supabase.isClientReady,
    needsSetup: !config.isConfigured,
    hasError: !!config.error
  };
};
