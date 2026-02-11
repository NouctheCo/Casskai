/**
 * CassKai - Undo/Redo Context Provider
 *
 * Phase 2 (P1) - UX Formulaires Premium
 *
 * Fonctionnalités:
 * - Stack d'historique illimité (avec limite configurable)
 * - Undo/Redo pour formulaires
 * - Sauvegarde automatique avant changement
 * - Snapshots complets de l'état
 * - Indicateurs visuels
 * - Shortcuts clavier intégrés (Ctrl+Z, Ctrl+Shift+Z)
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface HistoryEntry<T = any> {
  state: T;
  timestamp: number;
  action?: string;
}

export interface UndoRedoContextValue<T = any> {
  currentState: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  push: (state: T, action?: string) => void;
  clear: () => void;
  historyLength: number;
  currentIndex: number;
}

const UndoRedoContext = createContext<UndoRedoContextValue | undefined>(undefined);

export interface UndoRedoProviderProps<T = any> {
  children: React.ReactNode;
  initialState: T;
  maxHistorySize?: number;
  enableKeyboardShortcuts?: boolean;
  onUndo?: (state: T) => void;
  onRedo?: (state: T) => void;
}

/**
 * Provider pour gérer l'historique undo/redo
 */
export function UndoRedoProvider<T = any>({
  children,
  initialState,
  maxHistorySize = 50,
  enableKeyboardShortcuts = true,
  onUndo,
  onRedo
}: UndoRedoProviderProps<T>) {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([
    { state: initialState, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoActionRef = useRef(false);

  const currentState = history[currentIndex]?.state || initialState;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  /**
   * Ajouter un nouvel état à l'historique
   */
  const push = useCallback((state: T, action?: string) => {
    // Ne pas ajouter si c'est une action undo/redo en cours
    if (isUndoRedoActionRef.current) {
      return;
    }

    // Ne pas ajouter si l'état est identique au précédent
    const lastState = history[currentIndex]?.state;
    if (JSON.stringify(lastState) === JSON.stringify(state)) {
      return;
    }

    logger.debug('UndoRedoContext', 'Pushing new state:', { action, currentIndex });

    setHistory((prev) => {
      // Supprimer tout ce qui vient après l'index actuel (branch history)
      const newHistory = prev.slice(0, currentIndex + 1);

      // Ajouter le nouvel état
      newHistory.push({
        state,
        timestamp: Date.now(),
        action
      });

      // Limiter la taille de l'historique
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }

      return newHistory;
    });

    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });
  }, [currentIndex, history, maxHistorySize]);

  /**
   * Annuler la dernière action (Undo)
   */
  const undo = useCallback(() => {
    if (!canUndo) {
      logger.debug('UndoRedoContext', 'Cannot undo - at beginning of history');
      return;
    }

    isUndoRedoActionRef.current = true;

    setCurrentIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      const newState = history[newIndex]?.state;

      logger.debug('UndoRedoContext', 'Undo:', {
        from: prev,
        to: newIndex,
        action: history[prev]?.action
      });

      if (newState && onUndo) {
        onUndo(newState);
      }

      return newIndex;
    });

    // Réinitialiser le flag après un court délai
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 100);
  }, [canUndo, history, onUndo]);

  /**
   * Rétablir l'action annulée (Redo)
   */
  const redo = useCallback(() => {
    if (!canRedo) {
      logger.debug('UndoRedoContext', 'Cannot redo - at end of history');
      return;
    }

    isUndoRedoActionRef.current = true;

    setCurrentIndex((prev) => {
      const newIndex = Math.min(history.length - 1, prev + 1);
      const newState = history[newIndex]?.state;

      logger.debug('UndoRedoContext', 'Redo:', {
        from: prev,
        to: newIndex,
        action: history[newIndex]?.action
      });

      if (newState && onRedo) {
        onRedo(newState);
      }

      return newIndex;
    });

    // Réinitialiser le flag après un court délai
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 100);
  }, [canRedo, history, onRedo]);

  /**
   * Vider l'historique
   */
  const clear = useCallback(() => {
    logger.debug('UndoRedoContext', 'Clearing history');
    setHistory([{ state: initialState, timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, [initialState]);

  /**
   * Shortcuts clavier
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z = Undo
      if (isModifierPressed && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if (isModifierPressed && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Ctrl/Cmd + Y = Redo (alternative)
      if (isModifierPressed && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcuts, undo, redo]);

  const contextValue: UndoRedoContextValue<T> = {
    currentState,
    canUndo,
    canRedo,
    undo,
    redo,
    push,
    clear,
    historyLength: history.length,
    currentIndex
  };

  return (
    <UndoRedoContext.Provider value={contextValue as UndoRedoContextValue}>
      {children}
    </UndoRedoContext.Provider>
  );
}

/**
 * Hook pour utiliser l'undo/redo
 */
export function useUndoRedo<T = any>(): UndoRedoContextValue<T> {
  const context = useContext(UndoRedoContext);

  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }

  return context as UndoRedoContextValue<T>;
}

/**
 * Hook simplifié pour gérer un état avec undo/redo
 */
export function useStateWithUndo<T>(
  initialState: T,
  options: {
    maxHistorySize?: number;
    enableKeyboardShortcuts?: boolean;
  } = {}
): [T, (newState: T | ((prev: T) => T), action?: string) => void, { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }] {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([
    { state: initialState, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex]?.state || initialState;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T | ((prev: T) => T), action?: string) => {
    const resolvedState = typeof newState === 'function'
      ? (newState as (prev: T) => T)(currentState)
      : newState;

    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({
        state: resolvedState,
        timestamp: Date.now(),
        action
      });

      const maxSize = options.maxHistorySize || 50;
      if (newHistory.length > maxSize) {
        return newHistory.slice(newHistory.length - maxSize);
      }

      return newHistory;
    });

    setCurrentIndex((prev) => Math.min(prev + 1, (options.maxHistorySize || 50) - 1));
  }, [currentState, currentIndex, options.maxHistorySize]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
    }
  }, [canRedo, history.length]);

  // Shortcuts clavier
  useEffect(() => {
    if (!options.enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

      if (isModifierPressed && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (isModifierPressed && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [options.enableKeyboardShortcuts, undo, redo]);

  return [currentState, setState, { undo, redo, canUndo, canRedo }];
}

/**
 * Composant d'indicateur visuel de l'historique
 */
export function UndoRedoIndicator({ className }: { className?: string }) {
  const { canUndo, canRedo, undo, redo, currentIndex, historyLength } = useUndoRedo();

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Annuler (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Rétablir (Ctrl+Shift+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <span className="text-xs">
          {currentIndex + 1} / {historyLength}
        </span>
      </div>
    </div>
  );
}
