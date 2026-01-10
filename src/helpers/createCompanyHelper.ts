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

    // Create user-company relationship
    devLogger.debug('🔧 Creating user_companies link');
    
    const { error: userCompanyError } = await supabase
      .from('user_companies')
      .insert([{
        user_id: userId,
        company_id: createdCompany.id,
        role: 'owner',
        is_active: true,
        is_default: true,
        is_owner: true
      }])
      .select()
      .single();

    if (userCompanyError) {
      // If user_companies insert fails, it might already exist (idempotence)
      devLogger.warn('⚠️ user_companies insert warning:', userCompanyError.message);
      
      // Try to update instead
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({
          is_active: true,
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('company_id', createdCompany.id);

      if (updateError) {
        devLogger.error('❌ user_companies update failed:', updateError);
        throw updateError;
      }
    }

    devLogger.info('✅ Company and user_companies created successfully:', createdCompany.id);

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
