export interface OpportunityStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export type OpportunityStatus = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  client_id?: string;
  company_id?: string;
  notes?: string;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  notes?: string;
  status: 'prospect' | 'active' | 'inactive' | 'lost';
  enterprise_id: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  total_revenue?: number;
  last_interaction?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  client_id: string;
  client_name?: string;
  contact_id?: string;
  contact_name?: string;
  stage: OpportunityStatus;
  value: number;
  probability: number;
  expected_close_date: string;
  actual_close_date?: string;
  source?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  enterprise_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  next_action?: string;
  next_action_date?: string;
}

export interface CommercialAction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up' | 'other';
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  contact_id?: string;
  contact_name?: string;
  opportunity_id?: string;
  opportunity_title?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_date?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  outcome?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  duration_minutes?: number;
  company_id?: string;
  enterprise_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmStats {
  total_clients: number;
  active_clients: number;
  prospects: number;
  total_opportunities: number;
  opportunities_value: number;
  won_opportunities: number;
  won_value: number;
  conversion_rate: number;
  pending_actions: number;
  overdue_actions: number;
  monthly_revenue: number;
  revenue_growth: number;
}

export interface PipelineStats {
  stage: string;
  count: number;
  value: number;
  avg_deal_size: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  target?: number;
}

export interface ClientFormData {
  company_name: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  notes?: string;
  status: 'prospect' | 'active' | 'inactive' | 'lost';
}

export interface ContactFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  client_id?: string;
  notes?: string;
  is_primary?: boolean;
}

export interface OpportunityFormData {
  title: string;
  description?: string;
  client_id: string;
  contact_id?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing';
  value: number;
  probability: number;
  expected_close_date: string;
  source?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  next_action?: string;
  next_action_date?: string;
}

export interface CommercialActionFormData {
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up' | 'other';
  title: string;
  description?: string;
  client_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_date?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  outcome?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  duration_minutes?: number;
}

export interface CrmFilters {
  search?: string;
  status?: string;
  industry?: string;
  size?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  stage?: string;
  priority?: string;
  type?: string;
}

// Service response types
export interface CrmServiceResponse<T> {
  success: boolean;
  data: T | null;
  error?: string | {
    message: string;
    code?: string;
  };
}

export interface CrmDashboardData {
  stats: CrmStats;
  pipeline_stats: PipelineStats[];
  revenue_data: RevenueData[];
  recent_opportunities: Opportunity[];
  recent_actions: CommercialAction[];
  top_clients: Client[];
}