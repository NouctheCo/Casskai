// Types pour la définition des modules

// Définition d'un module
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ModuleCategory;
  icon: string;
  
  // Statut et availability
  status: 'available' | 'beta' | 'coming_soon' | 'deprecated';
  isCore: boolean; // Si true, module toujours activé
  isPremium: boolean;
  
  // Configuration
  config?: ModuleConfig;
  permissions: string[];
  dependencies: string[]; // IDs des modules requis
  conflicts: string[]; // IDs des modules incompatibles
  
  // Pricing
  pricing?: ModulePricing;
  
  // Metadata
  author: string;
  documentation?: string;
  supportUrl?: string;
  changelog?: ModuleChangelogEntry[];
}

export interface ModuleConfig {
  settings: Record<string, ModuleSetting>;
  defaultValues: Record<string, unknown>;
  validation?: Record<string, ValidationRule>;
}

export interface ModuleSetting {
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'json';
  label: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: unknown; label: string }>;
  min?: number;
  max?: number;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  custom?: (value: unknown) => boolean | string;
}

export interface ModulePricing {
  model: 'free' | 'one_time' | 'subscription' | 'usage_based';
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  trialDays?: number;
  features?: string[];
}

export interface ModuleChangelogEntry {
  version: string;
  date: string;
  changes: Array<{
    type: 'feature' | 'bugfix' | 'improvement' | 'breaking';
    description: string;
  }>;
}

export type ModuleCategory = 'core' | 'business' | 'hr' | 'project' | 'integration' | 'marketplace';
