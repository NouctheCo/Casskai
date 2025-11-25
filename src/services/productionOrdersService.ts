import { supabase } from '@/lib/supabase';

export interface ProductionOrderComponent {
  itemId: string;
  itemName: string;
  needed: number;
  allocated: number;
  available: number;
}

export interface ProductionOrder {
  id: string;
  company_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  expected_date: string;
  completed_date?: string;
  priority: 'low' | 'medium' | 'high';
  cost: number;
  responsible?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionOrderWithComponents extends ProductionOrder {
  components?: ProductionOrderComponent[];
}

class ProductionOrdersService {
  async getCurrentCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userCompanies, error } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error || !userCompanies) {
      throw new Error('No active company found');
    }

    return userCompanies.company_id;
  }

  async getProductionOrders(options?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductionOrderWithComponents[]> {
    try {
      const companyId = await this.getCurrentCompanyId();

      let query = supabase
        .from('production_orders')
        .select('*')
        .eq('company_id', companyId);

      // Filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      // Sorting
      query = query.order('expected_date', { ascending: true });

      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching production orders:', error);
        throw new Error(`Failed to fetch production orders: ${error.message}`);
      }

      // For each order, fetch components
      const ordersWithComponents = await Promise.all(
        (data || []).map(async (order) => {
          const { data: components } = await supabase
            .from('production_order_components')
            .select(`
              inventory_item_id,
              needed,
              allocated,
              inventory_items!inner(id, name, quantity)
            `)
            .eq('production_order_id', order.id);

          const transformedComponents = (components || []).map((comp: any) => ({
            itemId: comp.inventory_item_id,
            itemName: comp.inventory_items.name,
            needed: comp.needed,
            allocated: comp.allocated,
            available: comp.inventory_items.quantity
          }));

          return {
            ...order,
            components: transformedComponents
          };
        })
      );

      return ordersWithComponents;
    } catch (error) {
      console.error('Error in getProductionOrders:', error);
      throw error;
    }
  }

  async getProductionOrderById(id: string): Promise<ProductionOrderWithComponents | null> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch production order: ${error.message}`);
      }

      // Fetch components
      const { data: components } = await supabase
        .from('production_order_components')
        .select(`
          inventory_item_id,
          needed,
          allocated,
          inventory_items!inner(id, name, quantity)
        `)
        .eq('production_order_id', data.id);

      const transformedComponents = (components || []).map((comp: any) => ({
        itemId: comp.inventory_item_id,
        itemName: comp.inventory_items.name,
        needed: comp.needed,
        allocated: comp.allocated,
        available: comp.inventory_items.quantity
      }));

      return {
        ...data,
        components: transformedComponents
      };
    } catch (error) {
      console.error('Error in getProductionOrderById:', error);
      throw error;
    }
  }

  async createProductionOrder(
    orderData: Omit<ProductionOrder, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
    components: Omit<ProductionOrderComponent, 'itemName' | 'available'>[] = []
  ): Promise<ProductionOrderWithComponents> {
    try {
      const companyId = await this.getCurrentCompanyId();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      // Create the production order
      const { data: order, error: orderError } = await supabase
        .from('production_orders')
        .insert({
          company_id: companyId,
          ...orderData
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create production order: ${orderError.message}`);
      }

      // Create components
      if (components.length > 0) {
        const componentInserts = components.map(comp => ({
          production_order_id: order.id,
          inventory_item_id: comp.itemId,
          needed: comp.needed,
          allocated: comp.allocated
        }));

        const { error: componentsError } = await supabase
          .from('production_order_components')
          .insert(componentInserts);

        if (componentsError) {
          // Rollback the order if components fail
          await supabase.from('production_orders').delete().eq('id', order.id);
          throw new Error(`Failed to create production order components: ${componentsError.message}`);
        }
      }

      // Retrieve the complete order
      const createdOrder = await this.getProductionOrderById(order.id);
      if (!createdOrder) {
        throw new Error('Failed to retrieve created production order');
      }

      return createdOrder;
    } catch (error) {
      console.error('Error in createProductionOrder:', error);
      throw error;
    }
  }

  async updateProductionOrderStatus(
    id: string,
    status: ProductionOrder['status']
  ): Promise<ProductionOrderWithComponents> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const updateData: any = { status };

      // If completed, set completed_date
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('production_orders')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update production order status: ${error.message}`);
      }

      const updatedOrder = await this.getProductionOrderById(id);
      if (!updatedOrder) {
        throw new Error('Failed to retrieve updated production order');
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error in updateProductionOrderStatus:', error);
      throw error;
    }
  }

  async deleteProductionOrder(id: string): Promise<void> {
    try {
      const companyId = await this.getCurrentCompanyId();

      const { error } = await supabase
        .from('production_orders')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to delete production order: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteProductionOrder:', error);
      throw error;
    }
  }
}

export const productionOrdersService = new ProductionOrdersService();
export default productionOrdersService;
