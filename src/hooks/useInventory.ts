// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService } from '@/services/inventoryService';
import {
  InventoryItem,
  StockMovement,
  InventoryMetrics
} from '@/services/inventoryService';

interface UseInventoryReturn {
  // Data
  items: InventoryItem[];
  movements: StockMovement[];
  metrics: InventoryMetrics | null;
  categories: string[];

  // Loading states
  loading: boolean;
  itemsLoading: boolean;
  movementsLoading: boolean;
  metricsLoading: boolean;

  // Error state
  error: string | null;

  // Fetch functions
  fetchItems: (filters?: { category?: string; status?: string; search?: string; lowStock?: boolean }) => Promise<void>;
  fetchMovements: (filters?: { itemId?: string; type?: string; dateFrom?: string; dateTo?: string }) => Promise<void>;
  fetchMetrics: () => Promise<void>;
  fetchCategories: () => Promise<void>;

  // CRUD operations
  createItem: (itemData: Omit<InventoryItem, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'totalValue' | 'lastMovement'>) => Promise<boolean>;
  updateItem: (itemId: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<boolean>;

  createMovement: (movementData: Omit<StockMovement, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'item_name'>, updateStock?: boolean) => Promise<boolean>;

  // Utility
  refreshAll: () => Promise<void>;

  // Computed values
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  totalValue: number;
}

export function useInventory(): UseInventoryReturn {
  const { currentCompany } = useAuth();

  // States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchItems = useCallback(async (filters?: { category?: string; status?: string; search?: string; lowStock?: boolean }) => {
    if (!currentCompany?.id) return;

    setItemsLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getInventoryItems(currentCompany.id, filters);

      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch inventory items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setItemsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchMovements = useCallback(async (filters?: { itemId?: string; type?: string; dateFrom?: string; dateTo?: string }) => {
    if (!currentCompany?.id) return;

    setMovementsLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getStockMovements(currentCompany.id, filters);

      if (response.success && response.data) {
        setMovements(response.data);
      } else {
        setError(response.error || 'Failed to fetch stock movements');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMovementsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchMetrics = useCallback(async () => {
    if (!currentCompany?.id) return;

    setMetricsLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getInventoryMetrics(currentCompany.id);

      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch inventory metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMetricsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchCategories = useCallback(async () => {
    if (!currentCompany?.id) return;

    try {
      const response = await inventoryService.getCategories(currentCompany.id);

      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  }, [currentCompany?.id]);

  // CRUD operations
  const createItem = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'totalValue' | 'lastMovement'>): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await inventoryService.createInventoryItem(currentCompany.id, itemData);

      if (response.success) {
        await fetchItems();
        await fetchMetrics();
        await fetchCategories();
        return true;
      } else {
        setError(response.error || 'Failed to create inventory item');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchItems, fetchMetrics, fetchCategories]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    try {
      const response = await inventoryService.updateInventoryItem(itemId, updates);

      if (response.success) {
        await fetchItems();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to update inventory item');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchItems, fetchMetrics]);

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const response = await inventoryService.deleteInventoryItem(itemId);

      if (response.success) {
        await fetchItems();
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to delete inventory item');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [fetchItems, fetchMetrics]);

  const createMovement = useCallback(async (movementData: Omit<StockMovement, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'item_name'>, updateStock = true): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await inventoryService.createStockMovement(currentCompany.id, movementData, updateStock);

      if (response.success) {
        await fetchMovements();
        await fetchItems(); // Refresh items to update stock levels
        await fetchMetrics();
        return true;
      } else {
        setError(response.error || 'Failed to create stock movement');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchMovements, fetchItems, fetchMetrics]);

  // Utility function to refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchItems(),
      fetchMovements(),
      fetchMetrics(),
      fetchCategories()
    ]);
  }, [fetchItems, fetchMovements, fetchMetrics, fetchCategories]);

  // Computed values
  const lowStockItems = items.filter(item => item.status === 'low_stock');
  const outOfStockItems = items.filter(item => item.status === 'out_of_stock');
  const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  // Initial data load
  useEffect(() => {
    if (currentCompany?.id) {
      fetchMetrics();
      fetchItems();
      fetchCategories();
    }
  }, [currentCompany?.id, fetchMetrics, fetchItems, fetchCategories]);

  return {
    // Data
    items,
    movements,
    metrics,
    categories,

    // Loading states
    loading,
    itemsLoading,
    movementsLoading,
    metricsLoading,

    // Error
    error,

    // Fetch functions
    fetchItems,
    fetchMovements,
    fetchMetrics,
    fetchCategories,

    // CRUD
    createItem,
    updateItem,
    deleteItem,
    createMovement,

    // Utility
    refreshAll,

    // Computed values
    lowStockItems,
    outOfStockItems,
    totalValue
  };
}