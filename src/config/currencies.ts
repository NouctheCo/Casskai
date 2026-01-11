/**
 * Configuration des devises et pays supportés
 * Basé sur les annonces de la landing page
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  conversionRateFromEUR: number; // Taux de conversion depuis EUR
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  accountingStandard: 'PCG' | 'SYSCOHADA' | 'SCF' | 'IFRS';
  region: 'europe' | 'ohada' | 'maghreb' | 'anglophone';
}

// Taux de conversion approximatifs (à jour Novembre 2024)
// Base: 1 EUR = X unités de devise locale
export const CURRENCIES: Record<string, Currency> = {
  EUR: {
    code: 'EUR',
    symbol: ' EUR',
    name: 'Euro',
    conversionRateFromEUR: 1
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'Franc CFA (BCEAO)',
    conversionRateFromEUR: 655.957 // Taux fixe
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA (BEAC)',
    conversionRateFromEUR: 655.957 // Taux fixe
  },
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar algérien',
    conversionRateFromEUR: 145
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Dirham marocain',
    conversionRateFromEUR: 11
  },
  TND: {
    code: 'TND',
    symbol: 'DT',
    name: 'Dinar tunisien',
    conversionRateFromEUR: 3.4
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'Rand sud-africain',
    conversionRateFromEUR: 20
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Naira nigérian',
    conversionRateFromEUR: 1700
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Shilling kényan',
    conversionRateFromEUR: 140
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Cedi ghanéen',
    conversionRateFromEUR: 16
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Shilling tanzanien',
    conversionRateFromEUR: 2700
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Shilling ougandais',
    conversionRateFromEUR: 4000
  },
  RWF: {
    code: 'RWF',
    symbol: 'FRw',
    name: 'Franc rwandais',
    conversionRateFromEUR: 1400
  },
  ZMW: {
    code: 'ZMW',
    symbol: 'ZK',
    name: 'Kwacha zambien',
    conversionRateFromEUR: 28
  },
  ZWL: {
    code: 'ZWL',
    symbol: 'Z$',
    name: 'Dollar zimbabwéen',
    conversionRateFromEUR: 350
  },
  BWP: {
    code: 'BWP',
    symbol: 'P',
    name: 'Pula botswanais',
    conversionRateFromEUR: 15
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain',
    conversionRateFromEUR: 1.08
  }
};

// Liste complète des pays supportés
export const COUNTRIES: Country[] = [
  // 🇫🇷 PCG - Europe
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    accountingStandard: 'PCG',
    region: 'europe'
  },
  {
    code: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    currency: 'EUR',
    accountingStandard: 'PCG',
    region: 'europe'
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    flag: '🇱🇺',
    currency: 'EUR',
    accountingStandard: 'PCG',
    region: 'europe'
  },

  // 🌍 SYSCOHADA - 17 pays OHADA
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'CG',
    name: 'Congo-Brazzaville',
    flag: '🇨🇬',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'NE',
    name: 'Niger',
    flag: '🇳🇪',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'TD',
    name: 'Tchad',
    flag: '🇹🇩',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'CF',
    name: 'République Centrafricaine',
    flag: '🇨🇫',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'GW',
    name: 'Guinée-Bissau',
    flag: '🇬🇼',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'GQ',
    name: 'Guinée Équatoriale',
    flag: '🇬🇶',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'KM',
    name: 'Comores',
    flag: '🇰🇲',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'CD',
    name: 'RD Congo',
    flag: '🇨🇩',
    currency: 'XAF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },
  {
    code: 'GN',
    name: 'Guinée',
    flag: '🇬🇳',
    currency: 'XOF',
    accountingStandard: 'SYSCOHADA',
    region: 'ohada'
  },

  // 🌍 SCF / PCG Adapté - Maghreb
  {
    code: 'DZ',
    name: 'Algérie',
    flag: '🇩🇿',
    currency: 'DZD',
    accountingStandard: 'SCF',
    region: 'maghreb'
  },
  {
    code: 'MA',
    name: 'Maroc',
    flag: '🇲🇦',
    currency: 'MAD',
    accountingStandard: 'SCF',
    region: 'maghreb'
  },
  {
    code: 'TN',
    name: 'Tunisie',
    flag: '🇹🇳',
    currency: 'TND',
    accountingStandard: 'SCF',
    region: 'maghreb'
  },

  // 🌍 IFRS - Afrique anglophone
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    flag: '🇿🇦',
    currency: 'ZAR',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'TZ',
    name: 'Tanzanie',
    flag: '🇹🇿',
    currency: 'TZS',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'UG',
    name: 'Ouganda',
    flag: '🇺🇬',
    currency: 'UGX',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'ZM',
    name: 'Zambie',
    flag: '🇿🇲',
    currency: 'ZMW',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    flag: '🇿🇼',
    currency: 'ZWL',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  },
  {
    code: 'BW',
    name: 'Botswana',
    flag: '🇧🇼',
    currency: 'BWP',
    accountingStandard: 'IFRS',
    region: 'anglophone'
  }
];

// Tarifs de base en EUR (depuis la landing page)
export const BASE_PRICES_EUR = {
  starter: 29,
  professional: 69,
  enterprise: 129
};

/**
 * Convertit un prix EUR vers une devise locale
 */
export function convertPrice(priceEUR: number, currencyCode: string): number {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return priceEUR;

  const convertedPrice = priceEUR * currency.conversionRateFromEUR;

  // Arrondir intelligemment selon la devise
  if (currency.code === 'XOF' || currency.code === 'XAF') {
    // Franc CFA: arrondir à 1000
    return Math.round(convertedPrice / 1000) * 1000;
  } else if (['NGN', 'TZS', 'UGX', 'RWF'].includes(currency.code)) {
    // Grandes devises: arrondir à 100
    return Math.round(convertedPrice / 100) * 100;
  } else if (['ZAR', 'KES', 'GHS', 'ZMW', 'BWP'].includes(currency.code)) {
    // Devises moyennes: arrondir à 10
    return Math.round(convertedPrice / 10) * 10;
  } else {
    // Autres devises: arrondir à l'unité
    return Math.round(convertedPrice);
  }
}

/**
 * Formate un prix avec le symbole de la devise
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount}`;

  // Format spécial pour les devises CFA
  if (currency.code === 'XOF' || currency.code === 'XAF') {
    return `${amount.toLocaleString('fr-FR')} ${currency.symbol}`;
  }

  // Format avec le symbole avant ou après selon la devise
  if (['EUR', 'USD', 'GBP'].includes(currency.code)) {
    return `${currency.symbol}${amount.toLocaleString('fr-FR')}`;
  } else {
    return `${amount.toLocaleString('fr-FR')} ${currency.symbol}`;
  }
}

/**
 * Trouve un pays par son code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Trouve une devise par son code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES[code];
}

/**
 * Récupère tous les pays d'une région
 */
export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter(c => c.region === region);
}

/**
 * Récupère tous les pays utilisant un standard comptable
 */
export function getCountriesByAccountingStandard(standard: string): Country[] {
  return COUNTRIES.filter(c => c.accountingStandard === standard);
}
