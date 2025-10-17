import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ExperienceStep from './ExperienceStep';
import { supabase } from '@/lib/supabase';
import * as useOnboardingModule from '@/hooks/useOnboarding';
import * as useGuidedTourModule from '@/hooks/useGuidedTour';
import * as useOnboardingToastsModule from '@/hooks/useOnboardingToasts';

// Mock des hooks et dépendances
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/hooks/useOnboarding');
vi.mock('@/hooks/useGuidedTour');
vi.mock('@/hooks/useOnboardingToasts');
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ExperienceStep', () => {
  const mockGoToNextStep = vi.fn();
  const mockGoToPreviousStep = vi.fn();
  const mockStartTour = vi.fn();
  const mockPreviewToasts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useOnboarding
    vi.spyOn(useOnboardingModule, 'useOnboarding').mockReturnValue({
      goToNextStep: mockGoToNextStep,
      goToPreviousStep: mockGoToPreviousStep,
      state: {
        data: {
          companyProfile: {
            name: 'Test Company',
            country: 'FR',
          },
          selectedModules: ['accounting', 'invoicing'],
        },
      },
    } as any);

    // Mock useGuidedTour with callbacks
    vi.spyOn(useGuidedTourModule, 'useGuidedTour').mockReturnValue({
      run: false,
      steps: [],
      stepIndex: 0,
      tourActive: false,
      startTour: mockStartTour,
      endTour: vi.fn(),
      handleJoyrideCallback: vi.fn(),
    });

    // Mock useOnboardingToasts
    vi.spyOn(useOnboardingToastsModule, 'useOnboardingToasts').mockReturnValue({
      previewGuidedToasts: mockPreviewToasts.mockResolvedValue({
        success: true,
        toastsDisplayed: 3,
      }),
      showToastById: vi.fn(),
      availableToasts: [
        { id: 'toast-1', title: 'Toast 1', description: 'Description 1', type: 'info' as const },
      ],
    });

    // Mock Supabase
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id' },
          access_token: 'test-token',
        },
      },
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          session_data: {
            featuresExploration: {
              guided_tour_completed: false,
              toastPreview: { displayed: false },
              supabaseScenario: { status: 'pending' },
            },
          },
        },
        error: null,
      }),
    });

    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, sessionId: 'test-session-id' },
      error: null,
    });
  });

  it('devrait afficher les trois cartes de scénarios', () => {
    render(<ExperienceStep />);

    // Use async findBy* to wait for any async state updates triggered by the hook
    return Promise.all([
      screen.findByText('Parcours guidé interactif'),
      screen.findByText('Toasts dynamiques'),
      screen.findByText('Scénario Supabase'),
    ]).then(([a, b, c]) => {
      expect(a).toBeInTheDocument();
      expect(b).toBeInTheDocument();
      expect(c).toBeInTheDocument();
    });
  });

  it('devrait lancer le parcours guidé au clic sur "Lancer le tutoriel"', async () => {
    render(<ExperienceStep />);

    const guidedTourButton = screen.getByText('Lancer le tutoriel');
    fireEvent.click(guidedTourButton);

    await waitFor(() => {
      expect(mockStartTour).toHaveBeenCalled();
    });
  });

  it('devrait afficher les toasts pédagogiques au clic sur "Tester les toasts"', async () => {
    render(<ExperienceStep />);

    // Attendre que le bouton soit présent
    const toastButton = await screen.findByText('Tester les toasts');
    fireEvent.click(toastButton);

    await waitFor(() => {
      expect(mockPreviewToasts).toHaveBeenCalled();
    });
  });

  it('devrait enregistrer le scénario Supabase via RPC', async () => {
    render(<ExperienceStep />);

    // Attendre que le bouton soit présent
    const supabaseButton = await screen.findByText('Enregistrer un scénario');
    fireEvent.click(supabaseButton);

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith(
        'save_onboarding_scenario',
        expect.objectContaining({
          p_scenario: 'supabase-sync',
          p_status: 'completed',
        })
      );
    });
  });

  it('devrait désactiver les boutons une fois les scénarios complétés', async () => {
    // Mock d'une session avec scénarios complétés
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          session_data: {
            featuresExploration: {
              guided_tour_completed: true,
              toastPreview: { displayed: true },
              supabaseScenario: { status: 'completed' },
            },
          },
        },
        error: null,
      }),
    });

    render(<ExperienceStep />);

    // Attendre le chargement de l'état
    await waitFor(() => {
      const buttons = screen.getAllByText('Complété');
      expect(buttons).toHaveLength(3);
    });
  });

  it('devrait afficher la progression des scénarios complétés', async () => {
    render(<ExperienceStep />);

    // Au départ, aucun scénario n'est complété - wait for the component to settle
    const progress = await screen.findByText(/0 \/ 3 complétés/);
    expect(progress).toBeInTheDocument();
  });

  it('devrait gérer les erreurs lors de l\'enregistrement Supabase', async () => {
    // Mock d'une erreur Supabase
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'Erreur de connexion' },
    });

    render(<ExperienceStep />);

    // Attendre que le bouton soit présent
    const supabaseButton = await screen.findByText('Enregistrer un scénario');
    fireEvent.click(supabaseButton);

    await waitFor(() => {
      // Le bouton devrait redevenir actif après l'erreur
      expect(supabaseButton).not.toBeDisabled();
    });
  });
});
