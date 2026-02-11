/**
 * CassKai - File Uploader
 *
 * Phase 2 (P1) - Composants UI Premium
 *
 * Fonctionnalités:
 * - Drag & Drop
 * - Multi-upload
 * - Preview images
 * - Progress bar
 * - Validation (type, taille)
 * - Suppression fichiers
 * - Liste fichiers uploadés
 * - Upload vers Supabase Storage
 * - Compression images automatique
 * - Icônes par type de fichier
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { compressImage } from '@/lib/image-optimizer';
import {
  Upload,
  FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface FileUploadItem {
  /** Fichier original */
  file: File;
  /** ID unique */
  id: string;
  /** URL de preview */
  preview?: string;
  /** Statut d'upload */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** Progression (0-100) */
  progress: number;
  /** URL finale après upload */
  url?: string;
  /** Message d'erreur */
  error?: string;
}

export interface FileUploaderProps {
  /** Callback files sélectionnés */
  onFilesSelected?: (files: File[]) => void;
  /** Callback upload complet */
  onUploadComplete?: (items: FileUploadItem[]) => void;
  /** Fonction d'upload custom */
  uploadFunction?: (file: File, onProgress: (progress: number) => void) => Promise<string>;
  /** Types de fichiers acceptés */
  accept?: Record<string, string[]>;
  /** Taille max par fichier (bytes) */
  maxSize?: number;
  /** Nombre max de fichiers */
  maxFiles?: number;
  /** Upload multiple */
  multiple?: boolean;
  /** Compression automatique images */
  compressImages?: boolean;
  /** Qualité compression (0-1) */
  compressionQuality?: number;
  /** Désactiver l'uploader */
  disabled?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Icône selon type de fichier
 */
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.includes('pdf')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar')) return FileArchive;
  return FileIcon;
}

/**
 * Formater taille fichier
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100  } ${  sizes[i]}`;
}

/**
 * File Uploader Component
 */
export default function FileUploader({
  onFilesSelected,
  onUploadComplete,
  uploadFunction,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  maxFiles = 10,
  multiple = true,
  compressImages = true,
  compressionQuality = 0.8,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Générer ID unique
   */
  const generateId = () => Math.random().toString(36).substring(7);

  /**
   * Handler fichiers sélectionnés
   */
  const handleFilesSelected = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      // Validation nombre max de fichiers
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      // Compression images si activée
      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          if (compressImages && file.type.startsWith('image/')) {
            try {
              logger.debug('FileUploader', 'Compressing image:', file.name);
              const compressed = await compressImage(file, 1920, compressionQuality);
              return new File([compressed], file.name, { type: file.type });
            } catch (error) {
              logger.error('FileUploader', 'Compression failed:', error);
              return file; // Fallback sur fichier original
            }
          }
          return file;
        })
      );

      // Créer items
      const newItems: FileUploadItem[] = processedFiles.map((file) => ({
        file,
        id: generateId(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: 'pending',
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newItems]);

      if (onFilesSelected) {
        onFilesSelected(processedFiles);
      }

      logger.info('FileUploader', 'Files selected:', processedFiles.length);
    },
    [files.length, maxFiles, compressImages, compressionQuality, onFilesSelected]
  );

  /**
   * Dropzone config
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesSelected,
    accept,
    maxSize,
    multiple,
    disabled: disabled || isUploading,
    onDropRejected: (fileRejections: Array<{ file: File; errors: Array<{ message: string; code: string }> }>) => {
      const errors = fileRejections.map((rejection: { file: File; errors: Array<{ message: string; code: string }> }) => {
        const reasons = rejection.errors.map((e: { message: string; code: string }) => e.message).join(', ');
        return `${rejection.file.name}: ${reasons}`;
      });
      setError(errors.join(' | '));
    },
  });

  /**
   * Upload fichier individuel
   */
  const uploadFile = useCallback(
    async (item: FileUploadItem) => {
      if (!uploadFunction) {
        logger.warn('FileUploader', 'No upload function provided');
        return;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const url = await uploadFunction(item.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress } : f))
          );
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'success', progress: 100, url } : f
          )
        );

        logger.info('FileUploader', 'File uploaded successfully:', item.file.name);
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );

        logger.error('FileUploader', 'Upload failed:', error);
      }
    },
    [uploadFunction]
  );

  /**
   * Upload tous les fichiers
   */
  const handleUploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Upload en parallèle (max 3 simultanés)
    const chunks = [];
    for (let i = 0; i < pendingFiles.length; i += 3) {
      chunks.push(pendingFiles.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(uploadFile));
    }

    setIsUploading(false);

    if (onUploadComplete) {
      onUploadComplete(files);
    }
  }, [files, uploadFile, onUploadComplete]);

  /**
   * Supprimer fichier
   */
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /**
   * Cleanup previews
   */
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
          !isDragActive && 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez-déposez ou cliquez pour sélectionner'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {multiple ? `Max ${maxFiles} fichiers` : '1 fichier'} • Max {formatFileSize(maxSize)} par fichier
        </p>
        {accept && (
          <p className="text-xs text-gray-400 mt-2">
            Types acceptés: {Object.values(accept).flat().join(', ')}
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{files.length} fichiers</Badge>
              {successCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {successCount} réussi{successCount > 1 ? 's' : ''}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} erreur{errorCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {uploadFunction && pendingCount > 0 && (
              <Button onClick={handleUploadAll} disabled={isUploading} size="sm">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader tout ({pendingCount})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((item) => {
              const Icon = getFileIcon(item.file.type);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'border rounded-lg p-4 space-y-3',
                    item.status === 'success' && 'border-green-500 bg-green-50 dark:bg-green-900/10',
                    item.status === 'error' && 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    {/* Preview ou Icon */}
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                        <Icon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Status Icon */}
                      {item.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      )}
                      {item.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={item.status === 'uploading'}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {item.status === 'uploading' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Upload...</span>
                        <span className="font-medium">{Math.round(item.progress)}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}

                  {/* Error Message */}
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{item.error}</p>
                  )}

                  {/* Success URL */}
                  {item.status === 'success' && item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour upload vers Supabase Storage
 */
export function useSupabaseUpload(bucket: string, folder: string = '') {
  const uploadToSupabase = useCallback(
    async (file: File, onProgress: (progress: number) => void): Promise<string> => {
      // Import dynamique de supabase pour éviter erreur si pas installé
      const { supabase } = await import('@/lib/supabase');

      const fileName = `${folder ? `${folder  }/` : ''}${Date.now()}-${file.name}`;

      // Simula progress pour Supabase (pas de support natif)
      onProgress(10);

      const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      onProgress(90);

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      onProgress(100);

      return urlData.publicUrl;
    },
    [bucket, folder]
  );

  return uploadToSupabase;
}
