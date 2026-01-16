/**
 * CassKai - Index des templates réglementaires
 * Exportations centralisées pour tous les templates
 */

// Import France
export {
  FRANCE_TEMPLATES_CONFIG,
  generateAllFranceTemplates,
  getFranceTemplateConfig,
  FRANCE_DOCUMENT_TYPES
} from './allFranceTemplates';

// Import OHADA
export {
  OHADA_TEMPLATES_CONFIG,
  generateAllOhadaTemplates,
  getOhadaTemplateConfig,
  OHADA_DOCUMENT_TYPES,
  getOhadaTemplatesByCountry
} from './ohadaTemplates';

// Import IFRS
export {
  IFRS_TEMPLATES_CONFIG,
  generateAllIfrsTemplates,
  getIfrsTemplateConfig,
  IFRS_DOCUMENT_TYPES,
  getIfrsTemplatesByCountry
} from './ifrsTemplates';

// Import Maghreb
export {
  MAGHREB_TEMPLATES_CONFIG,
  generateAllMaghrebTemplates,
  getMaghrebTemplateConfig,
  MAGHREB_DOCUMENT_TYPES,
  getMaghrebTemplatesByCountry
} from './maghrebTemplates';

// Import Factory
export {
  createTemplateFromConfig,
  createTemplatesFromConfigs,
  type TemplateConfig,
  type SectionConfig,
  type FieldConfig
} from './templateFactory';

import type { RegulatoryTemplate } from '@/types/regulatory';

import { FRANCE_TEMPLATES_CONFIG, generateAllFranceTemplates } from './allFranceTemplates';
import { generateAllOhadaTemplates, getOhadaTemplatesByCountry } from './ohadaTemplates';
import { generateAllIfrsTemplates, getIfrsTemplatesByCountry } from './ifrsTemplates';
import { generateAllMaghrebTemplates, getMaghrebTemplatesByCountry } from './maghrebTemplates';
import { createTemplatesFromConfigs } from './templateFactory';

/**
 * Récupère les templates par pays
 */
export function getTemplatesByCountry(countryCode: string): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  const configs = [];

  // France
  if (countryCode === 'FR') {
    configs.push(...FRANCE_TEMPLATES_CONFIG);
  }

  // OHADA (SN, CI, CM)
  if (['SN', 'CI', 'CM'].includes(countryCode)) {
    configs.push(...getOhadaTemplatesByCountry(countryCode));
  }

  // IFRS (KE, NG, GH, ZA)
  if (['KE', 'NG', 'GH', 'ZA'].includes(countryCode)) {
    configs.push(...getIfrsTemplatesByCountry(countryCode));
  }

  // Maghreb (DZ, TN, MA)
  if (['DZ', 'TN', 'MA'].includes(countryCode)) {
    configs.push(...getMaghrebTemplatesByCountry(countryCode));
  }

  return createTemplatesFromConfigs(configs);
}

/**
 * Récupère les templates par standard comptable
 */
export function getTemplatesByAccountingStandard(
  standard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'PCM'
): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  switch (standard) {
    case 'PCG':
      return generateAllFranceTemplates();
    case 'SYSCOHADA':
      return generateAllOhadaTemplates();
    case 'IFRS':
      return generateAllIfrsTemplates();
    case 'SCF':
    case 'PCM':
      return generateAllMaghrebTemplates();
    default:
      return [];
  }
}

/**
 * Liste complète de tous les pays supportés par CassKai
 * Organisés par zone géographique et standard comptable
 */
export const SUPPORTED_COUNTRIES = [
  // FRANCE
  { code: 'FR', name: 'France', standard: 'PCG', region: 'Europe', taxFormsReady: true },

  // OHADA - AFRIQUE DE L'OUEST ET CENTRALE (17 pays)
  { code: 'BJ', name: 'Bénin', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'BF', name: 'Burkina Faso', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'CI', name: 'Côte d\'Ivoire', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: true },
  { code: 'GN', name: 'Guinée', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'GW', name: 'Guinée-Bissau', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'ML', name: 'Mali', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'NE', name: 'Niger', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'SN', name: 'Sénégal', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: true },
  { code: 'TG', name: 'Togo', standard: 'SYSCOHADA', region: 'West Africa', taxFormsReady: false },
  { code: 'CM', name: 'Cameroun', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: true },
  { code: 'CF', name: 'République Centrafricaine', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'TD', name: 'Tchad', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'CG', name: 'Congo-Brazzaville', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'CD', name: 'RD Congo', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'GQ', name: 'Guinée équatoriale', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'GA', name: 'Gabon', standard: 'SYSCOHADA', region: 'Central Africa', taxFormsReady: false },
  { code: 'KM', name: 'Comores', standard: 'SYSCOHADA', region: 'East Africa', taxFormsReady: false },

  // IFRS - AFRIQUE ANGLOPHONE (4 pays)
  { code: 'KE', name: 'Kenya', standard: 'IFRS', region: 'East Africa', taxFormsReady: true },
  { code: 'GH', name: 'Ghana', standard: 'IFRS', region: 'West Africa', taxFormsReady: true },
  { code: 'NG', name: 'Nigeria', standard: 'IFRS', region: 'West Africa', taxFormsReady: true },
  { code: 'ZA', name: 'South Africa', standard: 'IFRS', region: 'Southern Africa', taxFormsReady: true },

  // MAGHREB - AFRIQUE DU NORD (3 pays)
  { code: 'DZ', name: 'Algérie', standard: 'SCF', region: 'North Africa', taxFormsReady: true },
  { code: 'MA', name: 'Maroc', standard: 'PCM', region: 'North Africa', taxFormsReady: true },
  { code: 'TN', name: 'Tunisie', standard: 'PCM', region: 'North Africa', taxFormsReady: true }
];

/**
 * Obtenir les pays par région
 */
export function getCountriesByRegion(region: string) {
  return SUPPORTED_COUNTRIES.filter(c => c.region === region);
}

/**
 * Obtenir les pays OHADA uniquement
 */
export function getOhadaCountries() {
  return SUPPORTED_COUNTRIES.filter(c => c.standard === 'SYSCOHADA');
}

/**
 * Vérifier si un pays a ses déclarations fiscales implémentées
 */
export function hasCompleteTaxForms(countryCode: string): boolean {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country?.taxFormsReady ?? false;
}
