/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Modal de création d'un nouveau document réglementaire
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getFiscalYears } from '@/utils/fiscalYearUtils';
import type {
  RegulatoryTemplate,
  AccountingStandard,
  FiscalPeriod
} from '@/types/regulatory';
import { generateDocument } from '@/services/regulatory/documentGenerator';
import { logger } from '@/lib/logger';
interface NewDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onDocumentCreated: (documentId: string) => void;
}
export function NewDocumentModal({ open, onClose, onDocumentCreated }: NewDocumentModalProps) {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [templates, setTemplates] = useState<RegulatoryTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [fiscalPeriod, setFiscalPeriod] = useState<FiscalPeriod>('ANNUAL');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && currentCompany) {
      loadTemplates();
    }
  }, [open, currentCompany]);
  const loadTemplates = async () => {
    try {
      // Récupérer le pays de l'entreprise
      if (!currentCompany) return;
      const { data: companyData } = await supabase
        .from('companies')
        .select('country_code')
        .eq('id', currentCompany.id)
        .single();
      const countryCode = companyData?.country_code || 'FR';
      const { data, error } = await supabase
        .from('regulatory_templates')
        .select('*')
        .eq('is_active', true)
        .or(`country_code.eq.${countryCode},country_code.eq.XX`)
        .order('name');
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      logger.error('NewDocumentModal', 'Error loading templates:', error);
    }
  };
  const handleCreate = async () => {
    if (!currentCompany || !selectedTemplate) return;
    setLoading(true);
    try {
      const result = await generateDocument(
        currentCompany.id,
        selectedTemplate,
        fiscalYear,
        fiscalPeriod
      );
      if (result.success && result.documentId) {
        onDocumentCreated(result.documentId);
      } else {
        alert(t('reports.regulatory.messages.createError'));
      }
    } catch (error) {
      logger.error('NewDocumentModal', 'Error creating document:', error);
      alert(t('reports.regulatory.messages.createError'));
    } finally {
      setLoading(false);
    }
  };
  // Grouper les templates par pays/standard
  const groupedTemplates = templates.reduce((acc, template) => {
    const key = `${template.countryCode} - ${template.accountingStandard}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(template);
    return acc;
  }, {} as Record<string, RegulatoryTemplate[]>);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('reports.regulatory.newDocument')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
        {/* Sélection du template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('reports.regulatory.fields.template')} *
          </label>
          <select
            title={t('reports.regulatory.fields.template')}
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            <option value="">{t('reports.regulatory.selectTemplate')}</option>
            {Object.entries(groupedTemplates).map(([group, groupTemplates]) => (
              <optgroup key={group} label={group}>
                {groupTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {/* Exercice fiscal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('reports.regulatory.fields.fiscalYear')} *
          </label>
          <select
            title={t('reports.regulatory.fields.fiscalYear')}
            value={fiscalYear}
            onChange={(e) => setFiscalYear(parseInt(e.target.value))}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            {getFiscalYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        {/* Période */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('reports.regulatory.fields.period')} *
          </label>
          <select
            title={t('reports.regulatory.fields.period')}
            value={fiscalPeriod}
            onChange={(e) => setFiscalPeriod(e.target.value as FiscalPeriod)}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            <option value="ANNUAL">{t('reports.regulatory.periods.annual')}</option>
            <optgroup label={t('reports.regulatory.periods.quarterly')}>
              <option value="Q1">{t('reports.regulatory.periods.q1')}</option>
              <option value="Q2">{t('reports.regulatory.periods.q2')}</option>
              <option value="Q3">{t('reports.regulatory.periods.q3')}</option>
              <option value="Q4">{t('reports.regulatory.periods.q4')}</option>
            </optgroup>
            <optgroup label={t('reports.regulatory.periods.monthly')}>
              {['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12'].map(month => (
                <option key={month} value={month}>
                  {t(`reports.regulatory.months.${month}`)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !selectedTemplate}
            className="bg-primary text-white dark:text-white hover:bg-primary/90"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('reports.regulatory.creating')}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {t('reports.regulatory.create')}
              </>
            )}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}