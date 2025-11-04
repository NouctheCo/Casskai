// hooks/useTenant.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TenantConfig, TenantFeatures } from '../types/tenant';
import { TenantService } from '../services/tenantService';

export function useTenant() {
  const [tenantService] = useState(() => TenantService.getInstance());
  const [currentTenant, setCurrentTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeTenant();
  }, []);

  const initializeTenant = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Déterminer l'ID du tenant depuis l'URL ou la configuration
      const tenantId = getTenantIdFromUrl() || 'demo-benin';
      
      const success = await tenantService.initializeTenant(tenantId);
      if (success) {
        setCurrentTenant(tenantService.getCurrentTenant());
      } else {
        setError('Impossible d\'initialiser le tenant');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getTenantIdFromUrl = (): string | null => {
    // Extraire l'ID du tenant depuis l'URL (ex: tenant.casskai.app)
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'casskai') {
      return subdomain;
    }
    
    // Ou depuis un paramètre d'URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant');
  };

  const canAccess = (feature: keyof TenantFeatures): boolean => {
    return tenantService.canAccessFeature(feature);
  };

  const getQuota = (resource: 'users' | 'companies'): number => {
    return tenantService.getRemainingQuota(resource);
  };

  return {
    currentTenant,
    isLoading,
    error,
    canAccess,
    getQuota,
    supabase,
    reinitialize: initializeTenant
  };
}
