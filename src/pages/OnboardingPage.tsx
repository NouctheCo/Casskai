import React, { useEffect } from 'react';
import WelcomeStep from './onboarding/WelcomeStep';
import PreferencesStep from './onboarding/PreferencesStep';
import CompanyStep from './onboarding/CompanyStep';
import ModulesStep from './onboarding/ModulesStep';
import CompleteStep from './onboarding/CompleteStep';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function OnboardingPage() {
  const { state } = useOnboarding();

  useEffect(() => {
  }, [state.currentStep]);

  const steps = [
    <WelcomeStep key="welcome" />,
    <PreferencesStep key="preferences" />,
    <CompanyStep key="company" />,
    <ModulesStep key="modules" />,
    <CompleteStep key="complete" />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  {steps[(state.currentStep?.order ?? 1) - 1]}
    </div>
  );
}
