/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Service Unifié de Gestion des Tiers (Clients & Fournisseurs)
 *
 * Ce service centralise la gestion des tiers en utilisant :
 * - Table `customers` pour les clients
 * - Table `suppliers` pour les fournisseurs
 * - Vue `third_parties_unified` pour lectures unifiées
 *
 * Garantit la cohérence entre tous les modules de l'application.
 */

import { supabase } from '@/lib/supabase';

export type ThirdPartyType = 'customer' | 'supplier';

export interface ThirdPartyBase {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_number?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_country?: string;
  payment_terms?: number; // En jours
  currency?: string;
  discount_rate?: number;
  credit_limit?: number; // Seulement pour customers
  is_active?: boolean;
  notes?: string;
}

export interface Customer extends ThirdPartyBase {
  id?: string;
  company_id: string;
  customer_number?: string;
  credit_limit?: number;
}

export interface Supplier extends ThirdPartyBase {
  id?: string;
  company_id: string;
  supplier_number?: string;
}

export interface UnifiedThirdParty {
  party_type: 'customer' | 'supplier';
  id: string;
  company_id: string;
  party_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  tax_number: string | null;
  primary_address_line1: string | null;
  primary_city: string | null;
  primary_postal_code: string | null;
  primary_country: string | null;
  payment_terms: number | null;
  currency: string | null;
  discount_rate: number | null;
  is_active: boolean;
  notes: string | null;
  total_amount: number;
  transaction_count: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

class UnifiedThirdPartiesService {
  /**
   * Récupère l'ID de la compagnie courante de l'utilisateur
   */
  private async getCurrentCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userCompanies, error } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error || !userCompanies) {
      throw new Error('No active company found');
    }

    return userCompanies.company_id;
  }

  /**
   * Génère automatiquement un numéro unique pour customer/supplier
   */
  private async generateNumber(
    companyId: string,
    type: ThirdPartyType
  ): Promise<string> {
    const table = type === 'customer' ? 'customers' : 'suppliers';
    const numberField = type === 'customer' ? 'customer_number' : 'supplier_number';
    const prefix = type === 'customer' ? 'CL' : 'FO';

    // Récupérer le dernier numéro
    const { data, error } = await supabase
      .from(table)
      .select(numberField)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0][numberField];
      if (lastNumber) {
        const match = lastNumber.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * CUSTOMERS - Créer un nouveau client
   */
  async createCustomer(data: Customer): Promise<{ data: Customer | null; error: any }> {
    try {
      const companyId = data.company_id || await this.getCurrentCompanyId();

      // Générer numéro automatique si non fourni
      const customerNumber = data.customer_number || await this.generateNumber(companyId, 'customer');

      const customerData: Customer = {
        ...data,
        company_id: companyId,
        customer_number: customerNumber,
        currency: data.currency || 'EUR',
        payment_terms: data.payment_terms || 30,
        is_active: data.is_active !== undefined ? data.is_active : true,
        billing_country: data.billing_country || 'FR'
      };

      const { data: created, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;
      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating customer:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * CUSTOMERS - Récupérer tous les clients
   */
  async getCustomers(companyId?: string): Promise<Customer[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * CUSTOMERS - Récupérer un client par ID
   */
  async getCustomerById(id: string): Promise<{ data: Customer | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching customer:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * CUSTOMERS - Mettre à jour un client
   */
  async updateCustomer(
    id: string,
    data: Partial<Customer>
  ): Promise<{ data: Customer | null; error: any }> {
    try {
      const { data: updated, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating customer:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * CUSTOMERS - Supprimer (soft delete) un client
   */
  async deleteCustomer(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting customer:', error instanceof Error ? error.message : String(error));
      return { success: false, error };
    }
  }

  /**
   * SUPPLIERS - Créer un nouveau fournisseur
   */
  async createSupplier(data: Supplier): Promise<{ data: Supplier | null; error: any }> {
    try {
      const companyId = data.company_id || await this.getCurrentCompanyId();

      // Générer numéro automatique si non fourni
      const supplierNumber = data.supplier_number || await this.generateNumber(companyId, 'supplier');

      const supplierData: Supplier = {
        ...data,
        company_id: companyId,
        supplier_number: supplierNumber,
        currency: data.currency || 'EUR',
        payment_terms: data.payment_terms || 30,
        is_active: data.is_active !== undefined ? data.is_active : true,
        billing_country: data.billing_country || 'FR'
      };

      const { data: created, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) throw error;
      return { data: created, error: null };
    } catch (error) {
      console.error('Error creating supplier:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * SUPPLIERS - Récupérer tous les fournisseurs
   */
  async getSuppliers(companyId?: string): Promise<Supplier[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * SUPPLIERS - Récupérer un fournisseur par ID
   */
  async getSupplierById(id: string): Promise<{ data: Supplier | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching supplier:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * SUPPLIERS - Mettre à jour un fournisseur
   */
  async updateSupplier(
    id: string,
    data: Partial<Supplier>
  ): Promise<{ data: Supplier | null; error: any }> {
    try {
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating supplier:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * SUPPLIERS - Supprimer (soft delete) un fournisseur
   */
  async deleteSupplier(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting supplier:', error instanceof Error ? error.message : String(error));
      return { success: false, error };
    }
  }

  /**
   * UNIFIED - Récupérer tous les tiers via la vue unifiée
   */
  async getUnifiedThirdParties(
    companyId?: string,
    type?: ThirdPartyType
  ): Promise<UnifiedThirdParty[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();

      let query = supabase
        .from('third_parties_unified')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true)
        .order('name');

      if (type) {
        query = query.eq('party_type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unified third parties:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * UNIFIED - Recherche intelligente de tiers
   */
  async searchThirdParties(
    searchTerm: string,
    companyId?: string,
    type?: ThirdPartyType
  ): Promise<UnifiedThirdParty[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();

      let query = supabase
        .from('third_parties_unified')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true);

      if (type) {
        query = query.eq('party_type', type);
      }

      // Recherche sur nom, email, company_name, party_number
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,party_number.ilike.%${searchTerm}%`);

      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching third parties:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * STATS - Dashboard KPIs
   */
  async getDashboardStats(companyId?: string): Promise<{
    total_customers: number;
    total_suppliers: number;
    active_customers: number;
    active_suppliers: number;
    total_receivables: number;
    total_payables: number;
    net_balance: number;
  }> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();

      const { data, error } = await supabase
        .from('third_parties_unified')
        .select('party_type, balance')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        total_customers: 0,
        total_suppliers: 0,
        active_customers: 0,
        active_suppliers: 0,
        total_receivables: 0,
        total_payables: 0,
        net_balance: 0
      };

      (data || []).forEach(item => {
        if (item.party_type === 'customer') {
          stats.total_customers++;
          stats.active_customers++;
          stats.total_receivables += item.balance || 0;
        } else {
          stats.total_suppliers++;
          stats.active_suppliers++;
          stats.total_payables += item.balance || 0;
        }
      });

      stats.net_balance = stats.total_receivables - stats.total_payables;

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error instanceof Error ? error.message : String(error));
      return {
        total_customers: 0,
        total_suppliers: 0,
        active_customers: 0,
        active_suppliers: 0,
        total_receivables: 0,
        total_payables: 0,
        net_balance: 0
      };
    }
  }
}

// Export singleton instance
export const unifiedThirdPartiesService = new UnifiedThirdPartiesService();
export default unifiedThirdPartiesService;
