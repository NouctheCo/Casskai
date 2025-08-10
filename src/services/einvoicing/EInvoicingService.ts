/**
 * Main E-invoicing Service
 * Orchestrates the complete e-invoicing workflow
 */

import { supabase } from '@/lib/supabase';
import {
  EInvoiceFormat,
  EInvoiceChannel,
  EInvoiceLifecycleStatus,
  SubmissionOptions,
  SubmissionResult,
  EInvDocument,
  EInvoicingError,
  FeatureDisabledError
} from '@/types/einvoicing.types';

import { FormattingService } from './core/FormattingService';
import { ValidationService } from './core/ValidationService';
import { DispatchService } from './core/DispatchService';
import { ArchiveService } from './core/ArchiveService';
import { InvoiceToEN16931Mapper } from './adapters/InvoiceToEN16931Mapper';
import { FeatureFlagService } from './utils/FeatureFlagService';

export class EInvoicingService {
  private formattingService: FormattingService;
  private validationService: ValidationService;
  private dispatchService: DispatchService;
  private archiveService: ArchiveService;
  private mapper: InvoiceToEN16931Mapper;
  private featureFlagService: FeatureFlagService;

  constructor() {
    this.formattingService = new FormattingService();
    this.validationService = new ValidationService();
    this.dispatchService = new DispatchService();
    this.archiveService = new ArchiveService();
    this.mapper = new InvoiceToEN16931Mapper();
    this.featureFlagService = new FeatureFlagService();
  }

  /**
   * Submit an invoice for electronic processing
   */
  async submitInvoice(
    invoiceId: string,
    options: SubmissionOptions = {}
  ): Promise<SubmissionResult> {
    try {
      // Default options
      const {
        format = 'FACTURX',
        channel = 'PPF',
        async = true,
        validate = true,
        archive = true
      } = options;

      console.log(`🚀 Starting e-invoice submission for invoice ${invoiceId}`);
      
      // Step 1: Load and validate invoice
      const invoice = await this.loadInvoice(invoiceId);
      if (!invoice) {
        throw new EInvoicingError(`Invoice ${invoiceId} not found`, 'INVOICE_NOT_FOUND');
      }

      // Step 2: Check feature flag
      const isEnabled = await this.featureFlagService.isEInvoicingEnabled(invoice.company_id);
      if (!isEnabled) {
        throw new FeatureDisabledError('einvoicing_v1');
      }

      // Step 3: Check if already submitted for this format/channel
      const existingDoc = await this.getExistingDocument(invoiceId, format, channel);
      if (existingDoc && existingDoc.lifecycle_status !== 'DRAFT') {
        return {
          success: false,
          errors: [`Invoice already submitted as ${format} via ${channel} with status ${existingDoc.lifecycle_status}`],
          document_id: existingDoc.id
        };
      }

      // Step 4: Map to EN 16931 format
      const en16931Invoice = await this.mapper.mapInvoiceToEN16931(invoice);
      
      // Step 5: Validate (if requested)
      if (validate) {
        const validation = await this.validationService.validateEN16931(en16931Invoice);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors.map(e => e.message),
            warnings: validation.warnings.map(w => w.message)
          };
        }
      }

      // Step 6: Format document (Factur-X, UBL, or CII)
      const formattingResult = await this.formattingService.formatDocument(en16931Invoice, format);
      
      // Step 7: Create or update document record
      const document = await this.createOrUpdateDocument({
        invoice_id: invoiceId,
        company_id: invoice.company_id,
        format,
        channel,
        lifecycle_status: 'DRAFT'
      }, existingDoc?.id);

      // Step 8: Archive files (if requested)
      let pdfUrl: string | undefined;
      let xmlUrl: string | undefined;
      
      if (archive && formattingResult.pdf_content) {
        const archiveResult = await this.archiveService.storeDocuments(
          document.id,
          formattingResult.pdf_content,
          Buffer.from(formattingResult.xml_content, 'utf-8')
        );
        pdfUrl = archiveResult.pdf_url;
        xmlUrl = archiveResult.xml_url;
      }

      // Step 9: Update document with file URLs and hashes
      await this.updateDocument(document.id, {
        pdf_url: pdfUrl,
        xml_url: xmlUrl,
        sha256_pdf: formattingResult.sha256_pdf,
        sha256_xml: formattingResult.sha256_xml,
        xml_content: async ? undefined : formattingResult.xml_content, // Store temporarily if sync
      });

      // Step 10: Submit to channel (async or sync)
      if (async) {
        // Queue for async processing
        this.submitToChannelAsync(document.id, formattingResult, channel);
        
        return {
          success: true,
          document_id: document.id,
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
          warnings: ['Submission queued for asynchronous processing']
        };
      } else {
        // Synchronous submission
        const submissionResult = await this.dispatchService.submitDocument(
          formattingResult,
          channel,
          document.id
        );

        if (submissionResult.success) {
          await this.updateDocument(document.id, {
            lifecycle_status: 'SUBMITTED',
            message_id: submissionResult.message_id,
          });

          await this.logAudit('document', document.id, 'submitted', invoice.company_id, {
            format,
            channel,
            message_id: submissionResult.message_id
          });
        }

        return {
          success: submissionResult.success,
          document_id: document.id,
          message_id: submissionResult.message_id,
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
          errors: submissionResult.errors
        };
      }

    } catch (error) {
      console.error('Error submitting e-invoice:', error);
      
      if (error instanceof EInvoicingError) {
        return {
          success: false,
          errors: [error.message]
        };
      }
      
      return {
        success: false,
        errors: ['An unexpected error occurred during submission']
      };
    }
  }

  /**
   * Get status of an e-invoice document
   */
  async getDocumentStatus(documentId: string): Promise<EInvDocument | null> {
    try {
      const { data, error } = await supabase
        .from('einv_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        return null;
      }

      return data as EInvDocument;
    } catch (error) {
      console.error('Error getting document status:', error);
      return null;
    }
  }

  /**
   * Update document lifecycle status (typically called by webhooks)
   */
  async updateDocumentStatus(
    messageId: string,
    status: EInvoiceLifecycleStatus,
    reason?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('einv_documents')
        .update({
          lifecycle_status: status,
          lifecycle_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .select('id, company_id')
        .single();

      if (error) {
        console.error('Error updating document status:', error);
        return false;
      }

      // Log audit event
      await this.logAudit('document', data.id, 'status_change', data.company_id, {
        new_status: status,
        reason,
        message_id: messageId
      });

      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      return false;
    }
  }

  /**
   * Get all e-invoicing documents for a company
   */
  async getCompanyDocuments(
    companyId: string,
    options: {
      status?: EInvoiceLifecycleStatus;
      format?: EInvoiceFormat;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<EInvDocument[]> {
    try {
      let query = supabase
        .from('einv_documents')
        .select(`
          *,
          invoices!inner(invoice_number, issue_date, total_amount, third_parties(name))
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('lifecycle_status', options.status);
      }

      if (options.format) {
        query = query.eq('format', options.format);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching company documents:', error);
        return [];
      }

      return data as EInvDocument[];
    } catch (error) {
      console.error('Error getting company documents:', error);
      return [];
    }
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async loadInvoice(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        third_parties(*),
        companies(*),
        invoice_lines(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Error loading invoice:', error);
      return null;
    }

    return data;
  }

  private async getExistingDocument(
    invoiceId: string, 
    format: EInvoiceFormat, 
    channel: EInvoiceChannel
  ): Promise<EInvDocument | null> {
    const { data, error } = await supabase
      .from('einv_documents')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('format', format)
      .eq('channel', channel)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error checking existing document:', error);
    }

    return data as EInvDocument || null;
  }

  private async createOrUpdateDocument(
    data: Partial<EInvDocument>,
    existingId?: string
  ): Promise<EInvDocument> {
    if (existingId) {
      const { data: updated, error } = await supabase
        .from('einv_documents')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select('*')
        .single();

      if (error) {
        throw new EInvoicingError('Failed to update document', 'UPDATE_ERROR', { error });
      }

      return updated as EInvDocument;
    } else {
      const { data: created, error } = await supabase
        .from('einv_documents')
        .insert([data])
        .select('*')
        .single();

      if (error) {
        throw new EInvoicingError('Failed to create document', 'CREATE_ERROR', { error });
      }

      return created as EInvDocument;
    }
  }

  private async updateDocument(id: string, updates: Partial<EInvDocument>): Promise<void> {
    const { error } = await supabase
      .from('einv_documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating document:', error);
    }
  }

  private async submitToChannelAsync(
    documentId: string,
    formattingResult: any,
    channel: EInvoiceChannel
  ): Promise<void> {
    // Queue for background processing
    // This would typically use a job queue like Bull, Agenda, or similar
    setTimeout(async () => {
      try {
        const submissionResult = await this.dispatchService.submitDocument(
          formattingResult,
          channel,
          documentId
        );

        // Sécurité: si le mock ne renvoie pas d'objet pendant les tests, sortir sans bruit
        if (!submissionResult || typeof submissionResult.success !== 'boolean') {
          if (process.env.NODE_ENV !== 'test') {
            console.warn('Async submission returned no result; skipping status update');
          }
          return;
        }

        const status: EInvoiceLifecycleStatus = submissionResult.success ? 'SUBMITTED' : 'DRAFT';
        
        await this.updateDocument(documentId, {
          lifecycle_status: status,
          message_id: submissionResult.message_id,
          lifecycle_reason: submissionResult.success ? undefined : submissionResult.errors?.join('; ')
        });

        // Get company_id for audit log
        const doc = await this.getDocumentStatus(documentId);
        if (doc) {
          await this.logAudit(
            'document', 
            documentId, 
            submissionResult.success ? 'submitted' : 'error', 
            doc.company_id,
            {
              channel,
              message_id: submissionResult.message_id,
              errors: submissionResult.errors
            }
          );
        }

      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Async submission failed:', error);
        }
        
        await this.updateDocument(documentId, {
          lifecycle_status: 'DRAFT',
          lifecycle_reason: `Async submission failed: ${  (error as Error).message}`
        });
      }
    }, 100); // Small delay to return response quickly
  }

  private async logAudit(
    entityType: string,
    entityId: string,
    action: string,
    companyId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_action: action,
        p_company_id: companyId,
        p_actor_type: 'system',
        p_meta_json: metadata
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }
}