/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Page principale des documents réglementaires
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Filter, Download, Upload, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type {
  RegulatoryDocument,
  DocumentFilters,
  DocumentStatistics,
  AccountingStandard,
  DocumentStatus
} from '@/types/regulatory';
import { DocumentList } from './DocumentList';
import { DocumentEditor } from './DocumentEditor';
import { NewDocumentModal } from './NewDocumentModal';
import { logger } from '@/lib/logger';
export function RegulatoryDocuments() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [documents, setDocuments] = useState<RegulatoryDocument[]>([]);
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RegulatoryDocument | null>(null);
  // Charger les documents
  useEffect(() => {
    if (currentCompany) {
      loadDocuments();
      loadStatistics();
    }
  }, [currentCompany, filters]);
  const loadDocuments = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      // Récupérer d'abord le pays de l'entreprise
      const { data: companyData } = await supabase
        .from('companies')
        .select('country_code')
        .eq('id', currentCompany.id)
        .single();
      const countryCode = companyData?.country_code || 'FR';
      let query = supabase
        .from('regulatory_documents')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });
      // Appliquer les filtres
      if (filters.fiscalYear) {
        query = query.eq('fiscal_year', filters.fiscalYear);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.documentType) {
        query = query.eq('document_type', filters.documentType);
      }
      if (filters.countryCode) {
        query = query.eq('country_code', filters.countryCode);
      }
      if (filters.accountingStandard) {
        query = query.eq('accounting_standard', filters.accountingStandard);
      }
      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      logger.error('RegulatoryDocuments', 'Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadStatistics = async () => {
    if (!currentCompany) return;
    try {
      const { data, error } = await supabase
        .from('regulatory_documents')
        .select('status, document_type, country_code')
        .eq('company_id', currentCompany.id);
      if (error) throw error;
      if (data) {
        // Calculer les statistiques
        const byStatus: Record<DocumentStatus, number> = {
          draft: 0,
          completed: 0,
          submitted: 0,
          validated: 0,
          rejected: 0
        };
        const byType: Record<string, number> = {};
        const byCountry: Record<string, number> = {};
        data.forEach(doc => {
          byStatus[doc.status as DocumentStatus]++;
          byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
          byCountry[doc.country_code] = (byCountry[doc.country_code] || 0) + 1;
        });
        setStatistics({
          total: data.length,
          byStatus,
          byType,
          byCountry,
          upcomingDeadlines: [],
          recentActivity: []
        });
      }
    } catch (error) {
      logger.error('RegulatoryDocuments', 'Error loading statistics:', error);
    }
  };
  const handleNewDocument = () => {
    setShowNewDocumentModal(true);
  };
  const handleDocumentCreated = (documentId: string) => {
    setShowNewDocumentModal(false);
    loadDocuments();
    loadStatistics();
  };
  const handleEditDocument = (document: RegulatoryDocument) => {
    setSelectedDocument(document);
  };
  const handleCloseEditor = () => {
    setSelectedDocument(null);
    loadDocuments();
    loadStatistics();
  };
  if (selectedDocument) {
    return (
      <DocumentEditor
        document={selectedDocument}
        onClose={handleCloseEditor}
      />
    );
  }
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-8 h-8" />
            {t('reports.regulatory.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('reports.regulatory.subtitle')}
          </p>
        </div>
        <Button onClick={handleNewDocument}>
          <Plus className="w-4 h-4 mr-2" />
          {t('reports.regulatory.newDocument')}
        </Button>
      </div>
      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title={t('reports.regulatory.stats.total')}
            value={statistics.total}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title={t('reports.regulatory.stats.draft')}
            value={statistics.byStatus.draft}
            icon={<Clock className="w-5 h-5" />}
            color="gray"
          />
          <StatCard
            title={t('reports.regulatory.stats.completed')}
            value={statistics.byStatus.completed}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title={t('reports.regulatory.stats.submitted')}
            value={statistics.byStatus.submitted}
            icon={<Upload className="w-5 h-5" />}
            color="indigo"
          />
        </div>
      )}
      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.fiscalYear || ''}
            onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value ? parseInt(e.target.value) : undefined })}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            <option value="">{t('reports.regulatory.filters.allYears')}</option>
            {[2024, 2023, 2022, 2021].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as DocumentStatus || undefined })}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            <option value="">{t('reports.regulatory.filters.allStatuses')}</option>
            <option value="draft">{t('reports.regulatory.status.draft')}</option>
            <option value="completed">{t('reports.regulatory.status.completed')}</option>
            <option value="submitted">{t('reports.regulatory.status.submitted')}</option>
            <option value="validated">{t('reports.regulatory.status.validated')}</option>
            <option value="rejected">{t('reports.regulatory.status.rejected')}</option>
          </select>
          <select
            value={filters.accountingStandard || ''}
            onChange={(e) => setFilters({ ...filters, accountingStandard: e.target.value as AccountingStandard || undefined })}
            className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            <option value="">{t('reports.regulatory.filters.allStandards')}</option>
            <option value="PCG">PCG (France)</option>
            <option value="SYSCOHADA">SYSCOHADA (OHADA)</option>
            <option value="IFRS">IFRS</option>
            <option value="SCF">SCF (Algérie/Tunisie)</option>
            <option value="PCM">PCM (Maroc)</option>
          </select>
          {Object.keys(filters).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
            >
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      </div>
      {/* Liste des documents */}
      <DocumentList
        documents={documents}
        loading={loading}
        onEdit={handleEditDocument}
        onRefresh={loadDocuments}
      />
      {/* Modal nouveau document */}
      {showNewDocumentModal && (
        <NewDocumentModal
          onClose={() => setShowNewDocumentModal(false)}
          onDocumentCreated={handleDocumentCreated}
        />
      )}
    </div>
  );
}
// Composant StatCard
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'gray' | 'green' | 'indigo';
}
function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
export default RegulatoryDocuments;