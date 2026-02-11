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
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  Globe,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
const features = [
  {
    icon: BarChart3,
    title: 'Tableau de bord intelligent',
    description: 'Visualisez vos KPIs en temps réel',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    icon: Shield,
    title: 'Sécurité renforcée',
    description: 'Vos données sont chiffrées et protégées',
    color: 'text-green-600 bg-green-100'
  },
  {
    icon: Users,
    title: 'Collaboration d\'équipe',
    description: 'Travaillez ensemble efficacement',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    icon: Globe,
    title: 'Multi-devises & pays',
    description: 'Gérez vos activités internationales',
    color: 'text-orange-600 bg-orange-100'
  }
];
export default function WelcomeStep() {
  const { goToNextStep } = useOnboarding();
  const { user } = useAuth();
  const { t } = useTranslation();
  const _userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'utilisateur';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="text-center pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <CardTitle className="text-3xl font-bold font-heading gradient-text mb-3">
              {t('onboarding.welcome.title', {
                defaultValue: 'Bienvenue dans CassKai !'
              })}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('onboarding.welcome.subtitle', {
                defaultValue: 'Nous sommes ravis de vous accompagner dans la gestion de votre entreprise. Configurons ensemble votre plateforme en quelques étapes simples.'
              })}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Avantages CassKai */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-6 text-center">
              {t('onboarding.welcome.whatYouGet', {
                defaultValue: 'Ce que vous obtenez avec CassKai'
              })}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="flex items-center p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mr-4 flex-shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          {/* Étapes à venir */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              {t('onboarding.welcome.nextSteps', {
                defaultValue: 'Les étapes suivantes'
              })}
            </h3>
            <div className="space-y-3">
              {[
                {
                  step: 2,
                  title: t('onboarding.steps.features', { defaultValue: 'Fonctionnalités' }),
                  description: t('onboarding.steps.featuresDesc', { defaultValue: 'Découvrez nos modules' })
                },
                {
                  step: 3,
                  title: t('onboarding.steps.preferences', { defaultValue: 'Préférences' }),
                  description: t('onboarding.steps.preferencesDesc', { defaultValue: 'Personnalisez votre expérience' })
                },
                {
                  step: 4,
                  title: t('onboarding.steps.company', { defaultValue: 'Entreprise' }),
                  description: t('onboarding.steps.companyDesc', { defaultValue: 'Configurez votre société' })
                }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    {item.step}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100 dark:text-white text-sm">
                      {item.title}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs ml-2">
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          {/* Bouton de démarrage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center"
          >
            <Button
              onClick={() => {
                logger.warn('WelcomeStep', '[WelcomeStep] Button clicked - calling nextStep()');
                goToNextStep();
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="mr-2">
                {t('onboarding.welcome.startSetup', {
                  defaultValue: 'Commencer la configuration'
                })}
              </span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              {t('onboarding.welcome.duration', {
                defaultValue: '⏱️ Configuration estimée : 3-5 minutes'
              })}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}