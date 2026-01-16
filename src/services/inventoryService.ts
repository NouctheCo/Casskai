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
import type { CreateInventoryItemInput, StockMovementCreationInput } from '@/types/inventory';
import type { InventoryItemRow, StockMovementRow } from './inventory/types/inventory-db.types';
import {
  isInventoryItemRow,
  isStockMovementRow,
  validateCreateInventoryItem,
  validateProductData
} from './inventory/inventory-validations';
import { normalizeInventoryItem, normalizeStockMovement } from './inventory/inventory-normalizers';
import {
  attachInventoryIds,
  buildEmptyMetrics,
  calculateInventoryMetrics,
  calculateStockAdjustment,
  filterMovementsByDateRange,
  filterMovementsByItemId,
  filterMovementsByType,
  resolveMovementDirection
} from './inventory/inventory-calculations';
import { logger } from '@/lib/logger';
import {
  buildInventoryInsertPayload,
  buildInventoryUpdates,
  buildProductToItemMap,
  buildProductUpsertPayload,
  buildProductUpdates,
  buildStockMovementPayload,
  queryStockMovements,
  resolveWarehouse
} from './inventory/inventory-queries';
export type InventoryStatus = 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
export interface InventoryItem {
  id: string;
  productId: string;
  productVariantId?: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseCode?: string;
  locationId?: string;
  locationName?: string;
  location?: string;
  reference: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  unitCost: number;
  avgCost: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  supplierId?: string;
  supplierName?: string;
  supplier?: string;
  barcode?: string;
  variantSku?: string;
  variantName?: string;
  status: InventoryStatus;
  lastMovement?: string;
  lastCountDate?: string;
  totalValue: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}
export type InventoryItemFilters = {
  warehouseId?: string;
  category?: string;
  search?: string;
  lowStock?: boolean;
};
export interface StockMovement {
  id: string;
  item_id?: string;
  product_id: string;
  productVariantId?: string;
  productName: string;
  variantName?: string;
  warehouseId: string;
  warehouseName?: string;
  locationId?: string;
  locationName?: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  movementType: string;
  direction: 'in' | 'out';
  quantity: number;
  unit_price?: number;
  total_value?: number;
  reason?: string;
  reference?: string;
  batchNumber?: string;
  notes?: string;
  user_id?: string;
  company_id: string;
  created_at: string;
  movement_date: string;
}
export type StockMovementFilters = {
  itemId?: string;
  type?: 'entry' | 'exit' | 'adjustment' | 'transfer';
  dateFrom?: string;
  dateTo?: string;
};
export interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalMovements: number;
  pendingOrders: number;
  activeSuppliers: number;
  avgStockRotation: number;
  reservedStock: number;
  availableStock: number;
  totalWarehouses: number;
}
export interface InventoryAlertSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  digestEnabled: boolean;
  autoReorderEnabled: boolean;
  globalThreshold: number;
}
export const defaultInventoryAlertSettings: InventoryAlertSettings = {
  emailEnabled: true,
  smsEnabled: false,
  slackEnabled: false,
  digestEnabled: true,
  autoReorderEnabled: true,
  globalThreshold: 5
};
type InventoryAlertSettingsRow = {
  company_id?: string;
  email_enabled?: boolean | null;
  sms_enabled?: boolean | null;
  slack_enabled?: boolean | null;
  digest_enabled?: boolean | null;
  auto_reorder_enabled?: boolean | null;
  global_threshold?: number | null;
};
export interface Supplier {
  id: string;
  supplier_number: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_number?: string;
  category?: string;
  payment_terms?: number;
  currency?: string;
  discount_rate?: number;
  is_active: boolean;
  account_balance?: number;
  notes?: string;
  internal_notes?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}
export interface NewInventoryItemInput {
  productId?: string;
  productVariantId?: string | null;
  warehouseId?: string;
  locationId?: string | null;
  name: string;
  reference?: string;
  // Backwards-compatible aliases (used by some article-based flows)
  productCode?: string;
  productName?: string;
  description?: string;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  unitCost?: number;
  sellingPrice?: number;
  salePrice?: number;
  taxRate?: number;
  barcode?: string;
  currentStock?: number;
  initialQuantity?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  supplierId?: string;
  supplierReference?: string;
}
export interface NewStockMovementInput {
  item_id?: string;
  product_id?: string;
  productVariantId?: string | null;
  warehouse_id?: string;
  location_id?: string | null;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  unit_price?: number;
  reference?: string;
  reason?: string;
  notes?: string;
  user_id?: string;
  company_id?: string;
  location?: string;
}
export class InventoryService {
  static async getInventoryItems(companyId?: string, filters?: InventoryItemFilters): Promise<InventoryItem[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          products:product_id (
            id,
            code,
            name,
            description,
            category,
            stock_unit,
            sale_price,
            purchase_price,
            is_active
          ),
          product_variants:product_variant_id (
            id,
            variant_name,
            sku,
            barcode
          ),
          warehouses:warehouse_id (
            id,
            name,
            code
          ),
          inventory_locations:location_id (
            id,
            name,
            code
          )
        `)
        .eq('company_id', company_id)
        .order('updated_at', { ascending: false });
      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as unknown[];
      let items = rows
        .filter((item): item is InventoryItemRow => isInventoryItemRow(item))
        .map((item) => normalizeInventoryItem(item));
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        items = items.filter((item) =>
          item.name.toLowerCase().includes(term) ||
          item.reference.toLowerCase().includes(term)
        );
      }
      if (filters?.category) {
        items = items.filter((item) => item.category === filters.category);
      }
      if (filters?.lowStock) {
        items = items.filter((item) => item.status === 'low_stock' || item.status === 'out_of_stock');
      }
      return items;
    } catch (error) {
      logger.error('Inventory', 'Error fetching inventory items:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  static async createInventoryItem(
    companyIdOrData: string | NewInventoryItemInput,
    maybeItemData?: NewInventoryItemInput
  ): Promise<InventoryItem> {
    try {
      const { companyId, payload } = await this.resolveCreateItemContext(companyIdOrData, maybeItemData);
      const normalizedInput = this.normalizeCreateInventoryInput(payload, companyId);
      const warehouseId = await resolveWarehouse(companyId, normalizedInput.warehouseId);
      validateCreateInventoryItem(normalizedInput);
      const productPayload = buildProductUpsertPayload(normalizedInput, companyId);
      validateProductData(productPayload);
      const product = await this.upsertProduct(productPayload, {
        companyId,
        productId: normalizedInput.productId,
        productCode: normalizedInput.productCode
      });
      const inventoryPayload = buildInventoryInsertPayload(normalizedInput, {
        companyId,
        productId: product.id,
        warehouseId,
        locationId: normalizedInput.locationId
      });
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(inventoryPayload)
        .select(`
          *,
          products:product_id (*),
          product_variants:product_variant_id (*),
          warehouses:warehouse_id (*),
          inventory_locations:location_id (*)
        `)
        .single();
      if (error) throw error;
      if (!isInventoryItemRow(data)) {
        throw new Error('Unexpected inventory item payload');
      }
      return normalizeInventoryItem(data);
    } catch (error) {
      logger.error('Inventory', 'Error creating inventory item:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('id', id)
        .single();
      if (fetchError || !existing) {
        throw new Error('Inventory item not found');
      }
      const normalizedUpdates = this.normalizeUpdateInventoryInput(updates);
      const productUpdates = buildProductUpdates(normalizedUpdates);
      const inventoryUpdates = buildInventoryUpdates(normalizedUpdates);
      const mutations: Promise<unknown>[] = [];
      if (productUpdates) {
        mutations.push(
          Promise.resolve(supabase
            .from('products')
            .update(productUpdates)
            .eq('id', existing.product_id)
            .then())
        );
      }
      if (inventoryUpdates) {
        mutations.push(
          Promise.resolve(supabase
            .from('inventory_items')
            .update(inventoryUpdates)
            .eq('id', id)
            .then())
        );
      }
      if (mutations.length) {
        await Promise.all(mutations);
      }
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products:product_id (*),
          product_variants:product_variant_id (*),
          warehouses:warehouse_id (*),
          inventory_locations:location_id (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!isInventoryItemRow(data)) {
        throw new Error('Unexpected inventory item payload');
      }
      return normalizeInventoryItem(data);
    } catch (error) {
      logger.error('Inventory', 'Error updating inventory item:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      logger.error('Inventory', 'Error deleting inventory item:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async getStockMovements(companyId?: string, filters?: StockMovementFilters): Promise<StockMovement[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      const [rawMovements, productToItemMap] = await Promise.all([
        queryStockMovements({
          companyId: company_id,
          dateFrom: filters?.dateFrom,
          dateTo: filters?.dateTo
        }),
        buildProductToItemMap(company_id)
      ]);
      let movements = rawMovements
        .filter((movement): movement is StockMovementRow => isStockMovementRow(movement))
        .map((movement) => normalizeStockMovement(movement));
      movements = attachInventoryIds(movements, productToItemMap);
      movements = filterMovementsByType(movements, filters?.type);
      movements = filterMovementsByItemId(movements, filters?.itemId);
      movements = filterMovementsByDateRange(movements, filters?.dateFrom, filters?.dateTo);
      return movements;
    } catch (error) {
      logger.error('Inventory', 'Error fetching stock movements:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  static async createStockMovement(
    companyIdOrData: string | NewStockMovementInput,
    maybeMovementData?: NewStockMovementInput
  ): Promise<StockMovement> {
    try {
      const { companyId, payload } = await this.resolveMovementContext(companyIdOrData, maybeMovementData);
      const normalizedInput = this.normalizeStockMovementInput(payload, companyId);
      if (!normalizedInput.itemId) {
        throw new Error('Inventory item identifier is required for stock movements');
      }
      const itemRecord = await this.fetchInventoryItem(normalizedInput.itemId);
      const rawQuantity = this.sanitizeNumber(payload.quantity);
      const quantity = Math.abs(rawQuantity);
      const direction = resolveMovementDirection(normalizedInput.type, rawQuantity);
      const movementType = this.mapMovementType(normalizedInput.type, direction);
      const unitCost = normalizedInput.unitCost ?? itemRecord.unit_cost ?? 0;
      const newQuantity = normalizedInput.type === 'adjustment'
        ? quantity
        : calculateStockAdjustment(Number(itemRecord.quantity_on_hand ?? 0), quantity, direction);
      const movementPayload = buildStockMovementPayload(
        {
          productId: itemRecord.product_id,
          productVariantId: itemRecord.product_variant_id ?? null,
          warehouseId: itemRecord.warehouse_id,
          locationId: itemRecord.location_id ?? null,
          quantity,
          movementType,
          direction,
          reference: normalizedInput.reference,
          notes: normalizedInput.notes,
          unitCost,
          createdBy: normalizedInput.userId
        },
        companyId
      );
      const { data: movement, error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementPayload)
        .select(`
          *,
          products:product_id (*),
          product_variants:product_variant_id (*),
          warehouses:warehouse_id (*),
          inventory_locations:location_id (*)
        `)
        .single();
      if (movementError) throw movementError;
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_on_hand: newQuantity,
          last_movement_date: new Date().toISOString()
        })
        .eq('id', itemRecord.id);
      if (updateError) throw updateError;
      if (!movement || !isStockMovementRow(movement)) {
        throw new Error('Unexpected stock movement payload');
      }
      return normalizeStockMovement(movement, itemRecord.id);
    } catch (error) {
      logger.error('Inventory', 'Error creating stock movement:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async getSuppliers(companyId?: string): Promise<Supplier[]> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', company_id)
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Inventory', 'Error fetching suppliers:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  static async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Supplier> {
    try {
      const company_id = await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          company_id
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Inventory', 'Error creating supplier:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async getAlertSettings(companyId?: string): Promise<InventoryAlertSettings> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      const { data, error } = await supabase
        .from('inventory_alert_settings')
        .select('email_enabled, sms_enabled, slack_enabled, digest_enabled, auto_reorder_enabled, global_threshold')
        .eq('company_id', company_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return await this.saveAlertSettings(defaultInventoryAlertSettings, company_id);
      }
      return this.normalizeAlertSettings(data);
    } catch (error) {
      logger.error('Inventory', 'Error fetching inventory alert settings:', error instanceof Error ? error.message : String(error));
      return { ...defaultInventoryAlertSettings };
    }
  }
  static async saveAlertSettings(
    settings: InventoryAlertSettings,
    companyId?: string
  ): Promise<InventoryAlertSettings> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      const payload = this.serializeAlertSettings(company_id, settings);
      const { data, error } = await supabase
        .from('inventory_alert_settings')
        .upsert(payload, { onConflict: 'company_id' })
        .select('email_enabled, sms_enabled, slack_enabled, digest_enabled, auto_reorder_enabled, global_threshold')
        .single();
      if (error) throw error;
      return this.normalizeAlertSettings(data);
    } catch (error) {
      logger.error('Inventory', 'Error saving inventory alert settings:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  static async getInventoryMetrics(companyId?: string): Promise<InventoryMetrics> {
    try {
      const company_id = companyId || await this.getCurrentCompanyId();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [items, movements, suppliersRes, warehousesRes] = await Promise.all([
        this.getInventoryItems(company_id),
        this.getStockMovements(company_id, { dateFrom: thirtyDaysAgo, type: 'exit' }),
        supabase
          .from('suppliers')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .eq('is_active', true),
        supabase
          .from('warehouses')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company_id)
      ]);
      const movementsOutQuantity = movements
        .filter((movement) => movement.direction === 'out')
        .reduce((sum, movement) => sum + Math.abs(movement.quantity ?? 0), 0);
      return calculateInventoryMetrics(items, {
        totalMovements: movements.length,
        totalMovementsOut: movementsOutQuantity,
        activeSuppliers: suppliersRes.count ?? 0,
        totalWarehouses: warehousesRes.count ?? 0
      });
    } catch (error) {
      logger.error('Inventory', 'Error fetching inventory metrics:', error instanceof Error ? error.message : String(error));
      return buildEmptyMetrics();
    }
  }
  private static async fetchInventoryItem(id: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, product_id, product_variant_id, warehouse_id, location_id, unit_cost, quantity_on_hand')
      .eq('id', id)
      .single();
    if (error || !data) {
      throw new Error('Inventory item not found');
    }
    return data;
  }
  private static async upsertProduct(
    payload: ReturnType<typeof buildProductUpsertPayload>,
    options: { productId?: string | null; companyId: string; productCode?: string } 
  ) {
    if (options.productId) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', options.productId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', options.companyId)
      .eq('code', options.productCode ?? payload.code)
      .maybeSingle();
    if (existing) {
      const { data: updated, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      return updated;
    }
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
  private static async resolveCreateItemContext(
    companyIdOrData: string | NewInventoryItemInput | CreateInventoryItemInput,
    maybeItemData?: NewInventoryItemInput | CreateInventoryItemInput
  ) {
    if (typeof companyIdOrData === 'string') {
      if (!maybeItemData) {
        throw new Error('Inventory item payload is missing');
      }
      return { companyId: companyIdOrData, payload: maybeItemData };
    }
    const companyId = await this.getCurrentCompanyId();
    return { companyId, payload: companyIdOrData };
  }
  private static normalizeCreateInventoryInput(
    payload: NewInventoryItemInput | CreateInventoryItemInput,
    companyId: string
  ): CreateInventoryItemInput {
    const isNewInventoryItemPayload = (
      value: NewInventoryItemInput | CreateInventoryItemInput
    ): value is NewInventoryItemInput => typeof (value as any).name === 'string';

    if (isNewInventoryItemPayload(payload)) {
      return {
        companyId,
        productId: payload.productId,
        productVariantId: payload.productVariantId ?? null,
        warehouseId: payload.warehouseId,
        locationId: payload.locationId ?? null,
        productName: payload.name,
        productCode: payload.reference ?? payload.name,
        description: payload.description,
        quantity: payload.currentStock,
        reorderPoint: payload.reorderPoint ?? payload.minStock,
        reorderQuantity: payload.reorderQuantity ?? payload.minStock,
        unit: payload.unit,
        unitCost: payload.unitCost ?? payload.purchasePrice,
        sellingPrice: payload.sellingPrice,
        category: payload.category,
        maxStock: payload.maxStock ?? null,
        supplierId: payload.supplierId
      } satisfies CreateInventoryItemInput;
    }

    return { ...payload, companyId };
  }
  private static normalizeUpdateInventoryInput(updates: Partial<InventoryItem>): Partial<CreateInventoryItemInput> {
    return {
      productName: updates.name,
      productCode: updates.reference,
      description: updates.description,
      category: updates.category,
      unit: updates.unit,
      unitCost: updates.unitCost ?? updates.purchasePrice,
      sellingPrice: updates.sellingPrice,
      quantity: updates.currentStock,
      reorderPoint: updates.reorderPoint ?? updates.minStock,
      reorderQuantity: updates.reorderQuantity,
      warehouseId: updates.warehouseId,
      locationId: updates.locationId,
      maxStock: updates.maxStock,
      productVariantId: updates.productVariantId
    };
  }
  private static async resolveMovementContext(
    companyIdOrData: string | NewStockMovementInput,
    maybeMovementData?: NewStockMovementInput
  ) {
    if (typeof companyIdOrData === 'string') {
      if (!maybeMovementData) {
        throw new Error('Stock movement payload is missing');
      }
      return { companyId: companyIdOrData, payload: maybeMovementData };
    }
    const companyId = await this.getCurrentCompanyId();
    return { companyId, payload: companyIdOrData };
  }
  private static normalizeStockMovementInput(
    payload: NewStockMovementInput,
    companyId: string
  ): StockMovementCreationInput {
    return {
      companyId,
      itemId: payload.item_id,
      quantity: Math.abs(this.sanitizeNumber(payload.quantity)),
      type: payload.type,
      reference: payload.reference,
      notes: payload.notes ?? payload.reason,
      unitCost: payload.unit_price,
      userId: payload.user_id
    } satisfies StockMovementCreationInput;
  }
  private static mapMovementType(input: NewStockMovementInput['type'], direction: 'in' | 'out'): string {
    switch (input) {
      case 'entry':
        return direction === 'in' ? 'adjustment_in' : 'adjustment_out';
      case 'exit':
        return 'adjustment_out';
      case 'transfer':
        return direction === 'in' ? 'transfer_in' : 'transfer_out';
      case 'adjustment':
      default:
        return direction === 'in' ? 'adjustment_in' : 'adjustment_out';
    }
  }
  private static sanitizeNumber(value?: number | string | null): number {
    if (value === null || value === undefined) return 0;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  private static normalizeAlertSettings(record: InventoryAlertSettingsRow | null): InventoryAlertSettings {
    if (!record) {
      return { ...defaultInventoryAlertSettings };
    }
    return {
      emailEnabled: Boolean(record.email_enabled ?? defaultInventoryAlertSettings.emailEnabled),
      smsEnabled: Boolean(record.sms_enabled ?? defaultInventoryAlertSettings.smsEnabled),
      slackEnabled: Boolean(record.slack_enabled ?? defaultInventoryAlertSettings.slackEnabled),
      digestEnabled: Boolean(record.digest_enabled ?? defaultInventoryAlertSettings.digestEnabled),
      autoReorderEnabled: Boolean(record.auto_reorder_enabled ?? defaultInventoryAlertSettings.autoReorderEnabled),
      globalThreshold: Number(record.global_threshold ?? defaultInventoryAlertSettings.globalThreshold)
    } satisfies InventoryAlertSettings;
  }
  private static serializeAlertSettings(companyId: string, settings: InventoryAlertSettings): Required<InventoryAlertSettingsRow> {
    return {
      company_id: companyId,
      email_enabled: settings.emailEnabled,
      sms_enabled: settings.smsEnabled,
      slack_enabled: settings.slackEnabled,
      digest_enabled: settings.digestEnabled,
      auto_reorder_enabled: settings.autoReorderEnabled,
      global_threshold: settings.globalThreshold
    };
  }
  private static async getCurrentCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    const { data: defaultCompany, error: defaultError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .limit(1);
    if (defaultError) {
      logger.error('Inventory', 'Error fetching default company:', defaultError.message);
    }
    const companyId = defaultCompany?.[0]?.company_id;
    if (companyId) {
      return companyId;
    }
    const { data: fallbackCompanies, error: fallbackError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1);
    if (fallbackError) {
      logger.error('Inventory', 'Error fetching fallback company:', fallbackError.message);
      throw fallbackError;
    }
    if (!fallbackCompanies?.length) {
      throw new Error('No company associated with current user');
    }
    return fallbackCompanies[0].company_id;
  }
}
export default InventoryService;