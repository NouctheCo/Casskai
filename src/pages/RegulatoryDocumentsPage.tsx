/**
 * CassKai - Page des documents réglementaires
 *
 * Page principale pour gérer tous les documents réglementaires
 * (déclarations fiscales, états financiers, déclarations sociales)
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RegulatoryDocumentsList } from '@/components/regulatory/RegulatoryDocumentsList';
import { RegulatoryDocumentForm } from '@/components/regulatory/RegulatoryDocumentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { generateDocument } from '@/services/regulatory/documentGenerator';
import { exportRegulatoryDocumentToPdf } from '@/services/regulatory/pdfExporter';
import { getFiscalYears } from '@/utils/fiscalYearUtils';
import type { RegulatoryDocument, RegulatoryTemplate } from '@/types/regulatory';
import { logger } from '@/lib/logger';
export function RegulatoryDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompany } = useAuth();
  const [documents, setDocuments] = useState<RegulatoryDocument[]>([]);
  const [templates, setTemplates] = useState<RegulatoryTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RegulatoryTemplate | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<RegulatoryDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showYearSelectionDialog, setShowYearSelectionDialog] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ANNUAL');
  // Debug: Log current year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    logger.debug('RegulatoryDocuments', '📅 [RegulatoryDocuments] Current year:', currentYear);
    logger.debug('RegulatoryDocuments', '📅 [RegulatoryDocuments] Available fiscal years:', getFiscalYears());
  }, []);
  // Normalize templates coming from Supabase (snake_case) to the camelCase shape expected by the form
  const normalizeTemplate = (template: any): RegulatoryTemplate => ({
    ...template,
    formSchema: template.formSchema ?? template.form_schema ?? null,
    accountMappings: template.accountMappings ?? template.account_mappings ?? null,
    documentType: template.documentType ?? template.document_type,
    countryCode: template.countryCode ?? template.country_code,
    accountingStandard: template.accountingStandard ?? template.accounting_standard
  });
  // Charger les templates au montage
  useEffect(() => {
    if (currentCompany?.id) {
      loadTemplates();
      loadDocuments();
    }
  }, [currentCompany?.id]);
  // Gérer les paramètres URL pour ouvrir un document
  useEffect(() => {
    const documentId = searchParams.get('document');
    const templateId = searchParams.get('template');
    if (documentId) {
      loadAndEditDocument(documentId);
    } else if (templateId) {
      handleCreateDocument(templateId);
    }
  }, [searchParams]);
  /**
   * Charge les templates disponibles pour le pays de l'entreprise
   */
  const loadTemplates = async () => {
    try {
      setError(null);
      // Récupérer le code pays de l'entreprise
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('country_code')
        .eq('id', currentCompany?.id)
        .single();
      if (companyError) {
        logger.error('RegulatoryDocuments', 'Error loading company:', companyError);
        throw companyError;
      }
      const countryCode = company?.country_code || 'FR';
      // Charger directement depuis la table avec filtrage strict par pays
      // On charge UNIQUEMENT les templates du pays de l'entreprise (pas de XX/internationaux)
      const { data: templatesData, error: templatesError } = await supabase
        .from('regulatory_templates')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (templatesError) {
        logger.error('RegulatoryDocuments', 'Error loading templates from table:', templatesError);
        throw templatesError;
      }
      logger.debug('RegulatoryDocuments', `🔵 Templates loaded for ${countryCode}:`, templatesData?.length);
      setTemplates((templatesData || []).map(normalizeTemplate));
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error loading templates:', err);
      setError(t('regulatory.errorLoadingTemplates'));
      toast.error(t('regulatory.errorLoadingTemplates'));
    }
  };
  /**
   * Charge les documents de l'entreprise
   */
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Récupérer le pays de l'entreprise
      const { data: companyData } = await supabase
        .from('companies')
        .select('country_code')
        .eq('id', currentCompany?.id)
        .single();
      const countryCode = companyData?.country_code || 'FR';
      const { data, error: docsError } = await supabase
        .from('regulatory_documents')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });
      if (docsError) throw docsError;
      setDocuments(data || []);
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error loading documents:', err);
      setError(t('regulatory.errorLoadingDocuments'));
      toast.error(t('regulatory.errorLoadingDocuments'));
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * Ouvre le dialogue de sélection d'année/période
   */
  const handleCreateDocument = async (templateId: string) => {
    setPendingTemplateId(templateId);
    setSelectedYear(new Date().getFullYear());
    setSelectedPeriod('ANNUAL');
    setShowYearSelectionDialog(true);
  };
  /**
   * Crée le document avec l'année/période sélectionnée
   */
  const handleConfirmCreateDocument = async () => {
    if (!pendingTemplateId) return;
    try {
      let template = templates.find((t) => t.id === pendingTemplateId);
      if (!template) {
        toast.error(t('regulatory.templateNotFound'));
        return;
      }
      // Recharger le template pour s'assurer d'avoir toutes les données
      const { data: freshTemplate, error: templateError } = await supabase
        .from('regulatory_templates')
        .select('*')
        .eq('id', pendingTemplateId)
        .single();
      if (templateError || !freshTemplate) {
        logger.error('RegulatoryDocuments', 'Error loading fresh template:', templateError);
        toast.error(t('regulatory.errorLoadingTemplates'));
        return;
      }
      template = normalizeTemplate(freshTemplate);
      setShowYearSelectionDialog(false);
      // Générer le document avec auto-fill
      logger.debug('RegulatoryDocuments', '📅 [RegulatoryDocuments] Generating document with:', {
        companyId: currentCompany?.id,
        templateId: pendingTemplateId,
        selectedYear,
        selectedPeriod,
        currentYear: new Date().getFullYear()
      });
      const result = await generateDocument(
        currentCompany?.id!,
        pendingTemplateId,
        selectedYear,
        selectedPeriod
      );
      if (!result.success) {
        toast.error(t('regulatory.errorGeneratingDocument'));
        return;
      }
      // Charger le document créé
      const { data: newDoc, error } = await supabase
        .from('regulatory_documents')
        .select('*')
        .eq('id', result.documentId)
        .single();
      if (error) throw error;
      // Rafraîchir la liste des documents immédiatement
      await loadDocuments();
      setSelectedTemplate(template);
      setSelectedDocument(newDoc);
      // Passer aussi les données calculées au formulaire pour l'affichage immédiat
      // Le formulaire affichera selectedDocument?.data qui contient les données auto-remplies
      setShowFormDialog(true);
      toast.success(t('regulatory.documentCreated'));
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error creating document:', err);
      toast.error(t('regulatory.errorCreatingDocument'));
    }
  };
  /**
   * Charge et ouvre un document pour édition
   */
  const loadAndEditDocument = async (documentId: string) => {
    try {
      const { data: doc, error } = await supabase
        .from('regulatory_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (error) throw error;
      const { data: template, error: templateError } = await supabase
        .from('regulatory_templates')
        .select('*')
        .eq('id', doc.template_id)
        .single();
      if (templateError) throw templateError;
      setSelectedTemplate(normalizeTemplate(template));
      setSelectedDocument(doc);
      setShowFormDialog(true);
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error loading document:', err);
      toast.error(t('regulatory.errorLoadingDocument'));
    }
  };
  /**
   * Édite un document existant
   */
  const handleEditDocument = (documentId: string) => {
    setSearchParams({ document: documentId });
  };
  /**
   * Visualise un document (lecture seule)
   */
  const handleViewDocument = (documentId: string) => {
    setSearchParams({ document: documentId });
  };
  /**
   * Change le statut d'un document
   */
  const handleChangeDocumentStatus = async (documentId: string, newStatus: 'draft' | 'completed' | 'submitted' | 'validated') => {
    try {
      const { error } = await supabase
        .from('regulatory_documents')
        .update({ status: newStatus })
        .eq('id', documentId);
      if (error) throw error;
      // Mettre à jour dans la liste locale
      setDocuments(
        documents.map((d) =>
          d.id === documentId ? { ...d, status: newStatus } : d
        )
      );
      // Mettre à jour le document sélectionné s'il est ouvert
      if (selectedDocument?.id === documentId) {
        setSelectedDocument({ ...selectedDocument, status: newStatus });
      }
      const statusLabels: Record<string, string> = {
        draft: 'Brouillon',
        completed: 'Complété',
        submitted: 'Soumis',
        validated: 'Validé'
      };
      toast.success(`Document: ${statusLabels[newStatus]}`);
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error updating document status:', err);
      toast.error(t('regulatory.errorUpdatingDocument'));
    }
  };
  /**
   * Supprime un document
   */
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(t('regulatory.confirmDelete'))) return;
    try {
      const { error } = await supabase
        .from('regulatory_documents')
        .delete()
        .eq('id', documentId);
      if (error) throw error;
      setDocuments(documents.filter((d) => d.id !== documentId));
      toast.success(t('regulatory.documentDeleted'));
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error deleting document:', err);
      toast.error(t('regulatory.errorDeletingDocument'));
    }
  };
  /**
   * Exporte un document en PDF
   */
  const handleExportDocument = async (documentId: string) => {
    try {
      toast.info(t('regulatory.generatingPdf'));
      const pdfBlob = await exportRegulatoryDocumentToPdf(documentId);
      // Télécharger le PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document_${documentId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('regulatory.pdfGenerated'));
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error exporting document:', err);
      toast.error(t('regulatory.errorExportingDocument'));
    }
  };
  /**
   * Sauvegarde les modifications du document
   */
  const handleSubmitDocument = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('regulatory_documents')
        .update({
          data,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument?.id);
      if (error) throw error;
      toast.success(t('regulatory.documentSaved'));
      setShowFormDialog(false);
      setSearchParams({});
      loadDocuments();
    } catch (err: any) {
      logger.error('RegulatoryDocuments', 'Error saving document:', err);
      toast.error(t('regulatory.errorSavingDocument'));
    } finally {
      setIsSubmitting(false);
    }
  };
  /**
   * Ferme le dialogue de formulaire
   */
  const handleCloseDialog = () => {
    setShowFormDialog(false);
    setSelectedTemplate(null);
    setSelectedDocument(null);
    setSearchParams({});
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6">
      <RegulatoryDocumentsList
        documents={documents}
        templates={templates}
        onCreateDocument={handleCreateDocument}
        onEditDocument={handleEditDocument}
        onViewDocument={handleViewDocument}
        onDeleteDocument={handleDeleteDocument}
        onChangeStatus={handleChangeDocumentStatus}
        onExportDocument={handleExportDocument}
        isLoading={isLoading}
      />
      {/* Dialogue de sélection d'année/période */}
      <Dialog open={showYearSelectionDialog} onOpenChange={setShowYearSelectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('regulatory.selectPeriod')}</DialogTitle>
            <DialogDescription>
              {t('reports.regulatory.fields.template')} - Veuillez sélectionner l'exercice et la période
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="fiscal-year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('regulatory.fiscalYear')}
              </label>
              <select
                id="fiscal-year-select"
                title={t('regulatory.fiscalYear')}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {getFiscalYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('regulatory.period')}
              </label>
              <select
                id="period-select"
                title={t('regulatory.period')}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="ANNUAL">{t('regulatory.periods.annual')}</option>
                <option value="Q1">{t('regulatory.periods.q1')}</option>
                <option value="Q2">{t('regulatory.periods.q2')}</option>
                <option value="Q3">{t('regulatory.periods.q3')}</option>
                <option value="Q4">{t('regulatory.periods.q4')}</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowYearSelectionDialog(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateDocument}
                className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 rounded-md font-medium"
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialogue de formulaire */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? t('regulatory.editDocument') : t('regulatory.newDocument')}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name || 'Document réglementaire'}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <RegulatoryDocumentForm
              template={selectedTemplate}
              initialData={selectedDocument?.data || {}}
              onSubmit={handleSubmitDocument}
              onCancel={handleCloseDialog}
              isLoading={isSubmitting}
              autoFillEnabled={!selectedDocument}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default RegulatoryDocumentsPage;