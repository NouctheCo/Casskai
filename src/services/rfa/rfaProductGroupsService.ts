import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type RFAProductGroup = {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  description: string | null;
  is_active: boolean | null;
  color: string | null;
};

export type RFAProductGroupItem = {
  id: string;
  product_group_id: string;
  product_reference: string;
  product_name: string | null;
  article_id: string | null;
};

export const rfaProductGroupsService = {
  async listGroups(companyId: string): Promise<RFAProductGroup[]> {
    const { data, error } = await supabase
      .from('rfa_product_groups')
      .select('id, company_id, code, name, description, is_active, color')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('RFAProductGroups', 'listGroups error', error);
      throw error;
    }
    return (data || []) as any;
  },

  async upsertGroup(input: {
    company_id: string;
    id?: string;
    code?: string | null;
    name: string;
    description?: string | null;
    is_active?: boolean;
    color?: string | null;
  }): Promise<RFAProductGroup> {
    const payload: any = {
      company_id: input.company_id,
      code: input.code ?? null,
      name: input.name,
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      color: input.color ?? null
    };

    if (input.id) payload.id = input.id;

    const { data, error } = await supabase
      .from('rfa_product_groups')
      .upsert(payload, { onConflict: 'company_id,code' })
      .select('id, company_id, code, name, description, is_active, color')
      .single();

    if (error) {
      logger.error('RFAProductGroups', 'upsertGroup error', error);
      throw error;
    }

    return data as any;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('rfa_product_groups').delete().eq('id', groupId);
    if (error) {
      logger.error('RFAProductGroups', 'deleteGroup error', error);
      throw error;
    }
  },

  async listItems(groupId: string): Promise<RFAProductGroupItem[]> {
    const { data, error } = await supabase
      .from('rfa_product_group_items')
      .select('id, product_group_id, product_reference, product_name, article_id')
      .eq('product_group_id', groupId)
      .order('product_reference', { ascending: true });

    if (error) {
      logger.error('RFAProductGroups', 'listItems error', error);
      throw error;
    }

    return (data || []) as any;
  }
};
