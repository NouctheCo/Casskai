/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * UndoRedoService - Gestion Undo/Redo pour écritures comptables
 *
 * Features:
 * - Stack d'historique (max 50 actions)
 * - Undo (Ctrl+Z) : Annuler dernière action
 * - Redo (Ctrl+Y, Ctrl+Shift+Z) : Refaire action annulée
 * - Persistance localStorage
 * - Multi-onglets sync (BroadcastChannel)
 * - Timeline visuelle
 * - Support écritures comptables, factures, clients, etc.
 */

import { logger } from '@/lib/logger';

/**
 * Type d'action supportée
 */
export type ActionType =
  | 'create_journal_entry'
  | 'update_journal_entry'
  | 'delete_journal_entry'
  | 'create_invoice'
  | 'update_invoice'
  | 'delete_invoice'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'create_payment'
  | 'update_payment'
  | 'delete_payment'
  | 'custom';

/**
 * État d'une action (pour undo/redo)
 */
export interface ActionState {
  /**
   * ID unique de l'action
   */
  id: string;

  /**
   * Type d'action
   */
  type: ActionType;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Description humaine
   */
  description: string;

  /**
   * Données avant modification (pour undo)
   */
  previousState: any;

  /**
   * Données après modification (pour redo)
   */
  nextState: any;

  /**
   * ID de l'entreprise (multi-tenant)
   */
  companyId?: string;

  /**
   * Métadonnées optionnelles
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration du service
 */
export interface UndoRedoConfig {
  /**
   * Taille max de la stack (défaut: 50)
   */
  maxStackSize?: number;

  /**
   * Activer persistance localStorage (défaut: true)
   */
  enableLocalStorage?: boolean;

  /**
   * Clé localStorage (défaut: 'casskai_undo_redo')
   */
  localStorageKey?: string;

  /**
   * Activer sync multi-onglets (défaut: true)
   */
  enableBroadcast?: boolean;

  /**
   * Nom du canal BroadcastChannel (défaut: 'casskai_undo_redo_channel')
   */
  broadcastChannelName?: string;

  /**
   * Mode debug
   */
  debug?: boolean;
}

/**
 * État du service
 */
interface UndoRedoState {
  /**
   * Stack des actions passées (undo)
   */
  undoStack: ActionState[];

  /**
   * Stack des actions annulées (redo)
   */
  redoStack: ActionState[];

  /**
   * Index actuel dans l'historique
   */
  currentIndex: number;
}

/**
 * Callback listeners
 */
type StateChangeListener = (state: UndoRedoState) => void;

/**
 * UndoRedoService Class
 */
export class UndoRedoService {
  private config: Required<UndoRedoConfig>;
  private state: UndoRedoState;
  private listeners: Set<StateChangeListener>;
  private broadcastChannel: BroadcastChannel | null;

  constructor(config: UndoRedoConfig = {}) {
    this.config = {
      maxStackSize: config.maxStackSize || 50,
      enableLocalStorage: config.enableLocalStorage !== false,
      localStorageKey: config.localStorageKey || 'casskai_undo_redo',
      enableBroadcast: config.enableBroadcast !== false,
      broadcastChannelName: config.broadcastChannelName || 'casskai_undo_redo_channel',
      debug: config.debug || false,
    };

    this.state = {
      undoStack: [],
      redoStack: [],
      currentIndex: -1,
    };

    this.listeners = new Set();
    this.broadcastChannel = null;

    // Initialiser
    this.init();
  }

  /**
   * Initialisation
   */
  private init(): void {
    // Charger depuis localStorage
    if (this.config.enableLocalStorage) {
      this.loadFromLocalStorage();
    }

    // Initialiser BroadcastChannel pour sync multi-onglets
    if (this.config.enableBroadcast && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(this.config.broadcastChannelName);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data.type === 'sync') {
            this.state = event.data.state;
            this.notifyListeners();
            if (this.config.debug) {
              logger.debug('UndoRedoService', 'Synced from other tab:', this.state);
            }
          }
        };
      } catch (error) {
        logger.warn('UndoRedoService', 'BroadcastChannel not available:', error);
      }
    }

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'Initialized with config:', this.config);
    }
  }

  /**
   * Enregistrer une nouvelle action
   */
  public pushAction(action: Omit<ActionState, 'id' | 'timestamp'>): void {
    const newAction: ActionState = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    // Ajouter à la stack undo
    this.state.undoStack.push(newAction);

    // Limiter la taille de la stack
    if (this.state.undoStack.length > this.config.maxStackSize) {
      this.state.undoStack.shift(); // Retirer la plus ancienne
    }

    // Vider la stack redo (nouvelle action = perd l'historique redo)
    this.state.redoStack = [];

    // Mettre à jour l'index
    this.state.currentIndex = this.state.undoStack.length - 1;

    // Sauvegarder et notifier
    this.saveToLocalStorage();
    this.broadcastSync();
    this.notifyListeners();

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'Action pushed:', newAction);
    }
  }

  /**
   * Annuler la dernière action (Undo)
   */
  public async undo(): Promise<ActionState | null> {
    if (!this.canUndo()) {
      if (this.config.debug) {
        logger.debug('UndoRedoService', 'Cannot undo: stack empty');
      }
      return null;
    }

    const action = this.state.undoStack.pop()!;
    this.state.redoStack.push(action);
    this.state.currentIndex--;

    // Sauvegarder et notifier
    this.saveToLocalStorage();
    this.broadcastSync();
    this.notifyListeners();

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'Undo action:', action);
    }

    return action;
  }

  /**
   * Refaire une action annulée (Redo)
   */
  public async redo(): Promise<ActionState | null> {
    if (!this.canRedo()) {
      if (this.config.debug) {
        logger.debug('UndoRedoService', 'Cannot redo: stack empty');
      }
      return null;
    }

    const action = this.state.redoStack.pop()!;
    this.state.undoStack.push(action);
    this.state.currentIndex++;

    // Sauvegarder et notifier
    this.saveToLocalStorage();
    this.broadcastSync();
    this.notifyListeners();

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'Redo action:', action);
    }

    return action;
  }

  /**
   * Vérifier si undo possible
   */
  public canUndo(): boolean {
    return this.state.undoStack.length > 0;
  }

  /**
   * Vérifier si redo possible
   */
  public canRedo(): boolean {
    return this.state.redoStack.length > 0;
  }

  /**
   * Obtenir l'état actuel
   */
  public getState(): UndoRedoState {
    return {
      undoStack: [...this.state.undoStack],
      redoStack: [...this.state.redoStack],
      currentIndex: this.state.currentIndex,
    };
  }

  /**
   * Obtenir l'historique complet (pour timeline)
   */
  public getHistory(): ActionState[] {
    return [...this.state.undoStack];
  }

  /**
   * Nettoyer tout l'historique
   */
  public clear(): void {
    this.state = {
      undoStack: [],
      redoStack: [],
      currentIndex: -1,
    };

    this.saveToLocalStorage();
    this.broadcastSync();
    this.notifyListeners();

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'History cleared');
    }
  }

  /**
   * Supprimer une action spécifique de l'historique
   */
  public removeAction(actionId: string): boolean {
    const undoIndex = this.state.undoStack.findIndex((a) => a.id === actionId);
    const redoIndex = this.state.redoStack.findIndex((a) => a.id === actionId);

    let removed = false;

    if (undoIndex !== -1) {
      this.state.undoStack.splice(undoIndex, 1);
      this.state.currentIndex--;
      removed = true;
    }

    if (redoIndex !== -1) {
      this.state.redoStack.splice(redoIndex, 1);
      removed = true;
    }

    if (removed) {
      this.saveToLocalStorage();
      this.broadcastSync();
      this.notifyListeners();

      if (this.config.debug) {
        logger.debug('UndoRedoService', 'Action removed:', actionId);
      }
    }

    return removed;
  }

  /**
   * S'abonner aux changements d'état
   */
  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);

    // Retourner fonction de désinscription
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifier tous les listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logger.error('UndoRedoService', 'Listener error:', error);
      }
    });
  }

  /**
   * Sauvegarder dans localStorage
   */
  private saveToLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const data = JSON.stringify(this.state);
      localStorage.setItem(this.config.localStorageKey, data);
    } catch (error) {
      logger.error('UndoRedoService', 'Failed to save to localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage
   */
  private loadFromLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const data = localStorage.getItem(this.config.localStorageKey);
      if (data) {
        this.state = JSON.parse(data);
        if (this.config.debug) {
          logger.debug('UndoRedoService', 'Loaded from localStorage:', this.state);
        }
      }
    } catch (error) {
      logger.error('UndoRedoService', 'Failed to load from localStorage:', error);
    }
  }

  /**
   * Synchroniser via BroadcastChannel
   */
  private broadcastSync(): void {
    if (!this.config.enableBroadcast || !this.broadcastChannel) return;

    try {
      this.broadcastChannel.postMessage({
        type: 'sync',
        state: this.state,
      });
    } catch (error) {
      logger.error('UndoRedoService', 'Failed to broadcast sync:', error);
    }
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup (fermer BroadcastChannel)
   */
  public destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.listeners.clear();

    if (this.config.debug) {
      logger.debug('UndoRedoService', 'Service destroyed');
    }
  }
}

/**
 * Instance singleton globale
 */
let globalInstance: UndoRedoService | null = null;

/**
 * Obtenir l'instance singleton
 */
export function getUndoRedoService(config?: UndoRedoConfig): UndoRedoService {
  if (!globalInstance) {
    globalInstance = new UndoRedoService(config);
  }
  return globalInstance;
}

/**
 * Reset l'instance singleton (pour tests)
 */
export function resetUndoRedoService(): void {
  if (globalInstance) {
    globalInstance.destroy();
    globalInstance = null;
  }
}

/**
 * Export par défaut
 */
export default UndoRedoService;
