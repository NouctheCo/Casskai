/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Validateurs pour documents réglementaires
 */
import { safeEval, safeEvalCondition } from '@/utils/safeEval';
import { logger } from '@/lib/logger';
import type {
  RegulatoryDocument,
  RegulatoryTemplate,
  ValidationError,
  ValidationWarning,
  FormField,
  DisplayCondition
} from '@/types/regulatory';
/**
 * Valide un document complet
 */
export function validateDocument(
  document: RegulatoryDocument,
  template: RegulatoryTemplate
): { errors: ValidationError[]; warnings: ValidationWarning[]; isValid: boolean } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  // Validation des champs du schéma
  const schemaValidation = validateSchema(document.data, template);
  errors.push(...schemaValidation.errors);
  warnings.push(...schemaValidation.warnings);
  // Validation des règles métier
  const rulesValidation = validateBusinessRules(document.data, template);
  errors.push(...rulesValidation.errors);
  warnings.push(...rulesValidation.warnings);
  // Validation spécifique au type de document
  const typeValidation = validateByDocumentType(document, template);
  errors.push(...typeValidation.errors);
  warnings.push(...typeValidation.warnings);
  return {
    errors,
    warnings,
    isValid: errors.length === 0
  };
}
/**
 * Valide les données selon le schéma du template
 */
function validateSchema(
  data: Record<string, any>,
  template: RegulatoryTemplate
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const formSchema = template.formSchema as any;
  if (!formSchema || !formSchema.sections) {
    return { errors, warnings };
  }
  // Parcourir toutes les sections
  for (const section of formSchema.sections) {
    validateSection(section, data, errors, warnings);
  }
  return { errors, warnings };
}
/**
 * Valide une section et ses champs
 */
function validateSection(
  section: any,
  data: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Vérifier les conditions d'affichage de la section
  if (section.conditions && !evaluateConditions(section.conditions, data)) {
    return; // Section non applicable
  }
  // Valider chaque champ
  for (const field of section.fields || []) {
    validateField(field, data, errors, warnings);
  }
  // Valider les sous-sections
  if (section.subsections) {
    for (const subsection of section.subsections) {
      validateSection(subsection, data, errors, warnings);
    }
  }
}
/**
 * Valide un champ individuel
 */
function validateField(
  field: FormField,
  data: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const value = data[field.id];
  // Vérifier les conditions d'affichage
  if (field.conditions && !evaluateConditions(field.conditions, data)) {
    return; // Champ non applicable
  }
  // Champ caché ou en lecture seule
  if (field.hidden || field.readonly) {
    return;
  }
  // Champ requis
  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: field.id,
      message: field.validationMessage || `${field.label} est requis`,
      code: 'REQUIRED_FIELD',
      severity: 'error'
    });
    return;
  }
  // Si pas de valeur et pas requis, pas d'autres validations
  if (value === undefined || value === null || value === '') {
    return;
  }
  // Validation selon le type
  switch (field.type) {
    case 'number':
    case 'currency':
    case 'percentage':
      validateNumericField(field, value, errors, warnings);
      break;
    case 'text':
      validateTextField(field, value, errors, warnings);
      break;
    case 'date':
      validateDateField(field, value, errors, warnings);
      break;
  }
}
/**
 * Valide un champ numérique
 */
function validateNumericField(
  field: FormField,
  value: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const numValue = Number(value);
  if (isNaN(numValue)) {
    errors.push({
      field: field.id,
      message: `${field.label} doit être un nombre valide`,
      code: 'INVALID_NUMBER',
      severity: 'error'
    });
    return;
  }
  // Validation min/max
  if (field.min !== undefined && numValue < field.min) {
    errors.push({
      field: field.id,
      message: `${field.label} doit être supérieur ou égal à ${field.min}`,
      code: 'VALUE_TOO_LOW',
      severity: 'error'
    });
  }
  if (field.max !== undefined && numValue > field.max) {
    errors.push({
      field: field.id,
      message: `${field.label} doit être inférieur ou égal à ${field.max}`,
      code: 'VALUE_TOO_HIGH',
      severity: 'error'
    });
  }
  // Avertissement si valeur négative inhabituelle
  if (numValue < 0 && field.type === 'currency') {
    warnings.push({
      field: field.id,
      message: `${field.label} a une valeur négative`,
      code: 'NEGATIVE_VALUE',
      severity: 'warning'
    });
  }
}
/**
 * Valide un champ texte
 */
function validateTextField(
  field: FormField,
  value: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const strValue = String(value);
  // Validation de pattern (regex)
  if (field.pattern) {
    const regex = new RegExp(field.pattern);
    if (!regex.test(strValue)) {
      errors.push({
        field: field.id,
        message: field.validationMessage || `${field.label} a un format invalide`,
        code: 'INVALID_FORMAT',
        severity: 'error'
      });
    }
  }
  // Validation de longueur
  if (field.min !== undefined && strValue.length < field.min) {
    errors.push({
      field: field.id,
      message: `${field.label} doit contenir au moins ${field.min} caractères`,
      code: 'TOO_SHORT',
      severity: 'error'
    });
  }
  if (field.max !== undefined && strValue.length > field.max) {
    errors.push({
      field: field.id,
      message: `${field.label} ne peut pas dépasser ${field.max} caractères`,
      code: 'TOO_LONG',
      severity: 'error'
    });
  }
}
/**
 * Valide un champ date
 */
function validateDateField(
  field: FormField,
  value: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({
      field: field.id,
      message: `${field.label} n'est pas une date valide`,
      code: 'INVALID_DATE',
      severity: 'error'
    });
    return;
  }
  // Validation min/max (dates)
  if (field.min) {
    const minDate = new Date(field.min);
    if (date < minDate) {
      errors.push({
        field: field.id,
        message: `${field.label} doit être postérieur au ${minDate.toLocaleDateString('fr-FR')}`,
        code: 'DATE_TOO_EARLY',
        severity: 'error'
      });
    }
  }
  if (field.max) {
    const maxDate = new Date(field.max);
    if (date > maxDate) {
      errors.push({
        field: field.id,
        message: `${field.label} doit être antérieur au ${maxDate.toLocaleDateString('fr-FR')}`,
        code: 'DATE_TOO_LATE',
        severity: 'error'
      });
    }
  }
}
/**
 * Évalue les conditions d'affichage
 */
function evaluateConditions(
  conditions: DisplayCondition[],
  data: Record<string, any>
): boolean {
  // Toutes les conditions doivent être vraies (AND logique)
  return conditions.every(condition => evaluateCondition(condition, data));
}
/**
 * Évalue une condition individuelle
 */
function evaluateCondition(
  condition: DisplayCondition,
  data: Record<string, any>
): boolean {
  const fieldValue = data[condition.field];
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'notEquals':
      return fieldValue !== condition.value;
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value);
    case 'lessThan':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'isEmpty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    case 'isNotEmpty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    default:
      return true;
  }
}
/**
 * Valide les règles métier définies dans le template
 */
function validateBusinessRules(
  data: Record<string, any>,
  template: RegulatoryTemplate
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validationRules = template.validationRules as any;
  if (!validationRules) {
    return { errors, warnings };
  }
  // Vérifications d'équilibre
  if (validationRules.balanceChecks) {
    for (const check of validationRules.balanceChecks) {
      const leftSum = check.leftFields.reduce((sum: number, f: string) => sum + (Number(data[f]) || 0), 0);
      const rightSum = check.rightFields.reduce((sum: number, f: string) => sum + (Number(data[f]) || 0), 0);
      const tolerance = check.tolerance || 0.01;
      if (Math.abs(leftSum - rightSum) > tolerance) {
        errors.push({
          field: 'balance',
          message: check.message || `Équilibre non respecté: ${leftSum.toFixed(2)} ≠ ${rightSum.toFixed(2)}`,
          code: 'BALANCE_ERROR',
          severity: 'error'
        });
      }
    }
  }
  // Validations croisées
  if (validationRules.crossValidations) {
    for (const validation of validationRules.crossValidations) {
      try {
        if (!evaluateCrossValidation(validation.condition, data)) {
          if (validation.severity === 'error') {
            errors.push({
              field: 'cross_validation',
              message: validation.message,
              code: 'CROSS_VALIDATION_FAILED',
              severity: 'error'
            });
          } else {
            warnings.push({
              field: 'cross_validation',
              message: validation.message,
              code: 'CROSS_VALIDATION_WARNING',
              severity: validation.severity
            });
          }
        }
      } catch (error) {
        logger.error('Validators', 'Error evaluating cross validation:', error);
      }
    }
  }
  return { errors, warnings };
}
/**
 * Évalue une condition de validation croisée
 */
function evaluateCrossValidation(condition: string, data: Record<string, any>): boolean {
  try {
    // Préparer les variables pour l'évaluation sécurisée
    const variables: Record<string, number> = {};
    for (const [key, value] of Object.entries(data)) {
      variables[key] = Number(value) || 0;
    }
    // Évaluation sécurisée avec safeEvalCondition
    return safeEvalCondition(condition, variables);
  } catch {
    return true; // En cas d'erreur, on considère la validation comme passée
  }
}
/**
 * Validations spécifiques selon le type de document
 */
function validateByDocumentType(
  document: RegulatoryDocument,
  template: RegulatoryTemplate
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  // Validations France (PCG)
  if (document.accountingStandard === 'PCG') {
    validateFrenchDocument(document, template, errors, warnings);
  }
  // Validations OHADA (SYSCOHADA)
  if (document.accountingStandard === 'SYSCOHADA') {
    validateOhadaDocument(document, template, errors, warnings);
  }
  // Validations IFRS
  if (document.accountingStandard === 'IFRS') {
    validateIfrsDocument(document, template, errors, warnings);
  }
  // Validations SCF/PCM (Maghreb)
  if (document.accountingStandard === 'SCF' || document.accountingStandard === 'PCM') {
    validateMaghrebDocument(document, template, errors, warnings);
  }
  return { errors, warnings };
}
/**
 * Validations spécifiques aux documents français
 */
function validateFrenchDocument(
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Exemple: vérifier SIREN pour les documents fiscaux
  if (template.category === 'tax_returns') {
    const siren = document.data.siren;
    if (siren && !/^\d{9}$/.test(siren)) {
      errors.push({
        field: 'siren',
        message: 'Le numéro SIREN doit contenir 9 chiffres',
        code: 'INVALID_SIREN',
        severity: 'error'
      });
    }
  }
}
/**
 * Validations spécifiques aux documents OHADA
 */
function validateOhadaDocument(
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Validations SYSCOHADA
  // TODO: Ajouter validations spécifiques OHADA
}
/**
 * Validations spécifiques aux documents IFRS
 */
function validateIfrsDocument(
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Validations IFRS for SMEs
  // TODO: Ajouter validations spécifiques IFRS
}
/**
 * Validations spécifiques aux documents Maghreb (SCF/PCM)
 */
function validateMaghrebDocument(
  document: RegulatoryDocument,
  template: RegulatoryTemplate,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Validations SCF/PCM
  // TODO: Ajouter validations spécifiques Maghreb
}
