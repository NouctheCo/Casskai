/**
 * Onglet de gestion des documents RH
 * Interface complète pour uploader, consulter, signer et archiver des documents
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Archive, Trash2,
  Search, Plus, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { hrDocumentsService } from '@/services/hrDocumentsService';
import { DocumentUploadModal } from '@/components/hr/DocumentUploadModal';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { EmployeeDocument, DocumentType, DocumentStatus } from '@/types/hr-documents.types';
import type { Employee } from '@/services/hrService';

interface DocumentsManagementTabProps {
  companyId: string;
  currentUserId: string;
  employees: Employee[];
}

export const DocumentsManagementTab: React.FC<DocumentsManagementTabProps> = ({
  companyId,
  currentUserId,
  employees
}) => {
  const { toast } = useToast();
  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();

  // State
  const [_documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [_selectedDocument, _setSelectedDocument] = useState<EmployeeDocument | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    employee_id: '',
    document_type: '' as DocumentType | '',
    status: '' as DocumentStatus | ''
  });

  // Load documents
  const loadDocuments = async () => {
    setLoading(true);
    const response = await hrDocumentsService.getDocuments(companyId, {
      employee_id: filters.employee_id || undefined,
      document_type: filters.document_type || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined
    });

    if (response.success && response.data) {
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } else {
      toast({
        title: "Erreur",
        description: response.error || "Impossible de charger les documents",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [companyId, filters]);

  // Document types labels
  const documentTypeLabels: Record<DocumentType, string> = {
    contract: 'Contrat',
    amendment: 'Avenant',
    certificate: 'Certificat',
    payslip: 'Fiche de paie',
    id_document: 'Pièce d\'identité',
    diploma: 'Diplôme',
    certification: 'Certification',
    medical: 'Médical',
    resignation: 'Démission',
    termination: 'Licenciement',
    warning: 'Avertissement',
    evaluation: 'Évaluation',
    other: 'Autre'
  };

  // Status colors
  const statusColors: Record<DocumentStatus, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
    pending_signature: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-gray-100 text-gray-600'
  };

  const statusLabels: Record<DocumentStatus, string> = {
    active: 'Actif',
    expired: 'Expiré',
    archived: 'Archivé',
    pending_signature: 'En attente de signature',
    cancelled: 'Annulé'
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes  } B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)  } KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)  } MB`;
  };

  // Download document
  const handleDownload = async (doc: EmployeeDocument) => {
    const response = await hrDocumentsService.downloadDocument(doc.id);
    if (response.success && response.url) {
      window.open(response.url, '_blank');
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  // Sign document
  const handleSign = async (doc: EmployeeDocument) => {
    const response = await hrDocumentsService.signDocument(doc.id, currentUserId);
    if (response.success) {
      toast({
        title: "Succès",
        description: "Document signé avec succès"
      });
      loadDocuments();
    } else {
      toast({
        title: "Erreur",
        description: response.error || "Impossible de signer le document",
        variant: "destructive"
      });
    }
  };

  // Archive document
  const handleArchive = async (doc: EmployeeDocument) => {
    const confirmed = await confirmDialog({
      title: 'Confirmer l\'archivage',
      description: 'Êtes-vous sûr de vouloir archiver ce document ?',
      confirmText: 'Archiver',
      cancelText: 'Annuler',
      variant: 'default'
    });
    if (!confirmed) return;

    const response = await hrDocumentsService.archiveDocument(doc.id);
    if (response.success) {
      toast({
        title: "Succès",
        description: "Document archivé avec succès"
      });
      loadDocuments();
    } else {
      toast({
        title: "Erreur",
        description: response.error || "Impossible d'archiver le document",
        variant: "destructive"
      });
    }
  };

  // Delete document
  const handleDelete = async (doc: EmployeeDocument) => {
    const confirmed = await confirmDialog({
      title: 'Confirmer la suppression',
      description: 'Êtes-vous sûr de vouloir supprimer définitivement ce document ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    });
    if (!confirmed) return;

    const response = await hrDocumentsService.deleteDocument(doc.id);
    if (response.success) {
      toast({
        title: "Succès",
        description: "Document supprimé avec succès"
      });
      loadDocuments();
    } else {
      toast({
        title: "Erreur",
        description: response.error || "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Employee filter */}
          <Select
            value={filters.employee_id || undefined}
            onValueChange={(value) => setFilters({ ...filters, employee_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les employés" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Document type filter */}
          <Select
            value={filters.document_type || undefined}
            onValueChange={(value) => setFilters({ ...filters, document_type: value as DocumentType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de document" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={filters.status || undefined}
            onValueChange={(value) => setFilters({ ...filters, status: value as DocumentStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-300">Chargement...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-300">Aucun document trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-sm">{doc.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{doc.employee_name}</p>
                  </div>
                </div>
                {doc.is_confidential && (
                  <Badge variant="destructive" className="text-xs">Confidentiel</Badge>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-300">Type:</span>
                  <Badge variant="outline">{documentTypeLabels[doc.document_type]}</Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-300">Statut:</span>
                  <Badge className={statusColors[doc.status]}>
                    {statusLabels[doc.status]}
                  </Badge>
                </div>

                {doc.file_size && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-300">Taille:</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                )}

                {doc.issue_date && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-300">Date d'émission:</span>
                    <span>{new Date(doc.issue_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}

                {doc.expiry_date && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-300">Date d'expiration:</span>
                    <span className={new Date(doc.expiry_date) < new Date() ? 'text-red-600 font-semibold' : ''}>
                      {new Date(doc.expiry_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>

              {doc.description && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc)}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Télécharger
                </Button>

                {doc.status === 'pending_signature' && (
                  <Button
                    size="sm"
                    onClick={() => handleSign(doc)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <FileCheck className="h-3 w-3 mr-1" />
                    Signer
                  </Button>
                )}

                {doc.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchive(doc)}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={async (formData) => {
          const response = await hrDocumentsService.uploadDocument(companyId, currentUserId, formData);
          if (response.success) {
            toast({ title: "Succès", description: "Document ajouté avec succès" });
            loadDocuments();
            return true;
          } else {
            toast({ title: "Erreur", description: response.error || "Erreur lors de l'upload", variant: "destructive" });
            return false;
          }
        }}
        employees={employees}
      />
      <ConfirmDialogComponent />
    </div>
  );
};
