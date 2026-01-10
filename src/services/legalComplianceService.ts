/**
 * CassKai - Service de validation de conformité légale
 * Vérifie que les informations légales/bancaires minimales sont remplies avant génération PDF
 */

import type { CompanySettings } from '@/types/company-settings.types';

export interface LegalComplianceStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  warnings: string[];
}

/**
 * Champs légaux/comptables obligatoires pour une facture conforme
 */
const MANDATORY_FIELDS: Array<{
  key: keyof CompanySettings;
  path: string;
  label: string;
  nested?: string;
}> = [
  { key: 'generalInfo', path: 'generalInfo.legalForm', label: 'Forme juridique' },
  { key: 'generalInfo', path: 'generalInfo.siret', label: 'SIRET' },
  { key: 'generalInfo', path: 'generalInfo.vatNumber', label: 'TVA' },
  { key: 'generalInfo', path: 'generalInfo.shareCapital', label: 'Capital social' },
  { key: 'contact', path: 'contact.address.street', label: 'Adresse (rue)' },
  { key: 'contact', path: 'contact.address.city', label: 'Ville' },
  { key: 'contact', path: 'contact.address.postalCode', label: 'Code postal' },
  { key: 'contact', path: 'contact.address.country', label: 'Pays' },
  { key: 'accounting', path: 'accounting.mainBank.iban', label: 'IBAN' },
  { key: 'accounting', path: 'accounting.mainBank.bic', label: 'BIC' },
  { key: 'business', path: 'business.currency', label: 'Devise par défaut' },
];

/**
 * Accédateur récursif pour les chemins imbriqués
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Vérifie si une valeur est remplie
 */
function isFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  return true;
}

/**
 * Analyse la complétude des informations légales
 */
export function checkLegalCompliance(
  settings: CompanySettings | null
): LegalComplianceStatus {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!settings) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: MANDATORY_FIELDS.map(f => f.label),
      warnings: ['Aucune configuration entreprise trouvée'],
    };
  }

  let filledCount = 0;

  for (const field of MANDATORY_FIELDS) {
    const value = getNestedValue(settings, field.path);
    if (isFilled(value)) {
      filledCount++;
    } else {
      missingFields.push(field.label);
    }
  }

  const completionPercentage = Math.round(
    (filledCount / MANDATORY_FIELDS.length) * 100
  );

  // Avertissements supplémentaires
  if (!settings.branding?.legalMentions) {
    warnings.push('Aucune mention légale configurée');
  }
  if (!settings.branding?.defaultTermsConditions) {
    warnings.push('Pas de conditions de paiement par défaut');
  }

  return {
    isComplete: missingFields.length === 0,
    completionPercentage,
    missingFields,
    warnings,
  };
}

/**
 * Format texte pour l'affichage des champs manquants
 */
export function formatMissingFieldsList(fields: string[]): string {
  if (fields.length === 0) return '';
  return fields.map(f => `• ${f}`).join('\n');
}

/**
 * Message d'erreur standardisé
 */
export function getLegalComplianceMessage(status: LegalComplianceStatus): string {
  if (status.isComplete) {
    return 'Tous les champs légaux sont remplis ✓';
  }

  const missing = formatMissingFieldsList(status.missingFields);
  const warn = status.warnings.length
    ? `\n\nAvertissements:\n${status.warnings.map(w => `• ${w}`).join('\n')}`
    : '';

  return `Complétude: ${status.completionPercentage}%\n\nChamps obligatoires manquants:\n${missing}${warn}`;
}
