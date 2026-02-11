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

import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toastCreated, toastUpdated, toastDeleted, toastError } from '@/lib/toast-helpers';

import {
  InventoryService,
  type InventoryItem,
  type StockMovement,
  type InventoryMetrics,
  type InventoryItemFilters,
  type StockMovementFilters,
  type NewInventoryItemInput,
  type NewStockMovementInput
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

      // ✅ Lire depuis la table `articles` au lieu de `inventory_items`
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (articlesError) throw articlesError;

      // ✅ Mapper les articles vers le format InventoryItem
      const mappedItems: InventoryItem[] = (articlesData || []).map(article => {
        const currentStock = article.stock_quantity || 0;
        const minStock = article.stock_min || 0;
        const maxStock = article.stock_max || 0;

        // Calculer le statut
        let status: InventoryItem['status'] = 'active';
        if (currentStock === 0) {
          status = 'out_of_stock';
        } else if (currentStock <= minStock) {
          status = 'low_stock';
        }

        return {
          id: article.id,
          productId: (article.product_id as string) || article.id,
          productVariantId: (article.product_variant_id as string) || undefined,
          warehouseId: (article.warehouse_id as string) || '',
          reference: article.reference || '',
          name: article.name || '',
          description: article.description || undefined,
          category: article.category || undefined,
          unit: article.unit || 'pièce',
          purchasePrice: article.purchase_price || 0,
          sellingPrice: article.selling_price || 0,
          unitCost: article.purchase_price || 0,
          avgCost: article.purchase_price || 0,
          currentStock,
          reservedStock: 0,
          availableStock: currentStock,
          minStock,
          maxStock,
          status,
          lastMovement: undefined as string | undefined,
          lastCountDate: undefined as string | undefined,
          totalValue: currentStock * (article.purchase_price || 0),
          location: (article.warehouse_id as string) || undefined,
          supplierId: (article.supplier_id as string) || undefined,
          supplierName: undefined as string | undefined,
          barcode: article.barcode || undefined,
          company_id: article.company_id || currentCompany.id,
          created_at: article.created_at || new Date().toISOString(),
          updated_at: article.updated_at || new Date().toISOString(),
        };
      });

      const filteredItems = filters?.status
        ? mappedItems.filter((item) => item.status === filters.status)
        : mappedItems;

      setItems(filteredItems);

      const uniqueCategories = Array.from(
        new Set(
          mappedItems
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

      // ✅ Créer directement dans la table `articles`
      const { error } = await supabase
        .from('articles')
        .insert({
          company_id: currentCompany.id,
          reference: itemData.productCode,
          name: itemData.productName,
          description: itemData.description,
          category: itemData.category,
          unit: itemData.unit,
          purchase_price: itemData.purchasePrice,
          selling_price: itemData.salePrice,
          tva_rate: itemData.taxRate,
          barcode: itemData.barcode,
          warehouse_id: itemData.warehouseId,
          stock_quantity: itemData.initialQuantity || 0,
          stock_min: itemData.reorderPoint || 0,
          stock_max: itemData.reorderQuantity ? (itemData.reorderPoint || 0) + itemData.reorderQuantity : undefined,
          supplier_id: itemData.supplierId,
          supplier_reference: itemData.supplierReference,
          is_active: true
        });

      if (error) throw error;

      await fetchItems();

      await fetchMetrics();

      await fetchCategories();

      toastCreated(`Article ${itemData.productName} créé avec succès`);

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      toastError(`Erreur lors de la création : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);

      return false;

    }

  }, [currentCompany?.id, fetchItems, fetchMetrics, fetchCategories]);



  const updateItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>): Promise<boolean> => {

    try {

      // ✅ Mettre à jour dans la table `articles`
      const articleUpdates: Record<string, unknown> = {};
      if (updates.name) articleUpdates.name = updates.name;
      if (updates.reference) articleUpdates.reference = updates.reference;
      if (updates.description !== undefined) articleUpdates.description = updates.description;
      if (updates.category) articleUpdates.category = updates.category;
      if (updates.unit) articleUpdates.unit = updates.unit;
      if (updates.purchasePrice !== undefined) articleUpdates.purchase_price = updates.purchasePrice;
      if (updates.sellingPrice !== undefined) articleUpdates.selling_price = updates.sellingPrice;
      if (updates.currentStock !== undefined) articleUpdates.stock_quantity = updates.currentStock;
      if (updates.minStock !== undefined) articleUpdates.stock_min = updates.minStock;
      if (updates.maxStock !== undefined) articleUpdates.stock_max = updates.maxStock;
      if (updates.barcode !== undefined) articleUpdates.barcode = updates.barcode;
      if (updates.warehouseId) articleUpdates.warehouse_id = updates.warehouseId;
      if (updates.supplierId !== undefined) articleUpdates.supplier_id = updates.supplierId;

      const { error } = await supabase
        .from('articles')
        .update(articleUpdates)
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems();

      await fetchMetrics();

      toastUpdated('Article mis à jour');

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      toastError(`Erreur lors de la mise à jour : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);

      return false;

    }

  }, [fetchItems, fetchMetrics]);



  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {

    try {

      // ✅ Soft delete dans la table `articles` (marquer comme inactif)
      const { error } = await supabase
        .from('articles')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems();

      await fetchMetrics();

      toastDeleted('Article supprimé');

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      toastError(`Erreur lors de la suppression : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);

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

      toastCreated('Mouvement de stock créé avec succès');

      return true;

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Unknown error');

      toastError(`Erreur lors de la création du mouvement : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);

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



  // Initial data load - load items and metrics when company changes

  useEffect(() => {

    if (currentCompany?.id) {

      fetchMetrics();

      fetchItems();

    }

  }, [currentCompany?.id, fetchMetrics, fetchItems]);



  // Update categories when items change

  useEffect(() => {

    fetchCategories();

  }, [fetchCategories]); // fetchCategories dépend de items, donc se met à jour quand items change



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
