import { supabase } from './config';
import { handleSupabaseError, isRLSError } from './errors';
import { logger } from '@/utils/logger';

/**
 * Helper function to get current user's companies
 * @param userId - Optional user ID (if not provided, will use current session user)
 * @returns Array of user companies with company details
 */
export const getUserCompanies = async (userId?: string) => {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from('user_companies')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        country,
        default_currency,
        default_locale,
        timezone,
        is_active
      )
    `)
    .eq('user_id', resolvedUserId);

  if (error) {
    // Gestion gracieuse des erreurs RLS/500 - permet l'onboarding
    if (isRLSError(error)) {
      logger.warn('🔄 RLS/Policy error in getUserCompanies - returning empty array for onboarding');
      return [];
    }
    throw new Error(handleSupabaseError(error));
  }

  return data || [];
};

/**
 * Helper function to get current user's default company
 * @param userId - Optional user ID (if not provided, will use current session user)
 * @returns The default company or first company, or null if none found
 */
export const getCurrentCompany = async (userId?: string) => {
  const companies = await getUserCompanies(userId);
  const defaultCompany = companies.find(uc => uc.is_default);
  return defaultCompany?.companies || companies[0]?.companies || null;
};
