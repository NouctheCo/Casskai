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
import type { CreateInventoryItemInput } from '@/types/inventory';
import type { InventoryItemRow, StockMovementRow } from './types/inventory-db.types';

export interface InventoryItemQueryOptions {
  companyId: string;
  warehouseId?: string;
  productVariantId?: string;
  searchTerm?: string;
}

export interface StockMovementQueryOptions {
  companyId: string;
  warehouseId?: string;
  productId?: string;
  productVariantId?: string;
  movementType?: string;
  direction?: 'in' | 'out';
  dateFrom?: string;
  dateTo?: string;
}

const INVENTORY_ITEM_SELECT = `
  *,
  products:product_id (*),
  product_variants:product_variant_id (*),
  warehouses:warehouse_id (*),
  inventory_locations:location_id (*),
  companies:company_id (*)
`;

const STOCK_MOVEMENT_SELECT = `
  *,
  products:product_id (*),
  product_variants:product_variant_id (*),
  warehouses:warehouse_id (*),
  inventory_locations:location_id (*),
  companies:company_id (*)
`;

export async function queryInventoryItems(options: InventoryItemQueryOptions): Promise<InventoryItemRow[]> {
  let query = supabase
    .from('inventory_items')
    .select(INVENTORY_ITEM_SELECT)
    .eq('company_id', options.companyId);

  if (options.warehouseId) {
    query = query.eq('warehouse_id', options.warehouseId);
  }

  if (options.productVariantId) {
    query = query.eq('product_variant_id', options.productVariantId);
  }

  if (options.searchTerm?.trim()) {
    const pattern = `%${options.searchTerm.trim()}%`;
    query = query.or(`reference.ilike.${pattern},products.name.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to query inventory items: ${error.message}`);
  }

  return (data as InventoryItemRow[]) ?? [];
}

export async function queryStockMovements(options: StockMovementQueryOptions): Promise<StockMovementRow[]> {
  let query = supabase
    .from('inventory_movements')
    .select(STOCK_MOVEMENT_SELECT)
    .eq('company_id', options.companyId)
    .order('movement_date', { ascending: false });

  if (options.warehouseId) {
    query = query.eq('warehouse_id', options.warehouseId);
  }

  if (options.productId) {
    query = query.eq('product_id', options.productId);
  }

  if (options.productVariantId) {
    query = query.eq('product_variant_id', options.productVariantId);
  }

  if (options.movementType) {
    query = query.eq('movement_type', options.movementType);
  }

  if (options.direction) {
    query = query.eq('direction', options.direction);
  }

  if (options.dateFrom) {
    query = query.gte('movement_date', options.dateFrom);
  }

  if (options.dateTo) {
    query = query.lte('movement_date', options.dateTo);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to query stock movements: ${error.message}`);
  }

  return (data as StockMovementRow[]) ?? [];
}

const composeCompositeKey = (
  productId: string,
  productVariantId: string | null,
  warehouseId: string,
  locationId: string | null
): string => [productId, productVariantId ?? 'no-variant', warehouseId, locationId ?? 'no-location'].join('::');

export async function buildProductToItemMap(companyId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, product_id, product_variant_id, warehouse_id, location_id')
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to build product map: ${error.message}`);
  }

  const map = new Map<string, string>();
  (data ?? []).forEach((item) => {
    const key = composeCompositeKey(item.product_id, item.product_variant_id, item.warehouse_id, item.location_id);
    map.set(key, item.id);
  });

  return map;
}

export function buildInventoryInsertPayload(
  input: CreateInventoryItemInput,
  context: {
    companyId: string;
    productId: string;
    warehouseId: string;
    locationId?: string | null;
  }
) {
  return {
    company_id: context.companyId,
    product_id: context.productId,
    product_variant_id: input.productVariantId ?? null,
    warehouse_id: context.warehouseId,
    location_id: context.locationId ?? null,
    quantity_on_hand: input.quantity ?? 0,
    reserved_quantity: 0,
    minimum_stock: input.reorderPoint ?? 0,
    maximum_stock: input.maxStock ?? null,
    reorder_point: input.reorderPoint ?? null,
    reorder_quantity: input.reorderQuantity ?? null,
    unit_cost: input.unitCost ?? null,
    last_count_date: new Date().toISOString(),
    last_movement_date: new Date().toISOString()
  };
}

export function buildProductUpsertPayload(input: CreateInventoryItemInput, companyId: string) {
  return {
    company_id: companyId,
    name: input.productName,
    code: input.productCode ?? `PRD-${Date.now()}`,
    description: input.description ?? null,
    category: input.category ?? null,
    purchase_price: input.unitCost ?? null,
    sale_price: input.sellingPrice ?? null,
    minimum_stock: input.reorderPoint ?? 0,
    current_stock: input.quantity ?? 0,
    category_id: input.categoryId ?? null,
    stock_unit: input.unit ?? 'unit',
    is_stockable: true,
    is_active: true
  };
}

export async function resolveWarehouse(companyId: string, warehouseId?: string): Promise<string> {
  if (warehouseId) {
    return warehouseId;
  }

  const { data: existing, error: existingError } = await supabase
    .from('warehouses')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error('Failed to resolve warehouse:', existingError.message);
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('warehouses')
    .insert({
      company_id: companyId,
      name: 'Main Warehouse',
      location: 'Default Location'
    })
    .select('id')
    .single();

  if (createError || !created?.id) {
    throw new Error(`Failed to create warehouse: ${createError?.message ?? 'Unknown error'}`);
  }

  return created.id;
}

export function buildProductUpdates(input: Partial<CreateInventoryItemInput>) {
  const updates: Record<string, unknown> = {};

  if (input.productName) updates.name = input.productName;
  if (input.productCode) updates.code = input.productCode;
  if (input.description !== undefined) updates.description = input.description;
  if (input.category !== undefined) updates.category = input.category;
  if (input.unitCost !== undefined) updates.purchase_price = input.unitCost;
  if (input.sellingPrice !== undefined) updates.sale_price = input.sellingPrice;
  if (input.categoryId !== undefined) updates.category_id = input.categoryId;
  if (input.unit) updates.stock_unit = input.unit;
  if (input.reorderPoint !== undefined) updates.minimum_stock = input.reorderPoint;
  if (input.quantity !== undefined) updates.current_stock = input.quantity;

  return Object.keys(updates).length > 0 ? updates : null;
}

export function buildInventoryUpdates(input: Partial<CreateInventoryItemInput>) {
  const updates: Record<string, unknown> = {};

  if (input.quantity !== undefined) updates.quantity_on_hand = input.quantity;
  if (input.reorderPoint !== undefined) updates.reorder_point = input.reorderPoint;
  if (input.reorderQuantity !== undefined) updates.reorder_quantity = input.reorderQuantity;
  if (input.warehouseId) updates.warehouse_id = input.warehouseId;
  if (input.locationId !== undefined) updates.location_id = input.locationId;
  if (input.unitCost !== undefined) updates.unit_cost = input.unitCost;
  if (input.maxStock !== undefined) updates.maximum_stock = input.maxStock;

  return Object.keys(updates).length > 0 ? updates : null;
}

type StockMovementPayloadInput = {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  locationId?: string | null;
  quantity: number;
  movementType: string;
  direction: 'in' | 'out';
  reference?: string;
  notes?: string;
  unitCost?: number;
  createdBy?: string;
};

export function buildStockMovementPayload(input: StockMovementPayloadInput, companyId: string) {
  return {
    company_id: companyId,
    product_id: input.productId,
    product_variant_id: input.productVariantId ?? null,
    warehouse_id: input.warehouseId,
    location_id: input.locationId ?? null,
    movement_type: input.movementType,
    direction: input.direction,
    quantity: input.quantity,
    reference_number: input.reference ?? null,
    notes: input.notes ?? null,
    unit_cost: input.unitCost ?? null,
    created_by: input.createdBy ?? null,
    movement_date: new Date().toISOString()
  };
}
