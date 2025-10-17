import React, { useMemo, useState } from 'react';
import Joyride from 'react-joyride';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingData } from '@/types/onboarding.types';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { useOnboardingToasts } from '@/hooks/useOnboardingToasts';
// UI is moved to ExperienceParts
import { useToast } from '@/components/ui/use-toast';
// Separator removed - not used in this component
// Badge and icons used in ExperienceParts
import { logger } from '@/utils/logger';
import { useExperienceCompletion, SaveOnboardingScenarioPayload, SaveOnboardingScenarioResponse, SyncResult } from '@/hooks/useExperienceCompletion';
import { ExperienceContent } from './ExperienceParts';

// Helper: format RPC error object into readable message
function formatRpcError(err: unknown): string {
  if (!err) return '';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    // Try to pull common fields
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error === 'string') return anyErr.error;
    return JSON.stringify(anyErr);
  }
  return String(err);
}

// Helper: build supabase payload (kept here for readability)
// Small Joyride subcomponent to keep ExperienceStep compact
function ExperienceJoyride({ guidedTour }: { guidedTour: ReturnType<typeof useGuidedTour> }) {
  return (
    <Joyride
      steps={guidedTour.steps}
      run={guidedTour.run}
      continuous
      showProgress
      showSkipButton
      stepIndex={guidedTour.stepIndex}
      callback={guidedTour.handleJoyrideCallback}
      disableOverlayClose
      spotlightClicks={false}
      disableScrolling
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Quitter',
      }}
    />
  );
}

function ExperienceHeader() {
  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 w-fit">
        <span>Expérience enrichie</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Personnalisez votre arrivée sur CassKai</h1>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">Testez les nouveaux écrans, toasts pédagogiques et scénarios backend. L'objectif est de garantir un onboarding fluide pour chaque membre de votre équipe.</p>
    </div>
  );
}

// Factories to create handlers outside of the component to keep it small
function makeHandlers(
  onboardingData: OnboardingData | null,
  setCompletionStatus: React.Dispatch<React.SetStateAction<CompletionStatus>>,
  syncCompletionWithSupabase: (p: SaveOnboardingScenarioPayload) => Promise<SyncResult>,
  toast: ReturnType<typeof useToast>['toast'],
  loggerRef: typeof logger
) {
  const handleGuidedTour = async (guidedTourInstance: { startTour: () => void }, scenario: OnboardingScenario) => {
    guidedTourInstance.startTour();
    loggerRef.action('onboarding.guided-tour.started', { scenarioId: scenario.id, timestamp: new Date().toISOString() });
    // Marking completion is done in callback elsewhere
    toast({ title: 'Parcours démarré', description: 'Suivez les étapes pour découvrir CassKai !' });
  };

  const handleToastPreview = async (onboardingToasts: { previewGuidedToasts: () => Promise<{ success: boolean; toastsDisplayed?: number }> }, scenario: OnboardingScenario) => {
    const result = await onboardingToasts.previewGuidedToasts();
    if (!result.success) throw new Error('Erreur lors de l\'affichage des toasts');
    setCompletionStatus(prev => ({ ...prev, toastPreview: true }));
    const payload: SaveOnboardingScenarioPayload = {
      p_scenario: scenario.id,
      p_status: 'completed',
      p_payload: { ...scenario.payload, completedAt: new Date().toISOString(), userAgent: navigator.userAgent },
    };
    void syncCompletionWithSupabase(payload);
    setTimeout(() => {
      toast({ title: 'Toasts affichés', description: `${result.toastsDisplayed} toasts pédagogiques ont été affichés avec succès.` });
    }, 3500);
  };

  const handleSupabaseScenario = async (scenario: OnboardingScenario, companyName: string) => {
    const fullPayload = {
      ...scenario.payload,
      modules: onboardingData?.selectedModules || [],
      guidedTour: false,
      toastPreview: false,
      company: { id: null, name: companyName, country: onboardingData?.companyProfile?.country || 'FR' },
      completedAt: new Date().toISOString(),
    };

    loggerRef.action('onboarding.supabase-scenario.attempt', { scenarioId: scenario.id, payload: fullPayload, timestamp: new Date().toISOString() });

    const savePayload: SaveOnboardingScenarioPayload = { p_scenario: scenario.id, p_status: 'completed', p_payload: fullPayload };
    const result = await syncCompletionWithSupabase(savePayload);
    if (!result.success) {
      const err = (result as { success: false; error: unknown }).error;
      throw new Error(formatRpcError(err) || 'Impossible d\'enregistrer le scénario');
    }

    localStorage.setItem('supabase_scenario_completed', 'true');
    localStorage.setItem('supabase_scenario_payload', JSON.stringify(savePayload.p_payload));

  const sessionData = (result as { success: true; data?: SaveOnboardingScenarioResponse }).data;
  loggerRef.action('onboarding.supabase-scenario.completed', { scenarioId: scenario.id, payload: savePayload.p_payload, timestamp: new Date().toISOString(), sessionData });
    setCompletionStatus(prev => ({ ...prev, supabaseScenario: true }));
    toast({ title: 'Scénario enregistré', description: `Le scénario "${scenario.title}" a été enregistré localement avec succès.` });
  };

  return { handleGuidedTour, handleToastPreview, handleSupabaseScenario };
}

type OnboardingScenario = {
  id: string;
  title: string;
  description: string;
  badge: string;
  actionLabel: string;
  payload: Record<string, unknown>;
  completedKey: keyof CompletionStatus;
};

type CompletionStatus = {
  guidedTour: boolean;
  toastPreview: boolean;
  supabaseScenario: boolean;
};

const scenarios: OnboardingScenario[] = [
  {
    id: 'guided-tour',
    title: 'Parcours guidé interactif',
    description: 'Découvrez les modules clés de CassKai avec un tutoriel interactif étape par étape.',
    badge: 'Nouveau',
    actionLabel: 'Lancer le tutoriel',
    payload: {
      type: 'guided_tour',
      intensity: 'full',
    },
    completedKey: 'guidedTour',
  },
  {
    id: 'toast-hints',
    title: 'Toasts dynamiques',
    description: 'Testez les toasts pédagogiques avec astuces de navigation et raccourcis clavier.',
    badge: 'UX',
    actionLabel: 'Tester les toasts',
    payload: {
      type: 'toast_preview',
      count: 3,
    },
    completedKey: 'toastPreview',
  },
  {
    id: 'supabase-sync',
    title: 'Scénario Supabase',
    description: 'Enregistrez votre progression dans Supabase avec tracking complet de l\'expérience.',
    badge: 'Supabase',
    actionLabel: 'Enregistrer un scénario',
    payload: {
      type: 'supabase_scenario',
      status: 'completed',
    },
    completedKey: 'supabaseScenario',
  },
];

const ExperienceStep: React.FC = () => {
  const { goToNextStep, goToPreviousStep, state } = useOnboarding();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState<string | null>(null);
  const { completionStatus, setCompletionStatus, syncCompletionWithSupabase } = useExperienceCompletion();

  // Hooks personnalisés
  const onboardingToasts = useOnboardingToasts();
  const guidedTour = useGuidedTour(
    () => {
      // Callback appelé quand le tour se termine avec succès
      logger.info('Guided tour completed successfully');
      setCompletionStatus(prev => ({ ...prev, guidedTour: true }));

      // Synchroniser avec Supabase
      const guidedTourScenario = scenarios.find(s => s.id === 'guided-tour');
      if (guidedTourScenario) {
        const payload: SaveOnboardingScenarioPayload = {
          p_scenario: guidedTourScenario.id,
          p_status: 'completed',
          p_payload: {
            ...guidedTourScenario.payload,
            completedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        };

        void syncCompletionWithSupabase(payload);
      }
    },
    (error) => {
      // Callback appelé en cas d'erreur
      logger.error('Guided tour error:', error);
      toast({
        title: 'Erreur du parcours guidé',
        description: error,
        variant: 'destructive',
      });
    }
  );

  const companyName = useMemo(
    () => state.data?.companyProfile?.name || 'Votre entreprise',
    [state.data?.companyProfile?.name]
  );

  // Completion state is loaded by useExperienceCompletion hook

  /**
   * Gestion des scénarios selon leur ID
   */
  // Create handlers from factory to keep component body small
  const { handleGuidedTour, handleToastPreview, handleSupabaseScenario } = makeHandlers(
    state.data,
    setCompletionStatus,
    syncCompletionWithSupabase,
    toast,
    logger
  );

  const handleScenario = async (scenario: OnboardingScenario) => {
    if (isSending || completionStatus[scenario.completedKey]) return;

    setIsSending(scenario.id);

    try {
  if (scenario.id === 'guided-tour') await handleGuidedTour(guidedTour, scenario);
  else if (scenario.id === 'toast-hints') await handleToastPreview(onboardingToasts, scenario);
  else if (scenario.id === 'supabase-sync') await handleSupabaseScenario(scenario, companyName);
      else throw new Error('Scénario inconnu');
    } catch (error) {
      logger.error(`Error in scenario ${scenario.id}:`, error);

      toast({
        title: 'Action impossible',
        description: error instanceof Error ? error.message : 'Veuillez réessayer ultérieurement.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(null);
    }
  };

  // syncCompletionWithSupabase is provided by the hook
  // Note: concrete handlers are provided by makeHandlers above to keep this component small

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-slate-900">
      {/* Parcours guidé react-joyride */}
      <ExperienceJoyride guidedTour={guidedTour} />
      <ExperienceMain
        companyName={companyName}
        scenarios={scenarios}
        completionStatus={completionStatus}
        isSending={isSending}
        handleScenario={handleScenario}
        completionCount={Object.values(completionStatus).filter(Boolean).length}
        total={scenarios.length}
        onBack={goToPreviousStep}
        onNext={goToNextStep}
      />
    </div>
  );
};

function ExperienceMain(props: {
  companyName: string;
  scenarios: OnboardingScenario[];
  completionStatus: CompletionStatus;
  isSending: string | null;
  handleScenario: (s: OnboardingScenario) => void;
  completionCount: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const { scenarios, completionStatus, isSending, handleScenario, companyName, completionCount, total, onBack, onNext } = props;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
      <ExperienceHeader />

      <ExperienceContent
        scenarios={scenarios}
        completionStatus={completionStatus}
        isSending={isSending}
        handleScenario={handleScenario}
        companyName={companyName}
        completionCount={completionCount}
        total={total}
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  );
}

export default ExperienceStep;
