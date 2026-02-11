/**
 * CassKai - Plateforme de gestion financière
 * Copyright (c) 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits reserves - All rights reserved
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StepInfo {
  id: string;
  label: string;
  order: number;
}

interface OnboardingProgressBarProps {
  currentStepOrder: number;
  totalSteps: number;
  completedSteps: string[];
}

const STEP_DEFINITIONS: StepInfo[] = [
  { id: 'language', label: 'onboarding.progress.language', order: 1 },
  { id: 'welcome', label: 'onboarding.progress.welcome', order: 2 },
  { id: 'company', label: 'onboarding.progress.company', order: 3 },
  { id: 'preferences', label: 'onboarding.progress.preferences', order: 4 },
  { id: 'modules', label: 'onboarding.progress.modules', order: 5 },
  { id: 'complete', label: 'onboarding.progress.complete', order: 6 },
];

const STEP_LABEL_DEFAULTS: Record<string, string> = {
  'onboarding.progress.language': 'Langue',
  'onboarding.progress.welcome': 'Bienvenue',
  'onboarding.progress.company': 'Entreprise',
  'onboarding.progress.preferences': 'Preferences',
  'onboarding.progress.modules': 'Modules',
  'onboarding.progress.complete': 'Finalisation',
};

const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStepOrder,
  totalSteps,
  completedSteps,
}) => {
  const { t } = useTranslation();

  // Do not show the progress bar on the language (1) or complete (6) steps
  if (currentStepOrder <= 1 || currentStepOrder >= totalSteps) {
    return null;
  }

  // Steps to display (exclude language and complete for a cleaner visual)
  const visibleSteps = STEP_DEFINITIONS.filter(
    (s) => s.order > 1 && s.order < totalSteps
  );

  const progressPercent = Math.round(
    ((currentStepOrder - 1) / (totalSteps - 1)) * 100
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-2">
      {/* Step counter text */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t('onboarding.progress.stepOf', {
            current: currentStepOrder - 1,
            total: totalSteps - 2,
            defaultValue: 'Etape {{current}} sur {{total}}',
          })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {progressPercent}%
        </p>
      </div>

      {/* Progress bar track */}
      <div className="relative mb-4">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step dots with labels */}
      <div className="flex justify-between">
        {visibleSteps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.order === currentStepOrder;
          const isPast = step.order < currentStepOrder;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Dot */}
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                  isCompleted || isPast
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600'
                }`}
                initial={false}
                animate={
                  isCurrent
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={
                  isCurrent
                    ? { duration: 0.5, ease: 'easeInOut' }
                    : {}
                }
              >
                {isCompleted || isPast ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.order - 1
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`mt-1.5 text-xs text-center leading-tight hidden sm:block ${
                  isCurrent
                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                    : isCompleted || isPast
                    ? 'font-medium text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {t(step.label, { defaultValue: STEP_LABEL_DEFAULTS[step.label] || step.id })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgressBar;
