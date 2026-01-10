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
 * 🌍 SERVICE DÉTECTION PLAN COMPTABLE
 * 
 * Détecte automatiquement le plan comptable approprié selon:
 * - Pays de l'entreprise
 * - Zone géographique (OHADA, UE, etc.)
 * - Préférences utilisateur
 * 
 * Plans supportés:
 * - ✅ SYSCOHADA (16 pays d'Afrique)
 * - ✅ PCG France
 * - 🔄 IAS/IFRS (International)
 * - 🔄 UK GAAP (Royaume-Uni)
 * - 🔄 US GAAP (États-Unis)
 */
import { SYSCOHADA_PLAN, SYSCOHADA_ACCOUNTS } from '@/data/syscohada';
import PCG_FRANCE from '@/data/pcg';
import type { AccountPlan } from '@/types/accounting';
import { logger } from '@/lib/logger';
// ========================================
// CONSTANTES GÉOGRAPHIQUES
// ========================================
/** Pays membres de l'OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires) */
export const OHADA_COUNTRIES = [
  'BJ', // Bénin
  'BF', // Burkina Faso
  'CM', // Cameroun
  'CF', // République Centrafricaine
  'KM', // Comores
  'CG', // Congo-Brazzaville
  'CD', // RD Congo
  'CI', // Côte d'Ivoire
  'GA', // Gabon
  'GN', // Guinée
  'GQ', // Guinée Équatoriale
  'GW', // Guinée-Bissau
  'ML', // Mali
  'NE', // Niger
  'SN', // Sénégal
  'TD', // Tchad
  'TG'  // Togo
] as const;
/** Pays de l'Union Européenne */
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
] as const;
/** Pays du Maghreb utilisant SCF/PCG Adapté */
export const MAGHREB_COUNTRIES = [
  'DZ', // Algérie (SCF - Système Comptable Financier)
  'MA', // Maroc (PCG marocain inspiré du français)
  'TN'  // Tunisie (Système comptable tunisien inspiré du français)
] as const;
/** Pays anglophones africains utilisant IFRS */
export const IFRS_AFRICA_COUNTRIES = [
  'ZA', // Afrique du Sud
  'NG', // Nigeria
  'KE', // Kenya
  'GH', // Ghana
  'TZ', // Tanzanie
  'UG', // Ouganda
  'RW', // Rwanda
  'ZM', // Zambie
  'ZW', // Zimbabwe
  'BW'  // Botswana
] as const;
/** Mapping pays → Plan comptable recommandé */
export const COUNTRY_TO_CHART_MAP: Record<string, 'SYSCOHADA' | 'PCG' | 'SCF' | 'IAS_IFRS' | 'UK_GAAP' | 'US_GAAP'> = {
  // OHADA (17 pays)
  ...Object.fromEntries(OHADA_COUNTRIES.map(c => [c, 'SYSCOHADA' as const])),
  // France, Belgique, Luxembourg (PCG)
  'FR': 'PCG',
  'BE': 'PCG',
  'LU': 'PCG',
  // DOM-TOM français
  'RE': 'PCG', // Réunion
  'GP': 'PCG', // Guadeloupe
  'MQ': 'PCG', // Martinique
  'GF': 'PCG', // Guyane
  'YT': 'PCG', // Mayotte
  'NC': 'PCG', // Nouvelle-Calédonie
  'PF': 'PCG', // Polynésie française
  // Maghreb (3 pays - SCF/PCG Adapté)
  ...Object.fromEntries(MAGHREB_COUNTRIES.map(c => [c, 'SCF' as const])),
  // Afrique anglophone (10 pays - IFRS)
  ...Object.fromEntries(IFRS_AFRICA_COUNTRIES.map(c => [c, 'IAS_IFRS' as const])),
  // UK
  'GB': 'UK_GAAP',
  // USA
  'US': 'US_GAAP',
  // Autres pays UE (peuvent choisir IAS/IFRS ou plan local)
  ...Object.fromEntries(EU_COUNTRIES.filter(c => !['FR', 'BE', 'LU'].includes(c)).map(c => [c, 'IAS_IFRS' as const]))
};
// ========================================
// TYPES
// ========================================
export interface ChartDetectionResult {
  recommended: AccountPlan;
  alternatives: AccountPlan[];
  countryCode: string;
  countryName: string;
  zone: 'OHADA' | 'MAGHREB' | 'IFRS_AFRICA' | 'EU' | 'OTHER';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
}
// ========================================
// DÉTECTION AUTOMATIQUE
// ========================================
/**
 * Détecte le plan comptable recommandé pour une entreprise
 * @param countryCode Code pays ISO 3166-1 alpha-2 (ex: "FR", "CI", "SN")
 * @param companySize Taille entreprise (influence le choix)
 * @param industry Secteur d'activité (influence le choix)
 * @returns Plan comptable recommandé + alternatives
 */
export function detectChartOfAccounts(
  countryCode: string,
  companySize?: 'micro' | 'small' | 'medium' | 'large',
  _industry?: string
): ChartDetectionResult {
  const upperCode = countryCode.toUpperCase();
  // Déterminer zone géographique
  const zone = (OHADA_COUNTRIES as readonly string[]).includes(upperCode)
    ? 'OHADA'
    : (MAGHREB_COUNTRIES as readonly string[]).includes(upperCode)
    ? 'MAGHREB'
    : (IFRS_AFRICA_COUNTRIES as readonly string[]).includes(upperCode)
    ? 'IFRS_AFRICA'
    : (EU_COUNTRIES as readonly string[]).includes(upperCode)
    ? 'EU'
    : 'OTHER';
  // Détection OHADA (confidence HIGH)
  if (zone === 'OHADA') {
    return {
      recommended: SYSCOHADA_PLAN,
      alternatives: [PCG_FRANCE], // Certaines multinationales utilisent PCG
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'OHADA',
      confidence: 'HIGH',
      reasoning: `Pays membre de l'OHADA. Le SYSCOHADA révisé 2017 est obligatoire pour la comptabilité officielle dans les ${OHADA_COUNTRIES.length} pays membres.`
    };
  }
  // Maghreb - SCF/PCG Adapté (confidence HIGH)
  if (zone === 'MAGHREB') {
    return {
      recommended: PCG_FRANCE, // Utilise PCG comme base (SCF et PCG marocain/tunisien s'en inspirent)
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'MAGHREB',
      confidence: 'HIGH',
      reasoning: 'Système Comptable Financier (SCF) ou PCG adapté. Le PCG français est utilisé comme base car les standards du Maghreb s\'en inspirent fortement.'
    };
  }
  // Afrique anglophone - IFRS (confidence HIGH)
  if (zone === 'IFRS_AFRICA') {
    return {
      recommended: PCG_FRANCE, // Temporaire - IFRS templates seront ajoutés
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'IFRS_AFRICA',
      confidence: 'HIGH',
      reasoning: 'Standards internationaux IFRS obligatoires dans ce pays. Templates IFRS complets seront déployés prochainement.'
    };
  }
  // France, Belgique, Luxembourg + DOM-TOM (confidence HIGH)
  if (['FR', 'BE', 'LU', 'RE', 'GP', 'MQ', 'GF', 'YT', 'NC', 'PF'].includes(upperCode)) {
    return {
      recommended: PCG_FRANCE,
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'OTHER',
      confidence: 'HIGH',
      reasoning: 'Plan Comptable Général (PCG) français, obligatoire en France, Belgique, Luxembourg et DOM-TOM.'
    };
  }
  // UE - Grandes entreprises (IAS/IFRS recommandé)
  if (zone === 'EU' && companySize === 'large') {
    return {
      recommended: PCG_FRANCE, // Temporaire - IAS/IFRS pas encore implémenté
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'EU',
      confidence: 'MEDIUM',
      reasoning: 'Union Européenne - IAS/IFRS recommandé pour grandes entreprises (en développement). PCG utilisé temporairement.'
    };
  }
  // UE - PME (Plan local recommandé)
  if (zone === 'EU') {
    return {
      recommended: PCG_FRANCE,
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'EU',
      confidence: 'MEDIUM',
      reasoning: 'Union Européenne - PCG français utilisé par défaut. Possibilité d\'adapter au plan comptable local selon le pays.'
    };
  }
  // Autres pays (fallback PCG)
  return {
    recommended: PCG_FRANCE,
    alternatives: [],
    countryCode: upperCode,
    countryName: getCountryName(upperCode),
    zone: 'OTHER',
    confidence: 'LOW',
    reasoning: 'Pays hors OHADA/UE. Plan Comptable Général français utilisé par défaut. Peut nécessiter adaptation locale.'
  };
}
/**
 * Vérifie si un pays doit utiliser SYSCOHADA
 */
export function requiresSYSCOHADA(countryCode: string): boolean {
  return (OHADA_COUNTRIES as readonly string[]).includes(countryCode.toUpperCase());
}
/**
 * Obtient le plan comptable selon le code
 */
export function getChartPlanByCode(code: 'SYSCOHADA' | 'PCG'): AccountPlan {
  return code === 'SYSCOHADA' ? SYSCOHADA_PLAN : PCG_FRANCE;
}
/**
 * Liste tous les comptes disponibles pour un plan
 */
export function getAccountsForPlan(code: 'SYSCOHADA' | 'PCG') {
  if (code === 'SYSCOHADA') {
    return SYSCOHADA_ACCOUNTS;
  }
  // TODO: Implémenter PCG_ACCOUNTS similaire
  return SYSCOHADA_ACCOUNTS; // Fallback
}
// ========================================
// UTILITAIRES
// ========================================
/** Mapping code pays → Nom pays (simplifié) */
function getCountryName(code: string): string {
  const names: Record<string, string> = {
    // OHADA
    'BJ': 'Bénin',
    'BF': 'Burkina Faso',
    'CM': 'Cameroun',
    'CF': 'République Centrafricaine',
    'KM': 'Comores',
    'CG': 'Congo-Brazzaville',
    'CD': 'République Démocratique du Congo',
    'CI': 'Côte d\'Ivoire',
    'GA': 'Gabon',
    'GN': 'Guinée',
    'GQ': 'Guinée Équatoriale',
    'GW': 'Guinée-Bissau',
    'ML': 'Mali',
    'NE': 'Niger',
    'SN': 'Sénégal',
    'TD': 'Tchad',
    'TG': 'Togo',
    // France
    'FR': 'France',
    'RE': 'La Réunion',
    'GP': 'Guadeloupe',
    'MQ': 'Martinique',
    'GF': 'Guyane',
    'YT': 'Mayotte',
    // Autres
    'US': 'United States',
    'GB': 'United Kingdom',
    'DE': 'Allemagne',
    'ES': 'Espagne',
    'IT': 'Italie',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'CA': 'Canada',
    'MA': 'Maroc',
    'DZ': 'Algérie',
    'TN': 'Tunisie'
  };
  return names[code] || code;
}
/**
 * Format un numéro de compte SYSCOHADA pour affichage
 * Ex: "601" → "601 - Achats de marchandises"
 */
export function formatSYSCOHADAAccount(accountNumber: string): string {
  const account = SYSCOHADA_ACCOUNTS.find(a => a.number === accountNumber);
  return account ? `${account.number} - ${account.name}` : accountNumber;
}
/**
 * Recherche comptes SYSCOHADA par mot-clé
 */
export function searchSYSCOHADAAccounts(query: string): typeof SYSCOHADA_ACCOUNTS {
  const lowerQuery = query.toLowerCase();
  return SYSCOHADA_ACCOUNTS.filter(acc =>
    acc.number.includes(query) ||
    acc.name.toLowerCase().includes(lowerQuery)
  );
}
// ========================================
// EXEMPLES UTILISATION
// ========================================
/*
// 1. Détection automatique à la création d'entreprise
const detection = detectChartOfAccounts('SN'); // Sénégal
logger.debug('ChartDetection', 'Debug', detection.recommended); // SYSCOHADA_PLAN
logger.debug('ChartDetection', 'Debug', detection.reasoning); // "Pays membre de l'OHADA..."
// 2. Vérification OHADA obligatoire
if (requiresSYSCOHADA('CI')) {
  // Forcer SYSCOHADA pour Côte d'Ivoire
  setCompanyChart(SYSCOHADA_PLAN);
}
// 3. Recherche de comptes
const results = searchSYSCOHADAAccounts('achats');
// [{number: "601", name: "Achats de marchandises", ...}, ...]
// 4. Format affichage
const formatted = formatSYSCOHADAAccount("601");
// "601 - Achats de marchandises"
*/