/**
 * Helpers that compute aggregated inventory metrics from normalized items.
 */
import type { InventoryItem, InventoryMetrics, InventoryStatus, StockMovement } from '../inventoryService';

type MovementKind = 'entry' | 'exit' | 'in' | 'out' | 'transfer' | 'adjustment';

type StockQuantities = {
  total: number;
  reserved: number;
  available: number;
};

type StatusCounts = Record<InventoryStatus, number>;

type MetricsContext = {
  totalMovements?: number;
  totalMovementsOut?: number;
  pendingOrders?: number;
  activeSuppliers?: number;
  totalWarehouses?: number;
};

const EMPTY_STATUS_COUNTS: StatusCounts = {
  active: 0,
  inactive: 0,
  low_stock: 0,
  out_of_stock: 0
};

const toNumber = (value?: number | null): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const aggregateStockQuantities = (items: InventoryItem[]): StockQuantities =>
  items.reduce<StockQuantities>(
    (acc, item) => ({
      total: acc.total + toNumber(item.currentStock),
      reserved: acc.reserved + toNumber(item.reservedStock),
      available: acc.available + toNumber(item.availableStock)
    }),
    { total: 0, reserved: 0, available: 0 }
  );

const calculateTotalStockValue = (items: InventoryItem[]): number =>
  items.reduce((sum, item) => sum + toNumber(item.totalValue), 0);

const countProductsByStatus = (items: InventoryItem[]): StatusCounts =>
  items.reduce<StatusCounts>((acc, item) => {
    const status: InventoryStatus = item.status ?? 'active';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, { ...EMPTY_STATUS_COUNTS });

const findProductsNeedingReorder = (items: InventoryItem[]): InventoryItem[] =>
  items.filter((item) => {
    const reorderPoint = toNumber(item.reorderPoint);
    if (reorderPoint <= 0) return false;
    return toNumber(item.availableStock) <= reorderPoint;
  });

const calculateTurnoverRate = (totalMovementsOut: number, averageStock: number): number => {
  if (!averageStock) return 0;
  return Number((totalMovementsOut / averageStock).toFixed(2));
};

/**
 * Builds a zeroed metrics object, optionally overriding specific values.
 */
export function buildEmptyMetrics(overrides: Partial<InventoryMetrics> = {}): InventoryMetrics {
  return {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalMovements: overrides.totalMovements ?? 0,
    pendingOrders: overrides.pendingOrders ?? 0,
    activeSuppliers: overrides.activeSuppliers ?? 0,
    avgStockRotation: overrides.avgStockRotation ?? 0,
    reservedStock: overrides.reservedStock ?? 0,
    availableStock: overrides.availableStock ?? 0,
    totalWarehouses: overrides.totalWarehouses ?? 0
  } satisfies InventoryMetrics;
}

/**
 * Computes inventory metrics from normalized items and contextual data.
 */
export function calculateInventoryMetrics(
  items: InventoryItem[],
  context: MetricsContext = {}
): InventoryMetrics {
  if (!items.length) {
    return buildEmptyMetrics({
      totalMovements: context.totalMovements ?? 0,
      pendingOrders: context.pendingOrders ?? 0,
      activeSuppliers: context.activeSuppliers ?? 0,
      totalWarehouses: context.totalWarehouses ?? 0
    });
  }

  const quantities = aggregateStockQuantities(items);
  const totalValue = calculateTotalStockValue(items);
  const statuses = countProductsByStatus(items);
  const turnoverRate = calculateTurnoverRate(context.totalMovementsOut ?? 0, quantities.total);

  return {
    totalItems: items.length,
    totalValue,
    lowStockItems: statuses.low_stock,
    outOfStockItems: statuses.out_of_stock,
    totalMovements: context.totalMovements ?? 0,
    pendingOrders: context.pendingOrders ?? 0,
    activeSuppliers: context.activeSuppliers ?? 0,
    avgStockRotation: turnoverRate,
    reservedStock: quantities.reserved,
    availableStock: quantities.available,
    totalWarehouses: context.totalWarehouses ?? 0
  } satisfies InventoryMetrics;
}

/**
 * Calculates the average stock value from daily snapshots.
 */
export function calculateAverageStock(dailySnapshots: number[]): number {
  if (!dailySnapshots.length) {
    return 0;
  }

  const sum = dailySnapshots.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / dailySnapshots.length);
}

const composeMovementKey = (movement: StockMovement): string =>
  [
    movement.product_id,
    movement.productVariantId ?? 'no-variant',
    movement.warehouseId,
    movement.locationId ?? 'no-location'
  ].join('::');

const toTimestamp = (value: string): number => new Date(value).getTime();

export function filterMovementsByType(
  movements: StockMovement[],
  type?: StockMovement['type']
): StockMovement[] {
  if (!type) return movements;
  return movements.filter((movement) => movement.type === type);
}

export function filterMovementsByItemId(
  movements: StockMovement[],
  itemId?: string
): StockMovement[] {
  if (!itemId) return movements;
  return movements.filter((movement) => movement.item_id === itemId);
}

export function filterMovementsByDateRange(
  movements: StockMovement[],
  dateFrom?: string,
  dateTo?: string
): StockMovement[] {
  let filtered = movements;

  if (dateFrom) {
    const fromTime = Date.parse(dateFrom);
    if (!Number.isNaN(fromTime)) {
      filtered = filtered.filter((movement) => toTimestamp(movement.movement_date) >= fromTime);
    }
  }

  if (dateTo) {
    const toTime = Date.parse(dateTo);
    if (!Number.isNaN(toTime)) {
      filtered = filtered.filter((movement) => toTimestamp(movement.movement_date) <= toTime);
    }
  }

  return filtered;
}

export function attachInventoryIds(
  movements: StockMovement[],
  productToItemMap: Map<string, string>
): StockMovement[] {
  if (!productToItemMap.size) {
    return movements;
  }

  return movements.map((movement) => {
    if (movement.item_id) {
      return movement;
    }

    const key = composeMovementKey(movement);
    const resolvedItemId = productToItemMap.get(key);
    if (!resolvedItemId) {
      return movement;
    }

    return {
      ...movement,
      item_id: resolvedItemId
    };
  });
}

export function resolveMovementDirection(type: MovementKind, quantity?: number): 'in' | 'out' {
  if (type === 'in' || type === 'entry') {
    return 'in';
  }

  if (type === 'out' || type === 'exit') {
    return 'out';
  }

  if (type === 'transfer') {
    return quantity !== undefined && quantity < 0 ? 'out' : 'in';
  }

  return type === 'adjustment' && quantity !== undefined && quantity < 0 ? 'out' : 'in';
}

export function calculateStockAdjustment(
  currentQuantity: number,
  movementQuantity: number,
  direction: 'in' | 'out'
): number {
  const nextQuantity = direction === 'in'
    ? currentQuantity + movementQuantity
    : currentQuantity - movementQuantity;

  if (nextQuantity < 0) {
    throw new Error('Insufficient stock for this movement');
  }

  return nextQuantity;
}

// Exported only for testing potential future use.
export const __internal = {
  aggregateStockQuantities,
  calculateTotalStockValue,
  countProductsByStatus,
  findProductsNeedingReorder,
  calculateTurnoverRate,
  filterMovementsByType,
  filterMovementsByItemId,
  filterMovementsByDateRange,
  attachInventoryIds,
  resolveMovementDirection,
  calculateStockAdjustment
};
