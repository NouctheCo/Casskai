/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
  is_default: boolean;
  warehouse_type?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}
class WarehousesService {
  /**
   * Get all warehouses for a company
   */
  async getWarehouses(companyId: string): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });
    if (error) {
      logger.error('Warehouses', 'Error fetching warehouses:', error);
      throw error;
    }
    return data || [];
  }
  /**
   * Get default warehouse for a company
   */
  async getDefaultWarehouse(companyId: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();
    if (error) {
      logger.error('Warehouses', 'Error fetching default warehouse:', error);
      return null;
    }
    return data;
  }
  /**
   * Get warehouse by ID
   */
  async getWarehouseById(warehouseId: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', warehouseId)
      .single();
    if (error) {
      logger.error('Warehouses', 'Error fetching warehouse:', error);
      return null;
    }
    return data;
  }
  /**
   * Create a new warehouse
   */
  async createWarehouse(companyId: string, warehouseData: Omit<Warehouse, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        company_id: companyId,
        ...warehouseData
      })
      .select()
      .single();
    if (error) {
      logger.error('Warehouses', 'Error creating warehouse:', error);
      throw error;
    }
    return data;
  }
  /**
   * Update warehouse
   */
  async updateWarehouse(warehouseId: string, updates: Partial<Warehouse>): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', warehouseId)
      .select()
      .single();
    if (error) {
      logger.error('Warehouses', 'Error updating warehouse:', error);
      throw error;
    }
    return data;
  }
  /**
   * Delete warehouse (soft delete by setting is_active to false)
   */
  async deleteWarehouse(warehouseId: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .update({ is_active: false })
      .eq('id', warehouseId);
    if (error) {
      logger.error('Warehouses', 'Error deleting warehouse:', error);
      throw error;
    }
  }
}
export const warehousesService = new WarehousesService();
export default warehousesService;