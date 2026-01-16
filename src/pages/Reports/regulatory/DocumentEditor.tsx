/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Éditeur de document réglementaire
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Download, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type {
  RegulatoryDocument,
  RegulatoryTemplate,
  FormSection,
  FormField,
  ValidationError,
  ValidationWarning
} from '@/types/regulatory';
import { validateDocument } from '@/services/regulatory/validators';
import { exportToPdf, savePdfToStorage } from '@/services/regulatory/pdfExporter';
import { recalculateDocument } from '@/services/regulatory/documentGenerator';
import { logger } from '@/lib/logger';
interface DocumentEditorProps {
  document: RegulatoryDocument;
  onClose: () => void;
}
export function DocumentEditor({ document: initialDocument, onClose }: DocumentEditorProps) {
  const { t } = useTranslation();
  const document = initialDocument;
  const [template, setTemplate] = useState<RegulatoryTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(initialDocument.data);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  // Charger le template
  useEffect(() => {
    loadTemplate();
  }, []);
  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('regulatory_templates')
        .select('*')
        .eq('document_type', document.documentType)
        .eq('country_code', document.countryCode)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      logger.error('DocumentEditor', 'Error loading template:', error);
    }
  };
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };
  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      // Valider
      const validation = validateDocument({ ...document, data: formData }, template);
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      if (!validation.isValid) {
        setSaving(false);
        return;
      }
      // Sauvegarder
      const { error } = await supabase
        .from('regulatory_documents')
        .update({
          data: formData,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);
      if (error) throw error;
      toast.success(t('reports.regulatory.messages.saveSuccess'));
      onClose();
    } catch (error) {
      logger.error('DocumentEditor', 'Error saving document:', error);
      toast.error(t('reports.regulatory.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };
  const handleExportPdf = async () => {
    if (!template) return;
    setExporting(true);
    try {
      const blob = await exportToPdf({ ...document, data: formData }, template);
      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.documentType}_${document.fiscalYear}_${document.fiscalPeriod}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      // Optionnel: sauvegarder dans Supabase Storage
      const pdfUrl = await savePdfToStorage(blob, document.id, a.download);
      if (pdfUrl) {
        await supabase
          .from('regulatory_documents')
          .update({ pdf_url: pdfUrl })
          .eq('id', document.id);
      }
      toast.success(t('reports.regulatory.messages.exportSuccess'));
    } catch (error) {
      logger.error('DocumentEditor', 'Error exporting PDF:', error);
      toast.error(t('reports.regulatory.messages.exportError'));
    } finally {
      setExporting(false);
    }
  };
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await recalculateDocument(document.id);
      if (result.success && result.data) {
        setFormData(result.data);
        setErrors(result.errors || []);
        setWarnings(result.warnings || []);
        toast.success(t('reports.regulatory.messages.recalculateSuccess'));
      } else {
        toast.error(t('reports.regulatory.messages.recalculateError'));
      }
    } catch (error) {
      logger.error('DocumentEditor', 'Error recalculating:', error);
      toast.error(t('reports.regulatory.messages.recalculateError'));
    } finally {
      setRecalculating(false);
    }
  };
  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  const schema = template.formSchema as any;
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-8 h-8" />
              {template.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {document.fiscalYear} - {document.fiscalPeriod}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            {t('reports.regulatory.actions.recalculate')}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('reports.regulatory.actions.exportPdf')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {t('reports.regulatory.actions.save')}
          </Button>
        </div>
      </div>
      {/* Alertes de validation */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                {t('reports.regulatory.validation.errors')}
              </h3>
              <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {t('reports.regulatory.validation.warnings')}
              </h3>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Formulaire */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {schema.sections?.map((section: FormSection) => (
          <FormSectionComponent
            key={section.id}
            section={section}
            data={formData}
            onChange={handleFieldChange}
          />
        ))}
      </div>
    </div>
  );
}
// Composant Section
interface FormSectionComponentProps {
  section: FormSection;
  data: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}
function FormSectionComponent({ section, data, onChange }: FormSectionComponentProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {section.title}
      </h2>
      {section.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {section.description}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.fields.map(field => (
          <FormFieldComponent
            key={field.id}
            field={field}
            value={data[field.id]}
            onChange={onChange}
          />
        ))}
      </div>
      {section.subsections?.map(subsection => (
        <div key={subsection.id} className="mt-6">
          <FormSectionComponent
            section={subsection}
            data={data}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
}
// Composant Field
interface FormFieldComponentProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}
function FormFieldComponent({ field, value, onChange }: FormFieldComponentProps) {
  if (field.hidden) return null;
  const widthClass = {
    full: 'col-span-2',
    half: 'col-span-1',
    third: 'col-span-1',
    quarter: 'col-span-1'
  }[field.width || 'half'];
  return (
    <div className={widthClass}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {field.description}
        </p>
      )}
      {renderInput(field, value, onChange)}
    </div>
  );
}
function renderInput(
  field: FormField,
  value: any,
  onChange: (fieldId: string, value: any) => void
) {
  const commonProps = {
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
      onChange(field.id, e.target.value),
    disabled: field.readonly || field.calculated,
    className: 'input'
  };
  switch (field.type) {
    case 'textarea':
      return <textarea {...commonProps} rows={4} />;
    case 'number':
    case 'currency':
      return (
        <input
          {...commonProps}
          type="number"
          step={field.decimals ? Math.pow(10, -field.decimals) : 0.01}
        />
      );
    case 'date':
      return <input {...commonProps} type="date" />;
    case 'select':
      return (
        <select {...commonProps}>
          <option value="">{field.placeholder || 'Sélectionner...'}</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    default:
      return <input {...commonProps} type="text" />;
  }
}
