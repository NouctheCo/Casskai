import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';

export const useUserAccessData = () => {
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add missing state variables
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState(null);
  const [currentEnterpriseName, setCurrentEnterpriseName] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentGroupName, setCurrentGroupName] = useState(null);

  const fetchUserAccess = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        const errorInfo = handleSupabaseError(sessionError, 'Session check');
        throw new Error(errorInfo.message);
      }

      if (!session?.user) {
        setUserAccess(null);
        setLoading(false);
        return;
      }

      // Fetch user companies with retry logic
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select(`
          id,
          company_id,
          role_id,
          is_default,
          companies (
            id,
            name,
            country,
            default_currency,
            is_active
          ),
          roles (
            id,
            name,
            description,
            is_system_role
          )
        `)
        .eq('user_id', session.user.id);

      if (companiesError) {
        const errorInfo = handleSupabaseError(companiesError, 'User companies fetch');
        
        // If it's a network error and we haven't retried too many times, retry
        if (errorInfo.isNetworkError && retryCount < 3) {
          console.log(`Retrying user access fetch (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => fetchUserAccess(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        
        throw new Error(errorInfo.message);
      }

      // Fetch role permissions for each role
      const roleIds = userCompanies?.map(uc => uc.role_id).filter(Boolean) || [];
      
      let rolePermissions = [];
      if (roleIds.length > 0) {
        const { data: permissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select(`
            role_id,
            permissions (
              id,
              name,
              description,
              module
            )
          `)
          .in('role_id', roleIds);

        if (permissionsError) {
          const errorInfo = handleSupabaseError(permissionsError, 'Role permissions fetch');
          console.warn('Failed to fetch role permissions:', errorInfo.message);
          // Don't throw here, continue with empty permissions
        } else {
          rolePermissions = permissions || [];
        }
      }

      // Structure the user access data
      const accessData = {
        user: session.user,
        companies: userCompanies?.map(uc => ({
          ...uc,
          permissions: rolePermissions
            .filter(rp => rp.role_id === uc.role_id)
            .map(rp => rp.permissions)
            .flat()
        })) || [],
        defaultCompany: userCompanies?.find(uc => uc.is_default) || userCompanies?.[0] || null
      };

      setUserAccess(accessData);
      
      // Set current enterprise/company data if available
      if (accessData.defaultCompany) {
        setCurrentEnterpriseId(accessData.defaultCompany.company_id);
        setCurrentEnterpriseName(accessData.defaultCompany.companies?.name);
      }
      
      setLoading(false);

    } catch (err) {
      console.error('useUserAccessData: Error fetching user access:', err);
      setError(err.message || 'Failed to fetch user access data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAccess();
  }, [fetchUserAccess]);

  const refetch = useCallback(() => {
    fetchUserAccess();
  }, [fetchUserAccess]);

  const clearAccessData = useCallback(() => {
    setUserAccess(null);
    setCurrentEnterpriseId(null);
    setCurrentEnterpriseName(null);
    setCurrentGroupId(null);
    setCurrentGroupName(null);
  }, []);

  return {
    userAccess,
    loading,
    error,
    refetch,
    clearAccessData,
    currentEnterpriseId,
    currentEnterpriseName,
    currentGroupId,
    currentGroupName,
    // Group setters under a setters object
    setters: {
      setCurrentEnterpriseId,
      setCurrentEnterpriseName,
      setCurrentGroupId,
      setCurrentGroupName
    }
  };
};