/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Index principal de la librairie FormData
 * 
 * Point d'entrée unique pour toutes les fonctionnalités de validation,
 * formatage et gestion des formulaires.
 */

// Core validation engine
import {
  FormValidator,
  ValidationSchemas,
  CasskaiSchemas,
  Formatters,
  Parsers,
  Transformers,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type FieldValidationConfig,
  type FormValidationConfig,
  type ValidationContext,
  type InputHelpers,
  type FormatterFunction,
  type ParserFunction,
  type TransformerFunction
} from './formData';

export {
  FormValidator,
  ValidationSchemas,
  CasskaiSchemas,
  Formatters,
  Parsers,
  Transformers
};

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FieldValidationConfig,
  FormValidationConfig,
  ValidationContext,
  InputHelpers,
  FormatterFunction,
  ParserFunction,
  TransformerFunction
};

// Form helpers and hooks
export {
  useFormValidation,
  useInputHelpers,
  useRealtimeValidation,
  useCurrencyInput,
  useDateInput,
  usePhoneInput,
  usePercentageInput,
  useSiretInput,
  useFormPersistence,
  useStepForm,
  transformForApi,
  transformFromApi,
  sanitizeFormData
} from './formHelpers';

// Validation messages
import {
  ValidationCodes,
  DefaultValidationMessages,
  ValidationI18nKeys,
  ValidationMessageGenerator,
  createMessageGenerator,
  createValidationMessage,
  MessageTemplates
} from './validationMessages';

export {
  ValidationCodes,
  DefaultValidationMessages,
  ValidationI18nKeys,
  ValidationMessageGenerator,
  createMessageGenerator,
  createValidationMessage,
  MessageTemplates
};

export type {
  ValidationCode,
  MessageOptions
} from './validationMessages';

// UI integration components
export {
  ValidatedInput,
  ValidatedCurrencyInput,
  ValidatedPhoneInput,
  ValidatedPercentageInput,
  ValidatedSiretInput,
  ValidatedSelect,
  ValidationStateIndicator,
  ValidationErrorBadge,
  ValidationWarningBadge,
  ValidationSummary,
  ValidationCounter,
  ValidatedForm,
  useValidationToasts,
  useValidationScroll
} from './formIntegration';

// =============================================================================
// EXPORTS CONVENIENCE
// =============================================================================

/**
 * Raccourcis pour les fonctionnalités les plus utilisées
 */
export const FormData = {
  // Validation
  Validator: FormValidator,
  Schemas: ValidationSchemas,
  CasskaiSchemas,
  
  // Formatage
  Formatters,
  Parsers,
  Transformers,
  
  // Messages
  Messages: {
    Codes: ValidationCodes,
    Generator: ValidationMessageGenerator,
    create: createValidationMessage,
    Templates: MessageTemplates
  }
} as const;

/**
 * Configuration par défaut recommandée pour les formulaires Casskai
 */
export const DefaultFormConfig = {
  mode: 'onBlur' as const,
  revalidateMode: 'onChange' as const,
  locale: 'fr-FR',
  debounceMs: 300,
  enableWarnings: true,
  persistErrors: false
};

/**
 * Schémas de validation prêts à l'emploi pour les cas d'usage courants
 */
export const QuickSchemas = {
  // Profil utilisateur basique
  userProfile: CasskaiSchemas.userProfile,
  
  // Entreprise complète
  company: CasskaiSchemas.companyProfile,
  
  // Écriture comptable
  journalEntry: CasskaiSchemas.journalEntry,
  
  // Transaction bancaire
  bankTransaction: CasskaiSchemas.bankTransaction,
  
  // Authentification
  login: ValidationSchemas.email,
  password: ValidationSchemas.password(),
  
  // Formats français
  phone: ValidationSchemas.phone(),
  siret: ValidationSchemas.siret(),
  postalCode: ValidationSchemas.postalCode()
} as const;

/**
 * Helpers de formatage rapides
 */
export const QuickFormatters = {
  // Formatage monétaire français
  euro: (amount: number) => Formatters.currency(amount, 'EUR', 'fr-FR'),
  
  // Formatage de date française
  dateFr: (date: Date | string) => Formatters.date(date, 'fr-FR'),
  
  // Formatage de téléphone français
  phoneFr: (phone: string) => Formatters.phone(phone),
  
  // Formatage SIRET
  siretFr: (siret: string) => Formatters.siret(siret),
  
  // Pourcentage français
  percentFr: (value: number) => Formatters.percentage(value, 'fr-FR')
} as const;

/**
 * Helpers de parsing rapides
 */
export const QuickParsers = {
  // Parse montant depuis chaîne formatée
  currency: (value: string) => Parsers.currency(value),
  
  // Parse nombre depuis chaîne formatée
  number: (value: string) => Parsers.number(value),
  
  // Parse date depuis chaîne
  date: (value: string) => Parsers.date(value),
  
  // Parse téléphone (nettoie les espaces/tirets)
  phone: (value: string) => Parsers.phone(value),
  
  // Parse SIRET (nettoie les espaces)
  siret: (value: string) => Parsers.siret(value)
} as const;

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Crée une instance de validateur avec configuration par défaut
 */
export function createFormValidator<T extends Record<string, any>>(
  config: Partial<FormValidationConfig<T>>,
  t: any
) {
  const fullConfig = {
    ...DefaultFormConfig,
    ...config
  } as FormValidationConfig<T>;
  
  return new FormValidator(fullConfig, t);
}

/**
 * Crée un générateur de messages avec traduction
 */
export function createMessageGeneratorWithLocale(t: any) {
  return new ValidationMessageGenerator(t);
}

/**
 * Configuration rapide pour validation en temps réel
 */
export function createRealtimeConfig<T extends Record<string, any>>(
  fields: Record<keyof T, Partial<FieldValidationConfig>>
): Partial<FormValidationConfig<T>> {
  return {
    ...DefaultFormConfig,
    mode: 'onChange',
    debounceMs: 500,
    fields: Object.keys(fields).reduce((acc, key) => {
      acc[key as keyof T] = {
        validateOnChange: true,
        validateOnBlur: true,
        debounceMs: 300,
        ...fields[key as keyof T]
      };
      return acc;
    }, {} as Record<keyof T, FieldValidationConfig>)
  };
}

/**
 * Configuration pour formulaires en étapes
 */
export function createStepFormConfig<T extends Record<string, any>>(
  steps: Array<{
    name: string;
    fields: (keyof T)[];
    schema?: any;
  }>
) {
  return steps.map(step => ({
    name: step.name,
    fields: step.fields,
    validation: step.schema ? {
      schema: step.schema,
      fields: step.fields.reduce((acc, field) => {
        acc[field] = { required: true };
        return acc;
      }, {} as Record<keyof T, FieldValidationConfig>)
    } : undefined
  }));
}

// =============================================================================
// TYPES EXPORTS
// =============================================================================

// Re-export des types principaux pour faciliter l'importation
export type {
  FieldValues,
  Path,
  UseFormReturn,
  Control
} from 'react-hook-form';

export type {
  ZodSchema,
  z
} from 'zod';

// =============================================================================
// VERSION ET METADATA
// =============================================================================

export const VERSION = '1.0.0';
export const AUTHOR = 'Casskai Team';
export const DESCRIPTION = 'Librairie de validation et gestion de formulaires pour Casskai';

/**
 * Informations sur les fonctionnalités supportées
 */
export const FEATURES = {
  validation: {
    sync: true,
    async: true,
    realtime: true,
    conditional: true,
    crossField: true
  },
  formatting: {
    currency: true,
    dates: true,
    phone: true,
    siret: true,
    percentage: true
  },
  integration: {
    reactHookForm: true,
    zod: true,
    i18next: true,
    radixUI: true
  },
  persistence: {
    localStorage: true,
    sessionStorage: true,
    customStorage: true
  }
} as const;

export default FormData;
