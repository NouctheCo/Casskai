/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * useFormValidation - Hook pour validation de formulaires
 *
 * Integrates:
 * - Zod schema validation
 * - Async validation (email, SIRET, etc.)
 * - Visual feedback (icons, shake animation)
 * - Form progress tracking
 * - react-hook-form compatible
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormStep, calculateCompletedSteps } from '@/components/ui/FormProgress';
import { logger } from '@/lib/logger';

/**
 * Field validation state
 */
export interface FieldValidationState {
  /**
   * Champ valide
   */
  isValid: boolean;

  /**
   * Champ invalide (erreur)
   */
  isInvalid: boolean;

  /**
   * Champ dirty (modifié par l'utilisateur)
   */
  isDirty: boolean;

  /**
   * Champ touched (focus puis blur)
   */
  isTouched: boolean;

  /**
   * Message d'erreur
   */
  error?: string;

  /**
   * Validation en cours
   */
  isValidating: boolean;
}

/**
 * Form validation hook return type
 */
export interface UseFormValidationReturn {
  /**
   * État de validation pour un champ
   */
  getFieldState: (fieldName: string) => FieldValidationState;

  /**
   * Formulaire valide globalement
   */
  isFormValid: boolean;

  /**
   * Nombre de champs valides
   */
  validFieldsCount: number;

  /**
   * Nombre total de champs
   */
  totalFieldsCount: number;

  /**
   * Pourcentage de complétion
   */
  completionPercentage: number;

  /**
   * Étapes complétées (si formulaire multi-étapes)
   */
  completedSteps: number[];

  /**
   * Déclencher la validation manuelle d'un champ
   */
  validateField: (fieldName: string) => Promise<boolean>;

  /**
   * Reset validation state
   */
  resetValidation: () => void;
}

/**
 * useFormValidation Hook
 */
export function useFormValidation(
  form: UseFormReturn<any>,
  options: {
    /**
     * Liste des champs à valider
     */
    fields?: string[];

    /**
     * Étapes du formulaire (multi-step)
     */
    steps?: FormStep[];

    /**
     * Mode de validation
     */
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';

    /**
     * Activer la validation en temps réel
     */
    realtimeValidation?: boolean;
  } = {}
): UseFormValidationReturn {
  const {
    fields = [],
    steps = [],
    mode = 'onChange',
    realtimeValidation = true,
  } = options;

  const {
    formState: { errors, dirtyFields, touchedFields, isValid, isValidating },
    trigger,
  } = form;

  // État local pour forcer le re-render
  const [validationKey, setValidationKey] = useState(0);

  /**
   * Obtenir l'état de validation d'un champ
   */
  const getFieldState = useCallback(
    (fieldName: string): FieldValidationState => {
      const error = errors[fieldName];
      const isDirty = !!dirtyFields[fieldName];
      const isTouched = !!touchedFields[fieldName];
      const hasError = !!error;

      return {
        isValid: !hasError && isDirty,
        isInvalid: hasError && (isDirty || isTouched),
        isDirty,
        isTouched,
        error: error?.message as string | undefined,
        isValidating: false, // react-hook-form doesn't expose per-field validating state
      };
    },
    [errors, dirtyFields, touchedFields]
  );

  /**
   * Compter les champs valides
   */
  const { validFieldsCount, totalFieldsCount } = useMemo(() => {
    const fieldsToCheck = fields.length > 0 ? fields : Object.keys(dirtyFields);
    const valid = fieldsToCheck.filter((field) => {
      const state = getFieldState(field);
      return state.isValid;
    }).length;

    return {
      validFieldsCount: valid,
      totalFieldsCount: fieldsToCheck.length,
    };
  }, [fields, dirtyFields, getFieldState]);

  /**
   * Calculer le pourcentage de complétion
   */
  const completionPercentage = useMemo(() => {
    if (totalFieldsCount === 0) return 0;
    return Math.round((validFieldsCount / totalFieldsCount) * 100);
  }, [validFieldsCount, totalFieldsCount]);

  /**
   * Calculer les étapes complétées
   */
  const completedSteps = useMemo(() => {
    if (steps.length === 0) return [];
    return calculateCompletedSteps(steps, { errors, dirtyFields });
  }, [steps, errors, dirtyFields]);

  /**
   * Valider un champ manuellement
   */
  const validateField = useCallback(
    async (fieldName: string): Promise<boolean> => {
      try {
        const result = await trigger(fieldName);
        setValidationKey((prev) => prev + 1); // Force re-render
        return result;
      } catch (error) {
        logger.error('useFormValidation', 'Error validating field:', error);
        return false;
      }
    },
    [trigger]
  );

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setValidationKey(0);
    form.clearErrors();
  }, [form]);

  /**
   * Auto-validation en temps réel (si activée)
   */
  useEffect(() => {
    if (!realtimeValidation || mode === 'onSubmit') return;

    const subscription = form.watch(() => {
      setValidationKey((prev) => prev + 1);
    });

    return () => subscription.unsubscribe();
  }, [form, realtimeValidation, mode]);

  return {
    getFieldState,
    isFormValid: isValid,
    validFieldsCount,
    totalFieldsCount,
    completionPercentage,
    completedSteps,
    validateField,
    resetValidation,
  };
}

/**
 * Hook simplifié pour validation d'un champ unique
 */
export function useFieldValidation(
  form: UseFormReturn<any>,
  fieldName: string
): FieldValidationState {
  const { getFieldState } = useFormValidation(form, {
    fields: [fieldName],
    realtimeValidation: true,
  });

  return getFieldState(fieldName);
}

/**
 * Export par défaut
 */
export default useFormValidation;
