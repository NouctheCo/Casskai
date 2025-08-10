/**
 * TypeScript types for French E-invoicing module
 * Compliant with EN 16931, Factur-X 1.0.7, UBL 2.1, UN/CEFACT CII
 */

// ================================
// CORE E-INVOICING TYPES
// ================================

export type EInvoiceFormat = 'FACTURX' | 'UBL' | 'CII';

export type EInvoiceChannel = 'PPF' | `PDP:${string}`;

export type EInvoiceLifecycleStatus = 
  | 'DRAFT'      // Document created but not submitted
  | 'SUBMITTED'  // Sent to channel (PPF/PDP)
  | 'DELIVERED'  // Delivered to recipient
  | 'ACCEPTED'   // Accepted by recipient
  | 'REJECTED'   // Rejected by recipient  
  | 'PAID';      // Payment confirmed

export type EInvoiceAuditAction =
  | 'created'
  | 'submitted'
  | 'delivered'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'status_change'
  | 'error'
  | 'retry';

export type ParsedStatus = 'pending' | 'parsing' | 'parsed' | 'error' | 'duplicate';

// ================================
// DATABASE ENTITIES
// ================================

export interface EInvDocument {
  id: string;
  invoice_id: string;
  company_id: string;
  format: EInvoiceFormat;
  channel: EInvoiceChannel;
  lifecycle_status: EInvoiceLifecycleStatus;
  lifecycle_reason?: string;
  message_id?: string;
  xml_content?: string;
  xml_url?: string;
  pdf_url?: string;
  sha256_xml?: string;
  sha256_pdf?: string;
  metadata_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EInvAuditLog {
  id: string;
  entity_type: 'document' | 'invoice' | 'submission' | 'reception';
  entity_id: string;
  action: EInvoiceAuditAction;
  actor_id?: string;
  actor_type: 'user' | 'system' | 'webhook';
  company_id: string;
  meta_json: Record<string, any>;
  created_at: string;
}

export interface EInvInboundQueue {
  id: string;
  company_id: string;
  payload_raw: string;
  content_type: string;
  sender_identifier?: string;
  parsed_status: ParsedStatus;
  error_message?: string;
  processed_invoice_id?: string;
  metadata_json: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

// ================================
// EN 16931 COMPLIANT TYPES
// ================================

export type DocumentTypeCode = '380' | '381' | '384' | '389';
// 380: Commercial Invoice
// 381: Credit Note  
// 384: Corrected Invoice
// 389: Self-billed Invoice

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'XOF' | 'XAF' | 'CAD'; // ISO 4217

export type CountryCode = 'FR' | 'BE' | 'BJ' | 'CI' | 'BF' | 'ML' | 'SN' | 'TG' | 'CM' | 'GA'; // ISO 3166-1

export type UnitCode = 
  | 'C62' // Piece
  | 'HUR' // Hour
  | 'DAY' // Day
  | 'KGM' // Kilogram
  | 'LTR' // Litre
  | 'MTR' // Metre
  | 'MTK' // Square metre
  | 'MTQ' // Cubic metre
  | 'XPP'; // Percentage

export interface EN16931Party {
  // BT-27, BT-44: Party name
  name: string;
  
  // BT-29-34, BT-50-55: Postal address
  address?: {
    street_name?: string;
    additional_street_name?: string;
    city_name: string;
    postal_zone?: string;
    country_subentity?: string;
    country_code: CountryCode;
  };
  
  // BT-30, BT-49: Party identifier
  identifier?: string;
  
  // BT-31, BT-48: Party legal registration
  legal_registration?: {
    id: string;
    scheme_id?: string; // e.g., "0002" for SIRET
  };
  
  // BT-32, BT-47: Party VAT identifier
  vat_identifier?: string;
  
  // Contact information
  contact?: {
    name?: string;
    telephone?: string;
    email?: string;
  };
}

export interface EN16931Line {
  // BT-126: Invoice line identifier
  id: string;
  
  // BT-153: Item name
  name: string;
  
  // BT-154: Item description
  description?: string;
  
  // BT-129: Invoiced quantity
  quantity: number;
  
  // BT-130: Unit of measure
  unit_code: UnitCode;
  
  // BT-146: Item net price
  net_price: number;
  
  // BT-147: Item price discount
  price_discount?: number;
  
  // BT-148: Item gross price  
  gross_price?: number;
  
  // BT-131: Invoice line net amount
  net_amount: number;
  
  // Tax information
  tax?: {
    // BT-151: Classified tax category code
    category_code: 'S' | 'Z' | 'E' | 'AE' | 'K' | 'G' | 'O';
    
    // BT-152: Classified tax rate
    rate: number;
    
    // BT-118: Tax amount
    amount?: number;
  };
  
  // BT-158: Item classification identifier
  classification_identifier?: string;
  
  // Allowances and charges
  allowances_charges?: Array<{
    indicator: boolean; // true = charge, false = allowance
    reason?: string;
    amount: number;
    base_amount?: number;
    percentage?: number;
  }>;
}

export interface EN16931Totals {
  // BT-106: Sum of Invoice line net amount
  sum_invoice_line_net_amount: number;
  
  // BT-107: Sum of allowances on document level
  sum_allowances_on_document_level?: number;
  
  // BT-108: Sum of charges on document level  
  sum_charges_on_document_level?: number;
  
  // BT-109: Invoice total amount without VAT
  invoice_total_without_vat: number;
  
  // BT-110: Invoice total VAT amount
  invoice_total_vat_amount?: number;
  
  // BT-112: Invoice total amount with VAT
  invoice_total_with_vat: number;
  
  // BT-113: Paid amount
  paid_amount?: number;
  
  // BT-114: Rounding amount
  rounding_amount?: number;
  
  // BT-115: Amount due for payment
  amount_due_for_payment: number;
}

export interface EN16931PaymentTerms {
  // BT-20: Payment terms
  description?: string;
  
  // BT-9: Payment due date
  due_date?: string; // ISO date
  
  // Payment means
  means?: {
    // BT-81: Payment means code
    code: '30' | '31' | '42' | '48' | '49' | '57' | '58' | '59' | '97';
    
    // BT-83: Remittance information
    remittance_information?: string;
    
    // Bank account
    creditor_account?: {
      // BT-84: Payment account identifier (IBAN)
      iban?: string;
      
      // BT-85: Payment account name
      name?: string;
    };
    
    // Bank details
    creditor_agent?: {
      // BT-86: Payment service provider identifier (BIC)
      bic?: string;
    };
  };
}

export interface EN16931Invoice {
  // Core document information
  // BT-1: Invoice number
  invoice_number: string;
  
  // BT-2: Issue date
  issue_date: string; // ISO date
  
  // BT-3: Invoice type code
  type_code: DocumentTypeCode;
  
  // BT-5: Invoice currency code
  currency_code: CurrencyCode;
  
  // BT-7: Tax point date
  tax_point_date?: string; // ISO date
  
  // BT-8: Value added tax point date
  vat_accounting_date?: string; // ISO date
  
  // Parties
  seller: EN16931Party;
  buyer: EN16931Party;
  
  // Lines and totals
  lines: EN16931Line[];
  totals: EN16931Totals;
  
  // Payment information
  payment_terms?: EN16931PaymentTerms;
  
  // References
  references?: {
    // BT-10: Buyer reference
    buyer_reference?: string;
    
    // BT-11: Project reference
    project_reference?: string;
    
    // BT-12: Contract reference
    contract_reference?: string;
    
    // BT-13: Purchase order reference
    purchase_order_reference?: string;
    
    // BT-14: Sales order reference  
    sales_order_reference?: string;
    
    // BT-25: Preceding invoice reference
    preceding_invoice_reference?: string;
  };
  
  // Additional information
  // BT-22: Notes
  notes?: string[];
  
  // Attachments
  attachments?: Array<{
    // BT-125: Attached document
    filename: string;
    description?: string;
    content?: string; // Base64 encoded
    mime_code?: string;
  }>;
}

// ================================
// SERVICE INTERFACES
// ================================

export interface SubmissionOptions {
  format?: EInvoiceFormat;
  channel?: EInvoiceChannel;
  async?: boolean;
  validate?: boolean;
  archive?: boolean;
}

export interface SubmissionResult {
  success: boolean;
  document_id?: string;
  message_id?: string;
  pdf_url?: string;
  xml_url?: string;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

export interface FormattingResult {
  format: EInvoiceFormat;
  pdf_content?: Buffer;
  xml_content: string;
  pdf_url?: string;
  xml_url?: string;
  sha256_pdf?: string;
  sha256_xml: string;
  metadata?: Record<string, any>;
}

export interface ChannelResponse {
  success: boolean;
  message_id?: string;
  tracking_id?: string;
  errors?: string[];
  raw_response?: any;
}

// ================================
// WEBHOOK PAYLOADS
// ================================

export interface StatusWebhookPayload {
  message_id: string;
  lifecycle_status: EInvoiceLifecycleStatus;
  lifecycle_reason?: string;
  timestamp: string;
  channel: EInvoiceChannel;
  metadata?: Record<string, any>;
  raw?: any;
}

export interface InboundWebhookPayload {
  sender_identifier: string;
  document_type: 'invoice' | 'credit_note';
  content_type: 'application/xml' | 'application/pdf';
  payload: string; // Base64 encoded XML/PDF
  metadata?: Record<string, any>;
}

// ================================
// FEATURE FLAG HELPERS
// ================================

export interface EInvoicingFeatureFlags {
  einvoicing_v1_enabled: boolean;
  formats_enabled: EInvoiceFormat[];
  channels_enabled: EInvoiceChannel[];
  inbound_processing_enabled: boolean;
  archive_enabled: boolean;
}

export interface EInvoicingConfig {
  feature_flags: EInvoicingFeatureFlags;
  ppf: {
    base_url: string;
    client_id: string;
    cert_path?: string;
  };
  archive: {
    bucket: string;
    kms_key?: string;
    retention_years: number;
  };
  formats: {
    facturx: {
      version: string; // e.g., "1.0.7"
      profile: 'BASIC' | 'COMFORT' | 'EXTENDED';
    };
    ubl: {
      version: string; // e.g., "2.1"
    };
    cii: {
      version: string; // e.g., "D16B"
    };
  };
}

// ================================
// ERROR TYPES
// ================================

export class EInvoicingError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EInvoicingError';
  }
}

export class ValidationError extends EInvoicingError {
  constructor(message: string, public field?: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class SubmissionError extends EInvoicingError {
  constructor(message: string, public channel: EInvoiceChannel, context?: Record<string, any>) {
    super(message, 'SUBMISSION_ERROR', context);
    this.name = 'SubmissionError';
  }
}

export class FeatureDisabledError extends EInvoicingError {
  constructor(feature: string) {
    super(`E-invoicing feature '${feature}' is not enabled`, 'FEATURE_DISABLED');
    this.name = 'FeatureDisabledError';
  }
}