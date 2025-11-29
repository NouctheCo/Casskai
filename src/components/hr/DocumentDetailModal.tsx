/**
 * Document Detail Modal
 * Modal pour afficher les détails d'un document généré
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Send, FileSignature, Archive, Download } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '@/data/hr-document-templates-defaults';
import type { GeneratedDocument, GeneratedDocumentStatus } from '@/types/hr-document-templates.types';
import { createSafeHTML } from '@/utils/sanitize';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument;
  onStatusUpdate: (documentId: string, status: GeneratedDocumentStatus) => void;
}

export function DocumentDetailModal({
  isOpen,
  onClose,
  document,
  onStatusUpdate
}: DocumentDetailModalProps) {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{document.document_name}</h2>
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(document.status)}>
                {getStatusLabel(document.status)}
              </Badge>
              <Badge variant="outline">
                {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
              </Badge>
              {document.employee_name && (
                <Badge variant="outline">
                  {document.employee_name}
                </Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Généré le</p>
              <p className="text-sm">
                {new Date(document.generated_at).toLocaleString('fr-FR')}
              </p>
            </div>
            {document.sent_date && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Envoyé le</p>
                <p className="text-sm">
                  {new Date(document.sent_date).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {document.signed_date && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Signé le</p>
                <p className="text-sm">
                  {new Date(document.signed_date).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {document.requires_signature && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Signature</p>
                <Badge className="mt-1 bg-purple-100 text-purple-800">
                  <FileSignature className="w-3 h-3 mr-1" />
                  Requise
                </Badge>
              </div>
            )}
            {document.is_archived && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Archive</p>
                <Badge className="mt-1">
                  <Archive className="w-3 h-3 mr-1" />
                  {document.archive_reference || 'Archivé'}
                </Badge>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="border rounded-lg p-8 bg-white">
            <div
              dangerouslySetInnerHTML={createSafeHTML(document.generated_content)}
              className="prose prose-sm max-w-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            {document.status === 'generated' && (
              <Button
                onClick={() => onStatusUpdate(document.id, 'sent')}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Marquer comme envoyé
              </Button>
            )}
            {document.status === 'sent' && document.requires_signature && (
              <Button
                onClick={() => onStatusUpdate(document.id, 'signed')}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileSignature className="w-4 h-4" />
                Marquer comme signé
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
