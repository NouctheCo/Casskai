import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { InventoryService } from '@/services/inventoryService';

import type {
  InventoryItem,
  StockMovement,
  InventoryMetrics,
  InventoryItemFilters,
  StockMovementFilters,
  NewInventoryItemInput,
  NewStockMovementInput
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

  fetchItems: (filters?: InventoryItemFilters & { status?: string }) => Promise<void>;

  fetchMovements: (filters?: StockMovementFilters) => Promise<void>;

  fetchMetrics: () => Promise<void>;

  fetchCategories: () => Promise<void>;



  // CRUD operations

  createItem: (itemData: NewInventoryItemInput) => Promise<boolean>;

  updateItem: (itemId: string, updates: Partial<InventoryItem>) => Promise<boolean>;

  deleteItem: (itemId: string) => Promise<boolean>;



  createMovement: (movementData: NewStockMovementInput) => Promise<boolean>;



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

  const [itemsLoading, setItemsLoading] = useState(false);

  const [movementsLoading, setMovementsLoading] = useState(false);

  const [metricsLoading, setMetricsLoading] = useState(false);



  // Error state

  const [error, setError] = useState<string | null>(null);



  // Fetch functions

  const fetchItems = useCallback(async (filters?: InventoryItemFilters & { status?: string }) => {

    if (!currentCompany?.id) return;



    setItemsLoading(true);

    setError(null);



    try {

      const response = await InventoryService.getInventoryItems(currentCompany.id, filters);

      const filteredItems = filters?.status
        ? response.filter((item) => item.status === filters.status)
        : response;

      setItems(filteredItems);

      const uniqueCategories = Array.from(
        new Set(
          response
            .map(item => item.category)
            .filter((category): category is string => Boolean(category))
        )
      );
      setCategories(uniqueCategories);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

    } finally {

      setItemsLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchMovements = useCallback(async (filters?: StockMovementFilters) => {

    if (!currentCompany?.id) return;



    setMovementsLoading(true);

    setError(null);



    try {

      const response = await InventoryService.getStockMovements(currentCompany.id, filters);

      setMovements(response);

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

      const response = await InventoryService.getInventoryMetrics(currentCompany.id);

      setMetrics(response);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

    } finally {

      setMetricsLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchCategories = useCallback(async () => {

    const uniqueCategories = Array.from(
      new Set(
        items
          .map(item => item.category)
          .filter((category): category is string => Boolean(category))
      )
    );

    setCategories(uniqueCategories);

  }, [items]);



  // CRUD operations

  const createItem = useCallback(async (itemData: NewInventoryItemInput): Promise<boolean> => {

    if (!currentCompany?.id) return false;



    try {

      await InventoryService.createInventoryItem(currentCompany.id, itemData);

      await fetchItems();

      await fetchMetrics();

      await fetchCategories();

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      return false;

    }

  }, [currentCompany?.id, fetchItems, fetchMetrics, fetchCategories]);



  const updateItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>): Promise<boolean> => {

    try {

      await InventoryService.updateInventoryItem(itemId, updates);

      await fetchItems();

      await fetchMetrics();

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      return false;

    }

  }, [fetchItems, fetchMetrics]);



  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {

    try {

      await InventoryService.deleteInventoryItem(itemId);

      await fetchItems();

      await fetchMetrics();

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      return false;

    }

  }, [fetchItems, fetchMetrics]);



  const createMovement = useCallback(async (movementData: NewStockMovementInput): Promise<boolean> => {

    if (!currentCompany?.id) return false;



    try {

      await InventoryService.createStockMovement(currentCompany.id, movementData);

      await fetchMovements();

      await fetchItems(); // Refresh items to update stock levels

      await fetchMetrics();

      return true;

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

  const loading = itemsLoading || movementsLoading || metricsLoading;

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
