// Simple i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { logger } from '@/lib/logger';
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
// Initialize i18n synchronously with proper React integration
if (!i18n.isInitialized) {
  try {
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
      debug: false,
      returnNull: false,
      returnEmptyString: false,
      saveMissing: false,
      missingKeyHandler: (lng: string[], ns: string, key: string) => {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('I18n-simple', `Missing translation: ${key}`);
        }
      }
    });
    logger.debug('I18n-simple', '✅ i18n initialized successfully');
  } catch (error) {
    logger.error('I18n-simple', '❌ Failed to initialize i18n:', error);
    // Fallback initialization
    try {
      i18n
        .use(initReactI18next)
        .init({
          lng: 'fr',
          fallbackLng: 'fr',
          resources: { fr: { translation: {} } },
          react: { useSuspense: false },
          returnNull: false
        });
      logger.warn('I18n-simple', '⚠️ i18n initialized with minimal config');
    } catch (fallbackError) {
      logger.error('I18n-simple', '❌ Fallback i18n initialization failed:', fallbackError);
    }
  }
}
export default i18n;