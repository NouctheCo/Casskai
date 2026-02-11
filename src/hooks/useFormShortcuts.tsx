/**
 * Hook pour gérer les shortcuts clavier dans les formulaires
 * Permet d'améliorer la productivité avec des raccourcis clavier standards
 *
 * @module useFormShortcuts
 */

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface FormShortcutsHandlers {
  /**
   * Ctrl+S - Sauvegarder
   */
  onSave?: () => void | Promise<void>;

  /**
   * Ctrl+Enter - Valider/Soumettre
   */
  onSubmit?: () => void | Promise<void>;

  /**
   * Esc - Annuler/Fermer
   */
  onCancel?: () => void;

  /**
   * Ctrl+Z - Undo
   */
  onUndo?: () => void;

  /**
   * Ctrl+Y ou Ctrl+Shift+Z - Redo
   */
  onRedo?: () => void;

  /**
   * Ctrl+D - Dupliquer
   */
  onDuplicate?: () => void;

  /**
   * Delete - Supprimer
   */
  onDelete?: () => void;

  /**
   * Ctrl+P - Imprimer/Prévisualiser
   */
  onPrint?: () => void;
}

export interface UseFormShortcutsOptions {
  /**
   * Activer les shortcuts
   * @default true
   */
  enabled?: boolean;

  /**
   * Afficher toast de confirmation
   * @default true
   */
  showToast?: boolean;

  /**
   * Préfixe pour les messages toast
   * @default ''
   */
  toastPrefix?: string;

  /**
   * Désactiver shortcuts par défaut du navigateur
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Logging pour debug
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook pour gérer les shortcuts clavier dans les formulaires
 *
 * @example
 * function MyForm() {
 *   const { register, handleSubmit } = useForm();
 *
 *   useFormShortcuts({
 *     onSave: () => {
 *       console.log('Sauvegarde...');
 *       // Logique de sauvegarde
 *     },
 *     onSubmit: handleSubmit(onSubmit),
 *     onCancel: () => setIsOpen(false),
 *     onUndo: () => history.back(),
 *     onRedo: () => history.forward()
 *   }, {
 *     showToast: true,
 *     toastPrefix: 'Formulaire:'
 *   });
 *
 *   return <form>...</form>;
 * }
 */
export function useFormShortcuts(
  handlers: FormShortcutsHandlers,
  options: UseFormShortcutsOptions = {}
) {
  const {
    enabled = true,
    showToast = true,
    toastPrefix = '',
    preventDefault = true,
    debug = false
  } = options;

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorer si dans input/textarea (sauf Esc)
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      // Ctrl+S - Sauvegarder
      if (e.ctrlKey && e.key === 's') {
        if (preventDefault) e.preventDefault();

        if (handlers.onSave) {
          if (debug) console.log('🔧 Shortcut: Ctrl+S (Save)');

          try {
            await handlers.onSave();
            if (showToast) {
              toast.success(`${toastPrefix} Sauvegardé`.trim());
            }
          } catch (error) {
            console.error('Error in onSave:', error);
            if (showToast) {
              toast.error(`${toastPrefix} Erreur de sauvegarde`.trim());
            }
          }
        }
        return;
      }

      // Ctrl+Enter - Valider
      if (e.ctrlKey && e.key === 'Enter') {
        if (preventDefault) e.preventDefault();

        if (handlers.onSubmit) {
          if (debug) console.log('🔧 Shortcut: Ctrl+Enter (Submit)');

          try {
            await handlers.onSubmit();
            if (showToast) {
              toast.success(`${toastPrefix} Validé`.trim());
            }
          } catch (error) {
            console.error('Error in onSubmit:', error);
            if (showToast) {
              toast.error(`${toastPrefix} Erreur de validation`.trim());
            }
          }
        }
        return;
      }

      // Esc - Annuler (fonctionne toujours, même dans input)
      if (e.key === 'Escape') {
        if (preventDefault) e.preventDefault();

        if (handlers.onCancel) {
          if (debug) console.log('🔧 Shortcut: Esc (Cancel)');
          handlers.onCancel();
          if (showToast) {
            toast('Annulé', { icon: '↩️' });
          }
        }
        return;
      }

      // Les shortcuts suivants ne fonctionnent pas dans les inputs
      if (isInput || isContentEditable) return;

      // Ctrl+Z - Undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        if (preventDefault) e.preventDefault();

        if (handlers.onUndo) {
          if (debug) console.log('🔧 Shortcut: Ctrl+Z (Undo)');
          handlers.onUndo();
          if (showToast) {
            toast('Annulation', { icon: '↩️' });
          }
        }
        return;
      }

      // Ctrl+Y ou Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        if (preventDefault) e.preventDefault();

        if (handlers.onRedo) {
          if (debug) console.log('🔧 Shortcut: Ctrl+Y (Redo)');
          handlers.onRedo();
          if (showToast) {
            toast('Rétablir', { icon: '↪️' });
          }
        }
        return;
      }

      // Ctrl+D - Dupliquer
      if (e.ctrlKey && e.key === 'd') {
        if (preventDefault) e.preventDefault();

        if (handlers.onDuplicate) {
          if (debug) console.log('🔧 Shortcut: Ctrl+D (Duplicate)');
          handlers.onDuplicate();
          if (showToast) {
            toast.success('Dupliqué');
          }
        }
        return;
      }

      // Delete - Supprimer
      if (e.key === 'Delete' && !isInput && !isContentEditable) {
        if (handlers.onDelete) {
          if (debug) console.log('🔧 Shortcut: Delete');
          // Note: pas de preventDefault ici pour permettre Delete dans inputs
          handlers.onDelete();
        }
        return;
      }

      // Ctrl+P - Imprimer
      if (e.ctrlKey && e.key === 'p') {
        if (preventDefault) e.preventDefault();

        if (handlers.onPrint) {
          if (debug) console.log('🔧 Shortcut: Ctrl+P (Print)');
          handlers.onPrint();
        }
        return;
      }
    },
    [enabled, handlers, showToast, toastPrefix, preventDefault, debug]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Hook simplifié pour shortcuts communs (Save + Cancel uniquement)
 *
 * @example
 * useFormShortcutsSimple({
 *   onSave: handleSave,
 *   onCancel: () => setIsOpen(false)
 * });
 */
export function useFormShortcutsSimple(handlers: {
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  return useFormShortcuts(handlers, {
    enabled: true,
    showToast: true
  });
}

/**
 * Constantes des shortcuts pour affichage dans UI
 */
export const SHORTCUTS = {
  SAVE: 'Ctrl+S',
  SUBMIT: 'Ctrl+Entrée',
  CANCEL: 'Échap',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  DUPLICATE: 'Ctrl+D',
  DELETE: 'Suppr',
  PRINT: 'Ctrl+P'
} as const;

/**
 * Composant helper pour afficher les shortcuts disponibles
 */
export function ShortcutsHelp({ shortcuts }: { shortcuts: (keyof typeof SHORTCUTS)[] }) {
  const { t } = useTranslation();

  const getShortcutLabel = (key: keyof typeof SHORTCUTS): string => {
    const labels: Record<keyof typeof SHORTCUTS, string> = {
      SAVE: t('shortcuts.save'),
      SUBMIT: t('shortcuts.submit'),
      CANCEL: t('shortcuts.cancel'),
      UNDO: t('shortcuts.undo'),
      REDO: t('shortcuts.redo'),
      DUPLICATE: t('shortcuts.duplicate'),
      DELETE: t('shortcuts.delete'),
      PRINT: t('shortcuts.print')
    };
    return labels[key];
  };

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p className="font-medium">{t('shortcuts.title')} :</p>
      <ul className="list-disc list-inside space-y-0.5">
        {shortcuts.map(key => (
          <li key={key}>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
              {SHORTCUTS[key]}
            </kbd>
            {' - '}
            {getShortcutLabel(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
