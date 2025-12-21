export interface CreateInventoryItemInput {
  companyId?: string;
  productId?: string;
  productVariantId?: string | null;
  warehouseId?: string;
  locationId?: string | null;
  productName: string;
  productCode?: string;
  description?: string;
  quantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  unit?: string;
  unitCost?: number;
  sellingPrice?: number;
  categoryId?: string;
  category?: string;
  maxStock?: number | null;
  supplierId?: string;
}

export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput>;

export type StockMovementCreationInput = {
  itemId?: string;
  productId?: string;
  productVariantId?: string | null;
  warehouseId?: string;
  locationId?: string | null;
  quantity: number;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  reference?: string;
  notes?: string;
  unitCost?: number;
  companyId?: string;
  userId?: string;
};

export type ComputedMetrics = {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeItems: number;
  averageRotation: number;
  totalMovements: number;
  profitMargin: number;
  monthlyTurnover: number;
};
