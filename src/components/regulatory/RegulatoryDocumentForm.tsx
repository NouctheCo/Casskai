/**
 * CassKai - Composant générique de formulaire réglementaire
 *
 * Ce composant rend dynamiquement n'importe quel formulaire réglementaire
 * à partir de son template (formSchema).
 *
 * Features:
 * - Rendu dynamique depuis formSchema
 * - Auto-fill depuis les données comptables
 * - Validation en temps réel
 * - Calcul automatique des formules
 * - Support multi-langue (i18n)
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RegulatoryTemplate, FormSection, FormField } from '@/types/regulatory';
import { safeEval } from '@/utils/safeEval';
import { logger } from '@/lib/logger';
interface RegulatoryDocumentFormProps {
  template: RegulatoryTemplate;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  autoFillEnabled?: boolean;
}
export function RegulatoryDocumentForm({
  template,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  autoFillEnabled = true
}: RegulatoryDocumentFormProps) {
  const { t } = useTranslation();
  const [calculatedValues, setCalculatedValues] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: initialData
  });
  const formValues = watch();
  // Mémoriser le schema pour éviter les re-renders infinis
  const memoizedFormSchema = useMemo(() => template.formSchema, [template.formSchema?.version, template.id]);
  // Extraire les valeurs des champs non-calculés pour les utiliser comme dépendances stables
  const nonCalculatedValues = useMemo(() => {
    const values: Record<string, any> = {};
    if (memoizedFormSchema?.sections) {
      memoizedFormSchema.sections.forEach((section: FormSection) => {
        section.fields?.forEach((field: FormField) => {
          const formula = field.formula || (field as any).calculationFormula;
          // Inclure seulement les champs non-calculés dans les dépendances
          if (!formula) {
            values[field.id] = formValues[field.id];
          }
        });
      });
    }
    return values;
  }, [memoizedFormSchema, formValues]);
  // Calcul automatique des formules - seulement basé sur les champs non-calculés
  useEffect(() => {
    if (!memoizedFormSchema?.sections) return;
    const newCalculatedValues: Record<string, number> = {};
    let hasChanges = false;
    memoizedFormSchema.sections.forEach((section: FormSection) => {
      section.fields?.forEach((field: FormField) => {
        const formula = field.formula || (field as any).calculationFormula;
        if (formula) {
          try {
            const result = safeEval(formula, formValues);
            newCalculatedValues[field.id] = result;
            // Évite la boucle infinie: ne setValue que si la valeur change réellement
            if (formValues[field.id] !== result) {
              setValue(field.id, result, { shouldDirty: false, shouldValidate: false });
              hasChanges = true;
            }
          } catch (error) {
            logger.error('RegulatoryDocumentForm', `Error calculating formula for ${field.id}:`, error);
          }
        }
      });
    });
    // Ne mettre à jour l'état que si les valeurs ont changé
    if (hasChanges || Object.keys(calculatedValues).length !== Object.keys(newCalculatedValues).length) {
      setCalculatedValues(newCalculatedValues);
    }
  }, [memoizedFormSchema, nonCalculatedValues, setValue]);
  // Auto-fill depuis les données comptables
  useEffect(() => {
    if (!autoFillEnabled || !initialData || Object.keys(initialData).length === 0) return;
    setIsAutoFilling(true);
    // Pré-remplir les champs avec les données initiales
    Object.entries(initialData).forEach(([key, value]) => {
      setValue(key, value);
    });
    setIsAutoFilling(false);
  }, [initialData, setValue, autoFillEnabled]);
  // Rendu d'un champ selon son type
  const renderField = (field: FormField, _sectionId: string) => {
    const fieldId = field.id;
    const fieldValue = formValues[fieldId];
    const isCalculated = !!field.formula;
    const isReadOnly = isCalculated || field.readOnly;
    switch (field.type) {
      case 'number':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              step="0.01"
              {...register(fieldId, {
                required: field.required ? t('regulatory.fieldRequired') : false,
                min: field.min !== undefined ? { value: field.min, message: t('regulatory.minValue', { min: field.min }) } : undefined,
                max: field.max !== undefined ? { value: field.max, message: t('regulatory.maxValue', { max: field.max }) } : undefined
              })}
              readOnly={isReadOnly}
              disabled={isLoading}
              className={isCalculated ? 'bg-gray-100 dark:bg-gray-800' : ''}
            />
            {isCalculated && (
              <p className="text-xs text-gray-500">
                {t('regulatory.calculatedField')}
              </p>
            )}
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );
      case 'text':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="text"
              {...register(fieldId, {
                required: field.required ? t('regulatory.fieldRequired') : false
              })}
              readOnly={isReadOnly}
              disabled={isLoading}
            />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              {...register(fieldId, {
                required: field.required ? t('regulatory.fieldRequired') : false
              })}
              readOnly={isReadOnly}
              disabled={isLoading}
              rows={3}
            />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );
      case 'select':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => setValue(fieldId, value)}
              disabled={isLoading || isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('regulatory.selectOption')} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div key={fieldId} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={fieldValue}
              onCheckedChange={(checked) => setValue(fieldId, checked)}
              disabled={isLoading || isReadOnly}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        );
      case 'date':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="date"
              {...register(fieldId, {
                required: field.required ? t('regulatory.fieldRequired') : false
              })}
              readOnly={isReadOnly}
              disabled={isLoading}
            />
            {errors[fieldId] && (
              <p className="text-sm text-red-500">{errors[fieldId]?.message as string}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  // Rendu d'une section
  const renderSection = (section: FormSection) => {
    return (
      <Card key={section.id} className="p-6">
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {section.description}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields?.map((field) => renderField(field, section.id))}
          </div>
        </div>
      </Card>
    );
  };
  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      setValidationErrors([]);
      await onSubmit(data);
    } catch (error: any) {
      logger.error('RegulatoryDocumentForm', 'Form submission error:', error);
      setValidationErrors([
        { field: 'global', message: error.message || t('regulatory.submissionError') }
      ]);
    }
  };
  if (!template.formSchema?.sections) {
    logger.error('RegulatoryDocumentForm', 'Template invalide - formSchema manquant:', { template, hasFormSchema: !!template.formSchema });
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('regulatory.invalidTemplate')} - {template?.name || 'Unknown template'} (formSchema manquant ou vide)
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* En-tête du formulaire */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{template.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {template.documentType}
            </span>
            {autoFillEnabled && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Auto-fill activé
              </span>
            )}
          </div>
        </div>
        {template.description && (
          <p className="text-gray-600 dark:text-gray-400">{template.description}</p>
        )}
      </div>
      {/* Indicateur de chargement auto-fill */}
      {isAutoFilling && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {t('regulatory.autoFilling')}
          </AlertDescription>
        </Alert>
      )}
      {/* Erreurs de validation globales */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {/* Sections du formulaire */}
      <div className="space-y-6">
        {template.formSchema.sections.map(renderSection)}
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {isDirty && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {t('regulatory.unsavedChanges')}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}