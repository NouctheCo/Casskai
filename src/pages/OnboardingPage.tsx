import React, { useEffect } from 'react';
import WelcomeStep from './onboarding/WelcomeStep';
import FeaturesStep from './onboarding/FeaturesStep';
import PreferencesStep from './onboarding/PreferencesStep';
import CompanyStep from './onboarding/CompanyStep';
import CompleteStep from './onboarding/CompleteStep';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingPage() {
  const { currentStep } = useOnboarding();

  useEffect(() => {
  }, [currentStep]);

  const steps = [
    <WelcomeStep key="welcome" />,
    <FeaturesStep key="features" />,
    <PreferencesStep key="preferences" />,
    <CompanyStep key="company" />,
    <CompleteStep key="complete" />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {steps[currentStep - 1] || steps[0]}
    </div>
  );
}
