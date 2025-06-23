import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

// Configuration des devises ouest-africaines pour le formatage
export const WEST_AFRICAN_CURRENCIES = {
  'XOF': {
    name: 'Franc CFA BCEAO',
    symbol: 'CFA',
    countries: ['BJ', 'CI', 'BF', 'ML', 'NE', 'SN', 'TG', 'GW'],
    format: {
      decimal: 0,
      pattern: '#,##0 ¤',
      groupingSeparator: ' ',
      decimalSeparator: ','
    }
  },
  'XAF': {
    name: 'Franc CFA BEAC', 
    symbol: 'FCFA',
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'],
    format: {
      decimal: 0,
      pattern: '#,##0 ¤',
      groupingSeparator: ' ',
      decimalSeparator: ','
    }
  },
  'EUR': {
    name: 'Euro',
    symbol: '€',
    format: {
      decimal: 2,
      pattern: '#,##0.00 ¤',
      groupingSeparator: ' ',
      decimalSeparator: ','
    }
  },
  'USD': {
    name: 'Dollar américain',
    symbol: '$',
    format: {
      decimal: 2,
      pattern: '¤#,##0.00',
      groupingSeparator: ',',
      decimalSeparator: '.'
    }
  },
  'CAD': {
    name: 'Dollar canadien',
    symbol: 'CAD',
    format: {
      decimal: 2,
      pattern: '#,##0.00 ¤',
      groupingSeparator: ' ',
      decimalSeparator: ','
    }
  }
};

// Configuration des locales étendues
export const SUPPORTED_LOCALES = {
  'fr': { 
    name: 'Français', 
    flag: '🇫🇷', 
    region: 'global',
    currency: 'EUR',
    country: 'FR'
  },
  'fr-BJ': { 
    name: 'Français (Bénin)', 
    flag: '🇧🇯', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'BJ'
  },
  'fr-CI': { 
    name: 'Français (Côte d\'Ivoire)', 
    flag: '🇨🇮', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'CI'
  },
  'fr-BF': { 
    name: 'Français (Burkina Faso)', 
    flag: '🇧🇫', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'BF'
  },
  'fr-ML': { 
    name: 'Français (Mali)', 
    flag: '🇲🇱', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'ML'
  },
  'fr-SN': { 
    name: 'Français (Sénégal)', 
    flag: '🇸🇳', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'SN'
  },
  'fr-TG': { 
    name: 'Français (Togo)', 
    flag: '🇹🇬', 
    region: 'west-africa',
    currency: 'XOF',
    country: 'TG'
  },
  'en': { 
    name: 'English', 
    flag: '🇺🇸', 
    region: 'global',
    currency: 'USD',
    country: 'US'
  },
  'en-GB': { 
    name: 'English (UK)', 
    flag: '🇬🇧', 
    region: 'europe',
    currency: 'GBP',
    country: 'GB'
  },
  'en-CA': { 
    name: 'English (Canada)', 
    flag: '🇨🇦', 
    region: 'north-america',
    currency: 'CAD',
    country: 'CA'
  },
  'es': { 
    name: 'Español', 
    flag: '🇪🇸', 
    region: 'global',
    currency: 'EUR',
    country: 'ES'
  }
};

// Détecteur de langue personnalisé pour l'Afrique de l'Ouest
const customLanguageDetector = {
  name: 'customDetector',
  
  lookup(options: any) {
    // Priorité : URL params > localStorage > géolocalisation > navigateur
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lng');
    
    if (urlLang && SUPPORTED_LOCALES[urlLang as keyof typeof SUPPORTED_LOCALES]) {
      return urlLang;
    }
    
    // Détection basée sur la géolocalisation si disponible
    const storedCountry = localStorage.getItem('user_country');
    if (storedCountry) {
      const countryToLocale: Record<string, string> = {
        'BJ': 'fr-BJ',
        'CI': 'fr-CI',
        'BF': 'fr-BF',
        'ML': 'fr-ML',
        'SN': 'fr-SN',
        'TG': 'fr-TG',
        'FR': 'fr',
        'GB': 'en-GB',
        'US': 'en',
        'CA': 'en-CA',
        'ES': 'es'
      };
      return countryToLocale[storedCountry] || 'fr';
    }
    
    // Fallback sur la détection du navigateur
    const browserLang = navigator.language;
    if (browserLang.startsWith('fr')) {
      return 'fr';
    } else if (browserLang.startsWith('en')) {
      return 'en';
    } else if (browserLang.startsWith('es')) {
      return 'es';
    }
    
    return 'fr'; // Défaut pour l'Afrique de l'Ouest
  },
  
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  }
};

// Configuration i18next avancée
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Ressources de traduction
    resources: {
      fr: { translation: fr },
      'fr-BJ': { translation: fr }, // Utilise les mêmes traductions FR pour l'instant
      'fr-CI': { translation: fr },
      'fr-BF': { translation: fr },
      'fr-ML': { translation: fr },
      'fr-SN': { translation: fr },
      'fr-TG': { translation: fr },
      en: { translation: en },
      'en-GB': { translation: en },
      'en-CA': { translation: en },
      es: { translation: es }
    },
    
    // Langues supportées
    supportedLngs: Object.keys(SUPPORTED_LOCALES),
    fallbackLng: 'fr',
    
    // Détection de langue
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
      // Ajouter le détecteur personnalisé
      checkWhitelist: true
    },
    
    // Options d'interpolation avec formatage personnalisé
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
      format: function(value, format, lng) {
        // Formatage personnalisé pour les devises
        if (format === 'currency') {
          return formatCurrency(value, lng || 'fr');
        }
        // Formatage des nombres
        if (format === 'number') {
          return formatNumber(value, lng || 'fr');
        }
        // Formatage des dates
        if (format === 'date') {
          return formatDate(value, lng || 'fr');
        }
        return value;
      }
    },
    
    // Options de développement
    debug: process.env.NODE_ENV === 'development',
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🌍 Missing translation: ${lng}.${ns}.${key}`);
      }
    },
    
    // Configuration React
    react: {
      useSuspense: false
    }
  });

// Fonction de formatage des devises
export function formatCurrency(amount: number, locale: string, currency?: string): string {
  const detectedCurrency = currency || getCurrencyForLocale(locale);
  const currencyConfig = WEST_AFRICAN_CURRENCIES[detectedCurrency as keyof typeof WEST_AFRICAN_CURRENCIES];
  
  if (currencyConfig) {
    const formatted = new Intl.NumberFormat(locale.startsWith('fr') ? 'fr-FR' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits: currencyConfig.format.decimal,
      maximumFractionDigits: currencyConfig.format.decimal,
      useGrouping: true
    }).format(amount);
    
    return `${formatted} ${currencyConfig.symbol}`;
  }
  
  // Fallback standard
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: detectedCurrency || 'EUR'
    }).format(amount);
  } catch (error) {
    return `${amount} ${detectedCurrency || 'EUR'}`;
  }
}

// Fonction de formatage des nombres
export function formatNumber(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale.startsWith('fr') ? 'fr-FR' : 'en-US').format(value);
  } catch (error) {
    return value.toString();
  }
}

// Fonction de formatage des dates
export function formatDate(value: string | Date, locale: string): string {
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(locale.startsWith('fr') ? 'fr-FR' : 'en-US').format(date);
  } catch (error) {
    return value.toString();
  }
}

// Détection de devise basée sur la locale
export function getCurrencyForLocale(locale: string): string {
  const currencyMap: Record<string, string> = {
    'fr-BJ': 'XOF',
    'fr-CI': 'XOF',
    'fr-BF': 'XOF',
    'fr-ML': 'XOF',
    'fr-SN': 'XOF',
    'fr-TG': 'XOF',
    'fr': 'EUR',
    'en': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'es': 'EUR'
  };
  
  return currencyMap[locale] || 'EUR';
}

// Hook personnalisé pour la gestion des devises
export function useCurrency() {
  const currentLocale = i18n.language;
  const currentCurrency = getCurrencyForLocale(currentLocale);
  
  return {
    currency: currentCurrency,
    locale: currentLocale,
    formatAmount: (amount: number) => formatCurrency(amount, currentLocale, currentCurrency),
    formatNumber: (value: number) => formatNumber(value, currentLocale),
    formatDate: (date: string | Date) => formatDate(date, currentLocale),
    currencySymbol: WEST_AFRICAN_CURRENCIES[currentCurrency as keyof typeof WEST_AFRICAN_CURRENCIES]?.symbol || '€',
    isAfricanMarket: currentLocale.includes('-BJ') || currentLocale.includes('-CI') || currentLocale.includes('-BF') || currentLocale.includes('-ML') || currentLocale.includes('-SN') || currentLocale.includes('-TG')
  };
}

// Fonction pour changer la langue et détecter automatiquement le pays
export async function changeLanguageAndDetectCountry(lng: string) {
  try {
    // Tenter la géolocalisation pour les langues africaines
    if (lng.startsWith('fr-') && lng !== 'fr') {
      const country = lng.split('-')[1];
      localStorage.setItem('user_country', country);
    }
    
    await i18n.changeLanguage(lng);
    return true;
  } catch (error) {
    console.error('Erreur lors du changement de langue:', error);
    return false;
  }
}

// Fonction pour obtenir les informations de la locale actuelle
export function getCurrentLocaleInfo() {
  const currentLang = i18n.language;
  return SUPPORTED_LOCALES[currentLang as keyof typeof SUPPORTED_LOCALES] || SUPPORTED_LOCALES.fr;
}

export default i18n;
