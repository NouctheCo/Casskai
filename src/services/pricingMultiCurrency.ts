/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * ⚠️ DEPRECATION NOTICE (2026-02-02):
 * This service uses hardcoded EUR conversion rates.
 * For live exchange rates, use currencyRegistry instead.
 * This service is maintained for legacy LandingPage pricing only.
 * 
 * NEW CODE: Use import { currencyRegistry } from '@/services/currencyRegistry'
 */

import { COUNTRIES, CURRENCIES, BASE_PRICES_EUR, convertPrice, formatPrice as formatCurrencyPrice } from '@/config/currencies';
import { logger } from '@/lib/logger';

export interface CountryPricing {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  accountingStandard: string;
  region: string;

  // Prix pour chaque plan
  starter: {
    monthly: number;
    monthlyOriginal: number;
    yearly: number;
    yearlyOriginal: number;
    discount: number; // Pourcentage de réduction
  };
  professional: {
    monthly: number;
    monthlyOriginal: number;
    yearly: number;
    yearlyOriginal: number;
    discount: number;
  };
  enterprise: {
    monthly: number;
    monthlyOriginal: number;
    yearly: number;
    yearlyOriginal: number;
    discount: number;
  };
}

/**
 * Génère les tarifs pour un pays donné
 */
export function generateCountryPricing(countryCode: string): CountryPricing | null {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return null;

  const currency = CURRENCIES[country.currency];
  if (!currency) return null;

  // Convertir les prix de base EUR vers la devise locale
  const starterMonthly = convertPrice(BASE_PRICES_EUR.starter, country.currency);
  const professionalMonthly = convertPrice(BASE_PRICES_EUR.professional, country.currency);
  const enterpriseMonthly = convertPrice(BASE_PRICES_EUR.enterprise, country.currency);

  // Prix "originaux" (avant réduction de 26%, 22%, 19% respectivement)
  const starterOriginal = Math.round(starterMonthly / 0.74); // -26%
  const professionalOriginal = Math.round(professionalMonthly / 0.78); // -22%
  const enterpriseOriginal = Math.round(enterpriseMonthly / 0.81); // -19%

  // Prix annuels avec remise de 20%
  const starterYearly = Math.round(starterMonthly * 12 * 0.8);
  const professionalYearly = Math.round(professionalMonthly * 12 * 0.8);
  const enterpriseYearly = Math.round(enterpriseMonthly * 12 * 0.8);

  const starterYearlyOriginal = starterOriginal * 12;
  const professionalYearlyOriginal = professionalOriginal * 12;
  const enterpriseYearlyOriginal = enterpriseOriginal * 12;

  return {
    countryCode: country.code,
    countryName: country.name,
    flag: country.flag,
    currency: country.currency,
    currencySymbol: currency.symbol,
    accountingStandard: country.accountingStandard,
    region: country.region,

    starter: {
      monthly: starterMonthly,
      monthlyOriginal: starterOriginal,
      yearly: starterYearly,
      yearlyOriginal: starterYearlyOriginal,
      discount: 26
    },
    professional: {
      monthly: professionalMonthly,
      monthlyOriginal: professionalOriginal,
      yearly: professionalYearly,
      yearlyOriginal: professionalYearlyOriginal,
      discount: 22
    },
    enterprise: {
      monthly: enterpriseMonthly,
      monthlyOriginal: enterpriseOriginal,
      yearly: enterpriseYearly,
      yearlyOriginal: enterpriseYearlyOriginal,
      discount: 19
    }
  };
}

/**
 * Récupère tous les tarifs pour tous les pays
 */
export function getAllCountryPricing(): CountryPricing[] {
  return COUNTRIES.map(country => generateCountryPricing(country.code))
    .filter((pricing): pricing is CountryPricing => pricing !== null);
}

/**
 * Formate un prix avec la devise appropriée
 */
export function formatPriceWithCurrency(amount: number, currencyCode: string): string {
  return formatCurrencyPrice(amount, currencyCode);
}

/**
 * ✅ NOUVEAU: Récupère le pays par défaut avec détection intelligente
 * 1. Préférence utilisateur (localStorage)
 * 2. Langue du navigateur
 * 3. Fallback: France (audience principale)
 */
export function getDefaultCountry(): string {
  // 1️⃣ Vérifier localStorage pour préférence utilisateur
  try {
    const saved = localStorage.getItem('preferredCountry');
    if (saved && COUNTRIES.some(c => c.code === saved)) {
      return saved;
    }
  } catch (e) {
    // localStorage non disponible (SSR ou restrictions)
    logger.warn('PricingMultiCurrency', 'localStorage not available:', e);
  }

  // 2️⃣ Détecter selon la langue du navigateur
  const lang = navigator.language.toLowerCase();

  if (lang.startsWith('fr')) {
    // France par défaut pour France et Belgique FR
    const region = lang.split('-')[1]?.toUpperCase();
    if (region && COUNTRIES.some(c => c.code === region)) {
      return region;
    }
    return 'FR'; // France
  }

  if (lang.startsWith('en')) return 'ZA'; // Afrique du Sud
  if (lang.startsWith('ar')) return 'MA'; // Maroc
  if (lang.startsWith('es')) return 'ES'; // Espagne
  if (lang.startsWith('pt')) return 'PT'; // Portugal
  if (lang.startsWith('de')) return 'DE'; // Allemagne
  if (lang.startsWith('it')) return 'IT'; // Italie
  if (lang.startsWith('nl')) return 'NL'; // Pays-Bas

  // 3️⃣ Fallback: France (audience principale)
  return 'FR';
}

/**
 * ✅ NOUVEAU: Alias pour getDefaultCountry (utilisé dans AuthGuard)
 */
export function getCountry(): string {
  return getDefaultCountry();
}

/**
 * ✅ NOUVEAU: Enregistrer la préférence pays de l'utilisateur
 */
export function setPreferredCountry(countryCode: string): void {
  try {
    if (COUNTRIES.some(c => c.code === countryCode)) {
      localStorage.setItem('preferredCountry', countryCode);
    } else {
      logger.warn('PricingMultiCurrency', `Invalid country code: ${countryCode}`);
    }
  } catch (e) {
    logger.warn('PricingMultiCurrency', 'Could not save preferred country:', e);
  }
}

/**
 * Groupe les pays par région/standard comptable
 */
export interface CountryGroup {
  title: string;
  description: string;
  icon: string;
  countries: CountryPricing[];
}

export function getCountryGroups(): CountryGroup[] {
  const allPricing = getAllCountryPricing();

  return [
    {
      title: 'PCG - Plan Comptable Général',
      description: 'France, Belgique, Luxembourg',
      icon: '🇫🇷',
      countries: allPricing.filter(p => p.accountingStandard === 'PCG')
    },
    {
      title: 'SYSCOHADA',
      description: '17 pays OHADA',
      icon: '🌍',
      countries: allPricing.filter(p => p.accountingStandard === 'SYSCOHADA')
    },
    {
      title: 'SCF / PCG Adapté',
      description: 'Maghreb (Algérie, Maroc, Tunisie)',
      icon: '🌍',
      countries: allPricing.filter(p => p.accountingStandard === 'SCF')
    },
    {
      title: 'IFRS',
      description: 'Afrique anglophone',
      icon: '🌍',
      countries: allPricing.filter(p => p.accountingStandard === 'IFRS')
    }
  ];
}

/**
 * Calcule le pourcentage d'économie
 */
export function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}
