/**
 * Tests unitaires - Inventory Valuation Service
 * P2-2: Méthodes de valorisation des stocks (CMP, FIFO, LIFO)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryValuationService } from '../inventoryValuationService';
import type { ValuationMethod, StockBatch } from '../inventoryValuationService';

describe('InventoryValuationService', () => {
  describe('calculateWeightedAverage (CMP)', () => {
    it('should calculate weighted average correctly for first movement', () => {
      const stockState = {
        quantity: 0,
        total_value: 0,
        batches: []
      };

      const movement = {
        quantity: 100,
        unit_price: 10
      };

      const result = InventoryValuationService.calculateWeightedAverage(stockState, movement);

      expect(result.new_average_cost).toBe(10);
      expect(result.new_quantity).toBe(100);
      expect(result.new_total_value).toBe(1000);
      expect(result.movement_value).toBe(1000);
    });

    it('should calculate weighted average correctly for subsequent movement', () => {
      const stockState = {
        quantity: 100,
        total_value: 1000,
        batches: []
      };

      const movement = {
        quantity: 50,
        unit_price: 12
      };

      const result = InventoryValuationService.calculateWeightedAverage(stockState, movement);

      // Expected: (1000 + 600) / (100 + 50) = 1600 / 150 = 10.67
      expect(result.new_average_cost).toBeCloseTo(10.67, 2);
      expect(result.new_quantity).toBe(150);
      expect(result.new_total_value).toBe(1600);
      expect(result.movement_value).toBe(600);
    });

    it('should handle exit movement (sale)', () => {
      const stockState = {
        quantity: 100,
        total_value: 1000,
        batches: []
      };

      const movement = {
        quantity: -30,
        unit_price: 10 // Current average cost
      };

      const result = InventoryValuationService.calculateWeightedAverage(stockState, movement);

      expect(result.new_quantity).toBe(70);
      expect(result.new_total_value).toBe(700);
      expect(result.movement_value).toBe(300);
      expect(result.new_average_cost).toBe(10);
    });
  });

  describe('calculateFIFO', () => {
    it('should consume oldest batches first', () => {
      const stockState = {
        quantity: 150,
        total_value: 1600,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 120;

      const result = InventoryValuationService.calculateFIFO(stockState, exitQuantity);

      // Should consume: 100 from first batch @ 10 + 20 from second batch @ 12
      // Cost: (100 × 10) + (20 × 12) = 1000 + 240 = 1240
      expect(result.exit_value).toBe(1240);
      expect(result.new_quantity).toBe(30);
      expect(result.consumed_batches).toHaveLength(2);
      expect(result.consumed_batches[0].consumed_quantity).toBe(100);
      expect(result.consumed_batches[1].consumed_quantity).toBe(20);
    });

    it('should handle partial batch consumption', () => {
      const stockState = {
        quantity: 100,
        total_value: 1000,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 }
        ] as StockBatch[]
      };

      const exitQuantity = 30;

      const result = InventoryValuationService.calculateFIFO(stockState, exitQuantity);

      expect(result.exit_value).toBe(300);
      expect(result.new_quantity).toBe(70);
      expect(result.consumed_batches).toHaveLength(1);
      expect(result.consumed_batches[0].consumed_quantity).toBe(30);
    });

    it('should throw error if insufficient stock', () => {
      const stockState = {
        quantity: 50,
        total_value: 500,
        batches: [
          { date: '2024-01-01', quantity: 50, unit_price: 10, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 100;

      expect(() => {
        InventoryValuationService.calculateFIFO(stockState, exitQuantity);
      }).toThrow('Stock insuffisant');
    });
  });

  describe('calculateLIFO', () => {
    it('should consume newest batches first', () => {
      const stockState = {
        quantity: 150,
        total_value: 1600,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 80;

      const result = InventoryValuationService.calculateLIFO(stockState, exitQuantity);

      // Should consume: 50 from second batch @ 12 + 30 from first batch @ 10
      // Cost: (50 × 12) + (30 × 10) = 600 + 300 = 900
      expect(result.exit_value).toBe(900);
      expect(result.new_quantity).toBe(70);
      expect(result.consumed_batches).toHaveLength(2);
      expect(result.consumed_batches[0].consumed_quantity).toBe(50); // Newest first
      expect(result.consumed_batches[1].consumed_quantity).toBe(30);
    });

    it('should handle single batch consumption from newest', () => {
      const stockState = {
        quantity: 150,
        total_value: 1600,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 30;

      const result = InventoryValuationService.calculateLIFO(stockState, exitQuantity);

      // Should consume only from newest batch
      expect(result.exit_value).toBe(360); // 30 × 12
      expect(result.new_quantity).toBe(120);
      expect(result.consumed_batches).toHaveLength(1);
      expect(result.consumed_batches[0].consumed_quantity).toBe(30);
    });

    it('should throw error if insufficient stock', () => {
      const stockState = {
        quantity: 50,
        total_value: 500,
        batches: [
          { date: '2024-01-01', quantity: 50, unit_price: 10, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 100;

      expect(() => {
        InventoryValuationService.calculateLIFO(stockState, exitQuantity);
      }).toThrow('Stock insuffisant');
    });
  });

  describe('validateIFRSCompliance', () => {
    it('should block LIFO if accounting standard is IFRS', () => {
      const result = InventoryValuationService.validateIFRSCompliance('LIFO', 'IFRS');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('LIFO est INTERDIT en IFRS');
      expect(result.standard).toBe('IFRS');
      expect(result.regulation).toBe('IAS 2');
    });

    it('should allow LIFO if accounting standard is PCG', () => {
      const result = InventoryValuationService.validateIFRSCompliance('LIFO', 'PCG');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow LIFO if accounting standard is SYSCOHADA', () => {
      const result = InventoryValuationService.validateIFRSCompliance('LIFO', 'SYSCOHADA');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow CMP for all standards', () => {
      expect(InventoryValuationService.validateIFRSCompliance('CMP', 'IFRS').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('CMP', 'PCG').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('CMP', 'SYSCOHADA').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('CMP', 'SCF').isValid).toBe(true);
    });

    it('should allow FIFO for all standards', () => {
      expect(InventoryValuationService.validateIFRSCompliance('FIFO', 'IFRS').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('FIFO', 'PCG').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('FIFO', 'SYSCOHADA').isValid).toBe(true);
      expect(InventoryValuationService.validateIFRSCompliance('FIFO', 'SCF').isValid).toBe(true);
    });
  });

  describe('compareValuationMethods', () => {
    it('should compare CMP, FIFO, LIFO for same stock state', () => {
      const stockState = {
        quantity: 150,
        total_value: 1600,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 50, unit_price: 12, remaining_quantity: 50 }
        ] as StockBatch[]
      };

      const exitQuantity = 80;
      const currentAverageCost = 1600 / 150; // 10.67

      const comparison = InventoryValuationService.compareValuationMethods(
        stockState,
        exitQuantity,
        currentAverageCost
      );

      // CMP: 80 × 10.67 = 853.33
      expect(comparison.CMP.exit_value).toBeCloseTo(853.33, 2);

      // FIFO: (80 × 10) = 800 (oldest)
      expect(comparison.FIFO.exit_value).toBe(800);

      // LIFO: (50 × 12) + (30 × 10) = 900 (newest)
      expect(comparison.LIFO.exit_value).toBe(900);

      // FIFO should have lowest exit value (oldest prices)
      expect(comparison.FIFO.exit_value).toBeLessThan(comparison.CMP.exit_value);
      expect(comparison.FIFO.exit_value).toBeLessThan(comparison.LIFO.exit_value);
    });

    it('should show LIFO has highest exit value in rising prices', () => {
      // Rising prices: 10 → 12 → 15
      const stockState = {
        quantity: 300,
        total_value: 3600,
        batches: [
          { date: '2024-01-01', quantity: 100, unit_price: 10, remaining_quantity: 100 },
          { date: '2024-01-15', quantity: 100, unit_price: 12, remaining_quantity: 100 },
          { date: '2024-02-01', quantity: 100, unit_price: 15, remaining_quantity: 100 }
        ] as StockBatch[]
      };

      const exitQuantity = 150;
      const currentAverageCost = 3600 / 300; // 12

      const comparison = InventoryValuationService.compareValuationMethods(
        stockState,
        exitQuantity,
        currentAverageCost
      );

      // LIFO should have highest exit value (newest = most expensive)
      expect(comparison.LIFO.exit_value).toBeGreaterThan(comparison.FIFO.exit_value);
      expect(comparison.LIFO.exit_value).toBeGreaterThan(comparison.CMP.exit_value);
    });
  });
});
