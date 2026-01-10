/**
 * Types pour le module PHASE 5: Tax Authority Integrations
 */

export interface TaxAuthorityConfig {
  id: string;
  authority_name: string;
  country_code: string;
  authority_type: 'INCOME_TAX' | 'VAT' | 'PAYROLL' | 'GENERAL';
  api_base_url: string;
  api_protocol: 'REST' | 'SOAP' | 'SFTP' | 'PORTAL' | 'EDI';
  api_version?: string;
  auth_method: 'OAUTH2' | 'CLIENT_CREDENTIALS' | 'API_KEY' | 'CERTIFICATE' | 'BASIC';
  auth_endpoint?: string;
  requires_signature: boolean;
  signature_algorithm?: string;
  certificate_required: boolean;
  supported_formats: string[];
  supported_document_types: string[];
  max_submission_size?: number;
  submission_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUALLY';
  submission_endpoint: string;
  status_check_endpoint?: string;
  acknowledgement_endpoint?: string;
  expects_acknowledgement: boolean;
  acknowledgement_timeout_hours: number;
  is_active: boolean;
  documentation_url?: string;
  support_contact_email?: string;
  support_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxAuthorityCredentials {
  id: string;
  company_id: string;
  authority_id: string;
  tax_identification_number: string;
  registration_reference?: string;
  certificate_expiration?: string;
  api_key_encrypted?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expiration?: string;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at?: string;
  verification_error?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TaxAuthoritySubmission {
  id: string;
  document_id: string;
  authority_id: string;
  credentials_id: string;
  submission_date: string;
  submission_method: 'API' | 'SFTP' | 'WEB_PORTAL' | 'MANUAL';
  submission_reference?: string;
  document_type: string;
  fiscal_year: number;
  fiscal_period: string;
  file_hash?: string;
  file_size_bytes?: number;
  file_format: string;
  submission_status: 'pending' | 'acknowledged' | 'accepted' | 'rejected' | 'needs_correction' | 'processing';
  http_status_code?: number;
  error_code?: string;
  error_message?: string;
  acknowledgement_received_at?: string;
  acknowledgement_reference?: string;
  acknowledgement_data?: Record<string, any>;
  accepted_at?: string;
  final_status?: 'COMPLETED' | 'REJECTED' | 'UNDER_REVIEW' | 'NEEDS_RESUBMISSION';
  final_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TaxAuthorityResponse {
  id: string;
  submission_id: string;
  response_type: 'ACKNOWLEDGEMENT' | 'ACCEPTANCE' | 'REJECTION' | 'REQUEST_FOR_INFO' | 'AMENDMENT_NOTICE' | 'PENALTY_NOTICE';
  response_date?: string;
  authority_reference_number?: string;
  response_message?: string;
  response_data?: Record<string, any>;
  rejection_reason?: string;
  required_corrections?: string[];
  next_steps?: string;
  requires_resubmission: boolean;
  resubmission_deadline?: string;
  amount_due_if_applicable?: number;
  payment_reference?: string;
  payment_methods_available?: string[];
  received_at: string;
  processed_at?: string;
  created_by?: string;
}

export interface TaxAuthorityDeadline {
  id: string;
  company_id: string;
  authority_id: string;
  document_type: string;
  fiscal_year: number;
  fiscal_period?: string;
  submission_deadline: string;
  late_filing_penalty_date?: string;
  grace_period_days: number;
  is_submitted: boolean;
  submission_date?: string;
  is_accepted: boolean;
  acceptance_date?: string;
  notification_sent: boolean;
  notification_sent_date?: string;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
}

export interface TaxAuthorityAmendment {
  id: string;
  original_submission_id: string;
  original_document_id: string;
  authority_id: string;
  amendment_reason: string;
  authority_feedback?: string;
  required_changes?: string[];
  amended_document_id?: string;
  amended_submission_id?: string;
  amendment_status: 'pending' | 'completed' | 'submitted' | 'accepted' | 'rejected';
  deadline_for_amendment?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CommunicationLog {
  id: string;
  submission_id: string;
  authority_id: string;
  request_timestamp: string;
  request_method: string;
  request_endpoint: string;
  request_headers?: Record<string, any>;
  request_body_hash?: string;
  response_timestamp?: string;
  response_status_code?: number;
  response_headers?: Record<string, any>;
  response_body_hash?: string;
  error_occurred: boolean;
  error_type?: 'NETWORK' | 'AUTH' | 'VALIDATION' | 'SERVER' | 'TIMEOUT';
  error_message?: string;
  error_stack_trace?: string;
  request_duration_ms?: number;
  retry_count: number;
  is_retry: boolean;
  created_by?: string;
}

export interface SubmissionRequest {
  document_id: string;
  authority_id: string;
  credentials_id: string;
  submission_method: 'API' | 'SFTP' | 'WEB_PORTAL' | 'MANUAL';
  file_data?: Blob | File;
  file_format: string;
}

export interface SubmissionResponse {
  success: boolean;
  submission_id?: string;
  submission_reference?: string;
  message: string;
  error?: string;
  http_status_code?: number;
  response_data?: Record<string, any>;
}

export interface VerifyCredentialsRequest {
  authority_id: string;
  credentials_id: string;
}

export interface VerifyCredentialsResponse {
  success: boolean;
  is_valid: boolean;
  message: string;
  error?: string;
  token_expiration?: string;
}

export interface ComplianceStatus {
  company_id: string;
  total_deadlines: number;
  submitted: number;
  accepted: number;
  pending: number;
  overdue: number;
  needs_correction: number;
  submission_rate: number;
  acceptance_rate: number;
}

export interface SubmissionStats {
  total_submissions: number;
  successful: number;
  rejected: number;
  pending: number;
  average_processing_time_hours: number;
  success_rate: number;
  last_submission_date?: string;
}
