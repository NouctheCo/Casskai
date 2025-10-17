/**
 * Intégration avec les formulaires existants
 * 
 * Ce module fournit des composants et hooks pour intégrer facilement
 * la librairie de validation avec les composants UI existants du projet.
 */

import React, { forwardRef, useCallback, useEffect } from 'react';
import { 
  FieldValues, 
  Path, 
  useFormContext,
  Controller,
  ControllerRenderProps,
  FieldPath,
  Control
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

const FormDescription: any = (props: any) => <div className="text-sm text-muted-foreground" {...props} />;
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { 
  useInputHelpers,
  useCurrencyInput,
  useDateInput,
  usePhoneInput,
  usePercentageInput,
  useSiretInput
} from './formHelpers';
import { ValidationError, ValidationWarning } from './formData';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

// =============================================================================
// COMPOSANTS WRAPPER POUR VALIDATION
// =============================================================================

/**
 * Props pour les composants de validation
 */
interface ValidatedFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  showValidationState?: boolean;
  showWarnings?: boolean;
}

/**
 * Wrapper pour Input avec validation intégrée
 */
export const ValidatedInput = forwardRef<
  HTMLInputElement,
  ValidatedFieldProps & React.ComponentProps<typeof Input>
>(({ name, label, description, required, className, showValidationState = true, showWarnings = true, ...props }, ref) => {
  const helpers = useInputHelpers(name);
  
  return (
    <FormItem>
      {label && (
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </FormLabel>
      )}
      <FormControl>
        <div className="relative">
          <Input
            ref={ref}
            {...props}
            value={helpers.formatted}
            onChange={(e) => helpers.onChange(e.target.value)}
            onBlur={helpers.onBlur}
            className={cn(
              className,
              !helpers.isValid && helpers.isTouched && "border-destructive",
              helpers.isValid && helpers.isTouched && "border-green-500"
            )}
          />
          {showValidationState && (
            <ValidationStateIndicator 
              isValid={helpers.isValid}
              isValidating={helpers.isValidating}
              isTouched={helpers.isTouched}
            />
          )}
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage>
        {helpers.error}
        {showWarnings && helpers.warning && !helpers.error && (
          <div className="text-yellow-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {helpers.warning}
          </div>
        )}
      </FormMessage>
    </FormItem>
  );
});

ValidatedInput.displayName = "ValidatedInput";

/**
 * Input pour montants avec formatage de devise
 */
export const ValidatedCurrencyInput = forwardRef<
  HTMLInputElement,
  ValidatedFieldProps & React.ComponentProps<typeof Input> & {
    currency?: string;
    locale?: string;
  }
>(({ name, currency = 'EUR', locale = 'fr-FR', ...props }, ref) => {
  const helpers = useCurrencyInput(name, currency, locale);
  
  return (
    <ValidatedInput
      ref={ref}
      name={name}
      {...props}
      value={helpers.formatted}
      onChange={(e) => helpers.onChange(e.target.value)}
      onBlur={helpers.onBlur}
    />
  );
});

ValidatedCurrencyInput.displayName = "ValidatedCurrencyInput";

/**
 * Input pour téléphones avec formatage
 */
export const ValidatedPhoneInput = forwardRef<
  HTMLInputElement,
  ValidatedFieldProps & React.ComponentProps<typeof Input>
>(({ name, ...props }, ref) => {
  const helpers = usePhoneInput(name);
  
  return (
    <ValidatedInput
      ref={ref}
      name={name}
      {...props}
      value={helpers.formatted}
      onChange={(e) => helpers.onChange(e.target.value)}
      onBlur={helpers.onBlur}
      placeholder="01 23 45 67 89"
    />
  );
});

ValidatedPhoneInput.displayName = "ValidatedPhoneInput";

/**
 * Input pour pourcentages
 */
export const ValidatedPercentageInput = forwardRef<
  HTMLInputElement,
  ValidatedFieldProps & React.ComponentProps<typeof Input> & {
    locale?: string;
  }
>(({ name, locale = 'fr-FR', ...props }, ref) => {
  const helpers = usePercentageInput(name, locale);
  
  return (
    <ValidatedInput
      ref={ref}
      name={name}
      {...props}
      value={helpers.formatted}
      onChange={(e) => helpers.onChange(e.target.value)}
      onBlur={helpers.onBlur}
    />
  );
});

ValidatedPercentageInput.displayName = "ValidatedPercentageInput";

/**
 * Input pour SIRET avec formatage
 */
export const ValidatedSiretInput = forwardRef<
  HTMLInputElement,
  ValidatedFieldProps & React.ComponentProps<typeof Input>
>(({ name, ...props }, ref) => {
  const helpers = useSiretInput(name);
  
  return (
    <ValidatedInput
      ref={ref}
      name={name}
      {...props}
      value={helpers.formatted}
      onChange={(e) => helpers.onChange(e.target.value)}
      onBlur={helpers.onBlur}
      placeholder="123 456 789 01234"
      maxLength={17} // Avec espaces
    />
  );
});

ValidatedSiretInput.displayName = "ValidatedSiretInput";

/**
 * Select avec validation intégrée
 */
interface ValidatedSelectProps<T extends FieldValues = FieldValues> 
  extends ValidatedFieldProps<T> {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export function ValidatedSelect<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  required,
  options,
  placeholder,
  onValueChange,
  className,
  showValidationState = true,
  showWarnings = true
}: ValidatedSelectProps<T>) {
  const { control } = useFormContext<T>();
  const helpers = useInputHelpers(name);
  
  return (
    <FormItem>
      {label && (
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </FormLabel>
      )}
      <FormControl>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Select
                value={field.value || ''}
                onValueChange={(value) => {
                  field.onChange(value);
                  helpers.onChange(value);
                  onValueChange?.(value);
                }}
                onOpenChange={() => helpers.onBlur()}
              >
                <SelectTrigger className={cn(
                  className,
                  !helpers.isValid && helpers.isTouched && "border-destructive",
                  helpers.isValid && helpers.isTouched && "border-green-500"
                )}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showValidationState && (
                <ValidationStateIndicator 
                  isValid={helpers.isValid}
                  isValidating={helpers.isValidating}
                  isTouched={helpers.isTouched}
                />
              )}
            </div>
          )}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage>
        {helpers.error}
        {showWarnings && helpers.warning && !helpers.error && (
          <div className="text-yellow-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {helpers.warning}
          </div>
        )}
      </FormMessage>
    </FormItem>
  );
}

// =============================================================================
// INDICATEURS DE VALIDATION
// =============================================================================

/**
 * Indicateur d'état de validation
 */
interface ValidationStateIndicatorProps {
  isValid: boolean;
  isValidating: boolean;
  isTouched: boolean;
  className?: string;
}

export function ValidationStateIndicator({
  isValid,
  isValidating,
  isTouched,
  className
}: ValidationStateIndicatorProps) {
  if (!isTouched) return null;
  
  return (
    <div className={cn("absolute right-3 top-1/2 -translate-y-1/2", className)}>
      {isValidating ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : isValid ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  );
}

/**
 * Badge d'erreur de validation
 */
interface ValidationErrorBadgeProps {
  error: ValidationError;
  onDismiss?: () => void;
}

export function ValidationErrorBadge({ error, onDismiss }: ValidationErrorBadgeProps) {
  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {error.message}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-3 w-3 p-0 hover:bg-transparent"
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </Badge>
  );
}

/**
 * Badge d'avertissement de validation
 */
interface ValidationWarningBadgeProps {
  warning: ValidationWarning;
  onDismiss?: () => void;
}

export function ValidationWarningBadge({ warning, onDismiss }: ValidationWarningBadgeProps) {
  return (
    <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
      <AlertCircle className="h-3 w-3" />
      {warning.message}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-3 w-3 p-0 hover:bg-transparent"
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </Badge>
  );
}

// =============================================================================
// COMPOSANTS DE RÉSUMÉ DE VALIDATION
// =============================================================================

/**
 * Résumé des erreurs de validation pour tout le formulaire
 */
interface ValidationSummaryProps {
  errors: Record<string, ValidationError[]>;
  warnings?: Record<string, ValidationWarning[]>;
  title?: string;
  showWarnings?: boolean;
  onErrorClick?: (fieldName: string) => void;
  className?: string;
}

export function ValidationSummary({
  errors,
  warnings = {},
  title = "Erreurs de validation",
  showWarnings = true,
  onErrorClick,
  className
}: ValidationSummaryProps) {
  const allErrors = Object.values(errors).flat();
  const allWarnings = Object.values(warnings).flat();
  
  if (allErrors.length === 0 && (!showWarnings || allWarnings.length === 0)) {
    return null;
  }
  
  return (
    <div className={cn("border border-destructive bg-destructive/10 rounded-lg p-4", className)}>
      <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        {title}
      </h4>
      
      {allErrors.length > 0 && (
        <div className="space-y-1 mb-3">
          {allErrors.map((error, index) => (
            <div key={index} className="text-sm text-destructive">
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => onErrorClick?.(error.field)}
              >
                • {error.message}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {showWarnings && allWarnings.length > 0 && (
        <div className="space-y-1">
          <h5 className="font-medium text-yellow-700 text-sm">Avertissements :</h5>
          {allWarnings.map((warning, index) => (
            <div key={index} className="text-sm text-yellow-700">
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => onErrorClick?.(warning.field)}
              >
                • {warning.message}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compteur d'erreurs de validation
 */
interface ValidationCounterProps {
  errors: Record<string, ValidationError[]>;
  warnings?: Record<string, ValidationWarning[]>;
  showWarnings?: boolean;
  className?: string;
}

export function ValidationCounter({
  errors,
  warnings = {},
  showWarnings = true,
  className
}: ValidationCounterProps) {
  const errorCount = Object.values(errors).flat().length;
  const warningCount = Object.values(warnings).flat().length;
  
  if (errorCount === 0 && (!showWarnings || warningCount === 0)) {
    return null;
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {errorCount > 0 && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errorCount} erreur{errorCount > 1 ? 's' : ''}
        </Badge>
      )}
      
      {showWarnings && warningCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
          <AlertCircle className="h-3 w-3" />
          {warningCount} avertissement{warningCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}

// =============================================================================
// HOOKS D'INTÉGRATION
// =============================================================================

/**
 * Hook pour intégrer la validation avec les toasts existants
 */
export function useValidationToasts() {
  const { toast } = useToast();

  const showValidationErrors = useCallback((errors: ValidationError[]) => {
    if (errors.length === 0) return;
    
    toast({
      variant: 'destructive',
      title: 'Erreurs de validation',
      description: `${errors.length} erreur${errors.length > 1 ? 's' : ''} détectée${errors.length > 1 ? 's' : ''}`,
    });
  }, [toast]);
  
  const showValidationWarnings = useCallback((warnings: ValidationWarning[]) => {
    if (warnings.length === 0) return;
    
    toast({
      title: 'Avertissements',
      description: `${warnings.length} avertissement${warnings.length > 1 ? 's' : ''} détecté${warnings.length > 1 ? 's' : ''}`,
    });
  }, [toast]);
  
  const showValidationSuccess = useCallback((message = 'Validation réussie') => {
    toast({
      title: 'Succès',
      description: message,
    });
  }, [toast]);
  
  return {
    showValidationErrors,
    showValidationWarnings,
    showValidationSuccess
  };
}

/**
 * Hook pour faire défiler automatiquement vers les erreurs
 */
export function useValidationScroll() {
  const scrollToField = useCallback((fieldName: string) => {
    const element = document.querySelector(`[name="${fieldName}"]`) || 
                   document.querySelector(`#${fieldName}`) ||
                   document.querySelector(`[data-field="${fieldName}"]`);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus sur l'élément si possible
      if (element instanceof HTMLElement && element.focus) {
        setTimeout(() => element.focus(), 100);
      }
    }
  }, []);
  
  const scrollToFirstError = useCallback((errors: Record<string, ValidationError[]>) => {
    const firstErrorField = Object.keys(errors).find(field => errors[field].length > 0);
    if (firstErrorField) {
      scrollToField(firstErrorField);
    }
  }, [scrollToField]);
  
  return {
    scrollToField,
    scrollToFirstError
  };
}

// =============================================================================
// WRAPPER DE FORMULAIRE AVEC VALIDATION INTÉGRÉE
// =============================================================================

/**
 * Wrapper de formulaire avec validation et gestion d'erreurs intégrées
 */
interface ValidatedFormProps<T extends FieldValues = FieldValues> 
  extends React.FormHTMLAttributes<HTMLFormElement> {
  onValidSubmit: (data: T) => void | Promise<void>;
  showValidationSummary?: boolean;
  showValidationCounter?: boolean;
  autoScrollToErrors?: boolean;
  persistData?: boolean;
  persistKey?: string;
}

export function ValidatedForm<T extends FieldValues = FieldValues>({
  onValidSubmit,
  showValidationSummary = true,
  showValidationCounter = true,
  autoScrollToErrors = true,
  persistData = false,
  persistKey,
  children,
  className,
  ...props
}: ValidatedFormProps<T>) {
  const form = useFormContext<T>();
  const { showValidationErrors } = useValidationToasts();
  const { scrollToFirstError } = useValidationScroll();
  
  // Persistence des données si activée
  useEffect(() => {
    if (persistData && persistKey) {
      // Logique de persistence à implémenter avec useFormPersistence
    }
  }, [persistData, persistKey]);
  
  const handleSubmit = useCallback(async (data: T) => {
    try {
      // Validation avant soumission
      const isValid = await form.trigger();
      
      if (!isValid) {
        const errors = Object.values(form.formState.errors).map((error: any) => ({
          field: error.ref?.name || 'unknown',
          message: error.message || 'Erreur de validation',
          code: 'VALIDATION_ERROR'
        })) as ValidationError[];
        
        showValidationErrors(errors);
        
        if (autoScrollToErrors) {
          const errorFields = Object.keys(form.formState.errors);
          if (errorFields.length > 0) {
            scrollToFirstError({ [errorFields[0]]: errors });
          }
        }
        
        return;
      }
      
      await onValidSubmit(data);
    } catch (error) {
      logger.error('Erreur lors de la soumission:', error);
      showValidationErrors([{
        field: 'form',
        message: error instanceof Error ? error.message : 'Erreur inattendue',
        code: 'SUBMIT_ERROR'
      }]);
    }
  }, [form, onValidSubmit, showValidationErrors, autoScrollToErrors, scrollToFirstError]);
  
  const errors = Object.keys(form.formState.errors).reduce((acc, field) => {
    const error: any = form.formState.errors[field];
    acc[field] = [{
      field,
      message: (error?.message as string) || 'Erreur de validation',
      code: 'FORM_ERROR'
    }];
    return acc;
  }, {} as Record<string, ValidationError[]>);
  
  return (
    <form
      {...props}
      className={cn("space-y-6", className)}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      {showValidationCounter && (
        <ValidationCounter errors={errors} />
      )}
      
      {showValidationSummary && Object.keys(errors).length > 0 && (
        <ValidationSummary 
          errors={errors}
          onErrorClick={(fieldName) => {
            if (autoScrollToErrors) {
              scrollToFirstError({ [fieldName]: errors[fieldName] });
            }
          }}
        />
      )}
      
      {children}
    </form>
  );
}

export default {
  ValidatedInput,
  ValidatedCurrencyInput,
  ValidatedPhoneInput,
  ValidatedPercentageInput,
  ValidatedSiretInput,
  ValidatedSelect,
  ValidationStateIndicator,
  ValidationErrorBadge,
  ValidationWarningBadge,
  ValidationSummary,
  ValidationCounter,
  ValidatedForm,
  useValidationToasts,
  useValidationScroll
};