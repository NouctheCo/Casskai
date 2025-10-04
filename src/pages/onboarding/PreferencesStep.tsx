import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Globe,
  DollarSign,
  Bell,
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Info,
  Loader2
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import { CompanyProfile } from '@/types/onboarding.types';
import { useCurrencies, useTimezones } from '@/hooks/useReferentials';

// ✨ LISTES HARDCODÉES SUPPRIMÉES - PHASE 3 RÉFÉRENTIELS DYNAMIQUES
// Remplacées par useCurrencies() et useTimezones() hooks

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

const accountingStandards = [
  { code: 'PCG', name: 'Plan Comptable Général (France)', flag: '🇫🇷' },
  { code: 'SYSCOHADA', name: 'SYSCOHADA (Afrique)', flag: '🌍' },
  { code: 'IFRS', name: 'IFRS International', flag: '🌐' },
  { code: 'OTHER', name: 'Autre standard', flag: '⚙️' }
];

// Types pour les préférences
interface Preferences {
  language: string;
  currency: string;
  accountingStandard: string;
  fiscalYearStart: number;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    invoiceReminders: boolean;
    paymentAlerts: boolean;
    lowStockAlerts: boolean;
  };
  dateFormat: string;
  numberFormat: string;
  timezone: string;
}

// Composants modulaires pour réduire la taille de la fonction principale
interface RegionalConfigurationProps {
  preferences: Preferences;
  updatePreference: (key: string, value: string | number) => void;
  // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
  currencies?: any[];
  timezones?: any[];
}

const RegionalConfigurationSection: React.FC<RegionalConfigurationProps> = ({
  preferences,
  updatePreference,
  currencies = [],
  timezones = []
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    <div className="flex items-center space-x-2 mb-4">
      <Globe className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Configuration régionale
      </h3>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="language-select">Langue de l'interface</Label>
        <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
          <SelectTrigger id="language-select" name="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center space-x-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="currency-select">Devise principale</Label>
        <Select value={preferences.currency} onValueChange={(value) => updatePreference('currency', value)}>
          <SelectTrigger id="currency-select" name="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map(currency => (
              <SelectItem key={currency.currency_code} value={currency.currency_code}>
                <div className="flex items-center space-x-2">
                  <span>{currency.currency_symbol}</span>
                  <span>{currency.currency_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </motion.div>
);

interface AccountingConfigurationProps {
  preferences: Preferences;
  updatePreference: (key: string, value: string | number) => void;
}

const AccountingConfigurationSection: React.FC<AccountingConfigurationProps> = ({ preferences, updatePreference }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.5 }}
  >
    <div className="flex items-center space-x-2 mb-4">
      <DollarSign className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Configuration comptable
      </h3>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="accounting-standard-select">Standard comptable</Label>
        <Select value={preferences.accountingStandard} onValueChange={(value) => updatePreference('accountingStandard', value)}>
          <SelectTrigger id="accounting-standard-select" name="accounting-standard">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accountingStandards.map(standard => (
              <SelectItem key={standard.code} value={standard.code}>
                <div className="flex items-center space-x-2">
                  <span>{standard.flag}</span>
                  <span>{standard.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fiscal-year-start-select">Début d'exercice fiscal</Label>
        <Select value={preferences.fiscalYearStart.toString()} onValueChange={(value) => updatePreference('fiscalYearStart', parseInt(value))}>
          <SelectTrigger id="fiscal-year-start-select" name="fiscal-year-start">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <SelectItem key={month} value={month.toString()}>
                {new Date(2024, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </motion.div>
);

interface NotificationsProps {
  preferences: Preferences;
  updateNotification: (key: string, value: boolean) => void;
}

const NotificationsSection: React.FC<NotificationsProps> = ({ preferences, updateNotification }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.5 }}
  >
    <div className="flex items-center space-x-2 mb-4">
      <Bell className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Notifications
      </h3>
    </div>
    
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <Switch
            checked={preferences.notifications.email}
            onCheckedChange={(value) => updateNotification('email', value)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">SMS</span>
          </div>
          <Switch
            checked={preferences.notifications.sms}
            onCheckedChange={(value) => updateNotification('sms', value)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Push</span>
          </div>
          <Switch
            checked={preferences.notifications.push}
            onCheckedChange={(value) => updateNotification('push', value)}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Types de notifications</h4>
        <div className="space-y-2">
          {[
            { key: 'invoiceReminders', label: 'Rappels de factures impayées', icon: '📄' },
            { key: 'paymentAlerts', label: 'Alertes de paiements reçus', icon: '💰' },
            { key: 'lowStockAlerts', label: 'Alertes de stock faible', icon: '📦' }
          ].map(notif => (
            <div key={notif.key} className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{notif.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{notif.label}</span>
              </div>
              <Switch
                checked={preferences.notifications[notif.key as keyof typeof preferences.notifications]}
                onCheckedChange={(value) => updateNotification(notif.key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const InformationSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6, duration: 0.6 }}
    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
  >
    <div className="flex items-start space-x-3">
      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-sm mb-1">
          Personnalisation avancée
        </h4>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Ces paramètres peuvent être modifiés à tout moment depuis votre profil. 
          Votre configuration sera sauvegardée automatiquement.
        </p>
      </div>
    </div>
  </motion.div>
);

interface NavigationProps {
  onPrevStep: () => void;
  onNextStep: () => void;
}

const NavigationSection: React.FC<NavigationProps> = ({ onPrevStep, onNextStep }) => (
  <div className="flex justify-between">
    <Button
      variant="outline"
      onClick={onPrevStep}
      className="flex items-center space-x-2"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Précédent</span>
    </Button>
    
    <Button
      onClick={onNextStep}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2"
    >
      <span>Continuer</span>
      <ArrowRight className="w-4 h-4" />
    </Button>
  </div>
);

// Hook personnalisé pour gérer les préférences
const usePreferences = (companyData: Record<string, unknown>, updateCompanyProfile: (profile: Partial<CompanyProfile>) => void) => {
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'fr',
    currency: (companyData.default_currency as string) || 'EUR',
    accountingStandard: (companyData.accountingStandard as string) || 'PCG',
    fiscalYearStart: (companyData.fiscalYearStart as number) || 1,
    notifications: {
      email: true,
      sms: false,
      push: true,
      invoiceReminders: true,
      paymentAlerts: true,
      lowStockAlerts: false
    },
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'european',
    timezone: 'Europe/Paris'
  });

  const updatePreference = (key: string, value: string | number) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));

    if (key === 'currency' || key === 'accountingStandard' || key === 'fiscalYearStart') {
      updateCompanyProfile({ [key]: value });
    }
  };

  const updateNotification = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleNext = () => {
    updateCompanyProfile({
      currency: preferences.currency,
      accountingStandard: preferences.accountingStandard,
      fiscalYearStart: preferences.fiscalYearStart
    });
  };

  return {
    preferences,
    updatePreference,
    updateNotification,
    handleNext
  };
};

export default function PreferencesStep() {
  const { goToNextStep, goToPreviousStep, state, updateCompanyProfile } = useOnboarding();
  const { t } = useTranslation();

  // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const { timezones, loading: timezonesLoading } = useTimezones(true); // Seulement les populaires

  const referentialsLoading = currenciesLoading || timezonesLoading;

  const { preferences, updatePreference, updateNotification, handleNext: savePreferences } = usePreferences(state.data?.companyProfile || {}, updateCompanyProfile);

  const handleNext = () => {
    savePreferences();
    goToNextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card">
        <CardHeader className="text-center pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <Settings className="w-8 h-8 text-white" />
          </motion.div>

          <CardTitle className="text-2xl font-bold gradient-text mb-2">
            {t('onboarding.preferences.title', {
              defaultValue: 'Configurez vos préférences'
            })}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('onboarding.preferences.subtitle', {
              defaultValue: 'Personnalisez CassKai selon vos besoins et habitudes de travail.'
            })}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {referentialsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Chargement des préférences...</span>
            </div>
          ) : (
            <>
              <RegionalConfigurationSection
                preferences={preferences}
                updatePreference={updatePreference}
                // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
                currencies={currencies}
                timezones={timezones}
              />

              <AccountingConfigurationSection
                preferences={preferences}
                updatePreference={updatePreference}
              />

              <NotificationsSection
                preferences={preferences}
                updateNotification={updateNotification}
              />

              <InformationSection />

              <NavigationSection
                onPrevStep={goToPreviousStep}
                onNextStep={handleNext}
              />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}