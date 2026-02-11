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

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LanguageStep from './onboarding/LanguageStep';
import WelcomeStep from './onboarding/WelcomeStep';
import PreferencesStep from './onboarding/PreferencesStep';
import CompanyStep from './onboarding/CompanyStep';
import ModulesStep from './onboarding/ModulesStep';
import CompleteStep from './onboarding/CompleteStep';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function OnboardingPage() {
  const { state } = useOnboarding();

  // ✅ HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This effect tracks step changes - empty on purpose, could be used for analytics
  useEffect(() => {
    // Placeholder for step tracking logic
  }, [state.currentStep]);

  // Loading fallback to prevent blank screen during initialization
  if (!state.isInitialized || state.isLoading || !state.currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">Initialisation en cours...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configuration de votre espace de travail</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    <LanguageStep key="language" />,
    <WelcomeStep key="welcome" />,
    <CompanyStep key="company" />,
    <PreferencesStep key="preferences" />,
    <ModulesStep key="modules" />,
    <CompleteStep key="complete" />,
  ];

  const currentOrder = state.currentStep?.order ?? 1;
  const completedSteps = state.data?.completedSteps ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <OnboardingProgressBar
        currentStepOrder={currentOrder}
        totalSteps={steps.length}
        completedSteps={completedSteps}
      />
      <AnimatePresence mode="wait">
        {steps[currentOrder - 1]}
      </AnimatePresence>
    </div>
  );
}
