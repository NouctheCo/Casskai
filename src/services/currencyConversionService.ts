import { logger } from '@/utils/logger';
// Service de conversion des devises pour les marchés africains
// Taux de change approximatifs (à mettre à jour régulièrement)

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateFromEUR: number; // Taux par rapport à l'EUR (base)
}

// Taux de change actuels approximatifs (base EUR = 1)
export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  'EUR': {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateFromEUR: 1
  },
  'XOF': {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'CFA',
    rateFromEUR: 655.957 // Taux fixe EUR/XOF
  },
  'XAF': {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'FCFA',
    rateFromEUR: 655.957 // Taux fixe EUR/XAF (même que XOF)
  },
  'GHS': {
    code: 'GHS',
    name: 'Cedi ghanéen',
    symbol: '₵',
    rateFromEUR: 12.5 // Approximatif, à ajuster
  },
  'NGN': {
    code: 'NGN',
    name: 'Naira nigérian',
    symbol: '₦',
    rateFromEUR: 1650 // Approximatif, à ajuster
  },
  'USD': {
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    rateFromEUR: 1.05 // Approximatif
  },
  'GBP': {
    code: 'GBP',
    name: 'Livre sterling',
    symbol: '£',
    rateFromEUR: 0.85 // Approximatif
  },
  'CAD': {
    code: 'CAD',
    name: 'Dollar canadien',
    symbol: 'CAD$',
    rateFromEUR: 1.45 // Approximatif
  }
};

// Fonction pour convertir un prix d'EUR vers une autre devise
export function convertPrice(priceEUR: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency];
  if (!rate) {
    logger.warn(`Devise non supportée: ${targetCurrency}`);
    return priceEUR;
  }
  
  const convertedPrice = priceEUR * rate.rateFromEUR;
  
  // Arrondi intelligent selon la devise
  if (targetCurrency === 'XOF' || targetCurrency === 'XAF') {
    // Pour les francs CFA, arrondir à la dizaine proche
    return Math.round(convertedPrice / 10) * 10;
  } else if (targetCurrency === 'NGN') {
    // Pour le Naira, arrondir à la centaine proche
    return Math.round(convertedPrice / 100) * 100;
  } else if (targetCurrency === 'GHS') {
    // Pour le Cedi, arrondir à l'unité
    return Math.round(convertedPrice);
  } else {
    // Pour les autres devises, garder 2 décimales
    return Math.round(convertedPrice * 100) / 100;
  }
}

// Fonction pour formater un prix selon la devise
export function formatPriceWithCurrency(price: number, currency: string): string {
  const rate = CURRENCY_RATES[currency];
  if (!rate) {
    return `${price} €`;
  }
  
  // Formatage selon la devise
  switch (currency) {
    case 'XOF':
    case 'XAF':
      return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${rate.symbol}`;
    case 'NGN':
      return `${rate.symbol}${price.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'GHS':
      return `${rate.symbol}${price.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    case 'USD':
      return `${rate.symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${rate.symbol}`;
    case 'GBP':
      return `${rate.symbol}${price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'CAD':
      return `${rate.symbol}${price.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return `${price} ${rate.symbol}`;
  }
}

// Fonction pour obtenir les informations d'une devise
export function getCurrencyInfo(currency: string): CurrencyRate | null {
  return CURRENCY_RATES[currency] || null;
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