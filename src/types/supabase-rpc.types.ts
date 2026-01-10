/**
 * Supabase RPC Function Types
 *
 * This file declares the types for all RPC (Remote Procedure Call) functions
 * used in the application. These correspond to PostgreSQL functions defined
 * in the database.
 */

export interface DatabaseFunctions {
  // Accounting functions
  initialize_chart_of_accounts: {
    Args: { company_id: string };
    Returns: boolean;
  };

  get_balance_sheet: {
    Args: { company_id: string; period_id?: string; as_of_date?: string };
    Returns: any;
  };

  get_balance_sheet_data: {
    Args: { company_id: string; period_start: string; period_end: string };
    Returns: any;
  };

  get_cash_flow_data: {
    Args: { company_id: string; period_start: string; period_end: string };
    Returns: any;
  };

  get_income_statement_data: {
    Args: { company_id: string; period_start: string; period_end: string };
    Returns: any;
  };

  get_next_journal_entry_number: {
    Args: { company_id: string; journal_code: string };
    Returns: string;
  };

  update_accounts_balance_from_entry: {
    Args: { entry_id: string };
    Returns: void;
  };

  // Workflow functions
  submit_entry_for_review: {
    Args: { entry_id: string; reviewer_id: string };
    Returns: boolean;
  };

  approve_entry: {
    Args: { entry_id: string; approver_id: string; comments?: string };
    Returns: boolean;
  };

  reject_entry: {
    Args: { entry_id: string; approver_id: string; reason: string };
    Returns: boolean;
  };

  post_journal_entry: {
    Args: { entry_id: string };
    Returns: boolean;
  };

  get_entry_workflow_history: {
    Args: { entry_id: string };
    Returns: any[];
  };

  // Company functions
  create_company_with_user: {
    Args: { user_id: string; company_name: string; company_data: any };
    Returns: string;
  };

  // Reports functions
  generate_balance_sheet: {
    Args: { company_id: string; period_id: string; format?: string };
    Returns: any;
  };

  generate_income_statement: {
    Args: { company_id: string; period_id: string; format?: string };
    Returns: any;
  };

  generate_cash_flow_statement: {
    Args: { company_id: string; period_id: string; format?: string };
    Returns: any;
  };

  generate_trial_balance: {
    Args: { company_id: string; period_id: string; format?: string };
    Returns: any;
  };

  // Security functions
  log_security_event: {
    Args: { user_id: string; event_type: string; event_data: any };
    Returns: void;
  };

  search_security_logs: {
    Args: { company_id: string; filters: any };
    Returns: any[];
  };

  get_security_stats: {
    Args: { company_id: string; period: string };
    Returns: any;
  };

  // Subscription/Trial functions
  create_trial_subscription: {
    Args: { user_id: string; company_id: string };
    Returns: any;
  };

  can_create_trial: {
    Args: { user_id: string };
    Returns: boolean;
  };

  get_user_trial_info: {
    Args: { user_id: string };
    Returns: any;
  };

  convert_trial_to_paid: {
    Args: { subscription_id: string; plan_id: string };
    Returns: boolean;
  };

  get_trial_statistics: {
    Args: Record<string, never>;
    Returns: any;
  };

  expire_trials: {
    Args: Record<string, never>;
    Returns: number;
  };

  get_user_trial_engagement: {
    Args: { user_id: string };
    Returns: any;
  };

  track_trial_engagement_event: {
    Args: { user_id: string; event_type: string; event_data?: any };
    Returns: void;
  };

  // Notification functions
  get_user_notifications: {
    Args: Record<string, never>;
    Returns: any[];
  };

  save_user_notifications: {
    Args: { settings: any };
    Returns: boolean;
  };

  // Regulatory functions
  get_next_document_version: {
    Args: { document_type: string; company_id: string };
    Returns: number;
  };

  generate_vat_declaration: {
    Args: { company_id: string; period_start: string; period_end: string };
    Returns: any;
  };

  // FEC Export
  generate_fec_export: {
    Args: { company_id: string; fiscal_year: number };
    Returns: any;
  };

  // Team management
  decrement_seats_used: {
    Args: Record<string, never>;
    Returns: number;
  };

  // Generic SQL execution (admin/setup only)
  execute_sql: {
    Args: { sql: string };
    Returns: void;
  };
}

// Helper type to get RPC function args
export type RpcArgs<T extends keyof DatabaseFunctions> = DatabaseFunctions[T]['Args'];

// Helper type to get RPC function returns
export type RpcReturns<T extends keyof DatabaseFunctions> = DatabaseFunctions[T]['Returns'];
