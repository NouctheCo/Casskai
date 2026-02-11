/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * FormProgress - Indicateur de progression de formulaire
 *
 * Features:
 * - Progress bar visuelle (1/5 → 5/5)
 * - Étapes cliquables pour navigation
 * - Validation par étape
 * - Animations smooth
 * - Compatible react-hook-form
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormStep {
  /**
   * Identifiant unique de l'étape
   */
  id: string;

  /**
   * Titre de l'étape
   */
  title: string;

  /**
   * Description optionnelle
   */
  description?: string;

  /**
   * Champs requis pour cette étape
   */
  fields?: string[];
}

export interface FormProgressProps {
  /**
   * Étapes du formulaire
   */
  steps: FormStep[];

  /**
   * Index de l'étape actuelle (0-based)
   */
  currentStep: number;

  /**
   * Callback quand l'utilisateur clique sur une étape
   */
  onStepClick?: (stepIndex: number) => void;

  /**
   * Étapes complétées (validation passée)
   */
  completedSteps?: number[];

  /**
   * Afficher le pourcentage
   */
  showPercentage?: boolean;

  /**
   * Taille du composant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
  showPercentage = true,
  size = 'md',
  className,
}) => {
  const percentage = Math.round(((currentStep + 1) / steps.length) * 100);

  const sizes = {
    sm: {
      height: 'h-1',
      icon: 'h-6 w-6',
      text: 'text-xs',
      title: 'text-sm',
    },
    md: {
      height: 'h-2',
      icon: 'h-8 w-8',
      text: 'text-sm',
      title: 'text-base',
    },
    lg: {
      height: 'h-3',
      icon: 'h-10 w-10',
      text: 'text-base',
      title: 'text-lg',
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={cn('font-medium text-gray-700 dark:text-gray-300', currentSize.text)}>
            Étape {currentStep + 1} sur {steps.length}
          </span>
          {showPercentage && (
            <span className={cn('font-bold text-blue-600 dark:text-blue-400', currentSize.text)}>
              {percentage}%
            </span>
          )}
        </div>
        <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', currentSize.height)}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isClickable = onStepClick && (isPast || isCompleted);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-start gap-4 w-full text-left transition-all',
                  isClickable && 'cursor-pointer hover:opacity-80',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Step icon */}
                <div
                  className={cn(
                    'relative z-10 flex-shrink-0 flex items-center justify-center rounded-full',
                    'transition-all duration-300',
                    currentSize.icon,
                    isCurrent && 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/50',
                    isCompleted && 'bg-green-600 dark:bg-green-500 text-white',
                    !isCurrent && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pt-1">
                  <p
                    className={cn(
                      'font-semibold transition-colors',
                      currentSize.title,
                      isCurrent && 'text-blue-600 dark:text-blue-400',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      !isCurrent && !isCompleted && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className={cn('text-gray-500 dark:text-gray-400 mt-1', currentSize.text)}>
                      {step.description}
                    </p>
                  )}
                  {isCurrent && step.fields && (
                    <p className={cn('text-gray-400 dark:text-gray-500 mt-1', currentSize.text)}>
                      {step.fields.length} champ(s) requis
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Fonction utilitaire pour calculer les étapes complétées
 * basée sur la validation react-hook-form
 */
export function calculateCompletedSteps(
  steps: FormStep[],
  formState: any
): number[] {
  const completed: number[] = [];

  steps.forEach((step, index) => {
    if (!step.fields || step.fields.length === 0) {
      return;
    }

    const allFieldsValid = step.fields.every((field) => {
      const error = formState.errors[field];
      const isDirty = formState.dirtyFields[field];
      return !error && isDirty;
    });

    if (allFieldsValid) {
      completed.push(index);
    }
  });

  return completed;
}

/**
 * CompactFormProgress - Version compacte pour petits espaces
 */
export const CompactFormProgress: React.FC<{
  current: number;
  total: number;
  className?: string;
}> = ({ current, total, className }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  );
};
