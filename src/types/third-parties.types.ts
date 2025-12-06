// Third Parties Types
export interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  region?: string;
}

export interface ContactPerson {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  phone: string;
  mobile?: string;
  is_primary: boolean;
  notes?: string;
}

export interface BankDetails {
  bank_name: string;
  account_number: string;
  iban?: string;
  swift_code?: string;
  account_holder: string;
}

export interface ThirdParty {
  id: string;
  code: string; // Unique identifier code
  type: 'client' | 'supplier' | 'partner' | 'both'; // client+supplier
  category: 'individual' | 'company' | 'government' | 'ngo';
  
  // Basic information
  name: string;
  legal_name?: string;
  display_name?: string;
  
  // Registration details
  siret?: string;
  vat_number?: string;
  registration_number?: string;
  legal_form?: string;
  
  // Contact information
  primary_email: string;
  secondary_email?: string;
  primary_phone: string;
  secondary_phone?: string;
  website?: string;
  
  // Address information
  billing_address: Address;
  shipping_address?: Address;
  
  // Financial information
  currency: string;
  payment_terms: number; // in days
  credit_limit?: number;
  current_balance: number;
  total_receivables: number;
  total_payables: number;
  
  // Banking
  bank_details?: BankDetails;
  
  // Business relationship
  client_since?: string;
  supplier_since?: string;
  status: 'active' | 'inactive' | 'suspended' | 'blocked';
  
  // Contact persons
  contacts: ContactPerson[];
  
  // Additional information
  industry?: string;
  company_size?: 'micro' | 'small' | 'medium' | 'large';
  annual_revenue?: number;
  employee_count?: number;
  
  // Internal notes and tags
  internal_notes?: string;
  tags: string[];
  
  // Metadata
  enterprise_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_interaction?: string;
  
  // Preferences
  preferred_language: 'fr' | 'en' | 'es';
  communication_preference: 'email' | 'phone' | 'mail' | 'all';
  invoice_delivery_method: 'email' | 'mail' | 'portal';
}

export interface Transaction {
  id: string;
  third_party_id: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'debit_note' | 'adjustment';
  direction: 'incoming' | 'outgoing';
  
  // Transaction details
  reference: string;
  description: string;
  amount: number;
  currency: string;
  
  // Dates
  transaction_date: string;
  due_date?: string;
  payment_date?: string;
  
  // Status
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  
  // Additional details
  tax_amount?: number;
  net_amount: number;
  payment_method?: 'cash' | 'check' | 'transfer' | 'card' | 'other';
  
  // Links
  invoice_id?: string;
  payment_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ThirdPartyBalance {
  third_party_id: string;
  third_party_name: string;
  current_balance: number;
  receivables: number;
  payables: number;
  overdue_amount: number;
  overdue_count: number;
  last_transaction_date?: string;
  credit_limit?: number;
  credit_available: number;
  payment_history: {
    on_time_payments: number;
    late_payments: number;
    average_payment_delay: number; // in days
  };
}

export interface AgingReport {
  third_party_id: string;
  third_party_name: string;
  aging_buckets: {
    current: number; // 0-30 days
    bucket_30: number; // 31-60 days  
    bucket_60: number; // 61-90 days
    bucket_90: number; // 91-120 days
    bucket_over_120: number; // >120 days
  };
  total_outstanding: number;
  oldest_invoice_date?: string;
}

export interface ThirdPartyStats {
  total_third_parties: number;
  active_clients: number;
  active_suppliers: number;
  new_this_month: number;
  
  // Financial metrics
  total_receivables: number;
  total_payables: number;
  overdue_receivables: number;
  overdue_payables: number;
  
  // Top performers
  top_clients_by_revenue: {
    id: string;
    name: string;
    revenue: number;
  }[];
  top_suppliers_by_spending: {
    id: string;
    name: string;
    spending: number;
  }[];
}

// Form data types
export interface ThirdPartyFormData {
  type: 'client' | 'supplier' | 'partner' | 'both';
  category: 'individual' | 'company' | 'government' | 'ngo';
  name: string;
  legal_name?: string;
  siret?: string;
  vat_number?: string;
  primary_email: string;
  primary_phone: string;
  website?: string;
  billing_address: Address;
  shipping_address?: Address;
  currency: string;
  payment_terms: number;
  credit_limit?: number;
  bank_details?: BankDetails;
  industry?: string;
  company_size?: 'micro' | 'small' | 'medium' | 'large';
  internal_notes?: string;
  tags: string[];
  preferred_language: 'fr' | 'en' | 'es';
  communication_preference: 'email' | 'phone' | 'mail' | 'all';
  invoice_delivery_method: 'email' | 'mail' | 'portal';
}

export interface ContactPersonFormData {
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  phone: string;
  mobile?: string;
  is_primary: boolean;
  notes?: string;
}

export interface ThirdPartyFilters {
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  balance_status?: 'positive' | 'negative' | 'zero';
  has_overdue?: boolean;
  created_from?: string;
  created_to?: string;
  tags?: string[];
}

// Service response types
export interface ThirdPartyServiceResponse<T> {
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Dashboard data
export interface ThirdPartyDashboardData {
  stats: ThirdPartyStats;
  recent_third_parties: ThirdParty[];
  aging_summary: AgingReport[];
  recent_transactions: Transaction[];
  alerts: {
    overdue_invoices: number;
    credit_limit_exceeded: number;
    missing_information: number;
  };
}

// Export types
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  include_contacts: boolean;
  include_transactions: boolean;
  include_balances: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  filters?: ThirdPartyFilters;
}

// Integration types for Supabase
export interface ThirdPartyCreate {
  code: string;
  type: string;
  category: string;
  name: string;
  legal_name?: string;
  siret?: string;
  vat_number?: string;
  primary_email: string;
  primary_phone: string;
  billing_address: Address;
  currency: string;
  payment_terms: number;
  enterprise_id: string;
  created_by: string;
}

export interface ThirdPartyUpdate {
  name?: string;
  legal_name?: string;
  primary_email?: string;
  primary_phone?: string;
  billing_address?: Address;
  shipping_address?: Address;
  payment_terms?: number;
  credit_limit?: number;
  status?: string;
  internal_notes?: string;
  tags?: string[];
  updated_at: string;
}
