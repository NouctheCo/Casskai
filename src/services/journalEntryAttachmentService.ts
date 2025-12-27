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

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export interface JournalEntryAttachment {
  id: string;
  journal_entry_id: string;
  company_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  storage_bucket: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

class JournalEntryAttachmentService {
  private readonly BUCKET_NAME = 'journal-entry-attachments';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'text/plain'
  ];

  /**
   * Expose the current max file size in bytes for UI display
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Expose allowed MIME types for client hints
   */
  getAllowedTypes(): string[] {
    return [...this.ALLOWED_TYPES];
  }

  /**
   * Upload a file and attach it to a journal entry
   */
  async uploadAttachment(
    journalEntryId: string,
    companyId: string,
    file: File,
    description?: string
  ): Promise<JournalEntryAttachment | null> {
    try {
      // Validate file
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`Fichier trop volumineux. Taille maximale: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Type de fichier non autorisé: ${file.type}`);
      }

      // Create a unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${companyId}/${journalEntryId}/${timestamp}_${sanitizedFileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Try REST fallback if upload fails
        await this.uploadViaREST(filePath, file);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create attachment record
      const { data, error } = await supabase
        .from('journal_entry_attachments')
        .insert([{
          journal_entry_id: journalEntryId,
          company_id: companyId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: filePath,
          storage_bucket: this.BUCKET_NAME,
          description: description || null,
          uploaded_by: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Attachment record error:', error);
        // Try REST fallback
        return await this.createAttachmentViaREST({
          journal_entry_id: journalEntryId,
          company_id: companyId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: filePath,
          storage_bucket: this.BUCKET_NAME,
          description: description || null,
          uploaded_by: user.id
        });
      }

      return data;

    } catch (error: unknown) {
      console.error('Upload attachment error:', error);
      throw error;
    }
  }

  /**
   * Get attachments for a journal entry
   */
  async getAttachments(journalEntryId: string): Promise<JournalEntryAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('journal_entry_attachments')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching attachments, trying REST:', error);
        return await this.getAttachmentsViaREST(journalEntryId);
      }

      return data || [];

    } catch (error: unknown) {
      console.error('Get attachments error:', error);
      return [];
    }
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(attachment: JournalEntryAttachment): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(attachment.file_path);

      if (error) {
        console.warn('Download error, trying REST:', error);
        return await this.downloadViaREST(attachment);
      }

      return data;

    } catch (error: unknown) {
      console.error('Download attachment error:', error);
      return null;
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachment: JournalEntryAttachment): Promise<boolean> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([attachment.file_path]);

      if (storageError) {
        console.warn('Storage deletion error, continuing with DB deletion:', storageError);
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('journal_entry_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) {
        console.warn('DB deletion error, trying REST:', dbError);
        return await this.deleteViaREST(attachment.id);
      }

      return true;

    } catch (error: unknown) {
      console.error('Delete attachment error:', error);
      return false;
    }
  }

  /**
   * Generate a public URL for viewing an attachment
   */
  getPublicUrl(attachment: JournalEntryAttachment): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(attachment.file_path);

    return data?.publicUrl || '';
  }

  /**
   * REST API fallback methods
   */
  private async uploadViaREST(filePath: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${this.BUCKET_NAME}/${filePath}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Storage upload failed: ${response.status}`);
    }
  }

  private async createAttachmentViaREST(attachmentData: any): Promise<JournalEntryAttachment | null> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/journal_entry_attachments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify([attachmentData])
      }
    );

    if (!response.ok) {
      throw new Error(`Attachment creation failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.[0] || null;
  }

  private async getAttachmentsViaREST(journalEntryId: string): Promise<JournalEntryAttachment[]> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/journal_entry_attachments?journal_entry_id=eq.${journalEntryId}&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  private async downloadViaREST(attachment: JournalEntryAttachment): Promise<Blob | null> {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${this.BUCKET_NAME}/${attachment.file_path}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.blob();
  }

  private async deleteViaREST(attachmentId: string): Promise<boolean> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/journal_entry_attachments?id=eq.${attachmentId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    return response.ok;
  }
}

export const journalEntryAttachmentService = new JournalEntryAttachmentService();
export default journalEntryAttachmentService;
