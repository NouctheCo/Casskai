// Types pour les événements et hooks des modules

// Événements de modules
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  timestamp: string;
  data?: Record<string, unknown>;
  userId?: string;
  companyId?: string;
}

export type ModuleEventType =
  | 'module.installed'
  | 'module.activated'
  | 'module.deactivated'
  | 'module.updated'
  | 'module.uninstalled'
  | 'module.error'
  | 'module.config_changed'
  | 'module.permission_changed'
  | 'module.data_changed'

export interface ModuleEventHandler {
  eventType: ModuleEventType;
  handler: (event: ModuleEvent) => void | Promise<void>;
  priority?: number;
  once?: boolean;
}

export interface ModuleHook {
  name: string;
  type: 'filter' | 'action';
  callback: ModuleHookCallback;
  priority?: number;
  acceptedArgs?: number;
}

export type ModuleHookCallback = (...args: unknown[]) => unknown;

export interface ModuleLifecycle {
  onInstall?: (config?: Record<string, unknown>) => Promise<void>;
  onActivate?: (config?: Record<string, unknown>) => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onUpdate?: (oldVersion: string, newVersion: string) => Promise<void>;
  onUninstall?: () => Promise<void>;
  onConfigChange?: (newConfig: Record<string, unknown>, oldConfig: Record<string, unknown>) => Promise<void>;
}

export interface ModuleEventBus {
  emit: (event: ModuleEvent) => void;
  on: (eventType: ModuleEventType, handler: (event: ModuleEvent) => void) => void;
  off: (eventType: ModuleEventType, handler: (event: ModuleEvent) => void) => void;
  once: (eventType: ModuleEventType, handler: (event: ModuleEvent) => void) => void;
}

export interface ModuleHookSystem {
  addHook: (name: string, callback: ModuleHookCallback, priority?: number) => void;
  removeHook: (name: string, callback: ModuleHookCallback) => void;
  applyFilters: (name: string, value: unknown, ...args: unknown[]) => unknown;
  doAction: (name: string, ...args: unknown[]) => void;
}