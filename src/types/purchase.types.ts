export interface Purchase {
  id: string;
  invoice_number: string;
  purchase_date: string;
  supplier_id: string;
  supplier_name: string;
  description: string;
  amount_ht: number;
  tva_amount: number;
  amount_ttc: number;
  tva_rate: number;
  payment_status: 'paid' | 'pending' | 'overdue';
  payment_date?: string;
  due_date: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  company_id: string;
}

export interface PurchaseFormData {
  invoice_number: string;
  purchase_date: string;
  supplier_id: string;
  description: string;
  amount_ht: number;
  tva_rate: number;
  due_date: string;
  attachments?: File[];
}

export interface PurchaseFilters {
  supplier_id?: string;
  payment_status?: 'all' | 'paid' | 'pending' | 'overdue';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PurchaseStats {
  total_purchases: number;
  total_amount: number;
  pending_payments: number;
  overdue_payments: number;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_id: string;
}