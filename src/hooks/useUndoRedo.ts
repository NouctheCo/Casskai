/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * useUndoRedo - Hook React pour Undo/Redo
 *
 * Features:
 * - Accès au service Undo/Redo
 * - État réactif (re-render automatique)
 * - Helpers pour actions courantes
 * - Integration Ctrl+Z / Ctrl+Y
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUndoRedoService,
  type ActionState,
  type ActionType,
  type UndoRedoConfig,
} from '@/services/undoRedoService';
import { logger } from '@/lib/logger';

/**
 * Return type du hook
 */
export interface UseUndoRedoReturn {
  /**
   * Stack undo (actions passées)
   */
  undoStack: ActionState[];

  /**
   * Stack redo (actions annulées)
   */
  redoStack: ActionState[];

  /**
   * Index actuel
   */
  currentIndex: number;

  /**
   * Peut annuler (undo)
   */
  canUndo: boolean;

  /**
   * Peut refaire (redo)
   */
  canRedo: boolean;

  /**
   * Annuler dernière action
   */
  undo: () => Promise<ActionState | null>;

  /**
   * Refaire action annulée
   */
  redo: () => Promise<ActionState | null>;

  /**
   * Enregistrer une nouvelle action
   */
  pushAction: (action: Omit<ActionState, 'id' | 'timestamp'>) => void;

  /**
   * Nettoyer tout l'historique
   */
  clear: () => void;

  /**
   * Supprimer une action spécifique
   */
  removeAction: (actionId: string) => boolean;

  /**
   * Obtenir l'historique complet
   */
  getHistory: () => ActionState[];
}

/**
 * Options du hook
 */
export interface UseUndoRedoOptions extends UndoRedoConfig {
  /**
   * Activer les raccourcis clavier (Ctrl+Z, Ctrl+Y)
   */
  enableKeyboardShortcuts?: boolean;

  /**
   * Callback après undo
   */
  onUndo?: (action: ActionState) => void | Promise<void>;

  /**
   * Callback après redo
   */
  onRedo?: (action: ActionState) => void | Promise<void>;

  /**
   * Callback après nouvelle action
   */
  onPush?: (action: ActionState) => void;
}

/**
 * Hook useUndoRedo
 */
export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const {
    enableKeyboardShortcuts = false, // Désactivé par défaut (géré par KeyboardShortcutsContext)
    onUndo,
    onRedo,
    onPush,
    ...serviceConfig
  } = options;

  // Obtenir le service singleton
  const service = getUndoRedoService(serviceConfig);

  // État local (synchronisé avec le service)
  const [state, setState] = useState(() => service.getState());

  /**
   * S'abonner aux changements du service
   */
  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [service]);

  /**
   * Undo avec callback
   */
  const undo = useCallback(async () => {
    const action = await service.undo();
    if (action && onUndo) {
      try {
        await onUndo(action);
      } catch (error) {
        logger.error('useUndoRedo', 'onUndo callback error:', error);
      }
    }
    return action;
  }, [service, onUndo]);

  /**
   * Redo avec callback
   */
  const redo = useCallback(async () => {
    const action = await service.redo();
    if (action && onRedo) {
      try {
        await onRedo(action);
      } catch (error) {
        logger.error('useUndoRedo', 'onRedo callback error:', error);
      }
    }
    return action;
  }, [service, onRedo]);

  /**
   * Push action avec callback
   */
  const pushAction = useCallback(
    (action: Omit<ActionState, 'id' | 'timestamp'>) => {
      service.pushAction(action);
      if (onPush) {
        try {
          // Récupérer l'action complète (avec id et timestamp)
          const fullAction = service.getHistory()[service.getHistory().length - 1];
          onPush(fullAction);
        } catch (error) {
          logger.error('useUndoRedo', 'onPush callback error:', error);
        }
      }
    },
    [service, onPush]
  );

  /**
   * Clear
   */
  const clear = useCallback(() => {
    service.clear();
  }, [service]);

  /**
   * Remove action
   */
  const removeAction = useCallback(
    (actionId: string) => {
      return service.removeAction(actionId);
    },
    [service]
  );

  /**
   * Get history
   */
  const getHistory = useCallback(() => {
    return service.getHistory();
  }, [service]);

  /**
   * Raccourcis clavier (Ctrl+Z, Ctrl+Y)
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;

      // Ctrl+Z : Undo
      if (isCtrl && event.key === 'z' && !event.shiftKey) {
        if (service.canUndo()) {
          event.preventDefault();
          undo();
        }
      }

      // Ctrl+Y ou Ctrl+Shift+Z : Redo
      if (
        (isCtrl && event.key === 'y') ||
        (isCtrl && event.shiftKey && event.key === 'z')
      ) {
        if (service.canRedo()) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcuts, service, undo, redo]);

  return {
    undoStack: state.undoStack,
    redoStack: state.redoStack,
    currentIndex: state.currentIndex,
    canUndo: service.canUndo(),
    canRedo: service.canRedo(),
    undo,
    redo,
    pushAction,
    clear,
    removeAction,
    getHistory,
  };
}

/**
 * Hook helper pour enregistrer facilement une action
 */
export function useRecordAction(
  type: ActionType,
  companyId?: string
): (description: string, previousState: any, nextState: any, metadata?: Record<string, any>) => void {
  const { pushAction } = useUndoRedo();

  return useCallback(
    (description: string, previousState: any, nextState: any, metadata?: Record<string, any>) => {
      pushAction({
        type,
        description,
        previousState,
        nextState,
        companyId,
        metadata,
      });
    },
    [pushAction, type, companyId]
  );
}

/**
 * Export par défaut
 */
export default useUndoRedo;
