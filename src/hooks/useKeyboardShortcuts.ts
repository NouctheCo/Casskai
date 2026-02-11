/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * useKeyboardShortcuts - Hook pour gérer les raccourcis clavier globaux
 *
 * Features:
 * - Shortcuts configurables (Ctrl+K, Ctrl+S, Ctrl+Enter, etc.)
 * - Prévention des conflits avec shortcuts navigateur
 * - Support multi-plateforme (Cmd sur Mac, Ctrl sur Windows/Linux)
 * - Désactivation contextuelle (formulaires, modales)
 * - Chaînage de shortcuts (Ctrl+K → Enter)
 * - Debug mode pour développement
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * Modificateurs de clavier
 */
export interface KeyModifiers {
  ctrl?: boolean;   // Ctrl sur Windows/Linux, Cmd sur Mac
  alt?: boolean;    // Alt/Option
  shift?: boolean;  // Shift
  meta?: boolean;   // Cmd sur Mac (si différent de ctrl)
}

/**
 * Configuration d'un raccourci clavier
 */
export interface KeyboardShortcut {
  /**
   * Identifiant unique du raccourci
   */
  id: string;

  /**
   * Touche principale (ex: 'k', 's', 'Enter', 'Escape')
   */
  key: string;

  /**
   * Modificateurs (Ctrl, Alt, Shift)
   */
  modifiers?: KeyModifiers;

  /**
   * Description pour affichage utilisateur
   */
  description: string;

  /**
   * Callback exécuté quand le raccourci est déclenché
   */
  handler: (event: KeyboardEvent) => void;

  /**
   * Désactiver le raccourci
   */
  disabled?: boolean;

  /**
   * Empêcher le comportement par défaut du navigateur
   */
  preventDefault?: boolean;

  /**
   * Arrêter la propagation de l'événement
   */
  stopPropagation?: boolean;

  /**
   * Callback de condition (retourne false pour désactiver temporairement)
   */
  condition?: () => boolean;

  /**
   * Scope du raccourci (global, form, modal, etc.)
   */
  scope?: 'global' | 'form' | 'modal' | string;
}

/**
 * Options du hook
 */
export interface UseKeyboardShortcutsOptions {
  /**
   * Activer les shortcuts globalement
   */
  enabled?: boolean;

  /**
   * Scope actuel (global, form, modal)
   */
  scope?: string;

  /**
   * Mode debug (log dans console)
   */
  debug?: boolean;

  /**
   * Désactiver dans les inputs/textarea
   */
  disableInInputs?: boolean;
}

/**
 * Détection de la plateforme (Mac vs Windows/Linux)
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);

/**
 * Vérifier si un élément est un input/textarea/contenteditable
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = element.hasAttribute('contenteditable');

  return isInput || isContentEditable;
}

/**
 * Vérifier si les modificateurs correspondent
 */
function matchModifiers(event: KeyboardEvent, modifiers?: KeyModifiers): boolean {
  if (!modifiers) return !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;

  // Sur Mac, Cmd = metaKey, sur Windows/Linux, Ctrl = ctrlKey
  const ctrlPressed = isMac ? event.metaKey : event.ctrlKey;
  const altPressed = event.altKey;
  const shiftPressed = event.shiftKey;
  const metaPressed = event.metaKey;

  const ctrlMatch = modifiers.ctrl !== undefined ? modifiers.ctrl === ctrlPressed : true;
  const altMatch = modifiers.alt !== undefined ? modifiers.alt === altPressed : !altPressed;
  const shiftMatch = modifiers.shift !== undefined ? modifiers.shift === shiftPressed : !shiftPressed;
  const metaMatch = modifiers.meta !== undefined ? modifiers.meta === metaPressed : true;

  return ctrlMatch && altMatch && shiftMatch && metaMatch;
}

/**
 * Normaliser la clé pressée
 */
function normalizeKey(key: string): string {
  // Normaliser les cas spéciaux
  const keyMap: Record<string, string> = {
    'Esc': 'Escape',
    'Return': 'Enter',
    'Del': 'Delete',
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight',
  };

  return keyMap[key] || key;
}

/**
 * Hook useKeyboardShortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): {
  /**
   * Raccourcis actuellement enregistrés
   */
  registeredShortcuts: KeyboardShortcut[];

  /**
   * Activer/désactiver temporairement tous les shortcuts
   */
  setEnabled: (enabled: boolean) => void;

  /**
   * Obtenir la représentation textuelle d'un shortcut (ex: "Ctrl+K")
   */
  getShortcutLabel: (shortcut: KeyboardShortcut) => string;
} {
  const {
    enabled = true,
    scope = 'global',
    debug = false,
    disableInInputs = true,
  } = options;

  const enabledRef = useRef(enabled);
  const shortcutsRef = useRef(shortcuts);

  // Synchroniser les refs
  useEffect(() => {
    enabledRef.current = enabled;
    shortcutsRef.current = shortcuts;
  }, [enabled, shortcuts]);

  /**
   * Handler global des événements clavier
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Vérifier si les shortcuts sont activés
      if (!enabledRef.current) {
        if (debug) logger.debug('useKeyboardShortcuts', 'Shortcuts disabled globally');
        return;
      }

      // Désactiver dans les inputs/textarea si option activée
      if (disableInInputs && isInputElement(event.target as Element)) {
        if (debug) logger.debug('useKeyboardShortcuts', 'Ignoring shortcut in input element');
        return;
      }

      const pressedKey = normalizeKey(event.key);

      // Parcourir tous les shortcuts enregistrés
      for (const shortcut of shortcutsRef.current) {
        // Vérifier si le shortcut est désactivé
        if (shortcut.disabled) continue;

        // Vérifier le scope
        if (shortcut.scope && shortcut.scope !== scope) continue;

        // Vérifier la condition personnalisée
        if (shortcut.condition && !shortcut.condition()) continue;

        // Vérifier la correspondance clé + modificateurs
        if (pressedKey === shortcut.key && matchModifiers(event, shortcut.modifiers)) {
          if (debug) {
            logger.debug('useKeyboardShortcuts', 'Shortcut matched:', {
              id: shortcut.id,
              key: pressedKey,
              modifiers: shortcut.modifiers,
            });
          }

          // Empêcher le comportement par défaut si demandé
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          // Arrêter la propagation si demandé
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }

          // Exécuter le handler
          try {
            shortcut.handler(event);
          } catch (error) {
            logger.error('useKeyboardShortcuts', 'Error executing shortcut handler:', error);
          }

          // Arrêter après le premier match
          break;
        }
      }
    },
    [scope, debug, disableInInputs]
  );

  /**
   * Enregistrer/désenregistrer les event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    if (debug) {
      logger.debug('useKeyboardShortcuts', 'Registered shortcuts:', {
        count: shortcuts.length,
        scope,
        shortcuts: shortcuts.map((s) => ({ id: s.id, key: s.key, modifiers: s.modifiers })),
      });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (debug) logger.debug('useKeyboardShortcuts', 'Unregistered shortcuts');
    };
  }, [handleKeyDown, enabled, debug, shortcuts, scope]);

  /**
   * Activer/désactiver temporairement
   */
  const setEnabled = useCallback((newEnabled: boolean) => {
    enabledRef.current = newEnabled;
  }, []);

  /**
   * Obtenir le label d'un shortcut (ex: "Ctrl+K")
   */
  const getShortcutLabel = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];

    if (shortcut.modifiers?.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.modifiers?.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.modifiers?.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.modifiers?.meta && !isMac) {
      parts.push('Meta');
    }

    // Ajouter la clé principale
    let keyLabel = shortcut.key;
    if (keyLabel === 'Enter') keyLabel = '↵';
    else if (keyLabel === 'Escape') keyLabel = 'Esc';
    else if (keyLabel === 'ArrowUp') keyLabel = '↑';
    else if (keyLabel === 'ArrowDown') keyLabel = '↓';
    else if (keyLabel === 'ArrowLeft') keyLabel = '←';
    else if (keyLabel === 'ArrowRight') keyLabel = '→';
    else if (keyLabel.length === 1) keyLabel = keyLabel.toUpperCase();

    parts.push(keyLabel);

    return parts.join('+');
  }, []);

  return {
    registeredShortcuts: shortcuts,
    setEnabled,
    getShortcutLabel,
  };
}

/**
 * Hook simplifié pour un seul raccourci
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  modifiers?: KeyModifiers,
  options?: UseKeyboardShortcutsOptions
): void {
  const shortcut: KeyboardShortcut = {
    id: `shortcut-${key}`,
    key,
    modifiers,
    description: '',
    handler,
  };

  useKeyboardShortcuts([shortcut], options);
}

/**
 * Raccourcis clavier prédéfinis
 */
export const COMMON_SHORTCUTS = {
  SAVE: {
    id: 'save',
    key: 's',
    modifiers: { ctrl: true },
    description: 'Sauvegarder',
    preventDefault: true,
  },
  SUBMIT: {
    id: 'submit',
    key: 'Enter',
    modifiers: { ctrl: true },
    description: 'Soumettre le formulaire',
    preventDefault: true,
  },
  CANCEL: {
    id: 'cancel',
    key: 'Escape',
    description: 'Annuler / Fermer',
    preventDefault: true,
  },
  COMMAND_PALETTE: {
    id: 'command-palette',
    key: 'k',
    modifiers: { ctrl: true },
    description: 'Ouvrir la palette de commandes',
    preventDefault: true,
  },
  UNDO: {
    id: 'undo',
    key: 'z',
    modifiers: { ctrl: true },
    description: 'Annuler',
    preventDefault: true,
  },
  REDO: {
    id: 'redo',
    key: 'y',
    modifiers: { ctrl: true },
    description: 'Refaire',
    preventDefault: true,
  },
  REDO_ALT: {
    id: 'redo-alt',
    key: 'z',
    modifiers: { ctrl: true, shift: true },
    description: 'Refaire (alternatif)',
    preventDefault: true,
  },
  SEARCH: {
    id: 'search',
    key: 'f',
    modifiers: { ctrl: true },
    description: 'Rechercher',
    preventDefault: true,
  },
  NEW: {
    id: 'new',
    key: 'n',
    modifiers: { ctrl: true },
    description: 'Nouveau',
    preventDefault: true,
  },
  HELP: {
    id: 'help',
    key: '?',
    modifiers: { shift: true },
    description: 'Aide',
    preventDefault: true,
  },
} as const;

/**
 * Export par défaut
 */
export default useKeyboardShortcuts;
