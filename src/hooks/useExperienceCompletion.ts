import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export type CompletionStatus = {
  guidedTour: boolean;
  toastPreview: boolean;
  supabaseScenario: boolean;
};

export type SaveOnboardingScenarioPayload = {
  p_scenario: string;
  p_status: 'completed' | 'pending' | string;
  p_payload?: Record<string, unknown>;
};

export type SaveOnboardingScenarioResponse = {
  success?: boolean;
  sessionId?: string;
  [k: string]: unknown;
};

export type SyncResult =
  | { success: true; data?: SaveOnboardingScenarioResponse }
  | { success: false; error: unknown };

export function useExperienceCompletion() {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    guidedTour: false,
    toastPreview: false,
    supabaseScenario: false,
  });

  useEffect(() => {
    let mounted = true;

    const loadFromRemote = async (userId: string) => {
      const res = await supabase
        .from('onboarding_sessions')
        .select('session_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (res && res.data && res.data.session_data && res.data.session_data.featuresExploration) {
        type FeaturesExplorationShape = {
          guided_tour_completed?: boolean;
          toastPreview?: { displayed?: boolean };
          supabaseScenario?: { status?: string };
          [k: string]: unknown;
        };

        const fe = res.data.session_data.featuresExploration as FeaturesExplorationShape;
        const guidedTour = Boolean(fe?.guided_tour_completed);
        const toastPreview = Boolean(fe?.toastPreview?.displayed);
        const supabaseScenario = (fe?.supabaseScenario?.status || '') === 'completed';

        if (mounted) {
          setCompletionStatus({ guidedTour, toastPreview, supabaseScenario });
          logger.info('Completion status loaded from Supabase:', { guidedTour, toastPreview, supabaseScenario });
        }

        return true;
      }

      return false;
    };

    const load = async () => {
      try {
        let sessionRes: unknown;
        try {
          sessionRes = await supabase.auth.getSession();
        } catch {
          // Treat as no session and fall back to localStorage
          sessionRes = undefined;
        }

        const userId = (sessionRes as unknown as { data?: { session?: { user?: { id?: string } } } })?.data?.session?.user?.id;

        if (userId) {
          const ok = await loadFromRemote(userId).catch(() => false);
          if (ok) return;
        }

        // localStorage fallback
        const guidedTour = localStorage.getItem('guided_tour_completed') === 'true';
        const toastPreview = localStorage.getItem('toast_preview_displayed') === 'true';
        const supabaseScenario = localStorage.getItem('supabase_scenario_completed') === 'true';

        if (mounted) {
          setCompletionStatus({ guidedTour, toastPreview, supabaseScenario });
          logger.info('Completion status loaded from localStorage:', { guidedTour, toastPreview, supabaseScenario });
        }
      } catch (error) {
        logger.error('Error loading completion status:', error);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const syncCompletionWithSupabase = useCallback(async (payload: SaveOnboardingScenarioPayload): Promise<SyncResult> => {
    try {
      const { data, error } = (await supabase.rpc('save_onboarding_scenario', payload)) as { data?: SaveOnboardingScenarioResponse; error?: unknown };

      if (error) {
        logger.error('Error syncing completion with Supabase:', error);
        return { success: false, error };
      }

      logger.info('Completion synced with Supabase:', data);
      return { success: true, data };
    } catch (err) {
      logger.error('Exception in syncCompletionWithSupabase:', err);
      return { success: false, error: err };
    }
  }, []);

  return { completionStatus, setCompletionStatus, syncCompletionWithSupabase } as const;
}
