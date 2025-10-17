/**
 * Form Helpers - Helpers et hooks pour faciliter l'utilisation des formulaires
 * 
 * Ce module fournit des hooks React et des utilitaires pour simplifier
 * l'intégration de la validation avec React Hook Form et les composants UI.
 */

import { 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState 
} from 'react';
import { 
  FieldValues, 
  Path, 
  UseFormReturn, 
  useFormContext,
  FieldError,
  PathValue
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { 
  FormValidator, 
  ValidationResult, 
  FormValidationConfig, 
  ValidationError,
  InputHelpers,
  Formatters,
  Parsers,
  Transformers
} from './formData';
import { logger } from '@/utils/logger';

// =============================================================================
// HOOKS POUR LA VALIDATION
// =============================================================================

/**
 * Hook principal pour utiliser la validation avec React Hook Form
 */
export function useFormValidation<T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  config: FormValidationConfig<T>
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Instance du validateur
  const validator = useMemo(() => new FormValidator(config, t), [config, t]);
  
  // État de validation
  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationError[]>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, ValidationError[]>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  
  // Debounced validators par champ
  const debouncedValidators = useRef<Record<string, any>>({});
  
  /**
   * Valide un champ spécifique
   */
  const validateField = useCallback(async (fieldName: Path<T>, value: any) => {
    setIsValidating(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const result = await validator.validateField(fieldName, value);
      
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: result.errors
      }));
      
      setValidationWarnings(prev => ({
        ...prev,
        [fieldName]: result.warnings || []
      }));
      
      return result;
    } finally {
      setIsValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  }, [validator]);
  
  /**
   * Valide tout le formulaire
   */
  const validateForm = useCallback(async (data: T) => {
    setIsValidating({});
    
    try {
      const result = await validator.validateForm(data);
      
      if (!result.isValid) {
        // Groupe les erreurs par champ
        const errorsByField: Record<string, ValidationError[]> = {};
        result.errors.forEach(error => {
          if (!errorsByField[error.field]) {
            errorsByField[error.field] = [];
          }
          errorsByField[error.field].push(error);
        });
        
        setValidationErrors(errorsByField);
        
        // Affiche un toast d'erreur
        toast({
          variant: 'destructive',
          title: t('validation.formErrors', { defaultValue: 'Erreurs de validation' }),
          description: t('validation.fixErrors', { 
            count: result.errors.length,
            defaultValue: `Veuillez corriger ${result.errors.length} erreur(s)` 
          })
        });
      } else {
        setValidationErrors({});
        setValidationWarnings({});
      }
      
      return result;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('validation.unexpectedError', { defaultValue: 'Erreur inattendue' }),
        description: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, [validator, toast, t]);
  
  /**
   * Crée un validateur en temps réel pour un champ
   */
  const createFieldValidator = useCallback((fieldName: Path<T>) => {
    if (!debouncedValidators.current[fieldName]) {
      debouncedValidators.current[fieldName] = validator.createDebouncedValidator(fieldName);
    }
    
    return (value: any) => {
      debouncedValidators.current[fieldName](value, (result: ValidationResult) => {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: result.errors
        }));
        
        setValidationWarnings(prev => ({
          ...prev,
          [fieldName]: result.warnings || []
        }));
      });
    };
  }, [validator]);
  
  /**
   * Nettoie les erreurs pour un champ
   */
  const clearFieldErrors = useCallback((fieldName: Path<T>) => {
    setValidationErrors(prev => ({ ...prev, [fieldName]: [] }));
    setValidationWarnings(prev => ({ ...prev, [fieldName]: [] }));
  }, []);
  
  /**
   * Obtient les erreurs pour un champ
   */
  const getFieldError = useCallback((fieldName: Path<T>) => {
    const errors = validationErrors[fieldName] || [];
    return errors.length > 0 ? errors[0].message : undefined;
  }, [validationErrors]);
  
  /**
   * Obtient les avertissements pour un champ
   */
  const getFieldWarning = useCallback((fieldName: Path<T>) => {
    const warnings = validationWarnings[fieldName] || [];
    return warnings.length > 0 ? warnings[0].message : undefined;
  }, [validationWarnings]);
  
  /**
   * Vérifie si un champ est en cours de validation
   */
  const isFieldValidating = useCallback((fieldName: Path<T>) => {
    return isValidating[fieldName] || false;
  }, [isValidating]);
  
  return {
    validateField,
    validateForm,
    createFieldValidator,
    clearFieldErrors,
    getFieldError,
    getFieldWarning,
    isFieldValidating,
    validationErrors,
    validationWarnings,
    validator
  };
}

/**
 * Hook pour créer des helpers d'input avec validation et formatage
 */
export function useInputHelpers<T extends FieldValues = FieldValues, K extends Path<T> = Path<T>>(
  fieldName: K,
  options?: {
    formatter?: (value: any) => string;
    parser?: (value: string) => any;
    transformer?: (value: any) => any;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  }
): InputHelpers {
  const form = useFormContext<T>();
  const { validateField, getFieldError, getFieldWarning, isFieldValidating, createFieldValidator } = useFormValidation(form, {} as FormValidationConfig<T>);
  
  const value = form.watch(fieldName);
  const fieldState = form.getFieldState(fieldName);
  
  // Validateur en temps réel
  const realtimeValidator = useMemo(() => 
    createFieldValidator(fieldName), 
    [createFieldValidator, fieldName]
  );
  
  // Valeur formatée pour l'affichage
  const formattedValue = useMemo(() => {
    if (options?.formatter && value !== undefined && value !== null) {
      return options.formatter(value);
    }
    return String(value || '');
  }, [value, options?.formatter]);
  
  /**
   * Gestionnaire de changement de valeur
   */
  const handleChange = useCallback((newValue: any) => {
    // Parse la valeur si un parser est fourni
    const parsedValue = options?.parser ? options.parser(newValue) : newValue;
    
    // Transforme la valeur si un transformer est fourni
    const transformedValue = options?.transformer ? options.transformer(parsedValue) : parsedValue;
    
    // Met à jour la valeur dans le formulaire
    form.setValue(fieldName, transformedValue);
    
    // Validation en temps réel si activée
    if (options?.validateOnChange !== false) {
      realtimeValidator(transformedValue);
    }
  }, [form, fieldName, options, realtimeValidator]);
  
  /**
   * Gestionnaire de perte de focus
   */
  const handleBlur = useCallback(() => {
    if (options?.validateOnBlur !== false) {
      realtimeValidator(value);
    }
  }, [options?.validateOnBlur, realtimeValidator, value]);
  
  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    error: getFieldError(fieldName),
    warning: getFieldWarning(fieldName),
    isValidating: isFieldValidating(fieldName),
    formatted: formattedValue,
    isValid: !fieldState.error && !getFieldError(fieldName),
    isDirty: fieldState.isDirty,
    isTouched: fieldState.isTouched
  };
}

/**
 * Hook pour la validation en temps réel
 */
export function useRealtimeValidation<T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  config: FormValidationConfig<T>,
  options?: {
    validateOnMount?: boolean;
    validateOnChange?: boolean;
    debounceMs?: number;
  }
) {
  const { validateField } = useFormValidation(form, config);
  const [lastValidation, setLastValidation] = useState<Record<string, number>>({});
  
  const debounceMs = options?.debounceMs || 300;
  
  // Validation au montage
  useEffect(() => {
    if (options?.validateOnMount) {
      const currentValues = form.getValues();
      Object.keys(config.fields).forEach(fieldName => {
        validateField(fieldName as Path<T>, currentValues[fieldName as keyof T]);
      });
    }
  }, [options?.validateOnMount, form, config.fields, validateField]);
  
  // Validation sur changement avec debounce
  useEffect(() => {
    if (options?.validateOnChange === false) return;
    
    const subscription = form.watch((data, { name }) => {
      if (!name || !config.fields[name as keyof T]) return;
      
      const now = Date.now();
      const lastValidationTime = lastValidation[name] || 0;
      
      if (now - lastValidationTime < debounceMs) {
        // Debounce
        setTimeout(() => {
          if (Date.now() - lastValidation[name] >= debounceMs) {
            validateField(name as Path<T>, (data as any)[name as keyof T]);
            setLastValidation(prev => ({ ...prev, [name]: Date.now() }));
          }
        }, debounceMs);
      } else {
        validateField(name as Path<T>, (data as any)[name as keyof T]);
        setLastValidation(prev => ({ ...prev, [name]: now }));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, config.fields, validateField, lastValidation, debounceMs, options?.validateOnChange]);
}

// =============================================================================
// HELPERS POUR LES COMPOSANTS SPÉCIFIQUES
// =============================================================================

/**
 * Helper pour les inputs de montant avec formatage de devise
 */
export function useCurrencyInput<T extends FieldValues = FieldValues>(
  fieldName: Path<T>,
  currency = 'EUR',
  locale = 'fr-FR'
) {
  return useInputHelpers(fieldName, {
    formatter: (value: number) => Formatters.currency(value, currency, locale),
    parser: (value: string) => Parsers.currency(value),
    transformer: (value: any) => typeof value === 'string' ? Parsers.currency(value) : value
  });
}

/**
 * Helper pour les inputs de date
 */
export function useDateInput<T extends FieldValues = FieldValues>(
  fieldName: Path<T>,
  locale = 'fr-FR'
) {
  return useInputHelpers(fieldName, {
    formatter: (value: Date) => value instanceof Date ? Formatters.date(value, locale) : String(value),
    parser: (value: string) => Parsers.date(value),
    transformer: (value: any) => value instanceof Date ? value : Parsers.date(String(value))
  });
}

/**
 * Helper pour les inputs de téléphone
 */
export function usePhoneInput<T extends FieldValues = FieldValues>(
  fieldName: Path<T>
) {
  return useInputHelpers(fieldName, {
    formatter: (value: string) => Formatters.phone(value),
    parser: (value: string) => Parsers.phone(value),
    transformer: (value: any) => Parsers.phone(String(value || ''))
  });
}

/**
 * Helper pour les inputs de pourcentage
 */
export function usePercentageInput<T extends FieldValues = FieldValues>(
  fieldName: Path<T>,
  locale = 'fr-FR'
) {
  return useInputHelpers(fieldName, {
    formatter: (value: number) => Formatters.percentage(value, locale),
    parser: (value: string) => Parsers.percentage(value),
    transformer: (value: any) => typeof value === 'string' ? Parsers.percentage(value) : value
  });
}

/**
 * Helper pour les inputs SIRET
 */
export function useSiretInput<T extends FieldValues = FieldValues>(
  fieldName: Path<T>
) {
  return useInputHelpers(fieldName, {
    formatter: (value: string) => Formatters.siret(value),
    parser: (value: string) => Parsers.siret(value),
    transformer: (value: any) => Parsers.siret(String(value || ''))
  });
}

// =============================================================================
// UTILITAIRES DE TRANSFORMATION
// =============================================================================

/**
 * Transforme les données du formulaire pour l'API
 */
export function transformForApi<T extends FieldValues>(data: T): T {
  return Transformers.toApi(data);
}

/**
 * Transforme les données de l'API pour le formulaire
 */
export function transformFromApi<T extends FieldValues>(data: T): T {
  return Transformers.fromApi(data);
}

/**
 * Sanitise les données du formulaire
 */
export function sanitizeFormData<T extends FieldValues>(data: T): T {
  return Transformers.sanitize(data);
}

// =============================================================================
// HOOK POUR LA PERSISTANCE DES DONNÉES
// =============================================================================

/**
 * Hook pour persister automatiquement les données du formulaire
 */
export function useFormPersistence<T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  key: string,
  options?: {
    storage?: 'localStorage' | 'sessionStorage';
    debounceMs?: number;
    exclude?: (keyof T)[];
  }
) {
  const storage = options?.storage === 'sessionStorage' ? sessionStorage : localStorage;
  const debounceMs = options?.debounceMs || 1000;
  const exclude = options?.exclude || [];
  
  // Restaure les données au montage
  useEffect(() => {
    try {
      const saved = storage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        const transformedData = transformFromApi(data);
        
        // Applique seulement les champs non exclus
        Object.keys(transformedData).forEach(fieldName => {
          if (!exclude.includes(fieldName as keyof T)) {
            form.setValue(fieldName as Path<T>, transformedData[fieldName]);
          }
        });
      }
    } catch (error) {
      logger.warn('Erreur lors de la restauration des données du formulaire:', error)
    }
  }, [form, key, storage, exclude]);
  
  // Sauvegarde les données lors des changements
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((data) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        try {
          // Filtre les champs exclus
          const filteredData = Object.keys(data).reduce((acc, fieldName) => {
            if (!exclude.includes(fieldName as keyof T)) {
              acc[fieldName] = data[fieldName];
            }
            return acc;
          }, {} as any);
          
          const transformedData = transformForApi(filteredData);
          storage.setItem(key, JSON.stringify(transformedData));
        } catch (error) {
          logger.warn('Erreur lors de la sauvegarde des données du formulaire:', error)
        }
      }, debounceMs);
    });
    
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, key, storage, debounceMs, exclude]);
  
  /**
   * Nettoie les données persistées
   */
  const clearPersistedData = useCallback(() => {
    try {
      storage.removeItem(key);
    } catch (error) {
      logger.warn('Erreur lors de la suppression des données persistées:', error)
    }
  }, [storage, key]);
  
  return { clearPersistedData };
}

// =============================================================================
// HOOK POUR LES FORMULAIRES EN ÉTAPES
// =============================================================================

/**
 * Hook pour gérer les formulaires multi-étapes avec validation
 */
export function useStepForm<T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  steps: {
    name: string;
    fields: (keyof T)[];
    validation?: FormValidationConfig<Partial<T>>;
  }[]
) {
  const [currentStep, setCurrentStep] = useState(0);
  const { validateForm } = useFormValidation(form, {} as FormValidationConfig<T>);
  
  /**
   * Valide l'étape courante
   */
  const validateCurrentStep = useCallback(async () => {
    const step = steps[currentStep];
    if (!step.validation) return true;
    
    const stepData = step.fields.reduce((acc, field) => {
      acc[field] = form.getValues(field as Path<T>);
      return acc;
    }, {} as Partial<T>);
    
    const result = await validateForm(stepData as T);
    return result.isValid;
  }, [currentStep, steps, form, validateForm]);
  
  /**
   * Passe à l'étape suivante
   */
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [validateCurrentStep, currentStep, steps.length]);
  
  /**
   * Revient à l'étape précédente
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  /**
   * Va à une étape spécifique
   */
  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Valide toutes les étapes précédentes
      for (let i = 0; i < stepIndex; i++) {
        const tempCurrentStep = currentStep;
        setCurrentStep(i);
        const isValid = await validateCurrentStep();
        setCurrentStep(tempCurrentStep);
        
        if (!isValid) {
          return false;
        }
      }
      
      setCurrentStep(stepIndex);
      return true;
    }
    return false;
  }, [currentStep, steps.length, validateCurrentStep]);
  
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return {
    currentStep,
    currentStepData,
    isFirstStep,
    isLastStep,
    progress,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    totalSteps: steps.length
  };
}

export default {
  useFormValidation,
  useInputHelpers,
  useRealtimeValidation,
  useCurrencyInput,
  useDateInput,
  usePhoneInput,
  usePercentageInput,
  useSiretInput,
  useFormPersistence,
  useStepForm,
  transformForApi,
  transformFromApi,
  sanitizeFormData
};