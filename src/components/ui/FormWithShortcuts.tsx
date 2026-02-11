/**
 * CassKai - Form with Keyboard Shortcuts
 *
 * Phase 2 (P1) - UX Formulaires Premium
 *
 * Fonctionnalités:
 * - Ctrl+S / Cmd+S : Sauvegarder
 * - Ctrl+Enter / Cmd+Enter : Submit
 * - Esc : Annuler/Fermer
 * - Ctrl+Z / Cmd+Z : Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z : Redo
 * - Tab : Navigation intelligente entre champs
 * - Aide contextuelle (Ctrl+/)
 * - Indicateur visuel des shortcuts disponibles
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Save,
  X,
  Undo2,
  Redo2,
  Keyboard,
  Info,
  Command as CommandIcon
} from 'lucide-react';

export interface FormShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export interface FormWithShortcutsProps {
  children: React.ReactNode;
  onSave?: () => void | Promise<void>;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  customShortcuts?: FormShortcut[];
  showShortcutsHint?: boolean;
  showShortcutsHelp?: boolean;
  disabled?: boolean;
  className?: string;
  preventDefaultSubmit?: boolean;
}

/**
 * Détection du système d'exploitation
 */
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'Cmd' : 'Ctrl';

export default function FormWithShortcuts({
  children,
  onSave,
  onSubmit,
  onCancel,
  onUndo,
  onRedo,
  customShortcuts = [],
  showShortcutsHint = true,
  showShortcutsHelp = false,
  disabled = false,
  className,
  preventDefaultSubmit = true
}: FormWithShortcutsProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showHelp, setShowHelp] = useState(showShortcutsHelp);
  const [lastAction, setLastAction] = useState<string | null>(null);

  /**
   * Shortcuts standards
   */
  const standardShortcuts: FormShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: `${modifierKey}+S pour sauvegarder`,
      action: async () => {
        if (onSave && !disabled) {
          setLastAction('save');
          await onSave();
          setTimeout(() => setLastAction(null), 2000);
        }
      },
      disabled: !onSave || disabled
    },
    {
      key: 'Enter',
      ctrl: true,
      description: `${modifierKey}+Enter pour valider`,
      action: async () => {
        if (onSubmit && !disabled) {
          setLastAction('submit');
          await onSubmit();
          setTimeout(() => setLastAction(null), 2000);
        }
      },
      disabled: !onSubmit || disabled
    },
    {
      key: 'Escape',
      description: 'Esc pour annuler',
      action: () => {
        if (onCancel && !disabled) {
          setLastAction('cancel');
          onCancel();
          setTimeout(() => setLastAction(null), 2000);
        }
      },
      disabled: !onCancel || disabled
    },
    {
      key: 'z',
      ctrl: true,
      description: `${modifierKey}+Z pour annuler la dernière action`,
      action: () => {
        if (onUndo && !disabled) {
          setLastAction('undo');
          onUndo();
          setTimeout(() => setLastAction(null), 2000);
        }
      },
      disabled: !onUndo || disabled
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: `${modifierKey}+Shift+Z pour rétablir`,
      action: () => {
        if (onRedo && !disabled) {
          setLastAction('redo');
          onRedo();
          setTimeout(() => setLastAction(null), 2000);
        }
      },
      disabled: !onRedo || disabled
    },
    {
      key: '/',
      ctrl: true,
      description: `${modifierKey}+/ pour afficher l'aide`,
      action: () => {
        setShowHelp((prev) => !prev);
      },
      disabled: false
    }
  ];

  const allShortcuts = [...standardShortcuts, ...customShortcuts];

  /**
   * Gestionnaire de raccourcis clavier
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorer si focus sur input/textarea (sauf pour les shortcuts globaux)
      const target = e.target as HTMLElement;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      for (const shortcut of allShortcuts) {
        if (shortcut.disabled) continue;

        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? (isMac ? e.metaKey : e.ctrlKey) : true;
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatches = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          // Empêcher le comportement par défaut
          e.preventDefault();
          e.stopPropagation();

          // Ne pas exécuter si focus sur input et que ce n'est pas un shortcut global
          if (isInputField && !shortcut.ctrl && shortcut.key !== 'Escape') {
            continue;
          }

          logger.debug('FormWithShortcuts', 'Shortcut triggered:', shortcut.description);
          shortcut.action();
          break;
        }
      }
    },
    [allShortcuts]
  );

  /**
   * Empêcher le submit par défaut si demandé
   */
  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (preventDefaultSubmit) {
        e.preventDefault();
        if (onSubmit && !disabled) {
          onSubmit();
        }
      }
    },
    [preventDefaultSubmit, onSubmit, disabled]
  );

  /**
   * Attacher les event listeners
   */
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Écouter au niveau du formulaire pour capturer tous les événements
    form.addEventListener('keydown', handleKeyDown as any);

    return () => {
      form.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleKeyDown]);

  /**
   * Icône selon l'action
   */
  const ActionIcon = () => {
    switch (lastAction) {
      case 'save':
        return <Save className="w-4 h-4 text-green-500" />;
      case 'submit':
        return <Save className="w-4 h-4 text-blue-500" />;
      case 'cancel':
        return <X className="w-4 h-4 text-red-500" />;
      case 'undo':
        return <Undo2 className="w-4 h-4 text-orange-500" />;
      case 'redo':
        return <Redo2 className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const actionLabels: Record<string, string> = {
    save: 'Sauvegarde...',
    submit: 'Validation...',
    cancel: 'Annulation',
    undo: 'Annulation',
    redo: 'Rétablissement'
  };

  return (
    <div className={cn('relative', className)}>
      <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
        {children}

        {/* Indicateur d'action */}
        {lastAction && (
          <div className="fixed bottom-4 right-4 z-50">
            <Alert className="bg-white dark:bg-gray-800 shadow-lg border-2">
              <ActionIcon />
              <AlertDescription className="ml-2 font-medium">
                {actionLabels[lastAction]}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Hint des shortcuts disponibles */}
        {showShortcutsHint && !showHelp && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Raccourcis disponibles
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <Info className="w-4 h-4 mr-1" />
              Aide
            </Button>
          </div>
        )}

        {/* Aide complète des shortcuts */}
        {showHelp && (
          <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <CommandIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-800 dark:text-blue-200">
                  Raccourcis clavier
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                {allShortcuts
                  .filter((s) => !s.disabled)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <Badge variant="outline" className="font-mono">
                        {shortcut.ctrl && `${modifierKey}+`}
                        {shortcut.shift && 'Shift+'}
                        {shortcut.alt && 'Alt+'}
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}

/**
 * Hook pour utiliser les shortcuts en dehors d'un formulaire
 */
export function useKeyboardShortcuts(shortcuts: FormShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? (isMac ? e.metaKey : e.ctrlKey) : true;
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatches = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}
