import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export interface PedagogicalToast {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning';
}

// Définition des toasts pédagogiques
const PEDAGOGICAL_TOASTS: PedagogicalToast[] = [
  {
    id: 'navigation-tip',
    title: '💡 Astuce Navigation',
    description: 'Utilisez Ctrl+K (ou Cmd+K sur Mac) pour ouvrir la recherche rapide et naviguer instantanément.',
    type: 'success',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'ℹ️ Raccourcis Clavier',
    description: 'Appuyez sur "?" n\'importe où dans l\'application pour voir tous les raccourcis disponibles.',
    type: 'info',
  },
  {
    id: 'module-activation',
    title: '⚠️ Activation des Modules',
    description: 'N\'oubliez pas d\'activer les modules dont vous avez besoin dans Paramètres > Modules pour un accès optimal.',
    type: 'warning',
  },
];

/**
 * Hook pour gérer les toasts dynamiques pédagogiques de l'onboarding
 * Inclut le tracking et la sauvegarde Supabase
 */
export function useOnboardingToasts() {
  const { toast } = useToast();

  /**
   * Affiche tous les toasts pédagogiques en rafale avec un délai entre chacun
   */
  const previewGuidedToasts = useCallback(async () => {
    try {
      // Tracker le déclenchement
      logger.action('toast_preview.triggered', {
        timestamp: new Date().toISOString(),
        toastCount: PEDAGOGICAL_TOASTS.length,
      });

      // Afficher les toasts avec un délai de 1 seconde entre chacun
      PEDAGOGICAL_TOASTS.forEach((toastData, index) => {
        setTimeout(() => {
          const variant = toastData.type === 'warning'
            ? 'destructive'
            : toastData.type === 'info'
            ? 'default'
            : 'default';

          toast({
            title: toastData.title,
            description: toastData.description,
            variant,
          });

          // Tracker chaque toast affiché
          logger.action('toast_preview.displayed', {
            toastId: toastData.id,
            toastType: toastData.type,
            index,
            timestamp: new Date().toISOString(),
          });
        }, index * 1000); // Décalage de 1 seconde entre chaque toast
      });

      // Sauvegarder localement après affichage de tous les toasts
      setTimeout(() => {
        try {
          localStorage.setItem('toast_preview_displayed', 'true');
          localStorage.setItem('toast_preview_completed_at', new Date().toISOString());
          localStorage.setItem('toast_preview_data', JSON.stringify(
            PEDAGOGICAL_TOASTS.map(t => ({ id: t.id, type: t.type }))
          ));
          logger.info('Toast preview saved to localStorage');
        } catch (error) {
          logger.error('Error in toast preview localStorage save:', error);
        }
      }, PEDAGOGICAL_TOASTS.length * 1000 + 500);

      return {
        success: true,
        toastsDisplayed: PEDAGOGICAL_TOASTS.length,
      };
    } catch (error) {
      logger.error('Error in previewGuidedToasts:', error);

      toast({
        title: 'Erreur',
        description: 'Impossible d\'afficher les toasts pédagogiques.',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [toast]);

  /**
   * Affiche un toast pédagogique spécifique par son ID
   */
  const showToastById = useCallback((toastId: string) => {
    const toastData = PEDAGOGICAL_TOASTS.find(t => t.id === toastId);

    if (!toastData) {
      logger.warn('Toast not found:', toastId);
      return;
    }

    const variant = toastData.type === 'warning'
      ? 'destructive'
      : toastData.type === 'info'
      ? 'default'
      : 'default';

    toast({
      title: toastData.title,
      description: toastData.description,
      variant,
    });

    logger.action('toast.displayed', {
      toastId,
      toastType: toastData.type,
      timestamp: new Date().toISOString(),
    });
  }, [toast]);

  return {
    previewGuidedToasts,
    showToastById,
    availableToasts: PEDAGOGICAL_TOASTS,
  };
}
