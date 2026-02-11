/**
 * Helper function pour créer une entreprise pendant l'onboarding
 * Évite le problème de la fonction RPC manquante
 */

import { supabase } from '@/lib/supabase';
import { devLogger } from '@/utils/devLogger';

export async function createCompanyDirectly(
  userId: string,
  companyData: Record<string, any>
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  try {
    devLogger.debug('🔧 Creating company via direct insert...');
    
    // Create company directly via Supabase
    const { data: createdCompany, error: companyInsertError } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (companyInsertError) {
      devLogger.error('❌ Company insert error:', companyInsertError);
      throw companyInsertError;
    }

    if (!createdCompany?.id) {
      throw new Error('Company was not created (no ID returned)');
    }

    devLogger.info('✅ Company created successfully:', createdCompany.id);

    // Create user-company relationship in company_users table (RLS requirement)
    devLogger.debug('🔧 Creating company_users link');

    const { error: companyUserError } = await supabase
      .from('company_users')
      .insert([{
        user_id: userId,
        company_id: createdCompany.id,
        role: 'owner'
      }]);

    if (companyUserError) {
      devLogger.error('❌ company_users insert error:', companyUserError);
      throw companyUserError;
    }

    devLogger.info('✅ company_users link created');

    // Also insert into user_companies for compatibility
    devLogger.debug('🔧 Creating user_companies link');

    const { error: userCompanyError } = await supabase
      .from('user_companies')
      .insert([{
        user_id: userId,
        company_id: createdCompany.id,
        role: 'owner',
        is_default: true,
        is_active: true,
        status: 'active'
      }]);

    if (userCompanyError) {
      devLogger.error('❌ user_companies insert error:', userCompanyError);
      throw userCompanyError;
    }

    devLogger.info('✅ user_companies link created');

    // Create default warehouse
    devLogger.debug('🔧 Creating default warehouse');

    const { error: warehouseError } = await supabase
      .from('warehouses')
      .insert([{
        company_id: createdCompany.id,
        name: 'Entrepôt principal',
        code: 'WH-MAIN',
        is_default: true,
        is_active: true
      }]);

    if (warehouseError) {
      devLogger.error('❌ warehouse insert error:', warehouseError);
      throw warehouseError;
    }

    devLogger.info('✅ Company, company_users, and warehouse created successfully:', createdCompany.id);

    return {
      success: true,
      companyId: createdCompany.id
    };
  } catch (error: any) {
    devLogger.error('❌ Company creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create company'
    };
  }
}
