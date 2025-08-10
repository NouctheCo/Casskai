import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Globe,
  DollarSign,
  Calendar,
  Bell,
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

const currencies = [
  { code: 'EUR', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'XOF', name: 'Franc CFA BCEAO (F)', flag: '🇸🇳' },
  { code: 'XAF', name: 'Franc CFA BEAC (F)', flag: '🇨🇲' },
  { code: 'MAD', name: 'Dirham marocain (DH)', flag: '🇲🇦' },
  { code: 'TND', name: 'Dinar tunisien (د.ت)', flag: '🇹🇳' },
  { code: 'USD', name: 'Dollar américain ($)', flag: '🇺🇸' }
];

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

export default function PreferencesStep() {
  const { nextStep, prevStep, companyData, setCompanyData } = useOnboarding();
  const { t } = useTranslation();

  const [preferences, setPreferences] = useState({
    language: 'fr',
    currency: companyData.currency || 'EUR',
    accountingStandard: companyData.accountingStandard || 'PCG',
    fiscalYearStart: companyData.fiscalYearStart || 1,
    notifications: {
      email: true,
      sms: false,
      push: true,
      invoiceReminders: true,
      paymentAlerts: true,
      lowStockAlerts: false
    },
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'european', // european (1 234,56) ou american (1,234.56)
    timezone: 'Europe/Paris'
  });

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Mettre à jour les données de l'entreprise si nécessaire
    if (key === 'currency' || key === 'accountingStandard' || key === 'fiscalYearStart') {
      setCompanyData(prev => ({
        ...prev,
        [key]: value
      }));
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
    // Sauvegarder les préférences dans le contexte
    setCompanyData(prev => ({
      ...prev,
      currency: preferences.currency,
      accountingStandard: preferences.accountingStandard,
      fiscalYearStart: preferences.fiscalYearStart
    }));
    nextStep();
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
          {/* Configuration régionale */}
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
                <Label>Langue de l'interface</Label>
                <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                  <SelectTrigger>
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
                <Label>Devise principale</Label>
                <Select value={preferences.currency} onValueChange={(value) => updatePreference('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.flag}</span>
                          <span>{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Configuration comptable */}
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
                <Label>Standard comptable</Label>
                <Select value={preferences.accountingStandard} onValueChange={(value) => updatePreference('accountingStandard', value)}>
                  <SelectTrigger>
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
                <Label>Début d'exercice fiscal</Label>
                <Select value={preferences.fiscalYearStart.toString()} onValueChange={(value) => updatePreference('fiscalYearStart', parseInt(value))}>
                  <SelectTrigger>
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

          {/* Notifications */}
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
                        checked={preferences.notifications[notif.key as keyof typeof preferences.notifications] as boolean}
                        onCheckedChange={(value) => updateNotification(notif.key, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Information */}
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

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}