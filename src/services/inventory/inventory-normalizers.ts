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
 * Helpers that convert raw Supabase rows into domain Inventory models.
 */
import type { InventoryItem, StockMovement, InventoryStatus } from '../inventoryService';
import type { InventoryItemRow, StockMovementRow } from './types/inventory-db.types';

const UNKNOWN_PRODUCT = 'Article inconnu';
const UNKNOWN_WAREHOUSE = 'Entrepôt inconnu';
const DEFAULT_UNIT = 'unit';

const toNumber = (value: number | string | null | undefined, fallback = 0): number => {
  const numeric = Number(value ?? fallback);
  return Number.isNaN(numeric) ? fallback : numeric;
};

const extractWarehouseInfo = (row: InventoryItemRow) => ({
  warehouseId: row.warehouse_id,
  warehouseName: row.warehouses?.name ?? undefined,
  warehouseCode: row.warehouses?.code ?? undefined
});

const extractLocationInfo = (row: InventoryItemRow) => ({
  locationId: row.location_id ?? undefined,
  locationName: row.inventory_locations?.name ?? undefined,
  locationCode: row.inventory_locations?.code ?? undefined
});

const extractVariantInfo = (row: InventoryItemRow) => ({
  variantName: row.product_variants?.variant_name ?? undefined,
  variantSku: row.product_variants?.sku ?? undefined,
  barcode: row.product_variants?.barcode ?? undefined
});

const computeStockSnapshot = (row: InventoryItemRow) => {
  const currentStock = toNumber(row.quantity_on_hand);
  const reservedStock = toNumber(row.reserved_quantity);
  const availableStock = toNumber(row.available_quantity, currentStock - reservedStock);
  const minStock = toNumber(row.minimum_stock ?? row.products?.minimum_stock, 0);

  return {
    currentStock,
    reservedStock,
    availableStock,
    minStock
  };
};

const computeMonetaryValues = (row: InventoryItemRow, currentStock: number) => {
  const purchasePrice = toNumber(row.products?.purchase_price);
  const sellingPrice = toNumber(row.products?.sale_price);
  const unitCost = toNumber(row.unit_cost, purchasePrice);
  const totalValue = toNumber(row.total_value, currentStock * unitCost);

  return {
    purchasePrice,
    sellingPrice,
    unitCost,
    avgCost: unitCost,
    totalValue
  };
};

const deriveStatus = (currentStock: number, minStock: number, isActive: boolean | null | undefined): InventoryStatus => {
  if (!isActive) return 'inactive';
  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= minStock) return 'low_stock';
  return 'active';
};

/**
 * Normalizes a raw Supabase inventory row into the InventoryItem domain model.
 */
export function normalizeInventoryItem(row: InventoryItemRow): InventoryItem {
  const product = row.products ?? null;
  const { currentStock, reservedStock, availableStock, minStock } = computeStockSnapshot(row);
  const monetaryValues = computeMonetaryValues(row, currentStock);
  const status = deriveStatus(currentStock, minStock, product?.is_active ?? true);
  const warehouse = extractWarehouseInfo(row);
  const location = extractLocationInfo(row);
  const variant = extractVariantInfo(row);

  return {
    id: row.id,
    productId: row.product_id,
    productVariantId: row.product_variant_id ?? undefined,
    ...warehouse,
    ...location,
    location: location.locationName ?? undefined,
    reference: product?.code ?? '',
    name: product?.name ?? UNKNOWN_PRODUCT,
    description: product?.description ?? undefined,
    category: product?.category ?? undefined,
    unit: product?.stock_unit ?? DEFAULT_UNIT,
    purchasePrice: monetaryValues.purchasePrice,
    sellingPrice: monetaryValues.sellingPrice,
    unitCost: monetaryValues.unitCost,
    avgCost: monetaryValues.avgCost,
    currentStock,
    reservedStock,
    availableStock,
    minStock,
    maxStock: row.maximum_stock ?? undefined,
    reorderPoint: row.reorder_point ?? undefined,
    reorderQuantity: row.reorder_quantity ?? undefined,
    supplierId: undefined,
    supplierName: undefined,
    supplier: undefined,
    barcode: variant.barcode,
    variantSku: variant.variantSku,
    variantName: variant.variantName,
    status,
    lastMovement: row.last_movement_date ?? undefined,
    lastCountDate: row.last_count_date ?? undefined,
    totalValue: monetaryValues.totalValue,
    company_id: row.company_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

const resolveMovementDirection = (row: StockMovementRow): 'in' | 'out' => row.direction ?? 'in';

const mapMovementPresentationType = (movementType: string, direction: 'in' | 'out'): StockMovement['type'] => {
  if (movementType.startsWith('transfer')) return 'transfer';
  if (movementType.includes('adjustment')) return 'adjustment';
  return direction === 'in' ? 'entry' : 'exit';
};

const extractMovementRelations = (row: StockMovementRow, itemId?: string | null) => ({
  productName: row.products?.name ?? UNKNOWN_PRODUCT,
  productCode: row.products?.code ?? '',
  variantName: row.product_variants?.variant_name ?? undefined,
  warehouseName: row.warehouses?.name ?? UNKNOWN_WAREHOUSE,
  warehouseCode: row.warehouses?.code ?? undefined,
  locationName: row.inventory_locations?.name ?? undefined,
  locationCode: row.inventory_locations?.code ?? undefined,
  itemId: itemId ?? undefined
});

const computeMovementAmounts = (row: StockMovementRow) => {
  const quantity = toNumber(row.quantity);
  const unitCost = toNumber(row.unit_cost);
  const totalValue = toNumber(row.total_cost, quantity * unitCost);
  return { quantity, unitCost, totalValue };
};

/**
 * Normalizes a raw Supabase stock movement row into the StockMovement domain model.
 */
export function normalizeStockMovement(row: StockMovementRow, itemId?: string | null): StockMovement {
  const direction = resolveMovementDirection(row);
  const type = mapMovementPresentationType(row.movement_type, direction);
  const relations = extractMovementRelations(row, itemId);
  const amounts = computeMovementAmounts(row);

  return {
    id: row.id,
    item_id: relations.itemId,
    product_id: row.product_id,
    productVariantId: row.product_variant_id ?? undefined,
    productName: relations.productName,
    variantName: relations.variantName,
    warehouseId: row.warehouse_id,
    warehouseName: relations.warehouseName,
    locationId: row.location_id ?? undefined,
    locationName: relations.locationName,
    type,
    movementType: row.movement_type,
    direction,
    quantity: amounts.quantity,
    unit_price: amounts.unitCost,
    total_value: amounts.totalValue,
    reason: row.notes ?? undefined,
    reference: row.reference_number ?? row.reference_type ?? undefined,
    batchNumber: row.batch_number ?? undefined,
    notes: row.notes ?? undefined,
    user_id: row.created_by ?? undefined,
    company_id: row.company_id,
    created_at: row.created_at ?? row.movement_date,
    movement_date: row.movement_date,
    journal_entry_id: row.journal_entry_id ?? undefined
  };
}
