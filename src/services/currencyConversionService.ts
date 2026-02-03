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
// Service de conversion des devises (compatibilité)
// IMPORTANT: Les taux sont désormais centralisés via currencyRegistry.
import { currencyRegistry } from '@/services/currencyRegistry';
import { CurrencyService, type Currency } from '@/services/currencyService';
import type { CurrencyCode } from '@/hooks/useCompanyCurrency';
import { logger } from '@/lib/logger';

// Fonction pour convertir un prix d'EUR vers une autre devise
export async function convertPrice(priceEUR: number, targetCurrency: CurrencyCode): Promise<number> {
  try {
    return await currencyRegistry.convertPriceFromEUR(priceEUR, targetCurrency);
  } catch (error) {
    logger.warn('CurrencyConversion', 'Conversion fallback (EUR)', error);
    return priceEUR;
  }
}

// Fonction pour formater un prix selon la devise
export function formatPriceWithCurrency(price: number, currency: string): string {
  try {
    const currencyService = CurrencyService.getInstance();
    return currencyService.formatAmount(price, currency);
  } catch (error) {
    logger.warn('CurrencyConversion', 'Format fallback', error);
    return `${price} ${currency}`;
  }
}

// Fonction pour obtenir les informations d'une devise
export function getCurrencyInfo(currency: string): Currency | null {
  const currencyService = CurrencyService.getInstance();
  return currencyService.getCurrency(currency) || null;
}
// Liste des pays africains supportés
export const AFRICAN_COUNTRIES = [
  { code: 'fr-BJ', name: 'Bénin', flag: '🇧🇯', currency: 'XOF', region: 'west-africa' },
  { code: 'fr-CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', currency: 'XOF', region: 'west-africa' },
  { code: 'fr-TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', region: 'west-africa' },
  { code: 'en-GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', region: 'west-africa' },
  { code: 'fr-CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF', region: 'central-africa' },
  { code: 'en-NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', region: 'west-africa' },
  { code: 'fr-GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF', region: 'central-africa' }
];
// Fonction pour obtenir le pays par défaut basé sur la géolocalisation (optionnel)
export function getDefaultCountryFromLocale(browserLocale: string): string {
  // Détecter le pays basé sur la locale du navigateur
  const locale = browserLocale.toLowerCase();
  if (locale.includes('fr')) {
    return 'fr-CI'; // Côte d'Ivoire par défaut pour le français
  } else if (locale.includes('en')) {
    return 'en-NG'; // Nigeria par défaut pour l'anglais
  }
  return 'fr-CI'; // Par défaut
}