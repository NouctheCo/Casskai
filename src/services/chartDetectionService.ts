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

/** Mapping pays → Plan comptable recommandé */
export const COUNTRY_TO_CHART_MAP: Record<string, 'SYSCOHADA' | 'PCG' | 'IAS_IFRS' | 'UK_GAAP' | 'US_GAAP'> = {
  // OHADA
  ...Object.fromEntries(OHADA_COUNTRIES.map(c => [c, 'SYSCOHADA' as const])),
  
  // France et DOM-TOM
  'FR': 'PCG',
  'RE': 'PCG', // Réunion
  'GP': 'PCG', // Guadeloupe
  'MQ': 'PCG', // Martinique
  'GF': 'PCG', // Guyane
  'YT': 'PCG', // Mayotte
  'NC': 'PCG', // Nouvelle-Calédonie
  'PF': 'PCG', // Polynésie française
  
  // UK
  'GB': 'UK_GAAP',
  
  // USA
  'US': 'US_GAAP',
  
  // Pays UE (peuvent choisir IAS/IFRS ou plan local)
  ...Object.fromEntries(EU_COUNTRIES.map(c => [c, 'IAS_IFRS' as const]))
};

// ========================================
// TYPES
// ========================================

export interface ChartDetectionResult {
  recommended: AccountPlan;
  alternatives: AccountPlan[];
  countryCode: string;
  countryName: string;
  zone: 'OHADA' | 'EU' | 'OTHER';
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

  // France + DOM-TOM (confidence HIGH)
  if (upperCode === 'FR' || ['RE', 'GP', 'MQ', 'GF', 'YT', 'NC', 'PF'].includes(upperCode)) {
    return {
      recommended: PCG_FRANCE,
      alternatives: [],
      countryCode: upperCode,
      countryName: getCountryName(upperCode),
      zone: 'OTHER',
      confidence: 'HIGH',
      reasoning: 'Plan Comptable Général (PCG) français, obligatoire en France et DOM-TOM.'
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
console.log(detection.recommended); // SYSCOHADA_PLAN
console.log(detection.reasoning); // "Pays membre de l'OHADA..."

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
