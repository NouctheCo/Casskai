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
 * E-invoicing API Service
 * RESTful API interface for e-invoicing functionality
 */

import { supabase } from '../../../lib/supabase';
import {
  EInvoicingService,
  SubmissionOptions,
  SubmissionResult,
  EInvDocument,
  EInvoiceLifecycleStatus,
  EInvoiceFormat,
  EInvoiceChannel,
  EInvoicingError,
  FeatureDisabledError
} from '../index';

export interface EInvoicingAPIConfig {
  enabledCompanies?: string[];
  rateLimiting?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  warnings?: string[];
  timestamp: string;
  request_id: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DocumentFilter {
  status?: EInvoiceLifecycleStatus;
  format?: EInvoiceFormat;
  channel?: EInvoiceChannel;
  date_from?: string;
  date_to?: string;
}

export class EInvoicingAPI {
  private einvoicingService: EInvoicingService;
  private config: EInvoicingAPIConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: EInvoicingAPIConfig = {}) {
    this.einvoicingService = new EInvoicingService();
    this.config = {
      rateLimiting: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        ...config.rateLimiting
      },
      ...config
    };
  }

  /**
   * Submit an invoice for e-invoicing processing
   * POST /api/einvoicing/submit
   */
  async submitInvoice(
    invoiceId: string,
    companyId: string,
    options: SubmissionOptions = {},
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<SubmissionResult>> {
    try {
      console.warn(`🚀 API: Submitting invoice ${invoiceId} for company ${companyId}`);

      // Rate limiting check
      await this.checkRateLimit(companyId);

      // Security: Verify user has access to this company
      await this.verifyCompanyAccess(companyId);

      // Submit invoice
      const result = await this.einvoicingService.submitInvoice(invoiceId, options);

      // Log API usage
      await this.logAPIUsage(companyId, 'submit_invoice', { invoiceId, options }, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'submit_invoice', { invoiceId, companyId });
    }
  }

  /**
   * Get document status
   * GET /api/einvoicing/documents/:documentId/status
   */
  async getDocumentStatus(
    documentId: string,
    companyId: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<EInvDocument>> {
    try {
      console.warn(`📋 API: Getting status for document ${documentId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      const document = await this.einvoicingService.getDocumentStatus(documentId);
      
      if (!document) {
        throw new EInvoicingError('Document not found', 'NOT_FOUND');
      }

      // Security: Verify document belongs to company
      if (document.company_id !== companyId) {
        throw new EInvoicingError('Access denied', 'ACCESS_DENIED');
      }

      await this.logAPIUsage(companyId, 'get_document_status', { documentId }, requestId);

      return this.createSuccessResponse(document, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'get_document_status', { documentId, companyId });
    }
  }

  /**
   * List company documents with pagination and filtering
   * GET /api/einvoicing/documents
   */
  async listDocuments(
    companyId: string,
    pagination: PaginationParams = {},
    filters: DocumentFilter = {},
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{
    documents: EInvDocument[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }>> {
    try {
      console.warn(`📄 API: Listing documents for company ${companyId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      // Set defaults
      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(100, Math.max(1, pagination.limit || 20));
      const offset = (page - 1) * limit;

      // Get documents with filters
      const documents = await this.einvoicingService.getCompanyDocuments(companyId, {
        status: filters.status,
        format: filters.format,
        limit,
        offset
      });

      // Get total count for pagination
      const totalCount = await this.getDocumentCount(companyId, filters);
      const totalPages = Math.ceil(totalCount / limit);

      const result = {
        documents,
        pagination: {
          page,
          limit,
          total: totalCount,
          total_pages: totalPages
        }
      };

      await this.logAPIUsage(companyId, 'list_documents', { 
        page, limit, filters, count: documents.length 
      }, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'list_documents', { companyId, pagination, filters });
    }
  }

  /**
   * Update document status (webhook endpoint)
   * POST /api/einvoicing/webhooks/status
   */
  async updateDocumentStatus(
    messageId: string,
    status: EInvoiceLifecycleStatus,
    reason?: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{ updated: boolean }>> {
    try {
      console.warn(`🔄 API: Updating document status for message ${messageId} to ${status}`);

      // Note: Webhook endpoints typically bypass rate limiting and company access checks
      // as they come from external systems

      const updated = await this.einvoicingService.updateDocumentStatus(messageId, status, reason);

      const result = { updated };

      // Log webhook activity
      await this.logAPIUsage('system', 'webhook_status_update', { 
        messageId, status, reason, updated 
      }, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'webhook_status_update', { messageId, status, reason });
    }
  }

  /**
   * Get e-invoicing capabilities
   * GET /api/einvoicing/capabilities
   */
  async getCapabilities(
    companyId: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{
    enabled: boolean;
    formats: EInvoiceFormat[];
    channels: EInvoiceChannel[];
    features: string[];
  }>> {
    try {
      console.warn(`🔧 API: Getting capabilities for company ${companyId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      // Check if e-invoicing is enabled
      const { data: company } = await supabase
        .from('companies')
        .select('einvoicing_v1_enabled')
        .eq('id', companyId)
        .single();

      const enabled = company?.einvoicing_v1_enabled || false;

      const result = {
        enabled,
        formats: enabled ? ['FACTURX', 'UBL', 'CII'] as EInvoiceFormat[] : [],
        channels: enabled ? ['PPF'] as EInvoiceChannel[] : [],
        features: enabled ? [
          'en16931_compliance',
          'factur_x_1.0.7',
          'chorus_pro_integration',
          'document_archiving',
          'audit_trail',
          'status_tracking'
        ] : []
      };

      await this.logAPIUsage(companyId, 'get_capabilities', {}, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'get_capabilities', { companyId });
    }
  }

  /**
   * Get e-invoicing statistics
   * GET /api/einvoicing/statistics
   */
  async getStatistics(
    companyId: string,
    dateFrom?: string,
    dateTo?: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{
    total_documents: number;
    by_status: Record<EInvoiceLifecycleStatus, number>;
    by_format: Record<EInvoiceFormat, number>;
    by_channel: Record<EInvoiceChannel, number>;
    success_rate: number;
    recent_activity: Array<{
      date: string;
      count: number;
    }>;
  }>> {
    try {
      console.warn(`📊 API: Getting statistics for company ${companyId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      const stats = await this.calculateStatistics(companyId, dateFrom, dateTo);

      await this.logAPIUsage(companyId, 'get_statistics', { dateFrom, dateTo }, requestId);

      return this.createSuccessResponse(stats, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'get_statistics', { companyId, dateFrom, dateTo });
    }
  }

  /**
   * Enable e-invoicing for a company
   * POST /api/einvoicing/enable
   */
  async enableEInvoicing(
    companyId: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{ enabled: boolean }>> {
    try {
      console.warn(`🟢 API: Enabling e-invoicing for company ${companyId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      const { error } = await supabase
        .from('companies')
        .update({ einvoicing_v1_enabled: true })
        .eq('id', companyId);

      if (error) {
        throw new EInvoicingError(`Failed to enable e-invoicing: ${error.message}`, 'UPDATE_ERROR');
      }

      const result = { enabled: true };

      await this.logAPIUsage(companyId, 'enable_einvoicing', {}, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'enable_einvoicing', { companyId });
    }
  }

  /**
   * Disable e-invoicing for a company
   * POST /api/einvoicing/disable
   */
  async disableEInvoicing(
    companyId: string,
    requestId: string = this.generateRequestId()
  ): Promise<APIResponse<{ enabled: boolean }>> {
    try {
      console.warn(`🔴 API: Disabling e-invoicing for company ${companyId}`);

      await this.checkRateLimit(companyId);
      await this.verifyCompanyAccess(companyId);

      const { error } = await supabase
        .from('companies')
        .update({ einvoicing_v1_enabled: false })
        .eq('id', companyId);

      if (error) {
        throw new EInvoicingError(`Failed to disable e-invoicing: ${error.message}`, 'UPDATE_ERROR');
      }

      const result = { enabled: false };

      await this.logAPIUsage(companyId, 'disable_einvoicing', {}, requestId);

      return this.createSuccessResponse(result, requestId);

    } catch (error) {
      return this.handleAPIError(error, requestId, 'disable_einvoicing', { companyId });
    }
  }

  // Private helper methods

  private async checkRateLimit(companyId: string): Promise<void> {
    if (!this.config.rateLimiting) return;

    const now = Date.now();
    const key = `rate_limit_${companyId}`;
    const current = this.requestCounts.get(key);

    // Reset counters every minute
    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + 60000 });
      return;
    }

    current.count++;

    if (current.count > this.config.rateLimiting.maxRequestsPerMinute) {
      throw new EInvoicingError(
        'Rate limit exceeded. Too many requests per minute.',
        'RATE_LIMIT_EXCEEDED',
        { limit: this.config.rateLimiting.maxRequestsPerMinute }
      );
    }
  }

  private async verifyCompanyAccess(companyId: string): Promise<void> {
    // Get current user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new EInvoicingError('Authentication required', 'AUTH_REQUIRED');
    }

    // Check if user has access to this company
    const { data, error } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (error || !data) {
      throw new EInvoicingError('Access denied to company', 'ACCESS_DENIED');
    }
  }

  private async getDocumentCount(companyId: string, filters: DocumentFilter): Promise<number> {
    let query = supabase
      .from('einv_documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (filters.status) {
      query = query.eq('lifecycle_status', filters.status);
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting document count:', error);
      return 0;
    }

    return count || 0;
  }

  private async calculateStatistics(
    companyId: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<any> {
    let query = supabase
      .from('einv_documents')
      .select('*')
      .eq('company_id', companyId);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: documents, error } = await query;

    if (error) {
      throw new EInvoicingError(`Failed to calculate statistics: ${error.message}`, 'STATS_ERROR');
    }

    const stats = {
      total_documents: documents?.length || 0,
      by_status: {} as Record<EInvoiceLifecycleStatus, number>,
      by_format: {} as Record<EInvoiceFormat, number>,
      by_channel: {} as Record<EInvoiceChannel, number>,
      success_rate: 0,
      recent_activity: [] as Array<{ date: string; count: number }>
    };

    if (documents && documents.length > 0) {
      // Group by status
      documents.forEach(doc => {
        stats.by_status[doc.lifecycle_status as EInvoiceLifecycleStatus] = 
          (stats.by_status[doc.lifecycle_status as EInvoiceLifecycleStatus] || 0) + 1;
        
        stats.by_format[doc.format as EInvoiceFormat] = 
          (stats.by_format[doc.format as EInvoiceFormat] || 0) + 1;
        
        stats.by_channel[doc.channel as EInvoiceChannel] = 
          (stats.by_channel[doc.channel as EInvoiceChannel] || 0) + 1;
      });

      // Calculate success rate
      const successCount = (stats.by_status['DELIVERED'] || 0) + 
                          (stats.by_status['ACCEPTED'] || 0) + 
                          (stats.by_status['PAID'] || 0);
      stats.success_rate = Math.round((successCount / documents.length) * 100);

      // Recent activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      stats.recent_activity = last7Days.map(date => ({
        date,
        count: documents.filter(doc => 
          doc.created_at?.startsWith(date)
        ).length
      }));
    }

    return stats;
  }

  private async logAPIUsage(
    companyId: string,
    endpoint: string,
    params: any,
    requestId: string
  ): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: 'api',
        p_entity_id: requestId,
        p_action: endpoint,
        p_company_id: companyId,
        p_actor_type: 'system',
        p_meta_json: {
          endpoint,
          params,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging API usage:', error instanceof Error ? error.message : String(error));
    }
  }

  private createSuccessResponse<T>(data: T, requestId: string): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      request_id: requestId
    };
  }

  private handleAPIError(
    error: any,
    requestId: string,
    endpoint: string,
    _context: any
  ): APIResponse {
    console.error(`API Error in ${endpoint}:`, error);

    let errorMessage = 'Internal server error';
    let _errorCode = 'INTERNAL_ERROR';

    if (error instanceof EInvoicingError) {
      errorMessage = error.message;
      _errorCode = error.code;
    } else if (error instanceof FeatureDisabledError) {
      errorMessage = error.message;
      _errorCode = error.code;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      request_id: requestId
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
