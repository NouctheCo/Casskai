/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
/**
 * Service pour la gestion des documents RH
 * Gère les uploads, téléchargements, versioning et archivage
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  EmployeeDocument,
  DocumentFormData,
  DocumentFilters,
  DocumentStats,
  DocumentType,
  DocumentStatus
} from '@/types/hr-documents.types';
const STORAGE_BUCKET = 'hr-documents';
export class HRDocumentsService {
  /**
   * Upload d'un document
   */
  async uploadDocument(
    companyId: string,
    userId: string,
    formData: DocumentFormData
  ): Promise<{ success: boolean; data?: EmployeeDocument; error?: string }> {
    try {
      // 1. Upload du fichier vers Supabase Storage
      const fileName = `${companyId}/${formData.employee_id}/${Date.now()}_${formData.file.name}`;
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, formData.file, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);
      // 3. Create document record
      const documentData: Omit<EmployeeDocument, 'id' | 'created_at' | 'updated_at'> = {
        employee_id: formData.employee_id,
        document_type: formData.document_type,
        title: formData.title,
        description: formData.description,
        file_url: publicUrl,
        file_name: formData.file.name,
        file_size: formData.file.size,
        mime_type: formData.file.type,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        status: formData.requires_signature ? 'pending_signature' : 'active',
        is_confidential: formData.is_confidential,
        requires_signature: formData.requires_signature,
        version: 1,
        uploaded_by: userId,
        company_id: companyId,
        tags: formData.tags,
        notes: formData.notes
      };
      const { data, error } = await supabase
        .from('hr_documents')
        .insert(documentData)
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      // Add computed employee_name
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrDocuments', 'Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload du document'
      };
    }
  }
  /**
   * Récupérer les documents avec filtres
   */
  async getDocuments(
    companyId: string,
    filters?: DocumentFilters
  ): Promise<{ success: boolean; data?: EmployeeDocument[]; error?: string }> {
    try {
      let query = supabase
        .from('hr_documents')
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      // Apply filters
      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.is_confidential !== undefined) {
        query = query.eq('is_confidential', filters.is_confidential);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.from_date) {
        query = query.gte('created_at', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('created_at', filters.to_date);
      }
      const { data, error } = await query;
      if (error) throw error;
      // Add computed employee_name
      const results = data.map(doc => ({
        ...doc,
        employee_name: doc.employee ? `${doc.employee.first_name} ${doc.employee.last_name}` : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrDocuments', 'Error fetching documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des documents'
      };
    }
  }
  /**
   * Récupérer un document par ID
   */
  async getDocumentById(
    documentId: string
  ): Promise<{ success: boolean; data?: EmployeeDocument; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('hr_documents')
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .eq('id', documentId)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrDocuments', 'Error fetching document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document non trouvé'
      };
    }
  }
  /**
   * Mettre à jour un document
   */
  async updateDocument(
    documentId: string,
    updates: Partial<EmployeeDocument>
  ): Promise<{ success: boolean; data?: EmployeeDocument; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('hr_documents')
        .update(updates)
        .eq('id', documentId)
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrDocuments', 'Error updating document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du document'
      };
    }
  }
  /**
   * Signer un document
   */
  async signDocument(
    documentId: string,
    userId: string
  ): Promise<{ success: boolean; data?: EmployeeDocument; error?: string }> {
    return this.updateDocument(documentId, {
      status: 'active',
      signed_by: userId,
      signed_date: new Date().toISOString()
    });
  }
  /**
   * Archiver un document
   */
  async archiveDocument(
    documentId: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.updateDocument(documentId, {
      status: 'archived'
    });
    return { success: result.success, error: result.error };
  }
  /**
   * Supprimer un document (soft delete via archive)
   */
  async deleteDocument(
    documentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get document to find file path
      const { data: doc, error: fetchError } = await supabase
        .from('hr_documents')
        .select('file_url')
        .eq('id', documentId)
        .single();
      if (fetchError) throw fetchError;
      // Delete from storage
      const fileName = doc.file_url.split('/').slice(-3).join('/');
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);
      if (storageError) logger.warn('HrDocuments', 'Failed to delete file from storage:', storageError);
      // Delete record
      const { error: deleteError } = await supabase
        .from('hr_documents')
        .delete()
        .eq('id', documentId);
      if (deleteError) throw deleteError;
      return { success: true };
    } catch (error) {
      logger.error('HrDocuments', 'Error deleting document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du document'
      };
    }
  }
  /**
   * Créer une nouvelle version d'un document
   */
  async createNewVersion(
    documentId: string,
    newFile: File,
    userId: string
  ): Promise<{ success: boolean; data?: EmployeeDocument; error?: string }> {
    try {
      // Get original document
      const { data: originalDoc, error: fetchError } = await supabase
        .from('hr_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (fetchError) throw fetchError;
      // Archive original
      await this.archiveDocument(documentId);
      // Upload new version
      const fileName = `${originalDoc.company_id}/${originalDoc.employee_id}/${Date.now()}_${newFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, newFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);
      // Create new version
      const newVersion: Omit<EmployeeDocument, 'id' | 'created_at' | 'updated_at'> = {
        ...originalDoc,
        file_url: publicUrl,
        file_name: newFile.name,
        file_size: newFile.size,
        mime_type: newFile.type,
        version: originalDoc.version + 1,
        previous_version_id: documentId,
        uploaded_by: userId,
        status: 'active'
      };
      const { data, error } = await supabase
        .from('hr_documents')
        .insert(newVersion)
        .select(`
          *,
          employee:hr_employees(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrDocuments', 'Error creating new version:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la nouvelle version'
      };
    }
  }
  /**
   * Récupérer les statistiques des documents
   */
  async getDocumentStats(
    companyId: string
  ): Promise<{ success: boolean; data?: DocumentStats; error?: string }> {
    try {
      const { data: documents, error } = await supabase
        .from('hr_documents')
        .select('document_type, status, file_size, expiry_date, created_at')
        .eq('company_id', companyId);
      if (error) throw error;
      // Calculate stats
      const stats: DocumentStats = {
        total_documents: documents.length,
        by_type: {} as Record<DocumentType, number>,
        by_status: {} as Record<DocumentStatus, number>,
        expiring_soon: 0,
        pending_signature: 0,
        total_size: 0,
        recent_uploads: 0
      };
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      documents.forEach(doc => {
        // By type
        const docType = doc.document_type as DocumentType;
        stats.by_type[docType] = (stats.by_type[docType] || 0) + 1;
        // By status
        const docStatus = doc.status as DocumentStatus;
        stats.by_status[docStatus] = (stats.by_status[docStatus] || 0) + 1;
        // Expiring soon
        if (doc.expiry_date) {
          const expiryDate = new Date(doc.expiry_date);
          if (expiryDate <= thirtyDaysFromNow && expiryDate > now) {
            stats.expiring_soon++;
          }
        }
        // Pending signature
        if (doc.status === 'pending_signature') {
          stats.pending_signature++;
        }
        // Total size
        stats.total_size += doc.file_size || 0;
        // Recent uploads
        const createdDate = new Date(doc.created_at);
        if (createdDate >= sevenDaysAgo) {
          stats.recent_uploads++;
        }
      });
      return { success: true, data: stats };
    } catch (error) {
      logger.error('HrDocuments', 'Error fetching document stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
      };
    }
  }
  /**
   * Télécharger un document
   */
  async downloadDocument(documentId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: doc, error } = await supabase
        .from('hr_documents')
        .select('file_url, file_name')
        .eq('id', documentId)
        .single();
      if (error) throw error;
      return { success: true, url: doc.file_url };
    } catch (error) {
      logger.error('HrDocuments', 'Error downloading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du téléchargement du document'
      };
    }
  }
}
export const hrDocumentsService = new HRDocumentsService();