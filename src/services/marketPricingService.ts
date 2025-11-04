// Service de tarification adaptée aux marchés africains
// Avec des prix ronds et valorisés selon le pouvoir d'achat local

export interface MarketPricing {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  region: 'west-africa' | 'central-africa' | 'europe' | 'north-america';
  language: string;
  
  // Prix mensuels optimisés par marché
  starter: {
    monthly: number;
    monthlyOriginal: number;
    annual: number; // Prix annuel total avec remise
    annualOriginal: number;
  };
  professional: {
    monthly: number;
    monthlyOriginal: number;
    annual: number;
    annualOriginal: number;
  };
  enterprise: {
    monthly: number;
    monthlyOriginal: number;
    annual: number;
    annualOriginal: number;
  };
}

// Tarification adaptée par marché avec pouvoir d'achat local
export const MARKET_PRICING: Record<string, MarketPricing> = {
  // Marché ouest-africain francophone (UEMOA - Franc CFA)
  'fr-BJ': {
    countryCode: 'fr-BJ',
    countryName: 'Bénin',
    flag: '🇧🇯',
    currency: 'XOF',
    currencySymbol: 'CFA',
    region: 'west-africa',
    language: 'fr',
    starter: {
      monthly: 15000,      // ~25€ équivalent pouvoir d'achat
      monthlyOriginal: 20000,
      annual: 144000,      // 12 mois - 20% = 15000 * 12 * 0.8
      annualOriginal: 192000
    },
    professional: {
      monthly: 35000,      // ~58€ équivalent pouvoir d'achat  
      monthlyOriginal: 45000,
      annual: 336000,      // Prix annuel optimisé
      annualOriginal: 432000
    },
    enterprise: {
      monthly: 65000,      // ~108€ équivalent pouvoir d'achat
      monthlyOriginal: 85000,
      annual: 624000,
      annualOriginal: 816000
    }
  },

  'fr-CI': {
    countryCode: 'fr-CI',
    countryName: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    currency: 'XOF',
    currencySymbol: 'CFA',
    region: 'west-africa',
    language: 'fr',
    starter: {
      monthly: 18000,      // Économie plus forte que Bénin/Togo
      monthlyOriginal: 23000,
      annual: 172800,
      annualOriginal: 220800
    },
    professional: {
      monthly: 40000,      
      monthlyOriginal: 52000,
      annual: 384000,
      annualOriginal: 499200
    },
    enterprise: {
      monthly: 75000,
      monthlyOriginal: 98000,
      annual: 720000,
      annualOriginal: 940800
    }
  },

  'fr-TG': {
    countryCode: 'fr-TG',
    countryName: 'Togo',
    flag: '🇹🇬',
    currency: 'XOF',
    currencySymbol: 'CFA',
    region: 'west-africa',
    language: 'fr',
    starter: {
      monthly: 15000,      // Prix similaire au Bénin
      monthlyOriginal: 20000,
      annual: 144000,
      annualOriginal: 192000
    },
    professional: {
      monthly: 35000,
      monthlyOriginal: 45000,
      annual: 336000,
      annualOriginal: 432000
    },
    enterprise: {
      monthly: 65000,
      monthlyOriginal: 85000,
      annual: 624000,
      annualOriginal: 816000
    }
  },

  // Marché central-africain francophone (CEMAC - Franc CFA Central)
  'fr-CM': {
    countryCode: 'fr-CM',
    countryName: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    region: 'central-africa',
    language: 'fr',
    starter: {
      monthly: 16000,      
      monthlyOriginal: 22000,
      annual: 153600,
      annualOriginal: 211200
    },
    professional: {
      monthly: 38000,
      monthlyOriginal: 50000,
      annual: 364800,
      annualOriginal: 480000
    },
    enterprise: {
      monthly: 70000,
      monthlyOriginal: 90000,
      annual: 672000,
      annualOriginal: 864000
    }
  },

  'fr-GA': {
    countryCode: 'fr-GA',
    countryName: 'Gabon',
    flag: '🇬🇦',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    region: 'central-africa',
    language: 'fr',
    starter: {
      monthly: 20000,      // Économie pétrolière plus riche
      monthlyOriginal: 26000,
      annual: 192000,
      annualOriginal: 249600
    },
    professional: {
      monthly: 45000,
      monthlyOriginal: 58000,
      annual: 432000,
      annualOriginal: 556800
    },
    enterprise: {
      monthly: 85000,
      monthlyOriginal: 110000,
      annual: 816000,
      annualOriginal: 1056000
    }
  },

  // Marché ghanéen anglophone (Cedi)
  'en-GH': {
    countryCode: 'en-GH',
    countryName: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: '₵',
    region: 'west-africa',
    language: 'en',
    starter: {
      monthly: 300,        // ~25€ équivalent
      monthlyOriginal: 400,
      annual: 2880,        // Prix annuel avec remise
      annualOriginal: 3840
    },
    professional: {
      monthly: 700,        // ~58€ équivalent
      monthlyOriginal: 900,
      annual: 6720,
      annualOriginal: 8640
    },
    enterprise: {
      monthly: 1300,       // ~108€ équivalent
      monthlyOriginal: 1700,
      annual: 12480,
      annualOriginal: 16320
    }
  },

  // Marché nigérian anglophone (Naira)
  'en-NG': {
    countryCode: 'en-NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    region: 'west-africa',
    language: 'en',
    starter: {
      monthly: 25000,      // Prix ronds en Naira
      monthlyOriginal: 35000,
      annual: 240000,      // Remise annuelle attractive
      annualOriginal: 336000
    },
    professional: {
      monthly: 60000,      // Marché nigérian plus grand
      monthlyOriginal: 80000,
      annual: 576000,
      annualOriginal: 768000
    },
    enterprise: {
      monthly: 120000,     // Prix premium pour grandes entreprises
      monthlyOriginal: 160000,
      annual: 1152000,
      annualOriginal: 1536000
    }
  },

  // Marchés européens et internationaux (prix de référence)
  'fr': {
    countryCode: 'fr',
    countryName: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    region: 'europe',
    language: 'fr',
    starter: {
      monthly: 29,
      monthlyOriginal: 39,
      annual: 278,         // 29 * 12 * 0.8
      annualOriginal: 374
    },
    professional: {
      monthly: 69,
      monthlyOriginal: 89,
      annual: 662,
      annualOriginal: 854
    },
    enterprise: {
      monthly: 129,
      monthlyOriginal: 159,
      annual: 1238,
      annualOriginal: 1526
    }
  },

  'en': {
    countryCode: 'en',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    region: 'north-america',
    language: 'en',
    starter: {
      monthly: 29,
      monthlyOriginal: 39,
      annual: 278,
      annualOriginal: 374
    },
    professional: {
      monthly: 69,
      monthlyOriginal: 89,
      annual: 662,
      annualOriginal: 854
    },
    enterprise: {
      monthly: 129,
      monthlyOriginal: 159,
      annual: 1238,
      annualOriginal: 1526
    }
  },

  'en-GB': {
    countryCode: 'en-GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    region: 'europe',
    language: 'en',
    starter: {
      monthly: 25,
      monthlyOriginal: 32,
      annual: 240,
      annualOriginal: 307
    },
    professional: {
      monthly: 59,
      monthlyOriginal: 76,
      annual: 566,
      annualOriginal: 730
    },
    enterprise: {
      monthly: 109,
      monthlyOriginal: 135,
      annual: 1046,
      annualOriginal: 1296
    }
  }
};

// Fonction pour formater les prix selon le marché
export function formatMarketPrice(price: number, currency: string, symbol: string): string {
  switch (currency) {
    case 'XOF':
    case 'XAF':
      // Franc CFA - format français avec espaces
      return `${price.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })} ${symbol}`;
      
    case 'GHS':
      // Cedi ghanéen
      return `${symbol}${price.toLocaleString('en-GH', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
      
    case 'NGN':
      // Naira nigérian
      return `${symbol}${price.toLocaleString('en-NG', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
      
    case 'EUR':
      return `${price.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}${symbol}`;
      
    case 'USD':
      return `${symbol}${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      
    case 'GBP':
      return `${symbol}${price.toLocaleString('en-GB', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      
    default:
      return `${price} ${symbol}`;
  }
}

// Obtenir la tarification pour un pays
export function getMarketPricing(countryCode: string): MarketPricing | null {
  return MARKET_PRICING[countryCode] || null;
}

// Liste tous les pays supportés avec drapeaux
export function getAllSupportedCountries(): MarketPricing[] {
  return Object.values(MARKET_PRICING);
}

// Obtenir la liste des pays africains uniquement
export function getAfricanCountries(): MarketPricing[] {
  return Object.values(MARKET_PRICING).filter(country => 
    country.region === 'west-africa' || country.region === 'central-africa'
  );
}

// Obtenir le pays par défaut selon la langue du navigateur
export function getDefaultCountryCode(browserLanguage: string): string {
  const lang = browserLanguage.toLowerCase();
  
  // France par défaut pour afficher les prix en euros
  if (lang.includes('fr')) {
    return 'fr'; // France pour les prix en euros
  }
  
  // Marchés anglophones
  if (lang.includes('en')) {
    return 'en'; // États-Unis par défaut
  }
  
  // Par défaut France (euros)
  return 'fr';
}
