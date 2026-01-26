/**
 * CassKai - Liste des documents réglementaires
 *
 * Affiche la liste des documents réglementaires disponibles
 * et permet de créer/éditer/visualiser des documents.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import type { RegulatoryDocument, RegulatoryTemplate } from '@/types/regulatory';

interface RegulatoryDocumentsListProps {
  documents: RegulatoryDocument[];
  templates: RegulatoryTemplate[];
  onCreateDocument: (templateId: string) => void;
  onEditDocument: (documentId: string) => void;
  onViewDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onChangeStatus?: (documentId: string, status: 'draft' | 'completed' | 'submitted' | 'validated') => void;
  onExportDocument: (documentId: string) => void;
  isLoading?: boolean;
}

export function RegulatoryDocumentsList({
  documents,
  templates,
  onCreateDocument,
  onEditDocument,
  onViewDocument,
  onDeleteDocument,
  onChangeStatus,
  onExportDocument,
  isLoading: _isLoading = false
}: RegulatoryDocumentsListProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Normaliser les documents pour convertir snake_case à camelCase
  const normalizeDocument = (doc: any): RegulatoryDocument => ({
    ...doc,
    documentType: doc.documentType ?? doc.document_type,
    fiscalYear: doc.fiscalYear ?? doc.fiscal_year,
    fiscalPeriod: doc.fiscalPeriod ?? doc.fiscal_period,
    updatedAt: doc.updatedAt ?? doc.updated_at,
    createdAt: doc.createdAt ?? doc.created_at,
    countryCode: doc.countryCode ?? doc.country_code,
    accountingStandard: doc.accountingStandard ?? doc.accounting_standard,
    // Dériver la catégorie du template
    category: doc.category || 'other'
  });

  // Appliquer la normalisation à tous les documents
  const normalizedDocuments = documents.map(normalizeDocument);

  // Dériver la catégorie d'un document en trouvant son template
  const getDocumentCategory = (doc: RegulatoryDocument) => {
    if (doc.category && doc.category !== 'other') return doc.category;
    const template = templates.find((t) => t.id === (doc as any).template_id || t.documentType === doc.documentType);
    return template?.category || 'other';
  };

  // Pour le dropdown, on aplatit par catégorie uniquement
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, RegulatoryTemplate[]>);

  // Filtrer les documents
  const filteredDocuments = normalizedDocuments.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Obtenir le nom du document à partir du template
  const getDocumentName = (doc: RegulatoryDocument) => {
    const template = templates.find((t) => t.id === (doc as any).template_id || t.documentType === doc.documentType);
    return template?.name || doc.documentType || 'Document';
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="gap-1">
            <Edit className="h-3 w-3" />
            {t('regulatory.status.draft')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            {t('regulatory.status.pending')}
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <CheckCircle className="h-3 w-3" />
            {t('regulatory.status.submitted')}
          </Badge>
        );
      case 'validated':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            {t('regulatory.status.validated')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t('regulatory.status.rejected')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Badge de catégorie
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'financial_statements':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {t('regulatory.category.financialStatements')}
          </Badge>
        );
      case 'tax_returns':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            {t('regulatory.category.taxReturns')}
          </Badge>
        );
      case 'social_declarations':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            {t('regulatory.category.socialDeclarations')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('regulatory.myDocuments')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('regulatory.documentsDescription')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('regulatory.newDocument')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] max-h-[400px] overflow-y-auto">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t(`regulatory.category.${category}`)}
                </div>
                {categoryTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => onCreateDocument(template.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {template.documentType}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="category-filter" className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
              {t('regulatory.filterByCategory')}
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('regulatory.allCategories')}</option>
              <option value="financial_statements">
                {t('regulatory.category.financialStatements')}
              </option>
              <option value="tax_returns">
                {t('regulatory.category.taxReturns')}
              </option>
              <option value="social_declarations">
                {t('regulatory.category.socialDeclarations')}
              </option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="status-filter" className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
              {t('regulatory.filterByStatus')}
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('regulatory.allStatuses')}</option>
              <option value="draft">{t('regulatory.status.draft')}</option>
              <option value="pending">{t('regulatory.status.pending')}</option>
              <option value="submitted">{t('regulatory.status.submitted')}</option>
              <option value="validated">{t('regulatory.status.validated')}</option>
              <option value="rejected">{t('regulatory.status.rejected')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste des documents */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('regulatory.documentName')}</TableHead>
              <TableHead>{t('regulatory.category.label')}</TableHead>
              <TableHead>{t('regulatory.period')}</TableHead>
              <TableHead>{t('regulatory.status.label')}</TableHead>
              <TableHead>{t('regulatory.lastModified')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('regulatory.noDocuments')}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <div className="font-medium">{getDocumentName(doc)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.documentType}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(getDocumentCategory(doc))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {doc.fiscalYear} - {doc.fiscalPeriod}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDocument(doc.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditDocument(doc.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>

                        {/* Séparateur */}
                        <div className="my-1 border-t border-gray-200 dark:border-gray-600" />

                        {/* Actions de statut */}
                        {doc.status !== 'draft' && onChangeStatus && (
                          <DropdownMenuItem onClick={() => onChangeStatus(doc.id, 'draft')}>
                            <Edit className="mr-2 h-4 w-4" />
                            Revenir à Brouillon
                          </DropdownMenuItem>
                        )}

                        {doc.status !== 'completed' && onChangeStatus && (
                          <DropdownMenuItem onClick={() => onChangeStatus(doc.id, 'completed')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marquer Complété
                          </DropdownMenuItem>
                        )}

                        {(doc.status === 'completed' || doc.status === 'draft') && onChangeStatus && (
                          <DropdownMenuItem onClick={() => onChangeStatus(doc.id, 'submitted')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                            Soumettre
                          </DropdownMenuItem>
                        )}

                        {doc.status === 'submitted' && onChangeStatus && (
                          <DropdownMenuItem onClick={() => onChangeStatus(doc.id, 'validated')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Valider
                          </DropdownMenuItem>
                        )}

                        <div className="my-1 border-t border-gray-200 dark:border-gray-600" />

                        <DropdownMenuItem onClick={() => onExportDocument(doc.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          {t('common.export')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteDocument(doc.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
