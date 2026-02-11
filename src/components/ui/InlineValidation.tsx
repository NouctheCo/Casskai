/**
 * CassKai - Inline Validation Component
 *
 * Phase 2 (P1) - UX Formulaires Premium
 *
 * Fonctionnalités:
 * - Validation temps réel avec debounce
 * - Feedback visuel immédiat (✓ ✗)
 * - Messages d'erreur/succès/avertissement
 * - Suggestions de correction
 * - Animation des transitions
 * - Support Zod schemas
 * - Validation asynchrone
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Lightbulb
} from 'lucide-react';
import type { ZodSchema } from 'zod';

export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';

export interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  suggestions?: string[];
}

export interface InlineValidationProps {
  value: any;
  schema?: ZodSchema;
  validate?: (value: any) => ValidationResult | Promise<ValidationResult>;
  debounceMs?: number;
  showSuccessMessage?: boolean;
  showIcon?: boolean;
  showSuggestions?: boolean;
  disabled?: boolean;
  className?: string;
  onValidationChange?: (result: ValidationResult) => void;
}

/**
 * Icône selon le statut de validation
 */
function ValidationIcon({ status }: { status: ValidationStatus }) {
  switch (status) {
    case 'validating':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case 'valid':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'invalid':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return null;
  }
}

export default function InlineValidation({
  value,
  schema,
  validate,
  debounceMs = 500,
  showSuccessMessage = false,
  showIcon = true,
  showSuggestions = true,
  disabled = false,
  className,
  onValidationChange
}: InlineValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    status: 'idle'
  });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const validationInProgressRef = useRef(false);

  /**
   * Validation avec Zod schema
   */
  const validateWithSchema = useCallback(async (val: any): Promise<ValidationResult> => {
    if (!schema) {
      return { status: 'idle' };
    }

    try {
      await schema.parseAsync(val);
      return { status: 'valid', message: 'Valide' };
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        return {
          status: 'invalid',
          message: firstError.message,
          suggestions: []
        };
      }
      return { status: 'invalid', message: 'Valeur invalide' };
    }
  }, [schema]);

  /**
   * Validation personnalisée
   */
  const validateValue = useCallback(async (val: any) => {
    if (disabled) {
      setValidationResult({ status: 'idle' });
      return;
    }

    if (validationInProgressRef.current) {
      return;
    }

    validationInProgressRef.current = true;
    setValidationResult({ status: 'validating' });

    try {
      let result: ValidationResult;

      if (validate) {
        result = await Promise.resolve(validate(val));
      } else if (schema) {
        result = await validateWithSchema(val);
      } else {
        result = { status: 'idle' };
      }

      setValidationResult(result);
      onValidationChange?.(result);
    } catch (error) {
      logger.error('InlineValidation', 'Validation error:', error);
      setValidationResult({
        status: 'invalid',
        message: 'Erreur de validation'
      });
    } finally {
      validationInProgressRef.current = false;
    }
  }, [validate, schema, validateWithSchema, disabled, onValidationChange]);

  /**
   * Déclencher validation avec debounce
   */
  useEffect(() => {
    if (disabled) {
      return;
    }

    // Vider le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Ne rien valider si la valeur est vide (sauf si un schema l'exige)
    if (!value && !schema) {
      setValidationResult({ status: 'idle' });
      return;
    }

    // Lancer validation après debounce
    debounceTimerRef.current = setTimeout(() => {
      validateValue(value);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, validateValue, debounceMs, disabled, schema]);

  /**
   * Classe CSS selon le statut
   */
  const getStatusClasses = () => {
    switch (validationResult.status) {
      case 'valid':
        return 'border-green-500 bg-green-50 dark:bg-green-900/10';
      case 'invalid':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'validating':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return '';
    }
  };

  /**
   * Couleur du texte selon le statut
   */
  const getTextColor = () => {
    switch (validationResult.status) {
      case 'valid':
        return 'text-green-700 dark:text-green-300';
      case 'invalid':
        return 'text-red-700 dark:text-red-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'validating':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  /**
   * Ne rien afficher si idle ou si validation en cours sans message
   */
  const shouldShow = validationResult.status !== 'idle' &&
    (validationResult.status === 'validating' ||
     validationResult.message ||
     (validationResult.status === 'valid' && showSuccessMessage));

  if (!shouldShow && (!showSuggestions || !validationResult.suggestions?.length)) {
    return null;
  }

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert className={cn('py-2 px-3', getStatusClasses())}>
              <div className="flex items-start space-x-2">
                {showIcon && <ValidationIcon status={validationResult.status} />}
                <AlertDescription className={cn('text-sm', getTextColor())}>
                  {validationResult.message}
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}

        {showSuggestions && validationResult.suggestions && validationResult.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 py-2 px-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Suggestions :
                  </AlertDescription>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Wrapper pour un input avec validation inline
 */
export function ValidatedInput({
  value,
  onChange,
  validation,
  inputProps,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  validation: Omit<InlineValidationProps, 'value'>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleValidationChange = useCallback((result: ValidationResult) => {
    setValidationStatus(result.status);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <input
          {...inputProps}
          value={localValue}
          onChange={handleChange}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            validationStatus === 'valid' && 'border-green-500 pr-10',
            validationStatus === 'invalid' && 'border-red-500 pr-10',
            validationStatus === 'warning' && 'border-yellow-500 pr-10',
            inputProps?.className
          )}
        />
        {validationStatus !== 'idle' && validationStatus !== 'validating' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ValidationIcon status={validationStatus} />
          </div>
        )}
      </div>
      <InlineValidation
        value={localValue}
        {...validation}
        onValidationChange={handleValidationChange}
      />
    </div>
  );
}

/**
 * Hook pour gérer la validation d'un formulaire complet
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, InlineValidationProps['validate']>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [validationResults, setValidationResults] = useState<Record<keyof T, ValidationResult>>({} as any);
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback(async (field: keyof T, value: any) => {
    const validator = validationRules[field];
    if (!validator) {
      return { status: 'idle' as ValidationStatus };
    }

    const result = await Promise.resolve(validator(value));
    setValidationResults(prev => ({ ...prev, [field]: result }));
    return result;
  }, [validationRules]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  }, [validateField]);

  useEffect(() => {
    const allValid = Object.values(validationResults).every(
      (result: any) => result.status === 'valid' || result.status === 'idle'
    );
    setIsValid(allValid);
  }, [validationResults]);

  return {
    values,
    setValue,
    validationResults,
    isValid,
    validateField
  };
}
