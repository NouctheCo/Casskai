/**
 * CassKai - Plateforme de gestion financière
 * Journal Entry Attachments Component
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Trash2,
  Upload,
  File,
  AlertCircle,
  FileText,
  FileImage,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { journalEntryAttachmentService, JournalEntryAttachment } from '@/services/journalEntryAttachmentService';
import { logger } from '@/lib/logger';
interface JournalEntryAttachmentsProps {
  journalEntryId: string;
  companyId: string;
  readOnly?: boolean;
}
export const JournalEntryAttachments: React.FC<JournalEntryAttachmentsProps> = ({
  journalEntryId,
  companyId,
  readOnly = false
}) => {
  const { toast } = useToast();
  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();
  const [attachments, setAttachments] = useState<JournalEntryAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<JournalEntryAttachment | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Load attachments
  const loadAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalEntryAttachmentService.getAttachments(journalEntryId);
      setAttachments(data);
    } catch (error) {
      logger.error('JournalEntryAttachments', 'Error loading attachments:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pièces jointes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [journalEntryId, toast]);
  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);
  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier',
        variant: 'destructive'
      });
      return;
    }
    setUploading(true);
    try {
      const attachment = await journalEntryAttachmentService.uploadAttachment(
        journalEntryId,
        companyId,
        selectedFile,
        description || undefined
      );
      if (attachment) {
        setAttachments([attachment, ...attachments]);
        toast({
          title: 'Succès',
          description: 'Pièce jointe ajoutée avec succès'
        });
        setShowUploadDialog(false);
        setSelectedFile(null);
        setDescription('');
      }
    } catch (error) {
      logger.error('JournalEntryAttachments', 'Upload error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du téléchargement',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  // Handle file selection - optimized to avoid blocking UI
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use requestAnimationFrame to defer the state update
      requestAnimationFrame(() => {
        setSelectedFile(file);
      });
    }
  }, []);
  // Handle delete
  const handleDelete = async (attachment: JournalEntryAttachment) => {
    const confirmed = await confirmDialog({
      title: 'Supprimer la pièce jointe',
      description: 'Êtes-vous sûr de vouloir supprimer cette pièce jointe ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
    });
    if (!confirmed) {
      return;
    }
    try {
      const success = await journalEntryAttachmentService.deleteAttachment(attachment);
      if (success) {
        setAttachments(attachments.filter(a => a.id !== attachment.id));
        toast({
          title: 'Succès',
          description: 'Pièce jointe supprimée'
        });
      }
    } catch (error) {
      logger.error('JournalEntryAttachments', 'Delete error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la pièce jointe',
        variant: 'destructive'
      });
    }
  };
  // Handle download
  const handleDownload = async (attachment: JournalEntryAttachment) => {
    try {
      const blob = await journalEntryAttachmentService.downloadAttachment(attachment);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      logger.error('JournalEntryAttachments', 'Download error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger la pièce jointe',
        variant: 'destructive'
      });
    }
  };
  // Handle preview
  const handlePreview = (attachment: JournalEntryAttachment) => {
    setPreviewAttachment(attachment);
    setShowPreview(true);
  };
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
  };
  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Pièces jointes</CardTitle>
            {!readOnly && (
              <Button
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune pièce jointe</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      {attachment.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {attachment.file_type.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(attachment)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une pièce jointe</DialogTitle>
            <DialogDescription>
              Téléchargez un document pour cette écriture comptable
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Fichier *
              </label>
              <Input
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: PDF, DOC, XLS, JPG, PNG, WebP. Max 50MB.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optionnel)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Facture fournisseur du 15/12/2025"
                rows={3}
                disabled={uploading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Preview Dialog */}
      {previewAttachment && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewAttachment.file_name}</DialogTitle>
              <button
                onClick={() => setShowPreview(false)}
                className="absolute right-4 top-4"
                type="button"
                aria-label="Fermer l’aperçu de la pièce jointe"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogHeader>
            <div className="w-full h-[60vh] overflow-auto">
              {previewAttachment.file_type.startsWith('image/') ? (
                <img
                  src={journalEntryAttachmentService.getPublicUrl(previewAttachment)}
                  alt={previewAttachment.file_name}
                  className="w-full h-auto"
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aperçu non disponible pour ce type de fichier.
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleDownload(previewAttachment)}
                      className="ml-2"
                    >
                      Télécharger
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ConfirmDialogComponent />
    </>
  );
};
export default JournalEntryAttachments;
