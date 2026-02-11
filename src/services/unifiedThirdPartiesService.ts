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
 * Ce service centralise la gestion des tiers en utilisant la table unifiée `third_parties`.
 * Les anciennes tables `customers` et `suppliers` sont maintenant des vues de compatibilité.
 *
 * Architecture (après migration Phase 2) :
 * - Table `third_parties` : source unique de vérité
 * - Vue `customers` : compatibilité pour le code existant (INSTEAD OF triggers)
 * - Vue `suppliers` : compatibilité pour le code existant (INSTEAD OF triggers)
 * - Vue `unified_third_parties_view` : lecture unifiée avec statistiques
 *
 * Garantit la cohérence entre tous les modules de l'application.
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { ensureAuxiliaryAccount } from '@/services/auxiliaryAccountService';

export type ThirdPartyType = 'customer' | 'supplier' | 'both' | 'other';
export type ClientType = 'customer' | 'prospect' | 'supplier' | 'partner';

/**
 * Interface de base pour les tiers
 */
export interface ThirdPartyBase {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  legal_name?: string;

  // Identifiants légaux
  siret?: string;
  vat_number?: string;
  tax_number?: string;
  registration_number?: string;

  // Adresse de facturation
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_country?: string;

  // Adresse de livraison
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  shipping_country?: string;

  // Conditions commerciales
  payment_terms?: number;
  currency?: string;
  discount_rate?: number;
  credit_limit?: number;

  // Statut
  is_active?: boolean;

  // Notes
  notes?: string;
  internal_notes?: string;
  tags?: string[];

  // Site web
  website?: string;
}

/**
 * Interface pour la table third_parties (source unique)
 */
export interface ThirdParty extends ThirdPartyBase {
  id?: string;
  company_id: string;
  type: ThirdPartyType;
  client_type?: ClientType;
  code?: string;
  customer_number?: string;
  supplier_number?: string;
  customer_type?: 'individual' | 'business';
  supplier_type?: 'company' | 'individual';
  current_balance?: number;
  account_balance?: number;
  customer_account_id?: string;
  supplier_account_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface Customer (compatibilité avec code existant)
 */
export interface Customer extends ThirdPartyBase {
  id?: string;
  company_id: string;
  customer_number?: string;
  customer_type?: 'individual' | 'business';
  credit_limit?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface Supplier (compatibilité avec code existant)
 */
export interface Supplier extends ThirdPartyBase {
  id?: string;
  company_id: string;
  supplier_number?: string;
  supplier_type?: 'company' | 'individual';
  account_balance?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface pour la vue unifiée avec statistiques
 */
export interface UnifiedThirdParty {
  type: ThirdPartyType;
  client_type?: ClientType;
  id: string;
  company_id: string;
  code?: string;
  party_number?: string;
  customer_number?: string;
  supplier_number?: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  company_name: string | null;
  legal_name?: string | null;
  tax_number: string | null;
  siret?: string | null;
  vat_number?: string | null;

  // Adresses
  billing_address_line1?: string | null;
  billing_city?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;

  // Conditions
  payment_terms: number | null;
  currency: string | null;
  discount_rate: number | null;
  credit_limit?: number | null;

  // Statut
  is_active: boolean;

  // Notes
  notes: string | null;
  internal_notes?: string | null;
  tags?: string[] | null;

  // Statistiques
  total_amount?: number;
  transaction_count?: number;
  balance?: number;
  current_balance?: number;
  account_balance?: number;

  // Timestamps
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
   * Génère automatiquement un code unique pour un tiers
   */
  private async generateCode(
    companyId: string,
    type: ThirdPartyType
  ): Promise<string> {
    const prefix = type === 'customer' ? 'CL' : type === 'supplier' ? 'FO' : 'TP';
    const numberField = type === 'customer' ? 'customer_number' : 'supplier_number';

    // Récupérer le dernier numéro depuis third_parties directement
    const { data, error } = await supabase
      .from('third_parties')
      .select(numberField)
      .eq('company_id', companyId)
      .eq('type', type)
      .not(numberField, 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const record = data[0] as Record<string, string | null>;
      const lastNumber = record[numberField];
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
   * @deprecated Utiliser generateCode à la place
   * Maintenu pour compatibilité avec le code existant
   */
  private async generateNumber(
    companyId: string,
    type: 'customer' | 'supplier'
  ): Promise<string> {
    return this.generateCode(companyId, type);
  }

  // ============================================================================
  // THIRD_PARTIES - Méthodes directes pour la table unifiée
  // ============================================================================

  /**
   * Créer un tiers directement dans third_parties
   */
  async createThirdParty(data: Partial<ThirdParty>): Promise<{ data: ThirdParty | null; error: any }> {
    try {
      const companyId = data.company_id || await this.getCurrentCompanyId();
      const type = data.type || 'customer';

      // Générer code et numéro automatiques si non fournis
      const code = data.code || await this.generateCode(companyId, type);
      const customerNumber = type === 'customer' && !data.customer_number
        ? code
        : data.customer_number;
      const supplierNumber = type === 'supplier' && !data.supplier_number
        ? code
        : data.supplier_number;

      const thirdPartyData = {
        ...data,
        company_id: companyId,
        type,
        client_type: data.client_type || (type === 'customer' ? 'customer' : 'supplier'),
        code,
        customer_number: customerNumber,
        supplier_number: supplierNumber,
        currency: data.currency || getCurrentCompanyCurrency(),
        payment_terms: data.payment_terms || 30,
        is_active: data.is_active !== undefined ? data.is_active : true,
        billing_country: data.billing_country || 'FR',
      };

      const { data: created, error } = await supabase
        .from('third_parties')
        .insert(thirdPartyData)
        .select()
        .single();

      if (error) throw error;

      // ✅ Créer automatiquement le compte auxiliaire (411xxxx / 401xxxx)
      if (created) {
        ensureAuxiliaryAccount(
          companyId,
          created.id,
          created.type || type,
          created.name
        ).catch(err => logger.warn('UnifiedThirdParties', 'Erreur création compte auxiliaire (non bloquant):', err));
      }

      return { data: created, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error creating third party:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Récupérer tous les tiers depuis third_parties
   */
  async getThirdParties(
    companyId?: string,
    options?: {
      type?: ThirdPartyType;
      clientType?: ClientType;
      activeOnly?: boolean;
    }
  ): Promise<ThirdParty[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('third_parties')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('name');

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.clientType) {
        query = query.eq('client_type', options.clientType);
      }
      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error fetching third parties:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Récupérer un tiers par ID depuis third_parties
   */
  async getThirdPartyById(id: string): Promise<{ data: ThirdParty | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error fetching third party:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Mettre à jour un tiers dans third_parties
   */
  async updateThirdParty(
    id: string,
    data: Partial<ThirdParty>
  ): Promise<{ data: ThirdParty | null; error: any }> {
    try {
      const { data: updated, error } = await supabase
        .from('third_parties')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error updating third party:', error instanceof Error ? error.message : String(error));
      return { data: null, error };
    }
  }

  /**
   * Supprimer (soft delete) un tiers
   */
  async deleteThirdParty(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('third_parties')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error deleting third party:', error instanceof Error ? error.message : String(error));
      return { success: false, error };
    }
  }

  // ============================================================================
  // CUSTOMERS - Méthodes via vue de compatibilité
  // ============================================================================
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
        currency: data.currency || getCurrentCompanyCurrency(),
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

      // ✅ Créer automatiquement le compte auxiliaire client (411xxxx)
      if (created) {
        const companyIdForAccount = data.company_id || companyId;
        ensureAuxiliaryAccount(
          companyIdForAccount,
          created.id,
          'customer',
          created.name
        ).catch(err => logger.warn('UnifiedThirdParties', 'Erreur création compte auxiliaire client (non bloquant):', err));
      }

      return { data: created, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error creating customer:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error fetching customers:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error fetching customer:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error updating customer:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error deleting customer:', error instanceof Error ? error.message : String(error));
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
        currency: data.currency || getCurrentCompanyCurrency(),
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

      // ✅ Créer automatiquement le compte auxiliaire fournisseur (401xxxx)
      if (created) {
        const companyIdForAccount = data.company_id || companyId;
        ensureAuxiliaryAccount(
          companyIdForAccount,
          created.id,
          'supplier',
          created.name
        ).catch(err => logger.warn('UnifiedThirdParties', 'Erreur création compte auxiliaire fournisseur (non bloquant):', err));
      }

      return { data: created, error: null };
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error creating supplier:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error fetching suppliers:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error fetching supplier:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error updating supplier:', error instanceof Error ? error.message : String(error));
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
      logger.error('UnifiedThirdParties', 'Error deleting supplier:', error instanceof Error ? error.message : String(error));
      return { success: false, error };
    }
  }
  // ============================================================================
  // UNIFIED - Méthodes de lecture unifiée
  // ============================================================================

  /**
   * Récupérer tous les tiers via la vue unifiée (avec statistiques)
   */
  async getUnifiedThirdParties(
    companyId?: string,
    type?: ThirdPartyType
  ): Promise<UnifiedThirdParty[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('third_parties')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true)
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error fetching unified third parties:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Récupérer les tiers pour une liste déroulante (optimisé)
   */
  async getThirdPartiesForSelect(
    companyId?: string,
    options?: {
      type?: ThirdPartyType;
      clientType?: ClientType;
    }
  ): Promise<Array<{ id: string; name: string; code: string; type: ThirdPartyType }>> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('third_parties')
        .select('id, name, code, type, customer_number, supplier_number')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true)
        .order('name');

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.clientType) {
        query = query.eq('client_type', options.clientType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        code: item.code || item.customer_number || item.supplier_number || '',
        type: item.type as ThirdPartyType,
      }));
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error fetching third parties for select:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Recherche intelligente de tiers
   */
  async searchThirdParties(
    searchTerm: string,
    companyId?: string,
    type?: ThirdPartyType
  ): Promise<UnifiedThirdParty[]> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('third_parties')
        .select('*')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true);

      if (type) {
        query = query.eq('type', type);
      }

      // Recherche sur nom, email, company_name, code, customer_number, supplier_number
      query = query.or(
        `name.ilike.%${searchTerm}%,` +
        `email.ilike.%${searchTerm}%,` +
        `company_name.ilike.%${searchTerm}%,` +
        `code.ilike.%${searchTerm}%,` +
        `customer_number.ilike.%${searchTerm}%,` +
        `supplier_number.ilike.%${searchTerm}%`
      );
      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error searching third parties:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // ============================================================================
  // STATS - Dashboard et KPIs
  // ============================================================================

  /**
   * Dashboard KPIs
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
        .from('third_parties')
        .select('type, current_balance, account_balance')
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
        const balance = item.current_balance || item.account_balance || 0;
        if (item.type === 'customer') {
          stats.total_customers++;
          stats.active_customers++;
          stats.total_receivables += balance;
        } else if (item.type === 'supplier') {
          stats.total_suppliers++;
          stats.active_suppliers++;
          stats.total_payables += balance;
        }
      });

      stats.net_balance = stats.total_receivables - stats.total_payables;
      return stats;
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error fetching dashboard stats:', error instanceof Error ? error.message : String(error));
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

  /**
   * Compter les tiers par type
   */
  async countByType(companyId?: string): Promise<Record<ThirdPartyType, number>> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('third_parties')
        .select('type')
        .eq('company_id', activeCompanyId)
        .eq('is_active', true);

      if (error) throw error;

      const counts: Record<ThirdPartyType, number> = {
        customer: 0,
        supplier: 0,
        both: 0,
        other: 0
      };

      (data || []).forEach(item => {
        const type = item.type as ThirdPartyType;
        if (type in counts) {
          counts[type]++;
        }
      });

      return counts;
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error counting third parties by type:', error instanceof Error ? error.message : String(error));
      return { customer: 0, supplier: 0, both: 0, other: 0 };
    }
  }

  // ============================================================================
  // HELPERS - Méthodes utilitaires
  // ============================================================================

  /**
   * Vérifier si un code existe déjà
   */
  async codeExists(code: string, companyId?: string, excludeId?: string): Promise<boolean> {
    try {
      const activeCompanyId = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('third_parties')
        .select('id')
        .eq('company_id', activeCompanyId)
        .eq('code', code);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);
      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error('UnifiedThirdParties', 'Error checking code existence:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Convertir un Customer en ThirdParty
   */
  customerToThirdParty(customer: Customer, companyId: string): Partial<ThirdParty> {
    return {
      ...customer,
      company_id: companyId,
      type: 'customer',
      client_type: 'customer',
      code: customer.customer_number,
    };
  }

  /**
   * Convertir un Supplier en ThirdParty
   */
  supplierToThirdParty(supplier: Supplier, companyId: string): Partial<ThirdParty> {
    return {
      ...supplier,
      company_id: companyId,
      type: 'supplier',
      client_type: 'supplier',
      code: supplier.supplier_number,
    };
  }
}
// Export singleton instance
export const unifiedThirdPartiesService = new UnifiedThirdPartiesService();
export default unifiedThirdPartiesService;