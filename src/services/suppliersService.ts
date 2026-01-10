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
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  payment_terms?: string;
  delivery_time?: string;
  min_order?: number;
  discount?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface SupplierWithStats extends Supplier {
  last_order?: string;
  total_orders: number;
  total_amount: number;
}
class SuppliersService {
  async getCurrentCompanyId(): Promise<string> {
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
  async getSuppliers(options?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<SupplierWithStats[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId);
      // Filters
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }
      // Sorting
      query = query.order('name', { ascending: true });
      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }
      const { data, error } = await query;
      if (error) {
        logger.error('Suppliers', 'Error fetching suppliers:', error);
        throw new Error(`Failed to fetch suppliers: ${error.message}`);
      }
      // For each supplier, calculate stats from purchase orders
      const suppliersWithStats = await Promise.all(
        (data || []).map(async (supplier) => {
          // Get purchase orders for this supplier
          const { data: orders } = await supabase
            .from('purchase_orders')
            .select('order_date, total_amount')
            .eq('supplier_id', supplier.id)
            .eq('company_id', companyId);
          const totalOrders = orders?.length || 0;
          const totalAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          const lastOrder = orders && orders.length > 0
            ? orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date
            : undefined;
          return {
            ...supplier,
            total_orders: totalOrders,
            total_amount: totalAmount,
            last_order: lastOrder
          };
        })
      );
      return suppliersWithStats;
    } catch (error) {
      logger.error('Suppliers', 'Error in getSuppliers:', error);
      throw error;
    }
  }
  async getSupplierById(id: string): Promise<SupplierWithStats | null> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch supplier: ${error.message}`);
      }
      // Calculate stats
      const { data: orders } = await supabase
        .from('purchase_orders')
        .select('order_date, total_amount')
        .eq('supplier_id', data.id)
        .eq('company_id', companyId);
      const totalOrders = orders?.length || 0;
      const totalAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const lastOrder = orders && orders.length > 0
        ? orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date
        : undefined;
      return {
        ...data,
        total_orders: totalOrders,
        total_amount: totalAmount,
        last_order: lastOrder
      };
    } catch (error) {
      logger.error('Suppliers', 'Error in getSupplierById:', error);
      throw error;
    }
  }
  async createSupplier(
    supplierData: Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<SupplierWithStats> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          company_id: companyId,
          ...supplierData
        })
        .select()
        .single();
      if (supplierError) {
        throw new Error(`Failed to create supplier: ${supplierError.message}`);
      }
      // Retrieve the complete supplier with stats
      const createdSupplier = await this.getSupplierById(supplier.id);
      if (!createdSupplier) {
        throw new Error('Failed to retrieve created supplier');
      }
      return createdSupplier;
    } catch (error) {
      logger.error('Suppliers', 'Error in createSupplier:', error);
      throw error;
    }
  }
  async updateSupplier(
    id: string,
    updates: Partial<Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
  ): Promise<SupplierWithStats> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { error } = await supabase
        .from('suppliers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        throw new Error(`Failed to update supplier: ${error.message}`);
      }
      const updatedSupplier = await this.getSupplierById(id);
      if (!updatedSupplier) {
        throw new Error('Failed to retrieve updated supplier');
      }
      return updatedSupplier;
    } catch (error) {
      logger.error('Suppliers', 'Error in updateSupplier:', error);
      throw error;
    }
  }
  async deleteSupplier(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        throw new Error(`Failed to delete supplier: ${error.message}`);
      }
    } catch (error) {
      logger.error('Suppliers', 'Error in deleteSupplier:', error);
      throw error;
    }
  }
  async getSupplierCategories(): Promise<string[]> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('suppliers')
        .select('category')
        .eq('company_id', companyId)
        .not('category', 'is', null);
      if (error) {
        logger.error('Suppliers', 'Error fetching supplier categories:', error);
        return [];
      }
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return categories;
    } catch (error) {
      logger.error('Suppliers', 'Error in getSupplierCategories:', error);
      return [];
    }
  }
}
export const suppliersService = new SuppliersService();
export default suppliersService;