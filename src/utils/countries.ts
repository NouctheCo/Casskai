/**
 * Base de données complète des pays et devises supportés par CassKai
 * Couvre l'Europe (France) et l'Afrique principalement
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimals: number;
  thousandSeparator: string;
  decimalSeparator: string;
  exchangeRateToEUR?: number; // Taux indicatif, sera remplacé par API
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  continent: string;
  region: string;
  currency: string;
  languages: string[];
  timezone: string;
  phoneCode: string;
  businessIdFormat?: {
    name: string;
    pattern?: string;
    example?: string;
  };
}

// 6 DEVISES PRIORITAIRES
export const CURRENCIES: Record<string, Currency> = {
  // Europe
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 1.0,
  },
  
  // Afrique - CFA Ouest (8 pays)
  XOF: {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'CFA',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 655.957, // Taux fixe
  },
  
  // Afrique - CFA Central (6 pays)  
  XAF: {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'FCFA',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 655.957, // Taux fixe
  },
  
  // International
  USD: {
    code: 'USD',
    name: 'Dollar US',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    exchangeRateToEUR: 0.85, // Variable - sera remplacé par API
  },
  
  // Maroc - Marché prioritaire
  MAD: {
    code: 'MAD',
    name: 'Dirham marocain',
    symbol: 'MAD',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 10.8, // Variable
  },
  
  // Kenya - Marché test #1
  KES: {
    code: 'KES',
    name: 'Shilling kenyan',
    symbol: 'KSh',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    exchangeRateToEUR: 130.0, // Variable
  },

  // Nigeria
  NGN: {
    code: 'NGN',
    name: 'Naira nigérian',
    symbol: '₦',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    exchangeRateToEUR: 1600, // Variable
  },

  // Ghana
  GHS: {
    code: 'GHS',
    name: 'Cedi ghanéen',
    symbol: 'GH₵',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    exchangeRateToEUR: 15, // Variable
  },

  // Afrique du Sud
  ZAR: {
    code: 'ZAR',
    name: 'Rand sud-africain',
    symbol: 'R',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 20, // Variable
  },

  // Égypte
  EGP: {
    code: 'EGP',
    name: 'Livre égyptienne',
    symbol: 'E£',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    exchangeRateToEUR: 53, // Variable
  },

  // Algérie
  DZD: {
    code: 'DZD',
    name: 'Dinar algérien',
    symbol: 'د.ج',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 145, // Variable
  },

  // Tunisie
  TND: {
    code: 'TND',
    name: 'Dinar tunisien',
    symbol: 'د.ت',
    symbolPosition: 'after',
    decimals: 3,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    exchangeRateToEUR: 3.4, // Variable
  },
};

// PAYS SUPPORTÉS PAR CASSKAI
export const COUNTRIES: Record<string, Country> = {
  // EUROPE
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    continent: 'Europe',
    region: 'Europe de l\'Ouest',
    currency: 'EUR',
    languages: ['fr'],
    timezone: 'Europe/Paris',
    phoneCode: '+33',
    businessIdFormat: {
      name: 'SIRET',
      pattern: '^[0-9]{14}$',
      example: '12345678901234',
    },
  },

  // AFRIQUE DE L'OUEST (Zone CFA BCEAO - XOF)
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    continent: 'Africa',
    region: 'Afrique de l\'Ouest',
    currency: 'XOF',
    languages: ['fr'],
    timezone: 'Africa/Porto-Novo',
    phoneCode: '+229',
    businessIdFormat: {
      name: 'Numéro IFU',
      example: '2021234567890',
    },
  },
  
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    continent: 'Africa',
    region: 'Afrique de l\'Ouest',
    currency: 'XOF',
    languages: ['fr'],
    timezone: 'Africa/Abidjan',
    phoneCode: '+225',
    businessIdFormat: {
      name: 'Numéro CC',
      example: 'CI-ABJ-2021-B-12345',
    },
  },
  
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    continent: 'Africa',
    region: 'Afrique de l\'Ouest',
    currency: 'XOF',
    languages: ['fr'],
    timezone: 'Africa/Dakar',
    phoneCode: '+221',
    businessIdFormat: {
      name: 'Numéro NINEA',
      example: '2021234567890123',
    },
  },

  // AFRIQUE DE L'OUEST (Autres devises)
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    continent: 'Africa',
    region: 'Afrique de l\'Ouest',
    currency: 'NGN',
    languages: ['en'],
    timezone: 'Africa/Lagos',
    phoneCode: '+234',
    businessIdFormat: {
      name: 'RC Number',
      example: 'RC123456',
    },
  },

  GH: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    continent: 'Africa',
    region: 'Afrique de l\'Ouest',
    currency: 'GHS',
    languages: ['en'],
    timezone: 'Africa/Accra',
    phoneCode: '+233',
    businessIdFormat: {
      name: 'Company Number',
      example: 'C12345678',
    },
  },

  // AFRIQUE CENTRALE (Zone CFA BEAC - XAF)
  CM: {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    continent: 'Africa',
    region: 'Afrique Centrale',
    currency: 'XAF',
    languages: ['fr', 'en'],
    timezone: 'Africa/Douala',
    phoneCode: '+237',
    businessIdFormat: {
      name: 'Numéro RC',
      example: 'RC/DLA/2021/B/1234',
    },
  },

  // AFRIQUE DU NORD
  MA: {
    code: 'MA',
    name: 'Maroc',
    flag: '🇲🇦',
    continent: 'Africa',
    region: 'Afrique du Nord',
    currency: 'MAD',
    languages: ['ar', 'fr'],
    timezone: 'Africa/Casablanca',
    phoneCode: '+212',
    businessIdFormat: {
      name: 'Registre de Commerce',
      example: '12345',
    },
  },
  
  EG: {
    code: 'EG',
    name: 'Égypte',
    flag: '🇪🇬',
    continent: 'Africa',
    region: 'Afrique du Nord',
    currency: 'EGP',
    languages: ['ar', 'en'],
    timezone: 'Africa/Cairo',
    phoneCode: '+20',
    businessIdFormat: {
      name: 'Tax Number',
      example: '123-456-789',
    },
  },

  // AFRIQUE DE L'EST
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    continent: 'Africa',
    region: 'Afrique de l\'Est',
    currency: 'KES',
    languages: ['en', 'sw'],
    timezone: 'Africa/Nairobi',
    phoneCode: '+254',
    businessIdFormat: {
      name: 'KRA PIN',
      example: 'P051234567A',
    },
  },

  // AFRIQUE AUSTRALE
  ZA: {
    code: 'ZA',
    name: 'Afrique du Sud',
    flag: '🇿🇦',
    continent: 'Africa',
    region: 'Afrique Australe',
    currency: 'ZAR',
    languages: ['en', 'af'],
    timezone: 'Africa/Johannesburg',
    phoneCode: '+27',
    businessIdFormat: {
      name: 'Registration Number',
      example: '2021/123456/07',
    },
  },
};

// UTILITAIRES DE FORMATAGE

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount}`;
  
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
    useGrouping: true,
  }).format(amount);
  
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
}

export function getCountryByCurrency(currencyCode: string): Country[] {
  return Object.values(COUNTRIES).filter(country => country.currency === currencyCode);
}

export function getCountriesByRegion(region: string): Country[] {
  return Object.values(COUNTRIES).filter(country => country.region === region);
}

export function getCountriesByContinent(continent: string): Country[] {
  return Object.values(COUNTRIES).filter(country => country.continent === continent);
}

// GROUPES DE PAYS POUR LES SELECTS
export const COUNTRIES_BY_REGION = {
  'Europe': Object.values(COUNTRIES).filter(c => c.continent === 'Europe'),
  'Afrique de l\'Ouest': Object.values(COUNTRIES).filter(c => c.region === 'Afrique de l\'Ouest'),
  'Afrique Centrale': Object.values(COUNTRIES).filter(c => c.region === 'Afrique Centrale'),
  'Afrique du Nord': Object.values(COUNTRIES).filter(c => c.region === 'Afrique du Nord'),
  'Afrique de l\'Est': Object.values(COUNTRIES).filter(c => c.region === 'Afrique de l\'Est'),
  'Afrique Australe': Object.values(COUNTRIES).filter(c => c.region === 'Afrique Australe'),
};

// DEVISES POUR LES SELECTS
export const SUPPORTED_CURRENCIES = [
  { value: 'EUR', label: '🇪🇺 Euro (EUR)', priority: 1 },
  { value: 'XOF', label: '🌍 Franc CFA Ouest (XOF)', priority: 2 },
  { value: 'XAF', label: '🌍 Franc CFA Central (XAF)', priority: 3 },
  { value: 'USD', label: '🇺🇸 Dollar US (USD)', priority: 4 },
  { value: 'MAD', label: '🇲🇦 Dirham (MAD)', priority: 5 },
  { value: 'KES', label: '🇰🇪 Shilling kenyan (KES)', priority: 6 },
  { value: 'NGN', label: '🇳🇬 Naira (NGN)', priority: 7 },
  { value: 'GHS', label: '🇬🇭 Cedi (GHS)', priority: 8 },
  { value: 'ZAR', label: '🇿🇦 Rand (ZAR)', priority: 9 },
  { value: 'DZD', label: '🇩🇿 Dinar algérien (DZD)', priority: 10 },
  { value: 'TND', label: '🇹🇳 Dinar tunisien (TND)', priority: 11 },
  { value: 'EGP', label: '🇪🇬 Livre égyptienne (EGP)', priority: 12 },
];

// FUSEAUX HORAIRES SUPPORTÉS
export const SUPPORTED_TIMEZONES = [
  // Europe
  { value: 'Europe/Paris', label: '🇫🇷 Paris (UTC+1)', region: 'Europe' },
  { value: 'Europe/London', label: '🇬🇧 Londres (UTC+0)', region: 'Europe' },
  { value: 'Europe/Brussels', label: '🇧🇪 Bruxelles (UTC+1)', region: 'Europe' },
  { value: 'Europe/Madrid', label: '🇪🇸 Madrid (UTC+1)', region: 'Europe' },
  { value: 'Europe/Rome', label: '🇮🇹 Rome (UTC+1)', region: 'Europe' },
  
  // Afrique
  { value: 'Africa/Dakar', label: '🇸🇳 Dakar (UTC+0)', region: 'Afrique de l\'Ouest' },
  { value: 'Africa/Abidjan', label: '🇨🇮 Abidjan (UTC+0)', region: 'Afrique de l\'Ouest' },
  { value: 'Africa/Porto-Novo', label: '🇧🇯 Porto-Novo (UTC+1)', region: 'Afrique de l\'Ouest' },
  { value: 'Africa/Lagos', label: '🇳🇬 Lagos (UTC+1)', region: 'Afrique de l\'Ouest' },
  { value: 'Africa/Accra', label: '🇬🇭 Accra (UTC+0)', region: 'Afrique de l\'Ouest' },
  { value: 'Africa/Douala', label: '🇨🇲 Douala (UTC+1)', region: 'Afrique Centrale' },
  { value: 'Africa/Casablanca', label: '🇲🇦 Casablanca (UTC+1)', region: 'Afrique du Nord' },
  { value: 'Africa/Cairo', label: '🇪🇬 Le Caire (UTC+2)', region: 'Afrique du Nord' },
  { value: 'Africa/Nairobi', label: '🇰🇪 Nairobi (UTC+3)', region: 'Afrique de l\'Est' },
  { value: 'Africa/Johannesburg', label: '🇿🇦 Johannesburg (UTC+2)', region: 'Afrique Australe' },
  
  // International
  { value: 'America/New_York', label: '🇺🇸 New York (UTC-5)', region: 'Amérique du Nord' },
  { value: 'America/Montreal', label: '🇨🇦 Montréal (UTC-5)', region: 'Amérique du Nord' },
];

// LANGUES SUPPORTÉES
export const SUPPORTED_LANGUAGES = [
  // Langues principales
  { value: 'fr', label: '🇫🇷 Français', priority: 1, countries: ['FR', 'BJ', 'CI', 'SN', 'CM', 'MA'] },
  { value: 'en', label: '🇺🇸 English', priority: 2, countries: ['NG', 'GH', 'KE', 'ZA', 'EG'] },
  
  // Langues régionales
  { value: 'fr-SN', label: '🇸🇳 Français (Sénégal)', priority: 3, countries: ['SN'] },
  { value: 'fr-CI', label: '🇨🇮 Français (Côte d\'Ivoire)', priority: 4, countries: ['CI'] },
  { value: 'fr-BJ', label: '🇧🇯 Français (Bénin)', priority: 5, countries: ['BJ'] },
  { value: 'fr-CM', label: '🇨🇲 Français (Cameroun)', priority: 6, countries: ['CM'] },
  { value: 'ar', label: '🇲🇦 العربية (Arabe)', priority: 7, countries: ['MA', 'EG'] },
  { value: 'sw', label: '🇰🇪 Kiswahili', priority: 8, countries: ['KE'] },
];

// EXPORT PAR DÉFAUT
export default {
  COUNTRIES,
  CURRENCIES,
  COUNTRIES_BY_REGION,
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  SUPPORTED_LANGUAGES,
  formatCurrency,
  getCountryByCurrency,
  getCountriesByRegion,
  getCountriesByContinent,
};
