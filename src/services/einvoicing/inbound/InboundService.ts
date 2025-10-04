/**
 * Inbound Service
 * Processes incoming supplier e-invoices
 */

import { supabase } from '../../../lib/supabase';
import {
  EInvInboundQueue,
  ParsedStatus,
  EN16931Invoice,
  EInvoicingError
} from '../../../types/einvoicing.types';
import { ValidationService } from '../core/ValidationService';
import { xml2js } from 'xml2js';

interface ParsedInvoiceResult {
  success: boolean;
  invoice?: Partial<EN16931Invoice>;
  errors?: string[];
  warnings?: string[];
  detected_format?: 'FACTURX' | 'UBL' | 'CII';
}

interface InvoiceCreationResult {
  success: boolean;
  invoice_id?: string;
  errors?: string[];
}

export class InboundService {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  /**
   * Process incoming invoice payload
   */
  async processInboundInvoice(
    companyId: string,
    payload: string,
    contentType: string = 'application/xml',
    senderIdentifier?: string,
    metadata: Record<string, any> = {}
  ): Promise<{
    queue_id: string;
    status: ParsedStatus;
    invoice_id?: string;
    errors?: string[];
  }> {
    let queueId: string | null = null;
    
    try {
      console.log(`📥 Processing inbound invoice for company ${companyId}`);

      // Create queue entry
      queueId = await this.createQueueEntry(
        companyId,
        payload,
        contentType,
        senderIdentifier,
        metadata
      );

      // Update status to parsing
      await this.updateQueueStatus(queueId, 'parsing');

      // Check for duplicates
      const isDuplicate = await this.checkForDuplicates(companyId, payload);
      if (isDuplicate) {
        await this.updateQueueStatus(queueId, 'duplicate', 'Duplicate invoice detected');
        return {
          queue_id: queueId,
          status: 'duplicate',
          errors: ['Duplicate invoice detected']
        };
      }

      // Parse the invoice
      const parseResult = await this.parseInvoice(payload, contentType);
      
      if (!parseResult.success) {
        await this.updateQueueStatus(
          queueId, 
          'error', 
          `Parsing failed: ${parseResult.errors?.join(', ')}`
        );
        
        return {
          queue_id: queueId,
          status: 'error',
          errors: parseResult.errors
        };
      }

      // Create invoice in the system
      const creationResult = await this.createInvoiceFromParsed(
        companyId,
        parseResult.invoice!,
        parseResult.detected_format!
      );

      if (!creationResult.success) {
        await this.updateQueueStatus(
          queueId,
          'error',
          `Invoice creation failed: ${creationResult.errors?.join(', ')}`
        );
        
        return {
          queue_id: queueId,
          status: 'error',
          errors: creationResult.errors
        };
      }

      // Update queue with success
      await this.updateQueueStatus(
        queueId,
        'parsed',
        undefined,
        creationResult.invoice_id
      );

      console.log(`✅ Inbound invoice processed successfully: ${creationResult.invoice_id}`);

      return {
        queue_id: queueId,
        status: 'parsed',
        invoice_id: creationResult.invoice_id
      };

    } catch (error) {
      console.error('Error processing inbound invoice:', error);
      
      if (queueId) {
        await this.updateQueueStatus(
          queueId,
          'error',
          `Processing failed: ${(error as Error).message}`
        );
      }

      throw new EInvoicingError(
        `Failed to process inbound invoice: ${(error as Error).message}`,
        'INBOUND_PROCESSING_ERROR',
        { companyId, contentType, senderIdentifier }
      );
    }
  }

  /**
   * Get inbound queue status
   */
  async getQueueStatus(queueId: string): Promise<EInvInboundQueue | null> {
    try {
      const { data, error } = await supabase
        .from('einv_inbound_queue')
        .select('*')
        .eq('id', queueId)
        .single();

      if (error) {
        console.error('Error getting queue status:', error);
        return null;
      }

      return data as EInvInboundQueue;

    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }

  /**
   * List inbound invoices for a company
   */
  async listInboundInvoices(
    companyId: string,
    status?: ParsedStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<EInvInboundQueue[]> {
    try {
      let query = supabase
        .from('einv_inbound_queue')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('parsed_status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new EInvoicingError(
          `Failed to list inbound invoices: ${error.message}`,
          'LIST_ERROR',
          { companyId }
        );
      }

      return data as EInvInboundQueue[] || [];

    } catch (error) {
      console.error('Error listing inbound invoices:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to list inbound invoices: ${(error as Error).message}`,
        'LIST_INBOUND_ERROR',
        { companyId }
      );
    }
  }

  /**
   * Retry processing of a failed queue item
   */
  async retryProcessing(queueId: string): Promise<{
    success: boolean;
    status: ParsedStatus;
    invoice_id?: string;
    errors?: string[];
  }> {
    try {
      console.log(`🔄 Retrying processing for queue item ${queueId}`);

      // Get queue item
      const queueItem = await this.getQueueStatus(queueId);
      if (!queueItem) {
        throw new EInvoicingError('Queue item not found', 'NOT_FOUND');
      }

      if (queueItem.parsed_status === 'parsed') {
        return {
          success: true,
          status: 'parsed',
          invoice_id: queueItem.processed_invoice_id || undefined
        };
      }

      // Reset status to pending
      await this.updateQueueStatus(queueId, 'pending', undefined, null);

      // Reprocess
      const result = await this.processInboundInvoice(
        queueItem.company_id,
        queueItem.payload_raw,
        queueItem.content_type,
        queueItem.sender_identifier || undefined,
        queueItem.metadata_json
      );

      return {
        success: result.status === 'parsed',
        status: result.status,
        invoice_id: result.invoice_id,
        errors: result.errors
      };

    } catch (error) {
      console.error('Error retrying processing:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to retry processing: ${(error as Error).message}`,
        'RETRY_ERROR',
        { queueId }
      );
    }
  }

  // Private methods

  private async createQueueEntry(
    companyId: string,
    payload: string,
    contentType: string,
    senderIdentifier?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const { data, error } = await supabase
      .from('einv_inbound_queue')
      .insert([{
        company_id: companyId,
        payload_raw: payload,
        content_type: contentType,
        sender_identifier: senderIdentifier,
        parsed_status: 'pending',
        metadata_json: metadata
      }])
      .select('id')
      .single();

    if (error) {
      throw new EInvoicingError(
        `Failed to create queue entry: ${error.message}`,
        'QUEUE_CREATE_ERROR'
      );
    }

    return data.id;
  }

  private async updateQueueStatus(
    queueId: string,
    status: ParsedStatus,
    errorMessage?: string,
    processedInvoiceId?: string | null
  ): Promise<void> {
    const updates: any = {
      parsed_status: status,
      processed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (processedInvoiceId !== undefined) {
      updates.processed_invoice_id = processedInvoiceId;
    }

    const { error } = await supabase
      .from('einv_inbound_queue')
      .update(updates)
      .eq('id', queueId);

    if (error) {
      console.error('Error updating queue status:', error);
    }
  }

  private async checkForDuplicates(
    companyId: string,
    payload: string
  ): Promise<boolean> {
    try {
      // Generate payload hash for duplicate detection
      const crypto = require('crypto');
      const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

      // Check if we've seen this payload hash before
      const { data, error } = await supabase
        .from('einv_inbound_queue')
        .select('id')
        .eq('company_id', companyId)
        .like('metadata_json', `%"payload_hash":"${payloadHash}"%`)
        .limit(1);

      if (error) {
        console.error('Error checking for duplicates:', error);
        return false; // Don't block processing on duplicate check errors
      }

      return (data && data.length > 0);

    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  }

  private async parseInvoice(
    payload: string,
    contentType: string
  ): Promise<ParsedInvoiceResult> {
    try {
      // Detect format from payload
      const detectedFormat = this.detectInvoiceFormat(payload);
      
      let parsedInvoice: Partial<EN16931Invoice>;

      switch (detectedFormat) {
        case 'FACTURX':
          parsedInvoice = await this.parseFacturX(payload);
          break;
        case 'UBL':
          parsedInvoice = await this.parseUBL(payload);
          break;
        case 'CII':
          parsedInvoice = await this.parseCII(payload);
          break;
        default:
          return {
            success: false,
            errors: [`Unsupported or unrecognized invoice format`],
            detected_format: detectedFormat
          };
      }

      // Basic validation
      const validationErrors = await this.validateParsedInvoice(parsedInvoice);
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          detected_format: detectedFormat
        };
      }

      return {
        success: true,
        invoice: parsedInvoice,
        detected_format: detectedFormat
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Parsing error: ${(error as Error).message}`]
      };
    }
  }

  private detectInvoiceFormat(payload: string): 'FACTURX' | 'UBL' | 'CII' | 'UNKNOWN' {
    const normalizedPayload = payload.trim().toLowerCase();

    // Check for UBL namespace
    if (normalizedPayload.includes('urn:oasis:names:specification:ubl:schema:xsd:invoice-2')) {
      return 'UBL';
    }

    // Check for CII namespace
    if (normalizedPayload.includes('urn:un:unece:uncefact:data:standard:crossindustryinvoice')) {
      return 'CII';
    }

    // Factur-X is essentially CII with PDF embedding
    if (normalizedPayload.includes('urn:factur-x.eu') || 
        normalizedPayload.includes('zugferd')) {
      return 'FACTURX';
    }

    return 'UNKNOWN';
  }

  private async parseUBL(payload: string): Promise<Partial<EN16931Invoice>> {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
    const result = await parser.parseStringPromise(payload);
    
    const invoice = result.Invoice;
    
    return {
      invoice_number: invoice.ID,
      issue_date: invoice.IssueDate,
      type_code: invoice.InvoiceTypeCode,
      currency_code: invoice.DocumentCurrencyCode,
      
      seller: {
        name: invoice.AccountingSupplierParty?.Party?.PartyName?.Name || 'Unknown',
        vat_identifier: invoice.AccountingSupplierParty?.Party?.PartyTaxScheme?.CompanyID,
        address: invoice.AccountingSupplierParty?.Party?.PostalAddress ? {
          street_name: invoice.AccountingSupplierParty.Party.PostalAddress.StreetName,
          city_name: invoice.AccountingSupplierParty.Party.PostalAddress.CityName,
          postal_zone: invoice.AccountingSupplierParty.Party.PostalAddress.PostalZone,
          country_code: invoice.AccountingSupplierParty.Party.PostalAddress.Country?.IdentificationCode || 'FR'
        } : undefined
      },
      
      buyer: {
        name: invoice.AccountingCustomerParty?.Party?.PartyName?.Name || 'Unknown',
        vat_identifier: invoice.AccountingCustomerParty?.Party?.PartyTaxScheme?.CompanyID,
        address: invoice.AccountingCustomerParty?.Party?.PostalAddress ? {
          street_name: invoice.AccountingCustomerParty.Party.PostalAddress.StreetName,
          city_name: invoice.AccountingCustomerParty.Party.PostalAddress.CityName,
          postal_zone: invoice.AccountingCustomerParty.Party.PostalAddress.PostalZone,
          country_code: invoice.AccountingCustomerParty.Party.PostalAddress.Country?.IdentificationCode || 'FR'
        } : undefined
      },

      lines: Array.isArray(invoice.InvoiceLine) 
        ? invoice.InvoiceLine.map((line: any) => ({
            id: line.ID,
            name: line.Item?.Name || 'Unknown',
            description: line.Item?.Description,
            quantity: parseFloat(line.InvoicedQuantity) || 1,
            unit_code: line.InvoicedQuantity?.$?.unitCode || 'C62',
            net_price: parseFloat(line.Price?.PriceAmount) || 0,
            net_amount: parseFloat(line.LineExtensionAmount) || 0,
            tax: line.Item?.ClassifiedTaxCategory ? {
              category_code: line.Item.ClassifiedTaxCategory.ID,
              rate: parseFloat(line.Item.ClassifiedTaxCategory.Percent) || 0
            } : undefined
          }))
        : [],

      totals: {
        sum_invoice_line_net_amount: parseFloat(invoice.LegalMonetaryTotal?.LineExtensionAmount) || 0,
        invoice_total_without_vat: parseFloat(invoice.LegalMonetaryTotal?.TaxExclusiveAmount) || 0,
        invoice_total_vat_amount: parseFloat(invoice.TaxTotal?.TaxAmount) || 0,
        invoice_total_with_vat: parseFloat(invoice.LegalMonetaryTotal?.TaxInclusiveAmount) || 0,
        amount_due_for_payment: parseFloat(invoice.LegalMonetaryTotal?.PayableAmount) || 0
      }
    };
  }

  private async parseCII(payload: string): Promise<Partial<EN16931Invoice>> {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
    const result = await parser.parseStringPromise(payload);
    
    const invoice = result.CrossIndustryInvoice;
    const exchangedDocument = invoice.ExchangedDocument;
    const transaction = invoice.SupplyChainTradeTransaction;
    
    return {
      invoice_number: exchangedDocument.ID,
      issue_date: this.parseCIIDate(exchangedDocument.IssueDateTime?.DateTimeString),
      type_code: exchangedDocument.TypeCode,
      currency_code: transaction?.ApplicableHeaderTradeSettlement?.InvoiceCurrencyCode,
      
      seller: {
        name: transaction?.ApplicableHeaderTradeAgreement?.SellerTradeParty?.Name || 'Unknown',
        vat_identifier: transaction?.ApplicableHeaderTradeAgreement?.SellerTradeParty?.SpecifiedTaxRegistration?.ID
      },
      
      buyer: {
        name: transaction?.ApplicableHeaderTradeAgreement?.BuyerTradeParty?.Name || 'Unknown',
        vat_identifier: transaction?.ApplicableHeaderTradeAgreement?.BuyerTradeParty?.SpecifiedTaxRegistration?.ID
      },

      lines: [], // CII line parsing would be more complex

      totals: {
        sum_invoice_line_net_amount: parseFloat(transaction?.ApplicableHeaderTradeSettlement?.SpecifiedTradeSettlementHeaderMonetarySummation?.LineTotalAmount) || 0,
        invoice_total_without_vat: parseFloat(transaction?.ApplicableHeaderTradeSettlement?.SpecifiedTradeSettlementHeaderMonetarySummation?.TaxBasisTotalAmount) || 0,
        invoice_total_vat_amount: parseFloat(transaction?.ApplicableHeaderTradeSettlement?.SpecifiedTradeSettlementHeaderMonetarySummation?.TaxTotalAmount) || 0,
        invoice_total_with_vat: parseFloat(transaction?.ApplicableHeaderTradeSettlement?.SpecifiedTradeSettlementHeaderMonetarySummation?.GrandTotalAmount) || 0,
        amount_due_for_payment: parseFloat(transaction?.ApplicableHeaderTradeSettlement?.SpecifiedTradeSettlementHeaderMonetarySummation?.DuePayableAmount) || 0
      }
    };
  }

  private async parseFacturX(payload: string): Promise<Partial<EN16931Invoice>> {
    // Factur-X is CII embedded in PDF, but for this implementation we'll treat it as CII
    return this.parseCII(payload);
  }

  private parseCIIDate(dateTimeString: any): string {
    if (!dateTimeString) return new Date().toISOString().split('T')[0];
    
    const dateStr = typeof dateTimeString === 'string' ? dateTimeString : dateTimeString._;
    
    // Parse YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    return dateStr || new Date().toISOString().split('T')[0];
  }

  private async validateParsedInvoice(invoice: Partial<EN16931Invoice>): Promise<string[]> {
    const errors: string[] = [];

    if (!invoice.invoice_number) {
      errors.push('Invoice number is required');
    }

    if (!invoice.issue_date) {
      errors.push('Issue date is required');
    }

    if (!invoice.seller?.name) {
      errors.push('Seller name is required');
    }

    if (!invoice.buyer?.name) {
      errors.push('Buyer name is required');
    }

    if (!invoice.totals?.invoice_total_with_vat || invoice.totals.invoice_total_with_vat <= 0) {
      errors.push('Invoice total must be positive');
    }

    return errors;
  }

  private async createInvoiceFromParsed(
    companyId: string,
    parsedInvoice: Partial<EN16931Invoice>,
    format: 'FACTURX' | 'UBL' | 'CII'
  ): Promise<InvoiceCreationResult> {
    try {
      // This would integrate with your existing invoice creation logic
      // For now, we'll create a minimal invoice record
      
      const invoiceData = {
        company_id: companyId,
        invoice_number: parsedInvoice.invoice_number,
        issue_date: parsedInvoice.issue_date,
        total_amount: parsedInvoice.totals?.invoice_total_with_vat || 0,
        total_tax: parsedInvoice.totals?.invoice_total_vat_amount || 0,
        total_without_tax: parsedInvoice.totals?.invoice_total_without_vat || 0,
        currency: parsedInvoice.currency_code || 'EUR',
        notes: `Imported from e-invoice (${format})`,
        // You would map other fields as needed
      };

      // Insert into invoices table (this would use your existing invoice service)
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select('id')
        .single();

      if (error) {
        return {
          success: false,
          errors: [`Failed to create invoice: ${error.message}`]
        };
      }

      return {
        success: true,
        invoice_id: data.id
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Invoice creation error: ${(error as Error).message}`]
      };
    }
  }
}