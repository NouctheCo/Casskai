import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';

export interface GuidedTourState {
  run: boolean;
  steps: Step[];
  stepIndex: number;
  tourActive: boolean;
}

export interface GuidedTourCallbacks {
  startTour: () => void;
  endTour: () => void;
  handleJoyrideCallback: (data: CallBackProps) => void;
  onTourComplete?: () => void;
  onTourError?: (error: string) => void;
}

// Définition des étapes du tour guidé
const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Bienvenue dans CassKai ! Laissez-nous vous guider à travers les fonctionnalités clés de la plateforme.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="header-nav"]',
    content: 'Utilisez le menu de navigation pour accéder rapidement aux différentes sections de l\'application.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    content: 'Le tableau de bord vous donne une vue d\'ensemble de votre activité en temps réel.',
    placement: 'right',
  },
  {
    target: '[data-tour="accounting"]',
    content: 'Gérez toute votre comptabilité : écritures, plan comptable, rapports financiers.',
    placement: 'right',
  },
  {
    target: '[data-tour="invoicing"]',
    content: 'Créez et gérez vos factures, devis et paiements clients en quelques clics.',
    placement: 'right',
  },
  {
    target: '[data-tour="settings"]',
    content: 'Configurez votre entreprise, les utilisateurs et les modules dans les paramètres.',
    placement: 'left',
  },
];

/**
 * Hook pour gérer le parcours guidé interactif avec react-joyride
 * Inclut le tracking analytics et la sauvegarde Supabase
 */
export function useGuidedTour(onTourComplete?: () => void, onTourError?: (error: string) => void): GuidedTourState & GuidedTourCallbacks {
  const [state, setState] = useState<GuidedTourState>({
    run: false,
    steps: TOUR_STEPS,
    stepIndex: 0,
    tourActive: false,
  });

  /**
   * Démarre le tour guidé
   */
  const startTour = useCallback(async () => {
    try {
      // Vérifier si le tour a déjà été complété (localStorage fallback)
      const tourCompleted = localStorage.getItem('guided_tour_completed');

      if (tourCompleted === 'true') {
        logger.info('Guided tour already completed, skipping');
        return;
      }

      // Tracker le début du tour
      logger.action('modules-tour.started', {
        timestamp: new Date().toISOString(),
        stepsCount: TOUR_STEPS.length,
      });

      setState(prev => ({
        ...prev,
        run: true,
        tourActive: true,
        stepIndex: 0,
      }));
    } catch (error) {
      logger.error('Error starting guided tour:', error);
    }
  }, []);

  /**
   * Termine le tour guidé
   */
  const endTour = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        run: false,
        tourActive: false,
        stepIndex: 0,
      }));

      // Tracker la complétion du tour
      logger.action('modules-tour.completed', {
        timestamp: new Date().toISOString(),
        completedSteps: TOUR_STEPS.length,
      });

      // Sauvegarder localement (fallback)
      localStorage.setItem('guided_tour_completed', 'true');
      localStorage.setItem('guided_tour_completed_at', new Date().toISOString());

      logger.info('Guided tour completion saved to localStorage');

      // Notifier le parent que le tour est terminé avec succès
      onTourComplete?.();
    } catch (error) {
      logger.error('Error ending guided tour:', error);
      onTourError?.('Erreur lors de la finalisation du tour');
    }
  }, [onTourComplete, onTourError]);

  /**
   * Callback pour les événements react-joyride
   */
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Log de l'événement pour debugging
    logger.debug('Joyride callback:', { status, type, index, action });

    // Gestion de la fin du tour
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
    }

    // Gestion des erreurs
    if (type === EVENTS.ERROR || status === STATUS.ERROR) {
      logger.error('Joyride error:', { error: data });
      onTourError?.('Erreur lors du parcours guidé');
      // Arrêter le tour en cas d'erreur
      setState(prev => ({
        ...prev,
        run: false,
        tourActive: false,
      }));
    }

    // Gestion du changement d'étape
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (type === EVENTS.TARGET_NOT_FOUND) {
        logger.warn('Joyride target not found', { target: TOUR_STEPS[index]?.target });
        onTourError?.(`Cible non trouvée: ${TOUR_STEPS[index]?.target}`);
      }

      setState(prev => ({
        ...prev,
        stepIndex: index + (action === ACTIONS.PREV ? -1 : 1),
      }));
    }

    // Tracking des étapes individuelles
    if (type === EVENTS.STEP_AFTER) {
      logger.action('modules-tour.step-completed', {
        stepIndex: index,
        stepTarget: TOUR_STEPS[index]?.target || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  }, [endTour, onTourError]);

  return {
    ...state,
    startTour,
    endTour,
    handleJoyrideCallback,
  };
}
