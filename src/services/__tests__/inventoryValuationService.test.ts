/**
 * Tests unitaires - Inventory Valuation Service
 * P2-2: Méthodes de valorisation des stocks (CMP, FIFO, LIFO)
 */

import { describe, it, expect, vi } from 'vitest';
import { InventoryValuationService } from '../inventoryValuationService';
import type { StockState, StockMovement, StockBatch } from '../inventoryValuationService';

// Mock logger to avoid console noise in tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

/**
 * Helper to create a valid StockState with defaults
 */
function makeStockState(overrides: Partial<StockState> & { current_quantity: number; current_value: number; unit_cost: number; batches: StockBatch[] }): StockState {
  return {
    product_id: 'prod-1',
    warehouse_id: 'wh-1',
    current_quantity: overrides.current_quantity,
    current_value: overrides.current_value,
    unit_cost: overrides.unit_cost,
    batches: overrides.batches,
    last_updated: overrides.last_updated ?? new Date().toISOString(),
  };
}

/**
 * Helper to create a valid StockMovement with defaults
 */
function makeMovement(overrides: Partial<StockMovement> & { quantity: number; unit_price: number; type: StockMovement['type'] }): StockMovement {
  return {
    id: overrides.id ?? 'mov-1',
    movement_date: overrides.movement_date ?? '2024-01-01',
    type: overrides.type,
    quantity: overrides.quantity,
    unit_price: overrides.unit_price,
    total_value: overrides.total_value ?? overrides.quantity * overrides.unit_price,
    product_id: overrides.product_id ?? 'prod-1',
    warehouse_id: overrides.warehouse_id ?? 'wh-1',
    company_id: overrides.company_id ?? 'company-1',
  };
}

describe('InventoryValuationService', () => {
  describe('calculateWeightedAverage (CMP)', () => {
    it('should calculate weighted average correctly for first entry movement', async () => {
      const stockState = makeStockState({
        current_quantity: 0,
        current_value: 0,
        unit_cost: 0,
        batches: [],
      });

      const movement = makeMovement({
        type: 'entry',
        quantity: 100,
        unit_price: 10,
      });

      const result = await InventoryValuationService.calculateWeightedAverage(stockState, movement);

      expect(result.unit_cost).toBe(10);
      expect(result.quantity).toBe(100);
      expect(result.total_value).toBe(1000);
      expect(result.method).toBe('CMP');
      expect(result.details?.weighted_average).toBe(10);
    });

    it('should calculate weighted average correctly for subsequent entry movement', async () => {
      const stockState = makeStockState({
        current_quantity: 100,
        current_value: 1000,
        unit_cost: 10,
        batches: [],
      });

      const movement = makeMovement({
        type: 'entry',
        quantity: 50,
        unit_price: 12,
      });

      const result = await InventoryValuationService.calculateWeightedAverage(stockState, movement);

      // Expected new CMP: (1000 + 600) / (100 + 50) = 1600 / 150 = 10.6667
      expect(result.unit_cost).toBeCloseTo(10.67, 2);
      expect(result.quantity).toBe(50);
      expect(result.total_value).toBe(600);
      expect(result.method).toBe('CMP');
      expect(result.details?.weighted_average).toBeCloseTo(10.67, 2);
    });

    it('should handle exit movement (sale) at current CMP', async () => {
      const stockState = makeStockState({
        current_quantity: 100,
        current_value: 1000,
        unit_cost: 10,
        batches: [],
      });

      const movement = makeMovement({
        type: 'exit',
        quantity: 30,
        unit_price: 10,
      });

      const result = await InventoryValuationService.calculateWeightedAverage(stockState, movement);

      // Exit valued at current CMP = 10
      expect(result.unit_cost).toBe(10);
      expect(result.quantity).toBe(30);
      expect(result.total_value).toBe(300);
      expect(result.method).toBe('CMP');
      expect(result.details?.weighted_average).toBe(10);
    });
  });

  describe('calculateFIFO', () => {
    it('should consume oldest batches first', async () => {
      const stockState = makeStockState({
        current_quantity: 150,
        current_value: 1600,
        unit_cost: 1600 / 150,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 },
        ],
      });

      const exitQuantity = 120;

      const result = await InventoryValuationService.calculateFIFO(stockState, exitQuantity);

      // Should consume: 100 from first batch @ 10 + 20 from second batch @ 12
      // Cost: (100 * 10) + (20 * 12) = 1000 + 240 = 1240
      expect(result.total_value).toBe(1240);
      expect(result.quantity).toBe(120);
      expect(result.unit_cost).toBeCloseTo(1240 / 120, 2);
      expect(result.method).toBe('FIFO');
      expect(result.details?.batches_consumed).toHaveLength(2);
      // First consumed batch: 100 units from oldest lot
      expect(result.details!.batches_consumed![0].quantity).toBe(100);
      // Second consumed batch: 20 units from next lot
      expect(result.details!.batches_consumed![1].quantity).toBe(20);
    });

    it('should handle partial batch consumption', async () => {
      const stockState = makeStockState({
        current_quantity: 100,
        current_value: 1000,
        unit_cost: 10,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
        ],
      });

      const exitQuantity = 30;

      const result = await InventoryValuationService.calculateFIFO(stockState, exitQuantity);

      expect(result.total_value).toBe(300);
      expect(result.quantity).toBe(30);
      expect(result.unit_cost).toBe(10);
      expect(result.method).toBe('FIFO');
      expect(result.details?.batches_consumed).toHaveLength(1);
      expect(result.details!.batches_consumed![0].quantity).toBe(30);
      // Remaining should be 70
      expect(result.details!.batches_consumed![0].remaining_quantity).toBe(70);
    });

    it('should throw error if insufficient stock', async () => {
      const stockState = makeStockState({
        current_quantity: 50,
        current_value: 500,
        unit_cost: 10,
        batches: [
          { date: '2024-01-01', quantity: 50, unit_price: 10, remaining_quantity: 50 },
        ],
      });

      const exitQuantity = 100;

      await expect(
        InventoryValuationService.calculateFIFO(stockState, exitQuantity)
      ).rejects.toThrow('Stock insuffisant pour cette sortie');
    });
  });

  describe('calculateLIFO', () => {
    it('should consume newest batches first', async () => {
      const stockState = makeStockState({
        current_quantity: 150,
        current_value: 1600,
        unit_cost: 1600 / 150,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 },
        ],
      });

      const exitQuantity = 80;

      const result = await InventoryValuationService.calculateLIFO(stockState, exitQuantity);

      // Should consume: 50 from second batch @ 12 + 30 from first batch @ 10
      // Cost: (50 * 12) + (30 * 10) = 600 + 300 = 900
      expect(result.total_value).toBe(900);
      expect(result.quantity).toBe(80);
      expect(result.unit_cost).toBeCloseTo(900 / 80, 2);
      expect(result.method).toBe('LIFO');
      expect(result.details?.batches_consumed).toHaveLength(2);
      // First consumed batch: 50 units from newest lot (date: 2024-01-15)
      expect(result.details!.batches_consumed![0].quantity).toBe(50);
      // Second consumed batch: 30 units from oldest lot
      expect(result.details!.batches_consumed![1].quantity).toBe(30);
    });

    it('should handle single batch consumption from newest', async () => {
      const stockState = makeStockState({
        current_quantity: 150,
        current_value: 1600,
        unit_cost: 1600 / 150,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 },
        ],
      });

      const exitQuantity = 30;

      const result = await InventoryValuationService.calculateLIFO(stockState, exitQuantity);

      // Should consume only from newest batch @ 12
      expect(result.total_value).toBe(360); // 30 * 12
      expect(result.quantity).toBe(30);
      expect(result.unit_cost).toBe(12);
      expect(result.method).toBe('LIFO');
      expect(result.details?.batches_consumed).toHaveLength(1);
      expect(result.details!.batches_consumed![0].quantity).toBe(30);
    });

    it('should throw error if insufficient stock', async () => {
      const stockState = makeStockState({
        current_quantity: 50,
        current_value: 500,
        unit_cost: 10,
        batches: [
          { date: '2024-01-01', quantity: 50, unit_price: 10, remaining_quantity: 50 },
        ],
      });

      const exitQuantity = 100;

      await expect(
        InventoryValuationService.calculateLIFO(stockState, exitQuantity)
      ).rejects.toThrow('Stock insuffisant pour cette sortie');
    });
  });
});
