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
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ArrowRight, Check } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { changeLanguageAndDetectCountry } from '@/i18n/i18n';
import { logger } from '@/lib/logger';
const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', description: 'Français' },
  { code: 'en', name: 'English', flag: '🇬🇧', description: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', description: 'Español' }
];
export default function LanguageStep() {
  const { goToNextStep, updatePreferences } = useOnboarding();
  const { i18n } = useTranslation();
  const { locale: currentLanguage, setLocale } = useLocale();
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(currentLanguage || 'fr');
  const [isChanging, setIsChanging] = React.useState(false);
  // Initialize with current language from i18n
  useEffect(() => {
    if (i18n.language) {
      setSelectedLanguage(i18n.language);
    }
  }, [i18n.language]);
  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setIsChanging(true);
      setSelectedLanguage(languageCode);
      // Mettre à jour à la fois i18n et le LocaleContext
      setLocale(languageCode);
      await changeLanguageAndDetectCountry(languageCode);
      // Sauvegarder dans localStorage pour la persistance
      localStorage.setItem('preferred_language', languageCode);
      // Attendre un peu pour voir l'animation avant de passer à l'étape suivante
      setTimeout(() => {
        setIsChanging(false);
      }, 500);
    } catch (error) {
      logger.error('LanguageStep', 'Failed to change language:', error instanceof Error ? error.message : String(error));
      setIsChanging(false);
    }
  };
  const handleContinue = async () => {
    // Sauvegarder la langue dans les préférences du contexte onboarding
    try {
      updatePreferences({
        language: selectedLanguage
      });
    } catch (error) {
      logger.error('LanguageStep', 'Failed to save language preference:', error);
    }
    // Sauvegarder aussi dans localStorage pour la persistance immédiate
    localStorage.setItem('onboarding_language_selected', selectedLanguage);
    goToNextStep();
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="text-center pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          >
            <Globe className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <CardTitle className="text-3xl font-bold gradient-text mb-3">
              Choose your language
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Sélectionnez votre langue / Seleccione su idioma
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <div className="grid md:grid-cols-3 gap-4">
              {languages.map((lang, index) => (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    selectedLanguage === lang.code ? 'transform scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 text-center ${
                      selectedLanguage === lang.code
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="text-5xl mb-3">{lang.flag}</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {lang.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lang.description}
                    </p>
                    {selectedLanguage === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="absolute top-3 right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center"
          >
            <Button
              onClick={handleContinue}
              disabled={isChanging}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChanging ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Changing language...
                </>
              ) : (
                <>
                  <span className="mr-2">Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              You can change your language anytime in the application settings
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}