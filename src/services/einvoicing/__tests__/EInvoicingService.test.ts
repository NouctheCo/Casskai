/**
 * EInvoicingService Unit Tests
 * Test suite for main e-invoicing orchestration service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EInvoicingService } from '../EInvoicingService';
import { SubmissionOptions } from '@/types/einvoicing.types';

// Mock dependencies
vi.mock('../core/FormattingService');
vi.mock('../core/ValidationService');
vi.mock('../core/DispatchService');
vi.mock('../core/ArchiveService');
vi.mock('../adapters/InvoiceToEN16931Mapper');
vi.mock('../utils/FeatureFlagService');
vi.mock('@/lib/supabase');
import { supabase as mockSupabase } from '@/lib/supabase';

describe('EInvoicingService', () => {
  let einvoicingService: EInvoicingService;
  let mockFormattingService: any;
  let mockValidationService: any;
  let mockDispatchService: any;
  let mockArchiveService: any;
  let mockMapper: any;
  let mockFeatureFlagService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    einvoicingService = new EInvoicingService();

    // Access private members for testing
    mockFormattingService = (einvoicingService as any).formattingService;
    mockValidationService = (einvoicingService as any).validationService;
    mockDispatchService = (einvoicingService as any).dispatchService;
    mockArchiveService = (einvoicingService as any).archiveService;
    mockMapper = (einvoicingService as any).mapper;
    mockFeatureFlagService = (einvoicingService as any).featureFlagService;

    // Default archive stub to avoid runtime error in default submissions
    mockArchiveService.storeDocuments = vi.fn().mockResolvedValue({
      pdf_url: undefined,
      xml_url: undefined,
    });
  });

  describe('submitInvoice', () => {
    const mockInvoice = {
      id: 'invoice-123',
      invoice_number: 'INV-2024-001',
      company_id: 'company-456',
      issue_date: '2024-01-15',
      total_amount: 1200.00
    };

    const mockEN16931Invoice = {
      invoice_number: 'INV-2024-001',
      issue_date: '2024-01-15',
      type_code: '380' as const,
      currency_code: 'EUR' as const,
      seller: { name: 'Test Company' },
      buyer: { name: 'Test Client' },
      lines: [],
      totals: {
        sum_invoice_line_net_amount: 1000,
        invoice_total_without_vat: 1000,
        invoice_total_vat_amount: 200,
        invoice_total_with_vat: 1200,
        amount_due_for_payment: 1200
      }
    };

    beforeEach(() => {
      // Setup default mocks
      (einvoicingService as any).loadInvoice = vi.fn().mockResolvedValue(mockInvoice);
      (einvoicingService as any).getExistingDocument = vi.fn().mockResolvedValue(null);
      (einvoicingService as any).createOrUpdateDocument = vi.fn().mockResolvedValue({
        id: 'doc-789',
        invoice_id: 'invoice-123',
        company_id: 'company-456'
      });
      (einvoicingService as any).updateDocument = vi.fn().mockResolvedValue(undefined);
      (einvoicingService as any).logAudit = vi.fn().mockResolvedValue(undefined);

      mockFeatureFlagService.isEInvoicingEnabled.mockResolvedValue(true);
      mockMapper.mapInvoiceToEN16931.mockResolvedValue(mockEN16931Invoice);
      mockValidationService.validateEN16931.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      });
      mockFormattingService.formatDocument.mockResolvedValue({
        format: 'FACTURX',
        xml_content: '<xml>test</xml>',
        pdf_content: Buffer.from('pdf-content'),
        sha256_xml: 'xml-hash',
        sha256_pdf: 'pdf-hash'
      });
    });

  it('should successfully submit an invoice with default options', async () => {
      mockDispatchService.submitDocument.mockResolvedValue({
        success: true,
        message_id: 'msg-123'
      });

      const result = await einvoicingService.submitInvoice('invoice-123');

      expect(result.success).toBe(true);
      expect(result.document_id).toBe('doc-789');
      expect(mockFeatureFlagService.isEInvoicingEnabled).toHaveBeenCalledWith('company-456');
      expect(mockMapper.mapInvoiceToEN16931).toHaveBeenCalledWith(mockInvoice);
      expect(mockValidationService.validateEN16931).toHaveBeenCalledWith(mockEN16931Invoice);
      expect(mockFormattingService.formatDocument).toHaveBeenCalledWith(mockEN16931Invoice, 'FACTURX');
    });

    it('should return error when invoice not found', async () => {
  (einvoicingService as any).loadInvoice = vi.fn().mockResolvedValue(null);

      const result = await einvoicingService.submitInvoice('invalid-invoice');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invoice invalid-invoice not found');
    });

    it('should return error when feature is disabled', async () => {
      mockFeatureFlagService.isEInvoicingEnabled.mockResolvedValue(false);

      const result = await einvoicingService.submitInvoice('invoice-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain("E-invoicing feature 'einvoicing_v1' is not enabled");
    });

    it('should return error when validation fails', async () => {
      mockValidationService.validateEN16931.mockResolvedValue({
        valid: false,
        errors: [
          { code: 'BT-1-01', message: 'Invoice number is mandatory', severity: 'error' }
        ],
        warnings: []
      });

      const result = await einvoicingService.submitInvoice('invoice-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invoice number is mandatory');
    });

    it('should handle custom submission options', async () => {
      mockDispatchService.submitDocument.mockResolvedValue({
        success: true,
        message_id: 'msg-456'
      });

      const options: SubmissionOptions = {
        format: 'UBL',
        channel: 'PPF',
        async: false,
        validate: false,
        archive: false
      };

      const result = await einvoicingService.submitInvoice('invoice-123', options);

      expect(result.success).toBe(true);
      expect(mockFormattingService.formatDocument).toHaveBeenCalledWith(mockEN16931Invoice, 'UBL');
      expect(mockValidationService.validateEN16931).not.toHaveBeenCalled();
      expect(mockDispatchService.submitDocument).toHaveBeenCalled();
    });

    it('should handle asynchronous submission', async () => {
      const options: SubmissionOptions = { async: true };

      const result = await einvoicingService.submitInvoice('invoice-123', options);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Submission queued for asynchronous processing');
      expect(mockDispatchService.submitDocument).not.toHaveBeenCalled();
    });

    it('should archive documents when requested', async () => {
      mockArchiveService.storeDocuments.mockResolvedValue({
        pdf_url: 'https://storage/pdf',
        xml_url: 'https://storage/xml'
      });

      mockDispatchService.submitDocument.mockResolvedValue({
        success: true,
        message_id: 'msg-789'
      });

      const options: SubmissionOptions = { archive: true, async: false };

      const result = await einvoicingService.submitInvoice('invoice-123', options);

      expect(result.success).toBe(true);
      expect(result.pdf_url).toBe('https://storage/pdf');
      expect(result.xml_url).toBe('https://storage/xml');
      expect(mockArchiveService.storeDocuments).toHaveBeenCalled();
    });

    it('should not resubmit already submitted invoice', async () => {
  (einvoicingService as any).getExistingDocument = vi.fn().mockResolvedValue({
        id: 'existing-doc',
        lifecycle_status: 'SUBMITTED'
      });

      const result = await einvoicingService.submitInvoice('invoice-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Invoice already submitted as FACTURX via PPF with status SUBMITTED'
      );
      expect(result.document_id).toBe('existing-doc');
    });
  });

  describe('getDocumentStatus', () => {
    it('should return document status', async () => {
      const mockDocument = {
        id: 'doc-123',
        invoice_id: 'invoice-456',
        lifecycle_status: 'DELIVERED',
        created_at: '2024-01-15T10:00:00Z'
      };

  mockSupabase.from = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          })
        })
      });

      const result = await einvoicingService.getDocumentStatus('doc-123');

      expect(result).toEqual(mockDocument);
    });

    it('should return null when document not found', async () => {
  mockSupabase.from = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found
            })
          })
        })
      });

      const result = await einvoicingService.getDocumentStatus('invalid-doc');

      expect(result).toBeNull();
    });
  });

  describe('updateDocumentStatus', () => {
    it('should update document status successfully', async () => {
  mockSupabase.from = vi.fn().mockReturnValue({
  update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'doc-123', company_id: 'company-456' },
                error: null
              })
            })
          })
        })
      });

  (einvoicingService as any).logAudit = vi.fn().mockResolvedValue(undefined);

      const result = await einvoicingService.updateDocumentStatus('msg-123', 'DELIVERED', 'Successfully delivered');

      expect(result).toBe(true);
      expect((einvoicingService as any).logAudit).toHaveBeenCalledWith(
        'document',
        'doc-123',
        'status_change',
        'company-456',
        expect.objectContaining({
          new_status: 'DELIVERED',
          reason: 'Successfully delivered'
        })
      );
    });

    it('should return false when update fails', async () => {
  mockSupabase.from = vi.fn().mockReturnValue({
  update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
              })
            })
          })
        })
      });

      const result = await einvoicingService.updateDocumentStatus('invalid-msg', 'DELIVERED');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in submitInvoice', async () => {
      mockMapper.mapInvoiceToEN16931.mockRejectedValue(new Error('Mapping failed'));

      const result = await einvoicingService.submitInvoice('invoice-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('An unexpected error occurred during submission');
    });

    it('should handle network errors', async () => {
  mockSupabase.from = vi.fn(() => {
        throw new Error('Network error');
      });

      const result = await einvoicingService.getDocumentStatus('doc-123');

      expect(result).toBeNull();
    });
  });
});