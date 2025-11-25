import { supabase } from '@/lib/supabase';



// Types pour l'inventaire

export interface InventoryItem {

  id: string;

  reference: string;

  name: string;

  description?: string;

  category: string;

  unit: string;

  purchasePrice: number;

  sellingPrice: number;

  currentStock: number;

  minStock: number;

  maxStock: number;

  location?: string;

  supplier?: string;

  barcode?: string;

  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock';

  lastMovement?: string;

  avgCost?: number;

  totalValue?: number;

  company_id: string;

  created_at: string;

  updated_at: string;

}



export interface StockMovement {

  id: string;

  item_id: string;

  item_name?: string;

  type: 'entry' | 'exit' | 'adjustment' | 'transfer';

  quantity: number;

  unit_price?: number;

  total_value?: number;

  reason?: string;

  reference?: string;

  supplier?: string;

  location?: string;

  user_id?: string;

  company_id: string;

  created_at: string;

  updated_at: string;

}



export interface ProductionOrder {

  id: string;

  reference: string;

  product_id: string;

  product_name?: string;

  quantity_requested: number;

  quantity_produced?: number;

  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  start_date?: string;

  end_date?: string;

  expected_date?: string;

  priority: 'low' | 'medium' | 'high' | 'urgent';

  notes?: string;

  company_id: string;

  created_at: string;

  updated_at: string;

}



export interface Supplier {

  id: string;

  name: string;

  contact_person?: string;

  email?: string;

  phone?: string;

  address?: string;

  city?: string;

  postal_code?: string;

  country?: string;

  payment_terms?: number;

  rating?: number;

  status: 'active' | 'inactive';

  company_id: string;

  created_at: string;

  updated_at: string;

}



export interface InventoryMetrics {

  totalItems: number;

  totalValue: number;

  lowStockItems: number;

  outOfStockItems: number;

  totalMovements: number;

  pendingOrders: number;

  activeSuppliers: number;

  avgStockRotation: number;

}



export class InventoryService {

  // Méthodes pour les articles d'inventaire

  static async getInventoryItems(companyId?: string): Promise<InventoryItem[]> {

    try {

      const company_id = companyId || await this.getCurrentCompanyId();

      

      const { data, error } = await supabase

        .from('inventory_items')

        .select('*')

        .eq('company_id', company_id)

        .order('name', { ascending: true });



      if (error) throw error;

      

      // Calculer le statut basé sur le stock et transformer les noms de propriétés

      return (data || []).map(item => ({

        ...item,

        status: this.calculateItemStatus(item.current_stock, item.min_stock),

        totalValue: item.current_stock * (item.avg_cost || item.purchase_price),

        // Transformer les propriétés snake_case en camelCase pour la cohérence

        sellingPrice: item.selling_price,

        purchasePrice: item.purchase_price,

        currentStock: item.current_stock,

        minStock: item.min_stock,

        maxStock: item.max_stock,

        lastMovement: item.last_movement,

        avgCost: item.avg_cost,

        total_value: undefined, // Supprimer l'ancienne propriété

        selling_price: undefined,

        purchase_price: undefined,

        current_stock: undefined,

        min_stock: undefined,

        max_stock: undefined,

        last_movement: undefined,

        avg_cost: undefined

      }));

    } catch (error) {

      console.error('Error fetching inventory items:', error instanceof Error ? error.message : String(error));

      return [];

    }

  }



  static async createInventoryItem(itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<InventoryItem> {

    try {

      const company_id = await this.getCurrentCompanyId();

      

      const { data, error } = await supabase

        .from('inventory_items')

        .insert({

          reference: itemData.reference,

          name: itemData.name,

          description: itemData.description,

          category: itemData.category,

          unit: itemData.unit,

          purchase_price: itemData.purchasePrice,

          selling_price: itemData.sellingPrice,

          current_stock: itemData.currentStock,

          min_stock: itemData.minStock,

          max_stock: itemData.maxStock,

          location: itemData.location,

          supplier: itemData.supplier,

          barcode: itemData.barcode,

          company_id,

          status: this.calculateItemStatus(itemData.currentStock, itemData.minStock),

          total_value: itemData.currentStock * itemData.purchasePrice,

          avg_cost: itemData.purchasePrice

        })

        .select()

        .single();



      if (error) throw error;

      return data;

    } catch (error) {

      console.error('Error creating inventory item:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {

    try {

      // Transformer les propriétés camelCase en snake_case pour la base de données

      const dbUpdates: any = {};

      

      if (updates.reference !== undefined) dbUpdates.reference = updates.reference;

      if (updates.name !== undefined) dbUpdates.name = updates.name;

      if (updates.description !== undefined) dbUpdates.description = updates.description;

      if (updates.category !== undefined) dbUpdates.category = updates.category;

      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;

      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;

      if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;

      if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;

      if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;

      if (updates.maxStock !== undefined) dbUpdates.max_stock = updates.maxStock;

      if (updates.location !== undefined) dbUpdates.location = updates.location;

      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;

      if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;

      if (updates.status !== undefined) dbUpdates.status = updates.status;

      if (updates.lastMovement !== undefined) dbUpdates.last_movement = updates.lastMovement;

      if (updates.avgCost !== undefined) dbUpdates.avg_cost = updates.avgCost;

      if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;



      // Calculer les valeurs dérivées si nécessaire

      if (updates.currentStock !== undefined || updates.minStock !== undefined) {

        dbUpdates.status = this.calculateItemStatus(

          updates.currentStock ?? 0, 

          updates.minStock ?? 0

        );

      }

      

      const { data, error } = await supabase

        .from('inventory_items')

        .update(dbUpdates)

        .eq('id', id)

        .select()

        .single();



      if (error) throw error;

      return data;

    } catch (error) {

      console.error('Error updating inventory item:', error instanceof Error ? error.message : String(error));

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

      console.error('Error deleting inventory item:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  // Méthodes pour les mouvements de stock

  static async getStockMovements(companyId?: string, itemId?: string): Promise<StockMovement[]> {

    try {

      const company_id = companyId || await this.getCurrentCompanyId();

      

      let query = supabase

        .from('stock_movements')

        .select('*, inventory_items(name)')

        .eq('company_id', company_id)

        .order('created_at', { ascending: false });



      if (itemId) {

        query = query.eq('item_id', itemId);

      }



      const { data, error } = await query;



      if (error) throw error;

      

      return (data || []).map(movement => ({

        ...movement,

        item_name: movement.inventory_items?.name

      }));

    } catch (error) {

      console.error('Error fetching stock movements:', error instanceof Error ? error.message : String(error));

      return [];

    }

  }



  static async createStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<StockMovement> {

    try {

      const company_id = await this.getCurrentCompanyId();

      

      const { data, error } = await supabase

        .from('stock_movements')

        .insert({

          ...movementData,

          company_id,

          total_value: (movementData.unit_price || 0) * movementData.quantity

        })

        .select()

        .single();



      if (error) throw error;

      

      // Mettre à jour le stock de l'article

      await this.updateItemStock(movementData.item_id, movementData.quantity, movementData.type);

      

      return data;

    } catch (error) {

      console.error('Error creating stock movement:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  // Méthodes pour les fournisseurs

  static async getSuppliers(companyId?: string): Promise<Supplier[]> {

    try {

      const company_id = companyId || await this.getCurrentCompanyId();

      

      const { data, error } = await supabase

        .from('suppliers')

        .select('*')

        .eq('company_id', company_id)

        .order('name', { ascending: true });



      if (error) throw error;

      return data || [];

    } catch (error) {

      console.error('Error fetching suppliers:', error instanceof Error ? error.message : String(error));

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

        .select()

        .single();



      if (error) throw error;

      return data;

    } catch (error) {

      console.error('Error creating supplier:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  // Méthodes pour les métriques

  static async getInventoryMetrics(companyId?: string): Promise<InventoryMetrics> {

    try {

      const company_id = companyId || await this.getCurrentCompanyId();

      

      // Récupérer les articles

      const { data: items, error: itemsError } = await supabase

        .from('inventory_items')

        .select('current_stock, min_stock, purchase_price, avg_cost')

        .eq('company_id', company_id);



      if (itemsError) throw itemsError;



      // Récupérer les mouvements récents

      const { data: movements, error: movementsError } = await supabase

        .from('stock_movements')

        .select('id')

        .eq('company_id', company_id)

        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());



      if (movementsError) throw movementsError;



      // Récupérer les fournisseurs actifs

      const { data: suppliers, error: suppliersError } = await supabase

        .from('suppliers')

        .select('id')

        .eq('company_id', company_id)

        .eq('status', 'active');



      if (suppliersError) throw suppliersError;



      // Calculer les métriques

      const totalItems = items?.length || 0;

      const totalValue = items?.reduce((sum, item) => sum + (item.current_stock * (item.avg_cost || item.purchase_price)), 0) || 0;

      const lowStockItems = items?.filter(item => item.current_stock <= item.min_stock && item.current_stock > 0).length || 0;

      const outOfStockItems = items?.filter(item => item.current_stock === 0).length || 0;



      return {

        totalItems,

        totalValue,

        lowStockItems,

        outOfStockItems,

        totalMovements: movements?.length || 0,

        pendingOrders: 0, // À implémenter avec les commandes

        activeSuppliers: suppliers?.length || 0,

        avgStockRotation: 0 // À calculer plus tard

      };

    } catch (error) {

      console.error('Error fetching inventory metrics:', error instanceof Error ? error.message : String(error));

      return { totalValue: 0, totalItems: 0, lowStockItems: 0, outOfStockItems: 0, pendingOrders: 0, activeSuppliers: 0, avgStockRotation: 0 };

    }

  }



  // Méthodes utilitaires

  private static calculateItemStatus(currentStock: number, minStock: number): 'active' | 'low_stock' | 'out_of_stock' {

    if (currentStock === 0) return 'out_of_stock';

    if (currentStock <= minStock) return 'low_stock';

    return 'active';

  }



  private static async updateItemStock(itemId: string, quantity: number, movementType: string): Promise<void> {

    try {

      // Récupérer le stock actuel

      const { data: item, error: fetchError } = await supabase

        .from('inventory_items')

        .select('current_stock')

        .eq('id', itemId)

        .single();



      if (fetchError) throw fetchError;



      // Calculer le nouveau stock

      let newStock = item.current_stock;

      if (movementType === 'entry') {

        newStock += quantity;

      } else if (movementType === 'exit') {

        newStock -= quantity;

      } else if (movementType === 'adjustment') {

        newStock = quantity; // Ajustement absolu

      }



      // Mettre à jour le stock

      const { error: updateError } = await supabase

        .from('inventory_items')

        .update({ 

          current_stock: Math.max(0, newStock),

          last_movement: new Date().toISOString()

        })

        .eq('id', itemId);



      if (updateError) throw updateError;

    } catch (error) {

      console.error('Error updating item stock:', error instanceof Error ? error.message : String(error));

      throw error;

    }

  }



  private static async getCurrentCompanyId(): Promise<string> {

    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      

      // Pour l'instant, utiliser un UUID de test valide

      return '550e8400-e29b-41d4-a716-446655440000';

    } catch (error) {

      console.error('Error getting current company ID:', error instanceof Error ? error.message : String(error));

      return '550e8400-e29b-41d4-a716-446655440000';

    }

  }

}



export default InventoryService;
