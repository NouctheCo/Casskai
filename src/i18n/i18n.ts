// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
  },
  'GHS': {
    name: 'Cedi ghanéen',
    symbol: '₵',
    format: {
      decimal: 2,
      pattern: '¤#,##0.00',
      groupingSeparator: ',',
      decimalSeparator: '.'
    }
  },
  'NGN': {
    name: 'Naira nigérian',
    symbol: '₦',
    format: {
      decimal: 2,
      pattern: '¤#,##0.00',
      groupingSeparator: ',',
      decimalSeparator: '.'
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
  'fr-CM': { 
    name: 'Français (Cameroun)', 
    flag: '🇨🇲', 
    region: 'central-africa',
    currency: 'XAF',
    country: 'CM'
  },
  'fr-GA': { 
    name: 'Français (Gabon)', 
    flag: '🇬🇦', 
    region: 'central-africa',
    currency: 'XAF',
    country: 'GA'
  },
  'en-GH': { 
    name: 'English (Ghana)', 
    flag: '🇬🇭', 
    region: 'west-africa',
    currency: 'GHS',
    country: 'GH'
  },
  'en-NG': { 
    name: 'English (Nigeria)', 
    flag: '🇳🇬', 
    region: 'west-africa',
    currency: 'NGN',
    country: 'NG'
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

// Import des ressources de traduction
import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

// Configuration i18next avancée - synchrone pour éviter les problèmes d'ordre
const initConfig = {
  // Ressources de traduction avec structure de namespaces
  resources: {
    fr: {
      translation: frTranslations
    },
    en: {
      translation: enTranslations
    },
    es: {
      translation: esTranslations
    }
  },
  
  // Langue par défaut et fallback
  lng: 'fr',
  fallbackLng: 'fr',
  
  // Configuration des namespaces
  defaultNS: 'translation',
  ns: ['translation'],
  
  detection: {
    order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
    lookupQuerystring: 'lng',
    lookupLocalStorage: 'i18nextLng',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode']
  },
  
  // Options d'interpolation avec formatage personnalisé (nouvelle approche)
  interpolation: {
    escapeValue: false,
    // Nouvelle approche recommandée : utiliser des fonctions de formatage globales
    // au lieu de la propriété 'format' obsolète
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
  },
  
  // Retourner la clé si traduction non trouvée
  returnNull: false,
  returnEmptyString: false,
  returnObjects: false,
  joinArrays: false,
  
  // Configuration pour éviter les conflits
  keySeparator: '.',
  nsSeparator: ':',
  pluralSeparator: '_',
  contextSeparator: '_',
  
  // Fonction de post-processing pour améliorer les fallbacks
  postProcess: ['fallback'],
  parseMissingKeyHandler: (key) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🌍 Parsing missing key: ${key}`);
    }
    return key;
  }
};

// Initialisation asynchrone avec gestion d'erreur
const initializeI18n = async () => {
  try {
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init(initConfig);

    // Ajouter les formateurs avec la nouvelle approche
    if (i18n.services.formatter) {
      i18n.services.formatter.add('currency', (value, lng, options) => {
        // Utilisation directe des fonctions pour éviter les problèmes d'ordre
        const detectedCurrency = options?.currency || getCurrencyForLocale(lng || 'fr');
        const currencyConfig = WEST_AFRICAN_CURRENCIES[detectedCurrency as keyof typeof WEST_AFRICAN_CURRENCIES];

        if (currencyConfig) {
          const formatted = new Intl.NumberFormat(lng?.startsWith('fr') ? 'fr-FR' : 'en-US', {
            style: 'decimal',
            minimumFractionDigits: currencyConfig.format.decimal,
            maximumFractionDigits: currencyConfig.format.decimal,
            useGrouping: true
          }).format(value);
          return `${formatted} ${currencyConfig.symbol}`;
        }

        return new Intl.NumberFormat(lng || 'fr').format(value);
      });

      i18n.services.formatter.add('number', (value, lng) => {
        return new Intl.NumberFormat(lng || 'fr').format(value);
      });

      i18n.services.formatter.add('date', (value, lng) => {
        const date = typeof value === 'string' ? new Date(value) : value;
        return date.toLocaleDateString(lng || 'fr');
      });
    }

    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.warn('i18n initialisé avec succès');
    }
    return true;
  } catch (err) {
    console.error('Erreur d\'initialisation i18n:', err);
    // Fallback: initialiser avec une configuration minimale
    try {
      await i18n.init({
        lng: 'fr',
        resources: {
          fr: { translation: {} },
          en: { translation: {} }
        },
        react: { useSuspense: false },
        fallbackLng: 'fr'
      });
      console.warn('i18n initialisé avec configuration de secours');
      return true;
    } catch (fallbackErr) {
      console.error('Erreur d\'initialisation fallback i18n:', fallbackErr);
      return false;
    }
  }
};

// Lancer l'initialisation
initializeI18n();

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
    'fr-CM': 'XAF',
    'fr-GA': 'XAF',
    'en-GH': 'GHS',
    'en-NG': 'NGN',
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
    // Vérifier que i18n est correctement initialisé
    if (!i18n || !i18n.changeLanguage) {
      console.warn('i18n not properly initialized, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Tenter la géolocalisation pour les langues africaines
    if (lng.startsWith('fr-') && lng !== 'fr') {
      const country = lng.split('-')[1];
      localStorage.setItem('user_country', country);
    }
    
    if (i18n && typeof i18n.changeLanguage === 'function') {
      await i18n.changeLanguage(lng);
      return true;
    } else {
      console.error('i18n.changeLanguage is not available');
      return false;
    }
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

// Fonction de traduction robuste avec fallbacks
export function createSafeTranslation(i18nInstance = i18n) {
  return (key: string, fallback?: string, options?: any) => {
    try {
      // Tentative de traduction avec i18next
      const translation = i18nInstance.t(key, {
        defaultValue: fallback || key,
        ...options
      });

      // Vérifier si la traduction est valide
      if (translation && typeof translation === 'string' && translation !== key) {
        return translation;
      }

      // Si pas de traduction et qu'on a un fallback
      if (fallback && fallback !== key) {
        return fallback;
      }

      // En dernier recours, retourner la clé
      return key;
    } catch (error) {
      console.warn(`🌍 Translation error for key '${key}':`, error);
      return fallback || key;
    }
  };
}

// Instance de traduction sécurisée
export const tSafe = createSafeTranslation();

// Hook personnalisé pour les traductions avec fallbacks
export function useSafeTranslation() {
  return {
    t: tSafe,
    i18n
  };
}

export default i18n;
