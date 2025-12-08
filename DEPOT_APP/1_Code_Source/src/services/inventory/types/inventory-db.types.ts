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
 * Raw inventory item row as returned by Supabase (including joins).
 */
export interface InventoryItemRow {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  warehouse_id: string;
  location_id: string | null;
  company_id: string;
  quantity_on_hand: number | null;
  reserved_quantity: number | null;
  available_quantity: number | null;
  minimum_stock: number | null;
  maximum_stock: number | null;
  reorder_point: number | null;
  reorder_quantity: number | null;
  unit_cost: number | null;
  total_value: number | null;
  last_movement_date: string | null;
  last_count_date: string | null;
  created_at: string;
  updated_at: string;

  products: InventoryProductRow | null;
  product_variants: InventoryProductVariantRow | null;
  warehouses: InventoryWarehouseRow | null;
  inventory_locations: InventoryLocationRow | null;
}

export interface InventoryProductRow {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  stock_unit: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  barcode: string | null;
  is_active: boolean | null;
  minimum_stock?: number | null;
}

export interface InventoryProductVariantRow {
  id: string;
  variant_name: string | null;
  sku: string | null;
  barcode: string | null;
}

export interface InventoryWarehouseRow {
  id: string;
  name: string | null;
  code: string | null;
}

export interface InventoryLocationRow {
  id: string;
  name: string | null;
  code: string | null;
}

/**
 * Raw stock movement row as returned by Supabase (including joins).
 */
export interface StockMovementRow {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  warehouse_id: string;
  location_id: string | null;
  company_id: string;
  movement_type: string;
  direction: 'in' | 'out';
  item_name?: string; // For backward compatibility
  quantity: number | null;
  unit_cost: number | null;
  reference_type?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  batch_number?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  total_cost?: number | null;
  movement_date: string;

  products: InventoryProductRow | null;
  product_variants: InventoryProductVariantRow | null;
  warehouses: InventoryWarehouseRow | null;
  inventory_locations: InventoryLocationRow | null;
}
