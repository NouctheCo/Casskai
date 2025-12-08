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
 * Messages de validation localisés
 * 
 * Ce module centralise tous les messages d'erreur de validation
 * avec support complet de l'internationalisation.
 */

import { TFunction } from 'i18next';

// =============================================================================
// CODES D'ERREUR STANDARDISÉS
// =============================================================================

export const ValidationCodes = {
  // Erreurs générales
  REQUIRED: 'REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  
  // Chaînes de caractères
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Nombres
  TOO_SMALL: 'TOO_SMALL',
  TOO_BIG: 'TOO_BIG',
  NOT_INTEGER: 'NOT_INTEGER',
  NOT_FINITE: 'NOT_FINITE',
  
  // Dates
  INVALID_DATE: 'INVALID_DATE',
  DATE_TOO_EARLY: 'DATE_TOO_EARLY',
  DATE_TOO_LATE: 'DATE_TOO_LATE',
  
  // Formats spécifiques
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_URL: 'INVALID_URL',
  INVALID_UUID: 'INVALID_UUID',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_SIRET: 'INVALID_SIRET',
  INVALID_POSTAL_CODE: 'INVALID_POSTAL_CODE',
  
  // Mots de passe
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  PASSWORD_NO_UPPERCASE: 'PASSWORD_NO_UPPERCASE',
  PASSWORD_NO_LOWERCASE: 'PASSWORD_NO_LOWERCASE',
  PASSWORD_NO_NUMBER: 'PASSWORD_NO_NUMBER',
  PASSWORD_NO_SPECIAL: 'PASSWORD_NO_SPECIAL',
  
  // Validation métier
  ACCOUNT_NOT_BALANCED: 'ACCOUNT_NOT_BALANCED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_BUSINESS_LOGIC: 'INVALID_BUSINESS_LOGIC',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation asynchrone
  ASYNC_VALIDATION_FAILED: 'ASYNC_VALIDATION_FAILED',
  SERVER_VALIDATION_ERROR: 'SERVER_VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type ValidationCode = typeof ValidationCodes[keyof typeof ValidationCodes];

// =============================================================================
// MESSAGES DE VALIDATION PAR DÉFAUT
// =============================================================================

/**
 * Messages de validation en français (par défaut)
 */
export const DefaultValidationMessages: Record<ValidationCode, string> = {
  // Erreurs générales
  [ValidationCodes.REQUIRED]: 'Ce champ est requis',
  [ValidationCodes.INVALID_TYPE]: 'Type de données invalide',
  [ValidationCodes.UNKNOWN_ERROR]: 'Erreur de validation inconnue',
  
  // Chaînes de caractères
  [ValidationCodes.TOO_SHORT]: 'Texte trop court',
  [ValidationCodes.TOO_LONG]: 'Texte trop long',
  [ValidationCodes.INVALID_FORMAT]: 'Format invalide',
  
  // Nombres
  [ValidationCodes.TOO_SMALL]: 'Valeur trop petite',
  [ValidationCodes.TOO_BIG]: 'Valeur trop grande',
  [ValidationCodes.NOT_INTEGER]: 'Doit être un nombre entier',
  [ValidationCodes.NOT_FINITE]: 'Doit être un nombre fini',
  
  // Dates
  [ValidationCodes.INVALID_DATE]: 'Date invalide',
  [ValidationCodes.DATE_TOO_EARLY]: 'Date trop ancienne',
  [ValidationCodes.DATE_TOO_LATE]: 'Date trop récente',
  
  // Formats spécifiques
  [ValidationCodes.INVALID_EMAIL]: 'Adresse email invalide',
  [ValidationCodes.INVALID_URL]: 'URL invalide',
  [ValidationCodes.INVALID_UUID]: 'Identifiant invalide',
  [ValidationCodes.INVALID_PHONE]: 'Numéro de téléphone invalide',
  [ValidationCodes.INVALID_SIRET]: 'Numéro SIRET invalide',
  [ValidationCodes.INVALID_POSTAL_CODE]: 'Code postal invalide',
  
  // Mots de passe
  [ValidationCodes.PASSWORD_TOO_WEAK]: 'Mot de passe trop faible',
  [ValidationCodes.PASSWORD_NO_UPPERCASE]: 'Doit contenir au moins une majuscule',
  [ValidationCodes.PASSWORD_NO_LOWERCASE]: 'Doit contenir au moins une minuscule',
  [ValidationCodes.PASSWORD_NO_NUMBER]: 'Doit contenir au moins un chiffre',
  [ValidationCodes.PASSWORD_NO_SPECIAL]: 'Doit contenir au moins un caractère spécial',
  
  // Validation métier
  [ValidationCodes.ACCOUNT_NOT_BALANCED]: 'Les comptes doivent être équilibrés',
  [ValidationCodes.DUPLICATE_ENTRY]: 'Cette entrée existe déjà',
  [ValidationCodes.INVALID_BUSINESS_LOGIC]: 'Logique métier invalide',
  [ValidationCodes.INSUFFICIENT_PERMISSIONS]: 'Permissions insuffisantes',
  
  // Validation asynchrone
  [ValidationCodes.ASYNC_VALIDATION_FAILED]: 'Validation asynchrone échouée',
  [ValidationCodes.SERVER_VALIDATION_ERROR]: 'Erreur de validation côté serveur',
  [ValidationCodes.NETWORK_ERROR]: 'Erreur réseau lors de la validation'
};

// =============================================================================
// CLÉS DE TRADUCTION I18N
// =============================================================================

/**
 * Clés de traduction pour i18next
 */
export const ValidationI18nKeys = {
  // Préfixe général
  PREFIX: 'validation',
  
  // Erreurs générales
  REQUIRED: 'validation.required',
  INVALID_TYPE: 'validation.invalidType',
  UNKNOWN_ERROR: 'validation.unknownError',
  
  // Chaînes de caractères
  TOO_SHORT: 'validation.string.tooShort',
  TOO_LONG: 'validation.string.tooLong',
  INVALID_FORMAT: 'validation.string.invalidFormat',
  MIN_LENGTH: 'validation.string.minLength',
  MAX_LENGTH: 'validation.string.maxLength',
  
  // Nombres
  TOO_SMALL: 'validation.number.tooSmall',
  TOO_BIG: 'validation.number.tooBig',
  NOT_INTEGER: 'validation.number.notInteger',
  NOT_FINITE: 'validation.number.notFinite',
  MIN_VALUE: 'validation.number.min',
  MAX_VALUE: 'validation.number.max',
  
  // Dates
  INVALID_DATE: 'validation.date.invalid',
  DATE_TOO_EARLY: 'validation.date.tooEarly',
  DATE_TOO_LATE: 'validation.date.tooLate',
  MIN_DATE: 'validation.date.min',
  MAX_DATE: 'validation.date.max',
  
  // Formats spécifiques
  INVALID_EMAIL: 'validation.format.email',
  INVALID_URL: 'validation.format.url',
  INVALID_UUID: 'validation.format.uuid',
  INVALID_PHONE: 'validation.format.phone',
  INVALID_SIRET: 'validation.format.siret',
  INVALID_POSTAL_CODE: 'validation.format.postalCode',
  
  // Mots de passe
  PASSWORD_TOO_WEAK: 'validation.password.tooWeak',
  PASSWORD_NO_UPPERCASE: 'validation.password.noUppercase',
  PASSWORD_NO_LOWERCASE: 'validation.password.noLowercase',
  PASSWORD_NO_NUMBER: 'validation.password.noNumber',
  PASSWORD_NO_SPECIAL: 'validation.password.noSpecial',
  PASSWORD_MIN_LENGTH: 'validation.password.minLength',
  
  // Validation métier
  ACCOUNT_NOT_BALANCED: 'validation.business.accountNotBalanced',
  DUPLICATE_ENTRY: 'validation.business.duplicateEntry',
  INVALID_BUSINESS_LOGIC: 'validation.business.invalidLogic',
  INSUFFICIENT_PERMISSIONS: 'validation.business.insufficientPermissions',
  
  // Messages de formulaire
  FORM_ERRORS: 'validation.form.errors',
  FIX_ERRORS: 'validation.form.fixErrors',
  FORM_INVALID: 'validation.form.invalid',
  FIELD_REQUIRED: 'validation.form.fieldRequired',
  
  // États de validation
  VALIDATING: 'validation.state.validating',
  VALID: 'validation.state.valid',
  INVALID: 'validation.state.invalid',
  
  // Actions
  RETRY_VALIDATION: 'validation.action.retry',
  SKIP_VALIDATION: 'validation.action.skip',
  CLEAR_ERRORS: 'validation.action.clearErrors'
} as const;

// =============================================================================
// GÉNÉRATEUR DE MESSAGES
// =============================================================================

/**
 * Interface pour les options de message
 */
export interface MessageOptions {
  field?: string;
  value?: any;
  min?: number;
  max?: number;
  length?: number;
  expected?: string;
  received?: string;
  context?: Record<string, any>;
}

/**
 * Générateur de messages de validation localisés
 */
export class ValidationMessageGenerator {
  private t: TFunction;
  
  constructor(t: TFunction) {
    this.t = t;
  }
  
  /**
   * Génère un message pour un code d'erreur donné
   */
  getMessage(code: ValidationCode, options: MessageOptions = {}): string {
    const key = this.getI18nKey(code);
    const defaultMessage = DefaultValidationMessages[code];
    
    // Paramètres pour la traduction
    const params = {
      field: options.field || 'champ',
      value: options.value,
      min: options.min,
      max: options.max,
      length: options.length,
      expected: options.expected,
      received: options.received,
      defaultValue: defaultMessage,
      ...options.context
    };
    
    return this.t(key, params);
  }
  
  /**
   * Génère un message d'erreur requis
   */
  getRequiredMessage(field?: string): string {
    return this.getMessage(ValidationCodes.REQUIRED, { field });
  }
  
  /**
   * Génère un message d'erreur de longueur minimale
   */
  getMinLengthMessage(min: number, field?: string): string {
    return this.t(ValidationI18nKeys.MIN_LENGTH, {
      field,
      min,
      defaultValue: `Minimum ${min} caractères requis`
    });
  }
  
  /**
   * Génère un message d'erreur de longueur maximale
   */
  getMaxLengthMessage(max: number, field?: string): string {
    return this.t(ValidationI18nKeys.MAX_LENGTH, {
      field,
      max,
      defaultValue: `Maximum ${max} caractères autorisés`
    });
  }
  
  /**
   * Génère un message d'erreur de valeur minimale
   */
  getMinValueMessage(min: number, field?: string): string {
    return this.t(ValidationI18nKeys.MIN_VALUE, {
      field,
      min,
      defaultValue: `Valeur minimale : ${min}`
    });
  }
  
  /**
   * Génère un message d'erreur de valeur maximale
   */
  getMaxValueMessage(max: number, field?: string): string {
    return this.t(ValidationI18nKeys.MAX_VALUE, {
      field,
      max,
      defaultValue: `Valeur maximale : ${max}`
    });
  }
  
  /**
   * Génère un message d'erreur de format email
   */
  getEmailMessage(field?: string): string {
    return this.getMessage(ValidationCodes.INVALID_EMAIL, { field });
  }
  
  /**
   * Génère un message d'erreur de format téléphone
   */
  getPhoneMessage(field?: string): string {
    return this.getMessage(ValidationCodes.INVALID_PHONE, { field });
  }
  
  /**
   * Génère un message d'erreur de format SIRET
   */
  getSiretMessage(field?: string): string {
    return this.getMessage(ValidationCodes.INVALID_SIRET, { field });
  }
  
  /**
   * Génère un message d'erreur personnalisé pour les mots de passe
   */
  getPasswordMessage(requirements: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  }): string {
    const messages: string[] = [];
    
    if (requirements.minLength) {
      messages.push(this.t(ValidationI18nKeys.PASSWORD_MIN_LENGTH, {
        length: requirements.minLength,
        defaultValue: `Au moins ${requirements.minLength} caractères`
      }));
    }
    
    if (requirements.requireUppercase) {
      messages.push(this.getMessage(ValidationCodes.PASSWORD_NO_UPPERCASE));
    }
    
    if (requirements.requireLowercase) {
      messages.push(this.getMessage(ValidationCodes.PASSWORD_NO_LOWERCASE));
    }
    
    if (requirements.requireNumber) {
      messages.push(this.getMessage(ValidationCodes.PASSWORD_NO_NUMBER));
    }
    
    if (requirements.requireSpecial) {
      messages.push(this.getMessage(ValidationCodes.PASSWORD_NO_SPECIAL));
    }
    
    return messages.join(', ');
  }
  
  /**
   * Obtient la clé i18n pour un code d'erreur
   */
  private getI18nKey(code: ValidationCode): string {
    const keyMap: Record<ValidationCode, string> = {
      [ValidationCodes.REQUIRED]: ValidationI18nKeys.REQUIRED,
      [ValidationCodes.INVALID_TYPE]: ValidationI18nKeys.INVALID_TYPE,
      [ValidationCodes.UNKNOWN_ERROR]: ValidationI18nKeys.UNKNOWN_ERROR,
      [ValidationCodes.TOO_SHORT]: ValidationI18nKeys.TOO_SHORT,
      [ValidationCodes.TOO_LONG]: ValidationI18nKeys.TOO_LONG,
      [ValidationCodes.INVALID_FORMAT]: ValidationI18nKeys.INVALID_FORMAT,
      [ValidationCodes.TOO_SMALL]: ValidationI18nKeys.TOO_SMALL,
      [ValidationCodes.TOO_BIG]: ValidationI18nKeys.TOO_BIG,
      [ValidationCodes.NOT_INTEGER]: ValidationI18nKeys.NOT_INTEGER,
      [ValidationCodes.NOT_FINITE]: ValidationI18nKeys.NOT_FINITE,
      [ValidationCodes.INVALID_DATE]: ValidationI18nKeys.INVALID_DATE,
      [ValidationCodes.DATE_TOO_EARLY]: ValidationI18nKeys.DATE_TOO_EARLY,
      [ValidationCodes.DATE_TOO_LATE]: ValidationI18nKeys.DATE_TOO_LATE,
      [ValidationCodes.INVALID_EMAIL]: ValidationI18nKeys.INVALID_EMAIL,
      [ValidationCodes.INVALID_URL]: ValidationI18nKeys.INVALID_URL,
      [ValidationCodes.INVALID_UUID]: ValidationI18nKeys.INVALID_UUID,
      [ValidationCodes.INVALID_PHONE]: ValidationI18nKeys.INVALID_PHONE,
      [ValidationCodes.INVALID_SIRET]: ValidationI18nKeys.INVALID_SIRET,
      [ValidationCodes.INVALID_POSTAL_CODE]: ValidationI18nKeys.INVALID_POSTAL_CODE,
      [ValidationCodes.PASSWORD_TOO_WEAK]: ValidationI18nKeys.PASSWORD_TOO_WEAK,
      [ValidationCodes.PASSWORD_NO_UPPERCASE]: ValidationI18nKeys.PASSWORD_NO_UPPERCASE,
      [ValidationCodes.PASSWORD_NO_LOWERCASE]: ValidationI18nKeys.PASSWORD_NO_LOWERCASE,
      [ValidationCodes.PASSWORD_NO_NUMBER]: ValidationI18nKeys.PASSWORD_NO_NUMBER,
      [ValidationCodes.PASSWORD_NO_SPECIAL]: ValidationI18nKeys.PASSWORD_NO_SPECIAL,
      [ValidationCodes.ACCOUNT_NOT_BALANCED]: ValidationI18nKeys.ACCOUNT_NOT_BALANCED,
      [ValidationCodes.DUPLICATE_ENTRY]: ValidationI18nKeys.DUPLICATE_ENTRY,
      [ValidationCodes.INVALID_BUSINESS_LOGIC]: ValidationI18nKeys.INVALID_BUSINESS_LOGIC,
      [ValidationCodes.INSUFFICIENT_PERMISSIONS]: ValidationI18nKeys.INSUFFICIENT_PERMISSIONS,
      [ValidationCodes.ASYNC_VALIDATION_FAILED]: ValidationI18nKeys.UNKNOWN_ERROR,
      [ValidationCodes.SERVER_VALIDATION_ERROR]: ValidationI18nKeys.UNKNOWN_ERROR,
      [ValidationCodes.NETWORK_ERROR]: ValidationI18nKeys.UNKNOWN_ERROR
    };
    
    return keyMap[code] || ValidationI18nKeys.UNKNOWN_ERROR;
  }
}

// =============================================================================
// FACTORY POUR CRÉER DES MESSAGES
// =============================================================================

/**
 * Factory pour créer des générateurs de messages
 */
export function createMessageGenerator(t: TFunction): ValidationMessageGenerator {
  return new ValidationMessageGenerator(t);
}

/**
 * Helper pour créer des messages d'erreur rapides
 */
export function createValidationMessage(
  code: ValidationCode,
  options: MessageOptions = {},
  t?: TFunction
): string {
  if (t) {
    const generator = new ValidationMessageGenerator(t);
    return generator.getMessage(code, options);
  }
  
  // Fallback sans traduction
  return DefaultValidationMessages[code] || 'Erreur de validation';
}

// =============================================================================
// TEMPLATES DE MESSAGES PERSONNALISÉS
// =============================================================================

/**
 * Templates pour des cas d'usage spécifiques
 */
export const MessageTemplates = {
  /**
   * Message pour un champ requis avec nom de champ
   */
  required: (field: string, t: TFunction) => 
    t('validation.fieldRequired', { field, defaultValue: `${field} est requis` }),
  
  /**
   * Message pour longueur de chaîne
   */
  stringLength: (field: string, min?: number, max?: number, t?: TFunction) => {
    if (min && max) {
      return t ? t('validation.string.lengthBetween', { field, min, max, defaultValue: `${field} doit contenir entre ${min} et ${max} caractères` }) :
        `${field} doit contenir entre ${min} et ${max} caractères`;
    } else if (min) {
      return t ? t('validation.string.minLength', { field, min, defaultValue: `${field} doit contenir au moins ${min} caractères` }) :
        `${field} doit contenir au moins ${min} caractères`;
    } else if (max) {
      return t ? t('validation.string.maxLength', { field, max, defaultValue: `${field} doit contenir au maximum ${max} caractères` }) :
        `${field} doit contenir au maximum ${max} caractères`;
    }
    return t ? t('validation.string.invalidLength', { field, defaultValue: `Longueur de ${field} invalide` }) :
      `Longueur de ${field} invalide`;
  },
  
  /**
   * Message pour plage de nombres
   */
  numberRange: (field: string, min?: number, max?: number, t?: TFunction) => {
    if (min && max) {
      return t ? t('validation.number.between', { field, min, max, defaultValue: `${field} doit être entre ${min} et ${max}` }) :
        `${field} doit être entre ${min} et ${max}`;
    } else if (min) {
      return t ? t('validation.number.min', { field, min, defaultValue: `${field} doit être supérieur ou égal à ${min}` }) :
        `${field} doit être supérieur ou égal à ${min}`;
    } else if (max) {
      return t ? t('validation.number.max', { field, max, defaultValue: `${field} doit être inférieur ou égal à ${max}` }) :
        `${field} doit être inférieur ou égal à ${max}`;
    }
    return t ? t('validation.number.invalidRange', { field, defaultValue: `Valeur de ${field} invalide` }) :
      `Valeur de ${field} invalide`;
  },
  
  /**
   * Message pour correspondance de champs
   */
  fieldMatch: (field1: string, field2: string, t?: TFunction) =>
    t ? t('validation.fieldMatch', { field1, field2, defaultValue: `${field1} doit correspondre à ${field2}` }) :
    `${field1} doit correspondre à ${field2}`,
  
  /**
   * Message pour format personnalisé
   */
  customFormat: (field: string, format: string, example?: string, t?: TFunction) =>
    t ? t('validation.customFormat', { 
      field, 
      format, 
      example,
      defaultValue: `${field} doit respecter le format ${format}${example ? ` (ex: ${example})` : ''}` 
    }) :
    `${field} doit respecter le format ${format}${example ? ` (ex: ${example})` : ''}`
};

export default {
  ValidationCodes,
  DefaultValidationMessages,
  ValidationI18nKeys,
  ValidationMessageGenerator,
  createMessageGenerator,
  createValidationMessage,
  MessageTemplates
};
