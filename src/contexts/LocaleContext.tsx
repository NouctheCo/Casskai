import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/i18n';

const LocaleContext = createContext();

const supportedLocales = [
  { code: 'fr', name: 'Français', nameKey: 'french' },
  { code: 'en', name: 'English', nameKey: 'english' },
  { code: 'es', name: 'Español', nameKey: 'spanish' }
];

export const LocaleProvider = ({ children }) => {
  const [browserLocale] = useState(navigator.language.split('-')[0]);
  const defaultLocale = supportedLocales.some(l => l.code === browserLocale) ? browserLocale : 'fr';
  const [locale, setLocale] = useLocalStorage('casskai-locale', defaultLocale);
  const [loadingLocale, setLoadingLocale] = useState(true);
  
  const { t: translate } = useTranslation();

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Attendre que i18n soit initialisé
        let attempts = 0;
        while ((!i18n.isInitialized || !i18n.hasResourceBundle) && attempts < 50) {
          console.warn('i18n not ready, waiting... attempt', attempts + 1);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!i18n.isInitialized) {
          console.error('i18n failed to initialize after 5 seconds');
          setLoadingLocale(false);
          return;
        }

        if (i18n.language !== locale) {
          await i18n.changeLanguage(locale);
        }
        setLoadingLocale(false);
        document.documentElement.lang = locale;
        console.log('✅ Langue initialisée:', locale);
      } catch (error) {
        console.error('Error initializing language:', error);
        setLoadingLocale(false);
      }
    };

    initializeLanguage();
  }, [locale]);

  const t = (key, defaultValueOrParams, paramsIfDefaultValue) => {
    let currentParams = {};
    let currentDefaultValue = key;

    if (typeof defaultValueOrParams === 'string') {
      currentDefaultValue = defaultValueOrParams;
      currentParams = paramsIfDefaultValue || {};
    } else if (typeof defaultValueOrParams === 'object' && defaultValueOrParams !== null) {
      currentParams = defaultValueOrParams;
      if (defaultValueOrParams.defaultValue) {
        currentDefaultValue = defaultValueOrParams.defaultValue;
      }
    }

    try {
      // Utiliser la fonction de traduction de i18next
      const translation = translate(key, { 
        defaultValue: currentDefaultValue, 
        ...currentParams 
      });

      // Vérifier si la traduction retourne un message d'erreur
      if (translation && typeof translation === 'string') {
        // Détecter les messages d'erreur de i18next
        if (translation.includes("key '") && translation.includes("' return")) {
          console.warn(`Translation key '${key}' not found, using fallback: ${currentDefaultValue}`);
          return currentDefaultValue;
        }
        
        // Détecter d'autres formats d'erreur possibles
        if (translation.startsWith('key ') && translation.includes(' return')) {
          console.warn(`Translation key '${key}' not found, using fallback: ${currentDefaultValue}`);
          return currentDefaultValue;
        }

        // Si la traduction est la même que la clé et qu'on a une valeur par défaut différente
        if (translation === key && currentDefaultValue !== key) {
          return currentDefaultValue;
        }
      }

      return translation || currentDefaultValue;
    } catch (error) {
      console.error(`Error translating key '${key}':`, error);
      return currentDefaultValue;
    }
  };

  // Version sécurisée pour les cas spéciaux
  const tSafe = (key, fallback = key) => {
    const result = t(key, fallback);
    
    // Double vérification pour s'assurer qu'on n'a pas de message d'erreur
    if (typeof result === 'string' && 
        (result.includes("key '") || result.includes("' return") || result.startsWith('key '))) {
      return fallback;
    }
    
    return result;
  };

  const formatDate = (date, options = {}) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }).format(dateObj);
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getLocaleName = (code) => {
    const lang = supportedLocales.find(l => l.code === code);
    return lang ? tSafe(`common.${lang.nameKey}`, tSafe(lang.nameKey, lang.name)) : code;
  };

  if (loadingLocale) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <LocaleContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      tSafe, // Fonction de traduction sécurisée
      supportedLocales, 
      getLocaleName, 
      loadingLocale,
      formatDate,
      formatCurrency
    }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};