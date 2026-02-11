/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * KeyboardShortcutsContext - Contexte global pour raccourcis clavier
 *
 * Provides:
 * - Raccourcis globaux actifs dans toute l'application
 * - Command Palette (Ctrl+K)
 * - Sauvegarde rapide (Ctrl+S)
 * - Soumission formulaire (Ctrl+Enter)
 * - Fermeture modale (Esc)
 * - État centralisé des shortcuts
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useKeyboardShortcuts, type KeyboardShortcut, COMMON_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { logger } from '@/lib/logger';

/**
 * État du contexte
 */
interface KeyboardShortcutsContextValue {
  /**
   * Raccourcis actuellement enregistrés
   */
  shortcuts: KeyboardShortcut[];

  /**
   * Enregistrer un nouveau raccourci
   */
  registerShortcut: (shortcut: KeyboardShortcut) => void;

  /**
   * Désenregistrer un raccourci
   */
  unregisterShortcut: (id: string) => void;

  /**
   * Activer/désactiver tous les shortcuts
   */
  setEnabled: (enabled: boolean) => void;

  /**
   * Activer/désactiver un shortcut spécifique
   */
  setShortcutEnabled: (id: string, enabled: boolean) => void;

  /**
   * Obtenir le label d'un shortcut
   */
  getShortcutLabel: (shortcut: KeyboardShortcut) => string;

  /**
   * Command Palette ouverte
   */
  isCommandPaletteOpen: boolean;

  /**
   * Ouvrir/fermer Command Palette
   */
  setCommandPaletteOpen: (open: boolean) => void;

  /**
   * Handler de sauvegarde actif
   */
  saveHandler: (() => void) | null;

  /**
   * Enregistrer le handler de sauvegarde
   */
  setSaveHandler: (handler: (() => void) | null) => void;

  /**
   * Handler de soumission actif
   */
  submitHandler: (() => void) | null;

  /**
   * Enregistrer le handler de soumission
   */
  setSubmitHandler: (handler: (() => void) | null) => void;

  /**
   * Handler de fermeture actif (modale/dialog)
   */
  closeHandler: (() => void) | null;

  /**
   * Enregistrer le handler de fermeture
   */
  setCloseHandler: (handler: (() => void) | null) => void;
}

/**
 * Contexte
 */
const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  /**
   * Activer les shortcuts globalement
   */
  enabled?: boolean;
  /**
   * Mode debug
   */
  debug?: boolean;
}

/**
 * Provider
 */
export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children,
  enabled = true,
  debug = false,
}) => {
  // État local
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => void) | null>(null);
  const [submitHandler, setSubmitHandler] = useState<(() => void) | null>(null);
  const [closeHandler, setCloseHandler] = useState<(() => void) | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(enabled);

  /**
   * Raccourcis globaux par défaut
   */
  const defaultShortcuts: KeyboardShortcut[] = [
    // Command Palette (Ctrl+K)
    {
      ...COMMON_SHORTCUTS.COMMAND_PALETTE,
      handler: () => {
        if (debug) logger.debug('KeyboardShortcuts', 'Command Palette triggered');
        setIsCommandPaletteOpen((prev) => !prev);
      },
    },

    // Sauvegarde rapide (Ctrl+S)
    {
      ...COMMON_SHORTCUTS.SAVE,
      handler: (event) => {
        if (saveHandler) {
          if (debug) logger.debug('KeyboardShortcuts', 'Save triggered');
          event.preventDefault();
          saveHandler();
        }
      },
      condition: () => saveHandler !== null,
    },

    // Soumission formulaire (Ctrl+Enter)
    {
      ...COMMON_SHORTCUTS.SUBMIT,
      handler: (event) => {
        if (submitHandler) {
          if (debug) logger.debug('KeyboardShortcuts', 'Submit triggered');
          event.preventDefault();
          submitHandler();
        }
      },
      condition: () => submitHandler !== null,
    },

    // Fermeture modale (Esc)
    {
      ...COMMON_SHORTCUTS.CANCEL,
      handler: (event) => {
        // Fermer Command Palette en priorité
        if (isCommandPaletteOpen) {
          if (debug) logger.debug('KeyboardShortcuts', 'Close Command Palette');
          setIsCommandPaletteOpen(false);
          event.preventDefault();
          return;
        }

        // Puis fermer modale/dialog
        if (closeHandler) {
          if (debug) logger.debug('KeyboardShortcuts', 'Close dialog triggered');
          event.preventDefault();
          closeHandler();
        }
      },
      condition: () => isCommandPaletteOpen || closeHandler !== null,
    },

    // Aide (Shift+?)
    {
      ...COMMON_SHORTCUTS.HELP,
      handler: () => {
        if (debug) logger.debug('KeyboardShortcuts', 'Help triggered');
        // TODO: Ouvrir modal d'aide avec liste des shortcuts
        console.log('Aide - Raccourcis clavier disponibles');
      },
    },
  ];

  /**
   * Combiner raccourcis par défaut + personnalisés
   */
  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  /**
   * Enregistrer le hook global
   */
  const { setEnabled, getShortcutLabel } = useKeyboardShortcuts(allShortcuts, {
    enabled: globalEnabled,
    scope: 'global',
    debug,
    disableInInputs: true,
  });

  /**
   * Enregistrer un nouveau raccourci
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Éviter les doublons
      const exists = prev.some((s) => s.id === shortcut.id);
      if (exists) {
        logger.warn('KeyboardShortcuts', `Shortcut ${shortcut.id} already registered`);
        return prev;
      }
      if (debug) logger.debug('KeyboardShortcuts', `Registered shortcut: ${shortcut.id}`);
      return [...prev, shortcut];
    });
  }, [debug]);

  /**
   * Désenregistrer un raccourci
   */
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (debug && filtered.length < prev.length) {
        logger.debug('KeyboardShortcuts', `Unregistered shortcut: ${id}`);
      }
      return filtered;
    });
  }, [debug]);

  /**
   * Activer/désactiver globalement
   */
  const setEnabledWrapper = useCallback((newEnabled: boolean) => {
    setGlobalEnabled(newEnabled);
    setEnabled(newEnabled);
    if (debug) logger.debug('KeyboardShortcuts', `Global shortcuts ${newEnabled ? 'enabled' : 'disabled'}`);
  }, [setEnabled, debug]);

  /**
   * Activer/désactiver un shortcut spécifique
   */
  const setShortcutEnabled = useCallback((id: string, isEnabled: boolean) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, disabled: !isEnabled } : s))
    );
    if (debug) {
      logger.debug('KeyboardShortcuts', `Shortcut ${id} ${isEnabled ? 'enabled' : 'disabled'}`);
    }
  }, [debug]);

  /**
   * Setter pour Command Palette
   */
  const setCommandPaletteOpenWrapper = useCallback((open: boolean) => {
    setIsCommandPaletteOpen(open);
    if (debug) logger.debug('KeyboardShortcuts', `Command Palette ${open ? 'opened' : 'closed'}`);
  }, [debug]);

  /**
   * Setter pour save handler
   */
  const setSaveHandlerWrapper = useCallback((handler: (() => void) | null) => {
    setSaveHandler(() => handler);
    if (debug) {
      logger.debug('KeyboardShortcuts', `Save handler ${handler ? 'registered' : 'unregistered'}`);
    }
  }, [debug]);

  /**
   * Setter pour submit handler
   */
  const setSubmitHandlerWrapper = useCallback((handler: (() => void) | null) => {
    setSubmitHandler(() => handler);
    if (debug) {
      logger.debug('KeyboardShortcuts', `Submit handler ${handler ? 'registered' : 'unregistered'}`);
    }
  }, [debug]);

  /**
   * Setter pour close handler
   */
  const setCloseHandlerWrapper = useCallback((handler: (() => void) | null) => {
    setCloseHandler(() => handler);
    if (debug) {
      logger.debug('KeyboardShortcuts', `Close handler ${handler ? 'registered' : 'unregistered'}`);
    }
  }, [debug]);

  const value: KeyboardShortcutsContextValue = {
    shortcuts: allShortcuts,
    registerShortcut,
    unregisterShortcut,
    setEnabled: setEnabledWrapper,
    setShortcutEnabled,
    getShortcutLabel,
    isCommandPaletteOpen,
    setCommandPaletteOpen: setCommandPaletteOpenWrapper,
    saveHandler,
    setSaveHandler: setSaveHandlerWrapper,
    submitHandler,
    setSubmitHandler: setSubmitHandlerWrapper,
    closeHandler,
    setCloseHandler: setCloseHandlerWrapper,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte
 */
export function useKeyboardShortcutsContext(): KeyboardShortcutsContextValue {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
}

/**
 * Hook pour enregistrer un handler de sauvegarde (Ctrl+S)
 */
export function useSaveShortcut(handler: () => void): void {
  const { setSaveHandler } = useKeyboardShortcutsContext();

  React.useEffect(() => {
    setSaveHandler(handler);
    return () => setSaveHandler(null);
  }, [handler, setSaveHandler]);
}

/**
 * Hook pour enregistrer un handler de soumission (Ctrl+Enter)
 */
export function useSubmitShortcut(handler: () => void): void {
  const { setSubmitHandler } = useKeyboardShortcutsContext();

  React.useEffect(() => {
    setSubmitHandler(handler);
    return () => setSubmitHandler(null);
  }, [handler, setSubmitHandler]);
}

/**
 * Hook pour enregistrer un handler de fermeture (Esc)
 */
export function useCloseShortcut(handler: () => void): void {
  const { setCloseHandler } = useKeyboardShortcutsContext();

  React.useEffect(() => {
    setCloseHandler(handler);
    return () => setCloseHandler(null);
  }, [handler, setCloseHandler]);
}

/**
 * Export par défaut
 */
export default KeyboardShortcutsProvider;
