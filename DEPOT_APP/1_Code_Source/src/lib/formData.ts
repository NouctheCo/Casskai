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

 * FormData Library - Validation et gestion des formulaires pour Casskai

 * 

 * Cette librairie fournit un système complet de validation, formatage et gestion

 * des données de formulaires avec intégration native pour React Hook Form, Zod,

 * et le système d'internationalisation existant.

 */



import { z, ZodSchema, ZodError } from 'zod';

import { FieldValues, UseFormReturn } from 'react-hook-form';

import { TFunction } from 'i18next';



// =============================================================================

// TYPES TYPESCRIPT STRICTS

// =============================================================================



/**

 * Résultat de validation générique

 */

export interface ValidationResult<T = unknown> {

  isValid: boolean;

  data?: T;

  errors: ValidationError[];

  warnings?: ValidationWarning[];

}



/**

 * Erreur de validation

 */

export interface ValidationError {

  field: string;

  message: string;

  code: string;

  value?: unknown;

  context?: Record<string, unknown>;

}



/**

 * Avertissement de validation

 */

export interface ValidationWarning {

  field: string;

  message: string;

  code: string;

  severity: 'low' | 'medium' | 'high';

}



/**

 * Configuration de validation pour un champ

 */

export interface FieldValidationConfig<T = unknown> {

  required?: boolean;

  schema?: ZodSchema<T>;

  asyncValidator?: (value: T) => Promise<ValidationResult<T>>;

  dependencies?: string[];

  debounceMs?: number;

  validateOnChange?: boolean;

  validateOnBlur?: boolean;

  transform?: (value: unknown) => T;

  format?: (value: T) => string;

}



/**

 * Configuration globale du formulaire

 */

export interface FormValidationConfig<T extends FieldValues = FieldValues> {

  schema?: ZodSchema<T>;

  fields: Record<keyof T, FieldValidationConfig>;

  mode?: 'onChange' | 'onBlur' | 'onSubmit';

  revalidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  locale?: string;

  debounceMs?: number;

  enableWarnings?: boolean;

  persistErrors?: boolean;

}



/**

 * Contexte de validation

 */

export interface ValidationContext<T extends FieldValues = FieldValues> {

  form: UseFormReturn<T>;

  config: FormValidationConfig<T>;

  t: TFunction;

  errors: Record<string, ValidationError[]>;

  warnings: Record<string, ValidationWarning[]>;

  isValidating: Record<string, boolean>;

  cache: Map<string, ValidationResult>;

}



/**

 * Types pour les formatters

 */

export type FormatterFunction<T = unknown> = (value: T, locale?: string) => string;

export type ParserFunction<T = unknown> = (value: string, locale?: string) => T;

export type TransformerFunction<T = unknown, U = unknown> = (value: T) => U;



/**

 * Types pour les helpers d'inputs

 */

export interface InputHelpers<T = unknown> {

  value: T;

  onChange: (value: T) => void;

  onBlur: () => void;

  error?: string;

  warning?: string;

  isValidating: boolean;

  formatted: string;

  isValid: boolean;

  isDirty: boolean;

  isTouched: boolean;

}



// =============================================================================

// SCHÉMAS DE VALIDATION PRÉDÉFINIS

// =============================================================================



/**

 * Schémas de validation réutilisables

 */

export const ValidationSchemas = {

  // Chaînes de caractères

  required: (message?: string) => z.string().min(1, message || 'Ce champ est requis'),

  minLength: (min: number, message?: string) => 

    z.string().min(min, message || `Minimum ${min} caractères requis`),

  maxLength: (max: number, message?: string) => 

    z.string().max(max, message || `Maximum ${max} caractères autorisés`),

  

  // Email

  email: (message?: string) => 

    z.string().email(message || 'Format email invalide'),

  

  // Téléphone (format français)

  phone: (message?: string) => 

    z.string().regex(

      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,

      message || 'Format téléphone invalide'

    ),

  

  // SIRET français

  siret: (message?: string) => 

    z.string().regex(

      /^\d{14}$/,

      message || 'Le SIRET doit contenir 14 chiffres'

    ),

  

  // Code postal français

  postalCode: (message?: string) => 

    z.string().regex(

      /^\d{5}$/,

      message || 'Code postal invalide (5 chiffres)'

    ),

  

  // Montants financiers

  amount: (message?: string) => 

    z.number().min(0, message || 'Le montant doit être positif'),

  

  // Dates

  date: (message?: string) => 

    z.date({

      required_error: message || 'Date requise',

      invalid_type_error: message || 'Format de date invalide'

    }),

  

  // Pourcentages

  percentage: (message?: string) => 

    z.number().min(0).max(100, message || 'Pourcentage entre 0 et 100'),

  

  // Mots de passe

  password: (minLength = 8, message?: string) => 

    z.string()

      .min(minLength, message || `Mot de passe d'au moins ${minLength} caractères`)

      .regex(/[A-Z]/, message || 'Au moins une majuscule requise')

      .regex(/[a-z]/, message || 'Au moins une minuscule requise')

      .regex(/\d/, message || 'Au moins un chiffre requis'),

  

  // URL

  url: (message?: string) => 

    z.string().url(message || 'URL invalide'),

  

  // UUID

  uuid: (message?: string) => 

    z.string().uuid(message || 'Identifiant invalide'),

} as const;



/**

 * Schémas métier spécifiques à Casskai

 */

export const CasskaiSchemas = {

  companyProfile: z.object({

    name: ValidationSchemas.required('Nom de l\'entreprise requis'),

    legalName: z.string().optional(),

    siret: ValidationSchemas.siret(),

    address: ValidationSchemas.required('Adresse requise'),

    postalCode: ValidationSchemas.postalCode(),

    city: ValidationSchemas.required('Ville requise'),

    country: ValidationSchemas.required('Pays requis'),

    phone: ValidationSchemas.phone().optional(),

    email: ValidationSchemas.email(),

    website: ValidationSchemas.url().optional(),

    currency: z.enum(['EUR', 'USD', 'GBP'], {

      errorMap: () => ({ message: 'Devise non supportée' })

    }),

    fiscalYear: z.enum(['calendar', 'april', 'july']),

    accountingMethod: z.enum(['cash', 'accrual'])

  }),

  

  userProfile: z.object({

    firstName: ValidationSchemas.required('Prénom requis'),

    lastName: ValidationSchemas.required('Nom requis'),

    email: ValidationSchemas.email(),

    phone: ValidationSchemas.phone().optional(),

    jobTitle: z.string().optional(),

    department: z.string().optional(),

    timezone: z.string().default('Europe/Paris'),

    language: z.enum(['fr', 'en', 'es']).default('fr')

  }),

  

  journalEntry: z.object({

    entry_date: ValidationSchemas.date(),

    description: ValidationSchemas.minLength(3, 'Description trop courte'),

    journal_id: ValidationSchemas.uuid(),

    reference: z.string().optional(),

    items: z.array(z.object({

      account_id: ValidationSchemas.uuid(),

      description: ValidationSchemas.required(),

      debit_amount: ValidationSchemas.amount().optional(),

      credit_amount: ValidationSchemas.amount().optional(),

      tax_rate: ValidationSchemas.percentage().optional()

    })).min(2, 'Au moins 2 écritures requises')

  }).refine(

    (data) => {

      const totalDebit = data.items.reduce((sum, item) => sum + (item.debit_amount || 0), 0);

      const totalCredit = data.items.reduce((sum, item) => sum + (item.credit_amount || 0), 0);

      return Math.abs(totalDebit - totalCredit) < 0.01;

    },

    { message: 'Le débit et le crédit doivent être équilibrés' }

  ),

  

  bankTransaction: z.object({

    date: ValidationSchemas.date(),

    description: ValidationSchemas.required(),

    amount: z.number().refine(val => val !== 0, 'Le montant ne peut pas être zéro'),

    reference: z.string().optional(),

    category: z.string().optional(),

    account_id: ValidationSchemas.uuid()

  })

} as const;



// =============================================================================

// FORMATAGE DES DONNÉES

// =============================================================================



/**

 * Formatters pour différents types de données

 */

export const Formatters = {

  /**

   * Formate un montant en devise

   */

  currency: (amount: number, currency = 'EUR', locale = 'fr-FR'): string => {

    try {

      return new Intl.NumberFormat(locale, {

        style: 'currency',

        currency,

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

      }).format(amount);

    } catch {

      return `${amount.toFixed(2)} ${currency}`;

    }

  },



  /**

   * Formate un nombre avec séparateurs de milliers

   */

  number: (value: number, locale = 'fr-FR', decimals = 2): string => {

    try {

      return new Intl.NumberFormat(locale, {

        minimumFractionDigits: decimals,

        maximumFractionDigits: decimals

      }).format(value);

    } catch {

      return value.toFixed(decimals);

    }

  },



  /**

   * Formate une date

   */

  date: (date: Date | string, locale = 'fr-FR', options?: Intl.DateTimeFormatOptions): string => {

    try {

      const dateObj = typeof date === 'string' ? new Date(date) : date;

      const defaultOptions: Intl.DateTimeFormatOptions = {

        year: 'numeric',

        month: 'long',

        day: 'numeric'

      };

      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);

    } catch {

      return String(date);

    }

  },



  /**

   * Formate une date et heure

   */

  datetime: (date: Date | string, locale = 'fr-FR'): string => {

    return Formatters.date(date, locale, {

      year: 'numeric',

      month: 'short',

      day: 'numeric',

      hour: '2-digit',

      minute: '2-digit'

    });

  },



  /**

   * Formate un pourcentage

   */

  percentage: (value: number, locale = 'fr-FR', decimals = 1): string => {

    try {

      return new Intl.NumberFormat(locale, {

        style: 'percent',

        minimumFractionDigits: decimals,

        maximumFractionDigits: decimals

      }).format(value / 100);

    } catch {

      return `${value.toFixed(decimals)}%`;

    }

  },



  /**

   * Formate un numéro de téléphone français

   */

  phone: (phone: string): string => {

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {

      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

    }

    return phone;

  },



  /**

   * Formate un SIRET

   */

  siret: (siret: string): string => {

    const cleaned = siret.replace(/\D/g, '');

    if (cleaned.length === 14) {

      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');

    }

    return siret;

  },



  /**

   * Formate un code postal

   */

  postalCode: (code: string): string => {

    const cleaned = code.replace(/\D/g, '');

    return cleaned.slice(0, 5);

  }

} as const;



/**

 * Parsers pour convertir des chaînes formatées en valeurs

 */

export const Parsers = {

  /**

   * Parse un montant depuis une chaîne formatée

   */

  currency: (value: string): number => {

    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');

    return parseFloat(cleaned) || 0;

  },



  /**

   * Parse un nombre depuis une chaîne formatée

   */

  number: (value: string): number => {

    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');

    return parseFloat(cleaned) || 0;

  },



  /**

   * Parse une date depuis une chaîne

   */

  date: (value: string): Date | null => {

    try {

      const date = new Date(value);

      return isNaN(date.getTime()) ? null : date;

    } catch {

      return null;

    }

  },



  /**

   * Parse un pourcentage

   */

  percentage: (value: string): number => {

    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');

    return parseFloat(cleaned) || 0;

  },



  /**

   * Parse un téléphone

   */

  phone: (value: string): string => {

    return value.replace(/\D/g, '');

  },



  /**

   * Parse un SIRET

   */

  siret: (value: string): string => {

    return value.replace(/\D/g, '');

  }

} as const;



// =============================================================================

// TRANSFORMATION DES DONNÉES

// =============================================================================



/**

 * Transformers pour la conversion de données

 */

export const Transformers = {

  /**

   * Transforme les données pour l'API

   */

  toApi: <T extends Record<string, unknown>>(data: T): T => {

    const transformed: Record<string, unknown> = { ...data };



    // Convertit les dates en ISO strings

    Object.keys(transformed).forEach(key => {

      if (transformed[key] instanceof Date) {

        transformed[key] = transformed[key].toISOString();

      }

    });



    return transformed as T;

  },



  /**

   * Transforme les données depuis l'API

   */

  fromApi: <T extends Record<string, unknown>>(data: T): T => {

    const transformed: Record<string, unknown> = { ...data };



    // Convertit les ISO strings en dates

    Object.keys(transformed).forEach(key => {

      if (typeof transformed[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(transformed[key])) {

        transformed[key] = new Date(transformed[key]);

      }

    });



    return transformed as T;

  },



  /**

   * Normalise les données utilisateur

   */

  sanitize: <T extends Record<string, unknown>>(data: T): T => {

    const sanitized: Record<string, unknown> = { ...data };



    Object.keys(sanitized).forEach(key => {

      const value = sanitized[key];

      if (typeof value === 'string') {

        // Trim whitespace

        sanitized[key] = value.trim();



        // Nettoie les caractères spéciaux pour certains champs

        if (key.includes('phone')) {

          sanitized[key] = Parsers.phone(value);

        } else if (key.includes('siret')) {

          sanitized[key] = Parsers.siret(value);

        }

      }

    });



    return sanitized as T;

  },



  /**

   * Applique les transformations par défaut

   */

  default: <T extends Record<string, unknown>>(data: T): T => {

    return Transformers.sanitize(Transformers.fromApi(data));

  }

} as const;



// =============================================================================

// VALIDATION CORE ENGINE

// =============================================================================



/**

 * Cache de validation pour optimiser les performances

 */

class ValidationCache {

  private cache = new Map<string, { result: ValidationResult; timestamp: number }>();

  private ttl = 5000; // 5 secondes



  set(key: string, result: ValidationResult): void {

    this.cache.set(key, { result, timestamp: Date.now() });

  }



  get(key: string): ValidationResult | null {

    const cached = this.cache.get(key);

    if (!cached) return null;

    

    if (Date.now() - cached.timestamp > this.ttl) {

      this.cache.delete(key);

      return null;

    }

    

    return cached.result;

  }



  clear(): void {

    this.cache.clear();

  }



  private generateKey(field: string, value: unknown, schema?: unknown): string {

    return `${field}:${JSON.stringify(value)}:${schema?.toString() || ''}`;

  }

}



/**

 * Gestionnaire de validation principal

 */

export class FormValidator<T extends FieldValues = FieldValues> {

  private config: FormValidationConfig<T>;

  private cache = new ValidationCache();

  private pendingValidations = new Map<string, Promise<ValidationResult>>();

  private t: TFunction;



  constructor(config: FormValidationConfig<T>, t: TFunction) {

    this.config = config;

    this.t = t;

  }



  /**

   * Valide un champ spécifique

   */

  async validateField(field: keyof T, value: unknown): Promise<ValidationResult> {

    const fieldConfig = this.config.fields[field];

    if (!fieldConfig) {

      return { isValid: true, errors: [] };

    }



    // Vérification du cache

    const cacheKey = this.generateCacheKey(String(field), value, fieldConfig.schema);

    const cached = this.cache.get(cacheKey);

    if (cached) return cached;



    // Évite les validations concurrentes

    const pendingKey = `${String(field)}:${JSON.stringify(value)}`;

    if (this.pendingValidations.has(pendingKey)) {

      return this.pendingValidations.get(pendingKey)!;

    }



    const validationPromise = this.performFieldValidation(field, value, fieldConfig);

    this.pendingValidations.set(pendingKey, validationPromise);



    try {

      const result = await validationPromise;

      this.cache.set(cacheKey, result);

      return result;

    } finally {

      this.pendingValidations.delete(pendingKey);

    }

  }



  /**

   * Valide tout le formulaire

   */

  async validateForm(data: T): Promise<ValidationResult<T>> {

    const errors: ValidationError[] = [];

    const warnings: ValidationWarning[] = [];



    // Validation du schéma global

    if (this.config.schema) {

      try {

        const validatedData = this.config.schema.parse(data);

        

        // Validation des champs individuels

        const fieldValidations = await Promise.all(

          Object.keys(this.config.fields).map(async (field) => {

            const result = await this.validateField(field as keyof T, data[field as keyof T]);

            return { field, result };

          })

        );



        fieldValidations.forEach(({ field: _field, result }) => {

          if (!result.isValid) {

            errors.push(...result.errors);

          }

          if (result.warnings) {

            warnings.push(...result.warnings);

          }

        });



        return {

          isValid: errors.length === 0,

          data: validatedData,

          errors,

          warnings: warnings.length > 0 ? warnings : undefined

        };



      } catch (error) {

        if (error instanceof ZodError) {

          const zodErrors = this.convertZodErrors(error);

          return {

            isValid: false,

            errors: zodErrors

          };

        }

        throw error;

      }

    }



    return {

      isValid: errors.length === 0,

      data,

      errors,

      warnings: warnings.length > 0 ? warnings : undefined

    };

  }



  /**

   * Validation en temps réel avec debounce

   */

  createDebouncedValidator(field: keyof T) {

    let timeoutId: NodeJS.Timeout;



    return (value: unknown, callback: (result: ValidationResult) => void) => {

      clearTimeout(timeoutId);

      

      const delay = this.config.fields[field]?.debounceMs || this.config.debounceMs || 300;

      

      timeoutId = setTimeout(async () => {

        const result = await this.validateField(field, value);

        callback(result);

      }, delay);

    };

  }



  /**

   * Nettoie le cache de validation

   */

  clearCache(): void {

    this.cache.clear();

  }



  /**

   * Met à jour la configuration

   */

  updateConfig(config: Partial<FormValidationConfig<T>>): void {

    this.config = { ...this.config, ...config };

    this.clearCache();

  }



  // Méthodes privées

  private async performFieldValidation(

    field: keyof T,

    value: unknown,

    config: FieldValidationConfig

  ): Promise<ValidationResult> {

    const errors: ValidationError[] = [];

    const warnings: ValidationWarning[] = [];



    // Transformation des données

    const transformedValue = config.transform ? config.transform(value) : value;



    // Validation required

    if (config.required && (transformedValue === undefined || transformedValue === null || transformedValue === '')) {

      errors.push({

        field: String(field),

        message: this.t('validation.required', { field: String(field), defaultValue: 'Ce champ est requis' }),

        code: 'REQUIRED'

      });

      return { isValid: false, errors };

    }



    // Validation avec schéma Zod

    if (config.schema) {

      try {

        config.schema.parse(transformedValue);

      } catch (error) {

        if (error instanceof ZodError) {

          errors.push(...this.convertZodErrors(error, String(field)));

        }

      }

    }



    // Validation asynchrone

    if (config.asyncValidator && transformedValue !== undefined && transformedValue !== null && transformedValue !== '') {

      try {

        const asyncResult = await config.asyncValidator(transformedValue);

        if (!asyncResult.isValid) {

          errors.push(...asyncResult.errors);

        }

        if (asyncResult.warnings) {

          warnings.push(...asyncResult.warnings);

        }

      } catch (error) {

        errors.push({

          field: String(field),

          message: this.t('validation.asyncError', { defaultValue: 'Erreur de validation' }),

          code: 'ASYNC_ERROR',

          context: { error: error instanceof Error ? error.message : String(error) }

        });

      }

    }



    return {

      isValid: errors.length === 0,

      data: transformedValue,

      errors,

      warnings: warnings.length > 0 ? warnings : undefined

    };

  }



  private convertZodErrors(zodError: ZodError, fieldOverride?: string): ValidationError[] {

    return zodError.errors.map(error => ({

      field: fieldOverride || error.path.join('.'),

      message: error.message,

      code: error.code.toUpperCase(),

      value: (error as { input?: unknown }).input,

      context: { 

        path: error.path,

        expected: 'expected' in error ? error.expected : undefined,

        received: 'received' in error ? error.received : undefined

      }

    }));

  }



  private generateCacheKey(field: string, value: unknown, schema?: unknown): string {

    return `${field}:${JSON.stringify(value)}:${schema?.toString() || ''}`;

  }

}



export default FormValidator;
