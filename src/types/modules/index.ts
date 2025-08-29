// Index des types de modules - Organisation modulaire

// Types de base des modules
export type {
  ModuleDefinition,
  ModuleConfig,
  ModuleSetting,
  ValidationRule,
  ModulePricing,
  ModuleChangelogEntry
} from './module-definition.types'

// Types d'instance et état des modules
export type {
  ModuleInstance,
  ModuleState,
  ModuleStatus,
  ModuleActivation,
  ModuleRegistry,
  ModuleContext,
  Module
} from './module-instance.types'

// Types de composants et rendu
export type {
  ModuleComponent,
  ModuleComponentProps,
  ModuleRenderer,
  ModuleRoute,
  ModuleNavigation
} from './module-components.types'

// Types du marketplace
export type {
  MarketplaceItem,
  MarketplaceCategory,
  MarketplaceStats,
  ModuleInstallation,
  ModuleUpdate
} from './module-marketplace.types'

// Types d'événements et hooks
export type {
  ModuleEvent,
  ModuleEventHandler,
  ModuleHook,
  ModuleLifecycle
} from './module-events.types'

// Types utilitaires
export type {
  ModuleCategory,
  ModulePermission,
  ModuleMetrics
} from './module-utils.types'

// Classes d'erreurs (ne pas utiliser type pour les classes)
export {
  ModuleError,
  ModuleDependencyError,
  ModuleConflictError
} from './module-utils.types'