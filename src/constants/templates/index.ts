/**
 * CassKai - Index des templates réglementaires
 * Exportations centralisées pour tous les templates
 */

import type { RegulatoryTemplate } from '@/types/regulatory';

import {
  FRANCE_TEMPLATES_CONFIG,
  generateAllFranceTemplates,
  getFranceTemplateConfig,
  FRANCE_DOCUMENT_TYPES,
} from './allFranceTemplates';

import {
  OHADA_TEMPLATES_CONFIG,
  generateAllOhadaTemplates,
  getOhadaTemplateConfig,
  OHADA_DOCUMENT_TYPES,
  getOhadaTemplatesByCountry,
} from './ohadaTemplates';

import {
  IFRS_TEMPLATES_CONFIG,
  generateAllIfrsTemplates,
  getIfrsTemplateConfig,
  IFRS_DOCUMENT_TYPES,
  getIfrsTemplatesByCountry,
} from './ifrsTemplates';

import {
  MAGHREB_TEMPLATES_CONFIG,
  generateAllMaghrebTemplates,
  getMaghrebTemplateConfig,
  MAGHREB_DOCUMENT_TYPES,
  getMaghrebTemplatesByCountry,
} from './maghrebTemplates';

import {
  createTemplateFromConfig,
  createTemplatesFromConfigs,
  type TemplateConfig,
  type SectionConfig,
  type FieldConfig,
} from './templateFactory';

export {
  FRANCE_TEMPLATES_CONFIG,
  generateAllFranceTemplates,
  getFranceTemplateConfig,
  FRANCE_DOCUMENT_TYPES,
  OHADA_TEMPLATES_CONFIG,
  generateAllOhadaTemplates,
  getOhadaTemplateConfig,
  OHADA_DOCUMENT_TYPES,
  getOhadaTemplatesByCountry,
  IFRS_TEMPLATES_CONFIG,
  generateAllIfrsTemplates,
  getIfrsTemplateConfig,
  IFRS_DOCUMENT_TYPES,
  getIfrsTemplatesByCountry,
  MAGHREB_TEMPLATES_CONFIG,
  generateAllMaghrebTemplates,
  getMaghrebTemplateConfig,
  MAGHREB_DOCUMENT_TYPES,
  getMaghrebTemplatesByCountry,
  createTemplateFromConfig,
  createTemplatesFromConfigs,
};
export type { TemplateConfig, SectionConfig, FieldConfig };

/**
 * Génère TOUS les templates (79 documents)
 */
export function generateAllRegulatoryTemplates(): Array<Omit<RegulatoryTemplate, 'id' | 'createdAt' | 'updatedAt'>> {
  return [
    ...generateAllFranceTemplates(),
    ...generateAllOhadaTemplates(),
    ...generateAllIfrsTemplates(),
    ...generateAllMaghrebTemplates()
  ];
}

/**
 * Statistiques des templates
 */
export const TEMPLATE_STATS = {
  france: {
    count: 25,
    standard: 'PCG',
    countries: 1,
    countryCodes: ['FR']
  },
  ohada: {
    count: 16, // 4 états financiers + 12 déclarations fiscales (3 pays)
    standard: 'SYSCOHADA',
    countries: 17, // Tous les pays OHADA partagent les mêmes états financiers
    countriesWithTax: 3, // Seulement 3 pays ont les déclarations fiscales complètes
    countryCodesWithTax: ['SN', 'CI', 'CM'],
    allCountryCodes: ['BJ', 'BF', 'CM', 'CF', 'KM', 'CG', 'CD', 'CI', 'GA', 'GN', 'GW', 'GQ', 'ML', 'NE', 'SN', 'TD', 'TG']
  },
  ifrs: {
    count: 21,
    standard: 'IFRS',
    countries: 4,
    countryCodes: ['KE', 'NG', 'GH', 'ZA']
  },
  maghreb: {
    count: 17,
    standard: 'SCF/PCM',
    countries: 3,
    countryCodes: ['DZ', 'TN', 'MA']
  },
  total: 79, // 25 FR + 16 OHADA + 21 IFRS + 17 Maghreb
  totalCountries: 25, // 1 FR + 17 OHADA + 4 IFRS + 3 Maghreb
  countriesWithCompleteTaxForms: 11 // FR, SN, CI, CM, KE, NG, GH, ZA, DZ, TN, MA
};

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
