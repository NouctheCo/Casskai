/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * AsyncValidationService - Service de validation asynchrone
 *
 * Provides async validation for form fields:
 * - Email uniqueness (employees, clients)
 * - SIRET validation (format + Luhn checksum)
 * - Phone number validation (libphonenumber-js)
 * - VAT number validation (Europe)
 * - Custom business logic validation
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

/**
 * Debounce delay pour validation async (ms)
 */
const DEBOUNCE_DELAY = 500;

/**
 * Cache des résultats de validation (TTL: 5 minutes)
 */
const validationCache = new Map<string, { result: ValidationResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Générer une clé de cache
 */
function getCacheKey(type: string, value: string, companyId?: string): string {
  return `${type}:${companyId || 'global'}:${value}`;
}

/**
 * Vérifier si une entrée de cache est valide
 */
function getCachedResult(key: string): ValidationResult | null {
  const cached = validationCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    validationCache.delete(key);
    return null;
  }

  return cached.result;
}

/**
 * Enregistrer un résultat en cache
 */
function setCachedResult(key: string, result: ValidationResult): void {
  validationCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * ========================================
 * EMAIL UNIQUENESS VALIDATION
 * ========================================
 */

/**
 * Vérifier si un email est unique dans la table employees
 */
export async function validateEmailUniquenessInEmployees(
  email: string,
  companyId: string,
  excludeEmployeeId?: string
): Promise<ValidationResult> {
  if (!email || !email.trim()) {
    return { isValid: true }; // Empty email = optional field
  }

  const cacheKey = getCacheKey('employee-email', email, companyId);
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('employees')
      .select('id, email')
      .eq('company_id', companyId)
      .eq('email', email.toLowerCase().trim());

    if (excludeEmployeeId) {
      query = query.neq('id', excludeEmployeeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error('AsyncValidation', 'Error validating employee email:', error);
      return { isValid: false, message: 'Erreur de validation' };
    }

    const result: ValidationResult = data
      ? { isValid: false, message: 'Cet email est déjà utilisé par un autre employé' }
      : { isValid: true };

    setCachedResult(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('AsyncValidation', 'Exception validating employee email:', error);
    return { isValid: false, message: 'Erreur de validation' };
  }
}

/**
 * Vérifier si un email est unique dans la table third_parties
 */
export async function validateEmailUniquenessInThirdParties(
  email: string,
  companyId: string,
  excludeThirdPartyId?: string
): Promise<ValidationResult> {
  if (!email || !email.trim()) {
    return { isValid: true };
  }

  const cacheKey = getCacheKey('thirdparty-email', email, companyId);
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('third_parties')
      .select('id, email')
      .eq('company_id', companyId)
      .eq('email', email.toLowerCase().trim());

    if (excludeThirdPartyId) {
      query = query.neq('id', excludeThirdPartyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error('AsyncValidation', 'Error validating third_party email:', error);
      return { isValid: false, message: 'Erreur de validation' };
    }

    const result: ValidationResult = data
      ? { isValid: false, message: 'Cet email est déjà utilisé par un autre tiers' }
      : { isValid: true };

    setCachedResult(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('AsyncValidation', 'Exception validating third_party email:', error);
    return { isValid: false, message: 'Erreur de validation' };
  }
}

/**
 * ========================================
 * SIRET VALIDATION (France)
 * ========================================
 */

/**
 * Valider le format du SIRET (14 chiffres)
 */
export function validateSiretFormat(siret: string): boolean {
  if (!siret) return true; // Optional field
  const cleaned = siret.replace(/\s/g, '');
  return /^\d{14}$/.test(cleaned);
}

/**
 * Algorithme de Luhn pour valider le SIRET
 * Source: https://fr.wikipedia.org/wiki/SIRET
 */
export function validateSiretLuhn(siret: string): boolean {
  if (!siret) return true;
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);

    // Multiply every other digit by 2 (starting from right, index 1, 3, 5...)
    if (i % 2 === 1) {
      digit *= 2;
      // If result > 9, subtract 9
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Validation complète du SIRET (format + Luhn)
 */
export async function validateSiret(siret: string): Promise<ValidationResult> {
  if (!siret || !siret.trim()) {
    return { isValid: true }; // Optional field
  }

  const cacheKey = getCacheKey('siret', siret);
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const cleaned = siret.replace(/\s/g, '');

  // Format validation
  if (!/^\d{14}$/.test(cleaned)) {
    const result = {
      isValid: false,
      message: 'Le SIRET doit contenir exactement 14 chiffres',
    };
    setCachedResult(cacheKey, result);
    return result;
  }

  // Luhn validation
  if (!validateSiretLuhn(cleaned)) {
    const result = {
      isValid: false,
      message: 'Le SIRET est invalide (échec de la validation Luhn)',
    };
    setCachedResult(cacheKey, result);
    return result;
  }

  const result = { isValid: true };
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * ========================================
 * TVA INTRACOMMUNAUTAIRE VALIDATION
 * ========================================
 */

/**
 * Valider le format d'un numéro de TVA intracommunautaire
 * Source: https://ec.europa.eu/taxation_customs/vies/
 */
export async function validateVatNumber(
  vatNumber: string,
  countryCode: string = 'FR'
): Promise<ValidationResult> {
  if (!vatNumber || !vatNumber.trim()) {
    return { isValid: true }; // Optional field
  }

  const cacheKey = getCacheKey('vat', `${countryCode}:${vatNumber}`);
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();

  // Patterns par pays (simplifiés)
  const vatPatterns: Record<string, RegExp> = {
    FR: /^FR[A-Z0-9]{2}\d{9}$/, // France: FR + 2 caractères + 9 chiffres
    BE: /^BE0\d{9}$/, // Belgique: BE0 + 9 chiffres
    DE: /^DE\d{9}$/, // Allemagne: DE + 9 chiffres
    IT: /^IT\d{11}$/, // Italie: IT + 11 chiffres
    ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, // Espagne: ES + lettre/chiffre + 7 chiffres + lettre/chiffre
    GB: /^GB\d{9}$/, // Royaume-Uni: GB + 9 chiffres
  };

  const pattern = vatPatterns[countryCode];
  if (!pattern) {
    const result = {
      isValid: false,
      message: `Format de TVA non supporté pour le pays ${countryCode}`,
    };
    setCachedResult(cacheKey, result);
    return result;
  }

  const isValid = pattern.test(cleaned);
  const result: ValidationResult = isValid
    ? { isValid: true }
    : {
        isValid: false,
        message: `Format de TVA invalide pour ${countryCode}`,
      };

  setCachedResult(cacheKey, result);
  return result;
}

/**
 * ========================================
 * PHONE NUMBER VALIDATION
 * ========================================
 */

/**
 * Validation simple de numéro de téléphone (format international)
 * Pour validation avancée, utiliser libphonenumber-js
 */
export async function validatePhoneNumber(
  phone: string,
  countryCode: string = 'FR'
): Promise<ValidationResult> {
  if (!phone || !phone.trim()) {
    return { isValid: true }; // Optional field
  }

  const cleaned = phone.replace(/[\s().-]/g, '');

  // Format international: +33612345678
  if (cleaned.startsWith('+')) {
    if (!/^\+\d{10,15}$/.test(cleaned)) {
      return {
        isValid: false,
        message: 'Format de téléphone international invalide',
      };
    }
    return { isValid: true };
  }

  // Format national France: 0612345678
  if (countryCode === 'FR') {
    if (!/^0[1-9]\d{8}$/.test(cleaned)) {
      return {
        isValid: false,
        message: 'Format de téléphone français invalide (10 chiffres commençant par 0)',
      };
    }
    return { isValid: true };
  }

  // Generic validation for other countries
  if (!/^\d{8,15}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Format de téléphone invalide',
    };
  }

  return { isValid: true };
}

/**
 * ========================================
 * DEBOUNCED VALIDATORS (for react-hook-form)
 * ========================================
 */

/**
 * Map pour stocker les timers de debounce
 */
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Créer un validateur débounced pour react-hook-form
 */
export function createDebouncedValidator<T = string>(
  validator: (value: T, ...args: any[]) => Promise<ValidationResult>,
  delay: number = DEBOUNCE_DELAY
): (value: T, ...args: any[]) => Promise<boolean | string> {
  return (value: T, ...args: any[]) => {
    return new Promise((resolve) => {
      const key = `${validator.name}:${value}`;

      // Clear existing timer
      const existingTimer = debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const result = await validator(value, ...args);
        debounceTimers.delete(key);
        resolve(result.isValid ? true : (result.message || 'Validation échouée'));
      }, delay);

      debounceTimers.set(key, timer);
    });
  };
}

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Nettoyer le cache de validation
 */
export function clearValidationCache(): void {
  validationCache.clear();
  logger.info('AsyncValidation', 'Validation cache cleared');
}

/**
 * Nettoyer les timers de debounce
 */
export function clearDebounceTimes(): void {
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  logger.info('AsyncValidation', 'Debounce timers cleared');
}

/**
 * Export par défaut
 */
export default {
  validateEmailUniquenessInEmployees,
  validateEmailUniquenessInThirdParties,
  validateSiret,
  validateSiretFormat,
  validateSiretLuhn,
  validateVatNumber,
  validatePhoneNumber,
  createDebouncedValidator,
  clearValidationCache,
  clearDebounceTimes,
};
