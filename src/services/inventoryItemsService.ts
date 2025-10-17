import { supabase } from '@/lib/supabase';

export interface InventoryItem {
  id: string;
  company_id: string;
  code: string; // Référence dans products
  name: string;
  description?: string;
  type: 'product' | 'service' | 'bundle';
  category?: string;
  sale_price: number; // selling_price
  purchase_price: number;
  cost_price?: number;
  is_stockable: boolean;
  current_stock: number;
  minimum_stock: number;
  stock_unit: string; // unit
  sale_tax_rate: number; // TVA appliquée
  purchase_tax_rate?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInventoryItemPayload {
  reference: string; // sera mappé à code
  name: string;
  description?: string;
  category?: string;
  unit?: string; // sera mappé à stock_unit
  purchase_price: number;
  selling_price: number; // sera mappé à sale_price
  current_stock?: number;
  min_stock?: number; // sera mappé à minimum_stock
  max_stock?: number; // non utilisé dans products
  sale_tax_rate?: number; // TVA
}

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

class InventoryItemsService {
  /**
   * Générer un code unique pour un produit
   */
  private async generateProductCode(companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('products')
      .select('code')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'PROD-001';
    }

    const lastCode = data[0].code;
    const match = lastCode.match(/\d+$/);
    if (match) {
      const nextNumber = parseInt(match[0]) + 1;
      return `PROD-${String(nextNumber).padStart(3, '0')}`;
    }

    return `PROD-${Date.now()}`;
  }

  /**
   * Créer un nouvel article d'inventaire (produit)
   */
  async createItem(
    companyId: string,
    payload: CreateInventoryItemPayload
  ): Promise<ServiceResult<InventoryItem>> {
    try {
      // Vérifier que la référence est unique dans l'entreprise
      const { data: existingItem } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .eq('code', payload.reference)
        .single();

      if (existingItem) {
        return {
          success: false,
          error: `Un article avec la référence "${payload.reference}" existe déjà`,
        };
      }

      const productData = {
        company_id: companyId,
        code: payload.reference,
        name: payload.name,
        description: payload.description || null,
        type: 'product' as const,
        category: payload.category || null,
        sale_price: payload.selling_price,
        purchase_price: payload.purchase_price,
        cost_price: payload.purchase_price, // Par défaut, le coût = prix d'achat
        is_stockable: true,
        current_stock: payload.current_stock || 0,
        minimum_stock: payload.min_stock || 0,
        stock_unit: payload.unit || 'Pièce',
        sale_tax_rate: payload.sale_tax_rate || 20,
        purchase_tax_rate: payload.sale_tax_rate || 20,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transformer les données pour correspondre à l'interface InventoryItem
      const inventoryItem: InventoryItem = {
        id: data.id,
        company_id: data.company_id,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        sale_price: parseFloat(data.sale_price),
        purchase_price: parseFloat(data.purchase_price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : undefined,
        is_stockable: data.is_stockable,
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        stock_unit: data.stock_unit,
        sale_tax_rate: parseFloat(data.sale_tax_rate),
        purchase_tax_rate: data.purchase_tax_rate ? parseFloat(data.purchase_tax_rate) : undefined,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: inventoryItem };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'article';
      return { success: false, error: message };
    }
  }

  /**
   * Récupérer tous les articles d'une entreprise
   */
  async getItems(companyId: string): Promise<ServiceResult<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const inventoryItems: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        company_id: item.company_id,
        code: item.code,
        name: item.name,
        description: item.description,
        type: item.type,
        category: item.category,
        sale_price: parseFloat(item.sale_price),
        purchase_price: parseFloat(item.purchase_price),
        cost_price: item.cost_price ? parseFloat(item.cost_price) : undefined,
        is_stockable: item.is_stockable,
        current_stock: parseFloat(item.current_stock),
        minimum_stock: parseFloat(item.minimum_stock),
        stock_unit: item.stock_unit,
        sale_tax_rate: parseFloat(item.sale_tax_rate),
        purchase_tax_rate: item.purchase_tax_rate ? parseFloat(item.purchase_tax_rate) : undefined,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return { success: true, data: inventoryItems };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des articles';
      return { success: false, error: message };
    }
  }

  /**
   * Récupérer un article par ID
   */
  async getItemById(itemId: string): Promise<ServiceResult<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        throw error;
      }

      const inventoryItem: InventoryItem = {
        id: data.id,
        company_id: data.company_id,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        sale_price: parseFloat(data.sale_price),
        purchase_price: parseFloat(data.purchase_price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : undefined,
        is_stockable: data.is_stockable,
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        stock_unit: data.stock_unit,
        sale_tax_rate: parseFloat(data.sale_tax_rate),
        purchase_tax_rate: data.purchase_tax_rate ? parseFloat(data.purchase_tax_rate) : undefined,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: inventoryItem };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'article';
      return { success: false, error: message };
    }
  }

  /**
   * Mettre à jour un article
   */
  async updateItem(
    itemId: string,
    updates: Partial<CreateInventoryItemPayload>
  ): Promise<ServiceResult<InventoryItem>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.reference) updateData.code = updates.reference;
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.selling_price !== undefined) updateData.sale_price = updates.selling_price;
      if (updates.purchase_price !== undefined) updateData.purchase_price = updates.purchase_price;
      if (updates.current_stock !== undefined) updateData.current_stock = updates.current_stock;
      if (updates.min_stock !== undefined) updateData.minimum_stock = updates.min_stock;
      if (updates.unit !== undefined) updateData.stock_unit = updates.unit;
      if (updates.sale_tax_rate !== undefined) updateData.sale_tax_rate = updates.sale_tax_rate;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const inventoryItem: InventoryItem = {
        id: data.id,
        company_id: data.company_id,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        sale_price: parseFloat(data.sale_price),
        purchase_price: parseFloat(data.purchase_price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : undefined,
        is_stockable: data.is_stockable,
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        stock_unit: data.stock_unit,
        sale_tax_rate: parseFloat(data.sale_tax_rate),
        purchase_tax_rate: data.purchase_tax_rate ? parseFloat(data.purchase_tax_rate) : undefined,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: inventoryItem };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'article';
      return { success: false, error: message };
    }
  }

  /**
   * Supprimer un article (désactiver)
   */
  async deleteItem(itemId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      return { success: true, data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'article';
      return { success: false, error: message };
    }
  }

  /**
   * Rechercher des articles par nom ou référence
   */
  async searchItems(companyId: string, query: string): Promise<ServiceResult<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(50);

      if (error) {
        throw error;
      }

      const inventoryItems: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        company_id: item.company_id,
        code: item.code,
        name: item.name,
        description: item.description,
        type: item.type,
        category: item.category,
        sale_price: parseFloat(item.sale_price),
        purchase_price: parseFloat(item.purchase_price),
        cost_price: item.cost_price ? parseFloat(item.cost_price) : undefined,
        is_stockable: item.is_stockable,
        current_stock: parseFloat(item.current_stock),
        minimum_stock: parseFloat(item.minimum_stock),
        stock_unit: item.stock_unit,
        sale_tax_rate: parseFloat(item.sale_tax_rate),
        purchase_tax_rate: item.purchase_tax_rate ? parseFloat(item.purchase_tax_rate) : undefined,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return { success: true, data: inventoryItems };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la recherche';
      return { success: false, error: message };
    }
  }

  /**
   * Récupérer les articles avec stock faible
   */
  async getLowStockItems(companyId: string): Promise<ServiceResult<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('is_stockable', true)
        .filter('current_stock', 'lte', 'minimum_stock')
        .order('current_stock', { ascending: true });

      if (error) {
        throw error;
      }

      const inventoryItems: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        company_id: item.company_id,
        code: item.code,
        name: item.name,
        description: item.description,
        type: item.type,
        category: item.category,
        sale_price: parseFloat(item.sale_price),
        purchase_price: parseFloat(item.purchase_price),
        cost_price: item.cost_price ? parseFloat(item.cost_price) : undefined,
        is_stockable: item.is_stockable,
        current_stock: parseFloat(item.current_stock),
        minimum_stock: parseFloat(item.minimum_stock),
        stock_unit: item.stock_unit,
        sale_tax_rate: parseFloat(item.sale_tax_rate),
        purchase_tax_rate: item.purchase_tax_rate ? parseFloat(item.purchase_tax_rate) : undefined,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return { success: true, data: inventoryItems };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des articles en rupture';
      return { success: false, error: message };
    }
  }

  /**
   * Mettre à jour le stock d'un article
   */
  async updateStock(
    itemId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<ServiceResult<InventoryItem>> {
    try {
      // Récupérer l'article actuel
      const itemResult = await this.getItemById(itemId);
      if (!itemResult.success) {
        return itemResult;
      }

      const item = itemResult.data;
      let newStock = item.current_stock;

      switch (operation) {
        case 'add':
          newStock += quantity;
          break;
        case 'subtract':
          newStock -= quantity;
          break;
        case 'set':
          newStock = quantity;
          break;
      }

      // Ne pas permettre de stock négatif
      newStock = Math.max(0, newStock);

      const { data, error } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const inventoryItem: InventoryItem = {
        id: data.id,
        company_id: data.company_id,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        sale_price: parseFloat(data.sale_price),
        purchase_price: parseFloat(data.purchase_price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : undefined,
        is_stockable: data.is_stockable,
        current_stock: parseFloat(data.current_stock),
        minimum_stock: parseFloat(data.minimum_stock),
        stock_unit: data.stock_unit,
        sale_tax_rate: parseFloat(data.sale_tax_rate),
        purchase_tax_rate: data.purchase_tax_rate ? parseFloat(data.purchase_tax_rate) : undefined,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: inventoryItem };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock';
      return { success: false, error: message };
    }
  }
}

export const inventoryItemsService = new InventoryItemsService();
