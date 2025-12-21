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

import type { CreateInventoryItemInput } from '@/types/inventory';
import type { InventoryItemRow, StockMovementRow } from './types/inventory-db.types';

type RecordLike = Record<string, unknown>;

const hasKeys = (value: RecordLike, keys: string[]): boolean => keys.every((key) => key in value);

export function isInventoryItemRow(input: unknown): input is InventoryItemRow {
  if (typeof input !== 'object' || input === null) return false;
  const record = input as RecordLike;
  if (!hasKeys(record, ['id', 'product_id', 'warehouse_id'])) return false;
  return true;
}

export function isStockMovementRow(input: unknown): input is StockMovementRow {
  if (typeof input !== 'object' || input === null) return false;
  const record = input as RecordLike;
  if (!hasKeys(record, ['id', 'product_id', 'warehouse_id', 'movement_date'])) return false;
  return true;
}

export function validateCreateInventoryItem(input: CreateInventoryItemInput): void {
  if (!input.productName?.trim()) {
    throw new Error('Product name is required');
  }

  if (input.quantity !== undefined && input.quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  if (input.reorderPoint !== undefined && input.reorderPoint < 0) {
    throw new Error('Reorder point cannot be negative');
  }
}

export function validateProductData(product: {
  name: string;
  code?: string;
  purchase_price?: number;
  selling_price?: number;
}): void {
  if (!product.name?.trim()) {
    throw new Error('Product name is required');
  }

  if (product.purchase_price !== undefined && product.purchase_price < 0) {
    throw new Error('Purchase price cannot be negative');
  }

  if (product.selling_price !== undefined && product.selling_price < 0) {
    throw new Error('Selling price cannot be negative');
  }
}
