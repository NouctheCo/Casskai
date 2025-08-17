/* eslint-disable max-lines */
/**
 * Archive Service
 * Handles secure storage and retrieval of e-invoice documents
 * Compliant with French legal requirements for document retention
 */

import {
  EInvoicingError
} from '@/types/einvoicing.types';
import { supabase } from '../../../lib/supabase';
// import { createHash } from 'crypto';

export class ArchiveService {
  private readonly BUCKET_NAME = 'einvoicing-documents';
  private readonly RETENTION_YEARS = 10; // French legal requirement

  /**
   * Store PDF and XML documents in secure archive
   */
  async storeDocuments(
    documentId: string,
    pdfContent: Buffer,
    xmlContent: Buffer
  ): Promise<{
    pdf_url: string;
    xml_url: string;
  }> {
    try {
  console.warn(`📁 Archiving documents for ${documentId}`);

      // Generate file paths with timestamps for versioning
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pdfPath = `${documentId}/pdf/${timestamp}_facture.pdf`;
      const xmlPath = `${documentId}/xml/${timestamp}_facture.xml`;

      // Upload PDF
      const pdfUploadResult = await this.uploadFile(pdfPath, pdfContent, 'application/pdf');
      if (!pdfUploadResult.success) {
        throw new EInvoicingError(
          `Failed to upload PDF: ${pdfUploadResult.error}`,
          'ARCHIVE_PDF_ERROR',
          { documentId }
        );
      }

      // Upload XML
      const xmlUploadResult = await this.uploadFile(xmlPath, xmlContent, 'application/xml');
      if (!xmlUploadResult.success) {
        throw new EInvoicingError(
          `Failed to upload XML: ${xmlUploadResult.error}`,
          'ARCHIVE_XML_ERROR',
          { documentId }
        );
      }

      // Generate signed URLs for access
      const pdfUrl = await this.getSignedUrl(pdfPath);
      const xmlUrl = await this.getSignedUrl(xmlPath);

      // Log archival event
      await this.logArchivalEvent(documentId, {
        pdf_path: pdfPath,
        xml_path: xmlPath,
        pdf_size: pdfContent.length,
        xml_size: xmlContent.length,
        archived_at: new Date().toISOString()
      });

  console.warn(`✅ Documents archived successfully for ${documentId}`);

      return {
        pdf_url: pdfUrl,
        xml_url: xmlUrl
      };

    } catch (error) {
      console.error('Error archiving documents:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to archive documents: ${(error as Error).message}`,
        'ARCHIVE_ERROR',
        { documentId }
      );
    }
  }

  /**
   * Retrieve archived document
   */
  async retrieveDocument(
    documentId: string,
    type: 'pdf' | 'xml',
    version?: string
  ): Promise<{
    content: Buffer;
  metadata: Record<string, unknown>;
  }> {
    try {
  console.warn(`📥 Retrieving ${type.toUpperCase()} document for ${documentId}${version ? ` (version: ${version})` : ''}`);

      // Find the document path
      const path = await this.findDocumentPath(documentId, type, version);
      if (!path) {
        throw new EInvoicingError(
          `Document not found: ${documentId} (${type})`,
          'DOCUMENT_NOT_FOUND',
          { documentId, type, version }
        );
      }

      // Download file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(path);

      if (error) {
        throw new EInvoicingError(
          `Failed to download document: ${error.message}`,
          'DOWNLOAD_ERROR',
          { documentId, type, path }
        );
      }

      // Get file metadata
      const { data: fileInfo } = await supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path);

      const metadata = await this.getFileMetadata(path);

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      const content = Buffer.from(arrayBuffer);

      // Log access event
      await this.logAccessEvent(documentId, {
        document_type: type,
        file_path: path,
        accessed_at: new Date().toISOString(),
        file_size: content.length
      });

  console.warn(`✅ Document retrieved successfully: ${documentId} (${type})`);

      return {
        content,
        metadata: {
          ...metadata,
          public_url: fileInfo.publicUrl,
          size: content.length,
          type
        }
      };

    } catch (error) {
      console.error('Error retrieving document:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to retrieve document: ${(error as Error).message}`,
        'RETRIEVAL_ERROR',
        { documentId, type, version }
      );
    }
  }

  /**
   * List all archived documents for a document ID
   */
  // eslint-disable-next-line complexity
  async listDocumentVersions(documentId: string): Promise<Array<{
    type: 'pdf' | 'xml';
    path: string;
    created_at: string;
    size: number;
    version: string;
  }>> {
    try {
  console.warn(`📋 Listing document versions for ${documentId}`);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`${documentId}/`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new EInvoicingError(
          `Failed to list documents: ${error.message}`,
          'LIST_ERROR',
          { documentId }
        );
      }

      if (!data) {
        return [];
      }

      const versions: Array<{
        type: 'pdf' | 'xml';
        path: string;
        created_at: string;
        size: number;
        version: string;
      }> = [];

      // Process files recursively
      for (const item of data) {
        if (item.name === '.emptyFolderPlaceholder') continue;

        if (item.id) {
          // This is a file
          const type = item.name.endsWith('.pdf') ? 'pdf' : 'xml';
          const version = this.extractVersionFromPath(item.name);
          
          versions.push({
            type,
            path: `${documentId}/${item.name}`,
            created_at: item.created_at || '',
            size: item.metadata?.size || 0,
            version
          });
        } else {
          // This is a folder, list its contents
          // eslint-disable-next-line no-await-in-loop
          const { data: folderData } = await supabase.storage
            .from(this.BUCKET_NAME)
            .list(`${documentId}/${item.name}/`, {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (folderData) {
            for (const file of folderData) {
              if (file.id) {
                const type = item.name as 'pdf' | 'xml';
                const version = this.extractVersionFromPath(file.name);
                
                versions.push({
                  type,
                  path: `${documentId}/${item.name}/${file.name}`,
                  created_at: file.created_at || '',
                  size: file.metadata?.size || 0,
                  version
                });
              }
            }
          }
        }
      }

  console.warn(`📋 Found ${versions.length} document versions for ${documentId}`);
      return versions;

    } catch (error) {
      console.error('Error listing document versions:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to list document versions: ${(error as Error).message}`,
        'LIST_VERSIONS_ERROR',
        { documentId }
      );
    }
  }

  /**
   * Delete expired documents based on retention policy
   */
  async cleanupExpiredDocuments(): Promise<{
    deleted_count: number;
    errors: string[];
  }> {
    try {
  console.warn(`🧹 Starting cleanup of expired documents (older than ${this.RETENTION_YEARS} years)`);

      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - this.RETENTION_YEARS);

      // Get list of all documents
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        throw new EInvoicingError(
          `Failed to list documents for cleanup: ${error.message}`,
          'CLEANUP_LIST_ERROR'
        );
      }

      const expiredDocuments: string[] = [];
      const errors: string[] = [];

      // Find expired documents
      for (const item of data || []) {
        if (item.created_at && new Date(item.created_at) < cutoffDate) {
          expiredDocuments.push(item.name);
        }
      }

  console.warn(`🗑️ Found ${expiredDocuments.length} expired documents to delete`);

      // Delete expired documents
      let deletedCount = 0;
      for (const documentPath of expiredDocuments) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const { error: deleteError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .remove([documentPath]);

          if (deleteError) {
            errors.push(`Failed to delete ${documentPath}: ${deleteError.message}`);
          } else {
            deletedCount++;
            
            // Log deletion event
            // eslint-disable-next-line no-await-in-loop
            await this.logDeletionEvent(documentPath, {
              deleted_at: new Date().toISOString(),
              reason: 'retention_policy_expired',
              retention_years: this.RETENTION_YEARS
            });
          }
        } catch (error) {
          errors.push(`Error deleting ${documentPath}: ${(error as Error).message}`);
        }
      }

  console.warn(`✅ Cleanup complete: ${deletedCount} documents deleted, ${errors.length} errors`);

      return {
        deleted_count: deletedCount,
        errors
      };

    } catch (error) {
      console.error('Error during cleanup:', error);
      
      throw new EInvoicingError(
        `Failed to cleanup expired documents: ${(error as Error).message}`,
        'CLEANUP_ERROR'
      );
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStatistics(): Promise<{
    total_documents: number;
    total_size_bytes: number;
    documents_by_type: Record<string, number>;
    oldest_document: string;
    newest_document: string;
  }> {
    try {
  console.warn('📊 Calculating archive statistics');

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', {
          limit: 10000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new EInvoicingError(
          `Failed to get archive statistics: ${error.message}`,
          'STATS_ERROR'
        );
      }

      const stats = {
        total_documents: 0,
        total_size_bytes: 0,
        documents_by_type: {} as Record<string, number>,
        oldest_document: '',
        newest_document: ''
      };

      if (data && data.length > 0) {
        stats.total_documents = data.length;
        stats.newest_document = data[0].created_at || '';
        stats.oldest_document = data[data.length - 1].created_at || '';

        for (const item of data) {
          if (item.metadata?.size) {
            stats.total_size_bytes += item.metadata.size;
          }

          // Categorize by file type
          const extension = item.name.split('.').pop()?.toLowerCase() || 'unknown';
          stats.documents_by_type[extension] = (stats.documents_by_type[extension] || 0) + 1;
        }
      }

  console.warn('📊 Archive statistics calculated:', stats);
      return stats;

    } catch (error) {
      console.error('Error calculating archive statistics:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to calculate archive statistics: ${(error as Error).message}`,
        'STATS_CALCULATION_ERROR'
      );
    }
  }

  // Private helper methods

  private async uploadFile(
    path: string,
    content: Buffer,
    contentType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, content, {
          contentType,
          cacheControl: '31536000', // 1 year
          upsert: false
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      throw new EInvoicingError(
        `Failed to create signed URL: ${error.message}`,
        'SIGNED_URL_ERROR',
        { path }
      );
    }

    return data.signedUrl;
  }

  private async findDocumentPath(
    documentId: string,
    type: 'pdf' | 'xml',
    version?: string
  ): Promise<string | null> {
    const versions = await this.listDocumentVersions(documentId);
    const filteredVersions = versions.filter(v => v.type === type);

    if (filteredVersions.length === 0) {
      return null;
    }

    if (version) {
      const specificVersion = filteredVersions.find(v => v.version === version);
      return specificVersion?.path || null;
    }

    // Return the most recent version
    return filteredVersions[0].path;
  }

  private async getFileMetadata(path: string): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/'), {
        limit: 1,
        search: path.split('/').pop()
      });

    if (error || !data || data.length === 0) {
      return {};
    }

    return data[0].metadata || {};
  }

  private extractVersionFromPath(filename: string): string {
    // Extract timestamp from filename: "2025-01-08T10-30-00-123Z_facture.pdf"
    const match = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    return match ? match[1] : filename;
  }

  private async logArchivalEvent(documentId: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_action: 'archived',
        p_company_id: metadata.company_id || '',
        p_actor_type: 'system',
        p_meta_json: metadata
      });
    } catch (error) {
      console.error('Error logging archival event:', error);
    }
  }

  private async logAccessEvent(documentId: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_action: 'accessed',
        p_company_id: metadata.company_id || '',
        p_actor_type: 'system',
        p_meta_json: metadata
      });
    } catch (error) {
      console.error('Error logging access event:', error);
    }
  }

  private async logDeletionEvent(documentPath: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: 'document',
        p_entity_id: documentPath,
        p_action: 'deleted',
        p_company_id: metadata.company_id || '',
        p_actor_type: 'system',
        p_meta_json: metadata
      });
    } catch (error) {
      console.error('Error logging deletion event:', error);
    }
  }
}