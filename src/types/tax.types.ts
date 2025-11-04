// types/tax.types.ts

export interface TaxRate {
  id: string | number;
  name: string;
  rate: number;
  type: 'TVA' | 'IS' | 'IR' | 'OTHER';
  description?: string;
  countryCode: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TaxDeclaration {
  id: string;
  type: 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE';
  name: string;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'completed' | 'submitted' | 'draft';
  amount?: number;
  description?: string;
  companyId: string;
  countryCode: string;
  period?: {
    start: Date;
    end: Date;
  };
  attachments?: string[];
  notes?: string;
  submittedDate?: Date;
  submittedBy?: string;
}

export interface TaxRegime {
  id: string | number;
  name: string;
  description: string;
  countryCode: string;
  conditions: string;
  obligations: string[];
  advantages?: string[];
  disadvantages?: string[];
  revenueThresholds?: {
    services?: number;
    sales?: number;
  };
  taxRates?: {
    corporate?: number;
    vat?: boolean;
  };
}

export interface TaxCalculation {
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  calculatedAt: Date;
}

export interface TaxPayment {
  id: string;
  declarationId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'direct_debit' | 'check' | 'card';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  receiptUrl?: string;
}

export interface TaxDocument {
  id: string;
  type: 'declaration' | 'receipt' | 'certificate' | 'report';
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  declarationId?: string;
}

export interface TaxSettings {
  companyId: string;
  countryCode: string;
  defaultRates: {
    vat?: string;
    corporate?: string;
  };
  reminderDays: number;
  autoCalculate: boolean;
  roundingRule: 'up' | 'down' | 'nearest';
  emailNotifications: boolean;
  fiscalYearStart: number; // Month (1-12)
}

// Extended types for advanced features
export interface TaxCalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'declaration_due' | 'payment_due' | 'filing_deadline' | 'audit_date' | 'meeting' | 'reminder';
  tax_type?: string;
  
  // Timing
  start_date: string;
  end_date?: string;
  all_day: boolean;
  
  // Status and priority
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Associated data
  declaration_id?: string;
  amount?: number;
  
  // Notifications
  reminders: {
    days_before: number;
    notification_sent: boolean;
    notification_date?: string;
  }[];
  
  // Metadata
  enterprise_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaxAlert {
  id: string;
  type: 'deadline_approaching' | 'payment_overdue' | 'declaration_missing' | 'rate_change' | 'new_regulation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Alert content
  title: string;
  message: string;
  action_required?: string;
  
  // Timing
  trigger_date: string;
  due_date?: string;
  auto_resolve_date?: string;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  
  // Associated data
  declaration_id?: string;
  
  enterprise_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaxObligation {
  id: string;
  tax_type_id: string;
  tax_type_name: string;
  enterprise_id: string;
  
  // Timing
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  due_day: number; // day of month when due
  advance_notice_days: number; // how many days before to alert
  
  // Next obligation
  next_due_date: string;
  next_declaration_id?: string;
  
  // Settings
  is_active: boolean;
  auto_generate: boolean; // automatically create declaration
  requires_approval: boolean;
  
  // Notification settings
  email_notifications: boolean;
  notification_emails: string[];
  
  created_at: string;
  updated_at: string;
}

// Form data types
export interface TaxDeclarationFormData {
  type: 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE';
  name: string;
  period_start: string;
  period_end: string;
  taxable_base: number;
  tax_due: number;
  tax_paid: number;
  penalties?: number;
  interest?: number;
  internal_notes?: string;
  submission_notes?: string;
}

export interface TaxObligationFormData {
  tax_type_id: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  due_day: number;
  advance_notice_days: number;
  auto_generate: boolean;
  requires_approval: boolean;
  email_notifications: boolean;
  notification_emails: string[];
}

export interface TaxFilters {
  search?: string;
  type?: string;
  status?: string;
  period_start?: string;
  period_end?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount_from?: number;
  amount_to?: number;
}

// Statistics and dashboard types
export interface TaxStats {
  total_declarations: number;
  pending_declarations: number;
  overdue_declarations: number;
  total_tax_due: number;
  total_tax_paid: number;
  upcoming_deadlines: number;
  active_alerts: number;
  
  // By type breakdown
  by_type: {
    type: string;
    count: number;
    amount_due: number;
    amount_paid: number;
  }[];
}

export interface TaxDashboardData {
  stats: TaxStats;
  upcoming_obligations: TaxCalendarEvent[];
  recent_declarations: TaxDeclaration[];
  active_alerts: TaxAlert[];
  compliance_score: {
    current_score: number;
    max_score: number;
    factors: {
      name: string;
      score: number;
      max_score: number;
      status: 'good' | 'warning' | 'critical';
    }[];
  };
}

// Service response types
export interface TaxServiceResponse<T> {
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}
