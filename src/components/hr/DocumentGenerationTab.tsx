/**
 * Document Generation Tab
 * Génération de documents à partir de templates avec remplacement de variables
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, Search, Filter, Eye, Send, Download, FileSignature,
  CheckCircle, Clock, Mail, Archive, User
} from 'lucide-react';
import { hrDocumentTemplatesService } from '@/services/hrDocumentTemplatesService';
import { DOCUMENT_TYPE_LABELS } from '@/data/hr-document-templates-defaults';
import type {
  DocumentTemplate,
  GeneratedDocument,
  GeneratedDocumentStatus
} from '@/types/hr-document-templates.types';
type Employee = any; // Employee type not yet defined
import { GenerateDocumentModal } from './GenerateDocumentModal';
import { DocumentDetailModal } from './DocumentDetailModal';

interface DocumentGenerationTabProps {
  companyId: string;
  employees: Employee[];
}

export function DocumentGenerationTab({ companyId, employees }: DocumentGenerationTabProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    const [templatesRes, documentsRes] = await Promise.all([
      hrDocumentTemplatesService.getTemplates(companyId, { is_active: true }),
      hrDocumentTemplatesService.getGeneratedDocuments(companyId)
    ]);

    if (templatesRes.success && templatesRes.data) {
      setTemplates(templatesRes.data);
    }
    if (documentsRes.success && documentsRes.data) {
      setDocuments(documentsRes.data);
    }
    setLoading(false);
  };

  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowGenerateModal(true);
  };

  const handleViewDocument = (document: GeneratedDocument) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const handleUpdateDocumentStatus = async (documentId: string, status: GeneratedDocumentStatus) => {
    const response = await hrDocumentTemplatesService.updateDocumentStatus(documentId, status);
    if (response.success) {
      await loadData();
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    generated: documents.filter(d => d.status === 'generated').length,
    sent: documents.filter(d => d.status === 'sent').length,
    signed: documents.filter(d => d.status === 'signed').length
  };

  const getStatusIcon = (status: GeneratedDocumentStatus) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-gray-600" />;
      case 'generated': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'sent': return <Mail className="w-4 h-4 text-purple-600" />;
      case 'signed': return <FileSignature className="w-4 h-4 text-green-600" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: GeneratedDocumentStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: GeneratedDocumentStatus) => {
    const labels: Record<GeneratedDocumentStatus, string> = {
      draft: 'Brouillon',
      generated: 'Généré',
      sent: 'Envoyé',
      signed: 'Signé',
      archived: 'Archivé'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Générés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.generated}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Envoyés</p>
                <p className="text-2xl font-bold text-purple-600">{stats.sent}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signés</p>
                <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
              </div>
              <FileSignature className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates disponibles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Templates Disponibles</CardTitle>
          <CardDescription>Sélectionnez un template pour générer un document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                onClick={() => handleGenerateDocument(template)}
                className="h-auto p-4 flex flex-col items-start gap-2 hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-left flex-1">{template.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {DOCUMENT_TYPE_LABELS[template.template_type] || template.template_type}
                </Badge>
                {template.requires_signature && (
                  <Badge className="text-xs bg-purple-100 text-purple-800">
                    <FileSignature className="w-3 h-3 mr-1" />
                    Signature requise
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents générés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents Générés</CardTitle>
              <CardDescription>Liste de tous les documents générés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous statuts</option>
              <option value="draft">Brouillons</option>
              <option value="generated">Générés</option>
              <option value="sent">Envoyés</option>
              <option value="signed">Signés</option>
              <option value="archived">Archivés</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{document.document_name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusIcon(document.status)}
                        <span className="ml-1">{getStatusLabel(document.status)}</span>
                      </Badge>
                      <Badge variant="outline">
                        {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                      </Badge>
                      {document.employee_name && (
                        <Badge variant="outline">
                          <User className="w-3 h-3 mr-1" />
                          {document.employee_name}
                        </Badge>
                      )}
                      {document.requires_signature && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <FileSignature className="w-3 h-3 mr-1" />
                          Signature
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <span>Généré le {new Date(document.generated_at).toLocaleDateString('fr-FR')}</span>
                      {document.sent_date && (
                        <span className="ml-4">• Envoyé le {new Date(document.sent_date).toLocaleDateString('fr-FR')}</span>
                      )}
                      {document.signed_date && (
                        <span className="ml-4">• Signé le {new Date(document.signed_date).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(document)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Button>

                    {document.status === 'generated' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateDocumentStatus(document.id, 'sent')}
                        className="gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer
                      </Button>
                    )}

                    {document.status === 'sent' && document.requires_signature && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateDocumentStatus(document.id, 'signed')}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <FileSignature className="w-4 h-4" />
                        Marquer signé
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun document</h3>
              <p className="text-gray-600">Générez votre premier document à partir d'un template</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showGenerateModal && selectedTemplate && (
        <GenerateDocumentModal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setSelectedTemplate(null);
          }}
          onSubmit={async () => {
            await loadData();
            setShowGenerateModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          employees={employees}
          companyId={companyId}
        />
      )}

      {showDetailModal && selectedDocument && (
        <DocumentDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          onStatusUpdate={async (documentId, status) => {
            await handleUpdateDocumentStatus(documentId, status);
            await loadData();
          }}
        />
      )}
    </>
  );
}
