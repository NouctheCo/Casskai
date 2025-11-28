/**
 * Types pour la gestion des employés RH
 */

import { Database } from './supabase';

// Type de base pour un employé
export type Employee = {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  contract_type?: 'cdi' | 'cdd' | 'intern' | 'contractor' | 'temporary';
  employment_status?: 'active' | 'on_leave' | 'terminated' | 'suspended';
  salary?: number;
  salary_currency?: string;
  manager_id?: string;
  social_security_number?: string;
  tax_id?: string;
  bank_account?: string;
  profile_picture_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// Type pour l'insertion d'un nouvel employé
export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

// Type pour la mise à jour d'un employé
export type EmployeeUpdate = Partial<EmployeeInsert>;

// Type pour un employé avec ses informations détaillées
export interface EmployeeWithDetails extends Employee {
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  documents_count?: number;
  reviews_count?: number;
  training_count?: number;
}

// Type pour les statistiques d'employés
export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  on_leave_employees: number;
  terminated_employees: number;
  average_tenure_months: number;
  turnover_rate: number;
}

// Type pour les filtres de recherche d'employés
export interface EmployeeFilters {
  department?: string;
  position?: string;
  employment_status?: Employee['employment_status'];
  contract_type?: Employee['contract_type'];
  manager_id?: string;
  hire_date_from?: string;
  hire_date_to?: string;
  search?: string;
}
