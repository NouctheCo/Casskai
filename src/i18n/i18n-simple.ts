// Simple i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      light: 'Clair',
      dark: 'Sombre',
      system: 'Système',
      welcome: 'Bienvenue',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès'
    }
  },
  en: {
    translation: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      welcome: 'Welcome',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    debug: false
  });

export default i18n;
