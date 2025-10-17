import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Enterprise, EnterpriseTaxConfiguration } from '../types/enterprise.types';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS, readUserScopedItem, writeUserScopedItem, removeUserScopedItem } from '@/utils/userStorage';
import { logger } from '@/utils/logger';

interface EnterpriseContextType {
  enterprises: Enterprise[];
  currentEnterprise: Enterprise | null;
  currentEnterpriseId: string | null;
  setCurrentEnterpriseId: (id: string) => void;
  addEnterprise: (enterprise: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
  getEnterpriseTaxConfig: (enterpriseId: string) => EnterpriseTaxConfiguration | null;
  switchEnterprise: (enterpriseId: string) => void;
  loading: boolean;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};

const mapSupabaseEnterprise = (record: any): Enterprise => ({
  id: record.companies.id,
  name: record.companies.name,
  registrationNumber: record.companies.registration_number || '',
  vatNumber: record.companies.tax_number || '',
  countryCode: record.companies.country || 'FR',
  address: {
    street: record.companies.address || '',
    postalCode: record.companies.postal_code || '',
    city: record.companies.city || '',
    country: record.companies.country || 'FR'
  },
  taxRegime: {
    id: 'default',
    code: 'NORMAL',
    name: 'Regime reel normal',
    type: 'realNormal' as const,
    vatPeriod: 'monthly' as const
  },
  fiscalYearStart: record.companies.fiscal_year_start || 1,
  fiscalYearEnd: 12,
  currency: record.companies.default_currency || 'EUR',
  createdAt: new Date(record.companies.created_at).getTime(),
  updatedAt: new Date(record.companies.updated_at).getTime(),
  isActive: true,
  settings: {
    defaultPaymentTerms: 30,
    taxReminderDays: 15,
    autoCalculateTax: true,
    roundingRule: 'nearest' as const,
    emailNotifications: true,
    language: 'fr',
    timezone: 'Europe/Paris'
  }
});

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const persistEnterprisesForUser = useCallback((userId: string, enterpriseList: Enterprise[]) => {
    writeUserScopedItem(STORAGE_KEYS.ENTERPRISES, userId, JSON.stringify(enterpriseList));
  }, []);

  const persistCurrentEnterpriseForUser = useCallback((userId: string, enterpriseId: string | null) => {
    writeUserScopedItem(STORAGE_KEYS.CURRENT_ENTERPRISE, userId, enterpriseId);
  }, []);

  const setEnterprisesSafely = useCallback((list: Enterprise[], userIdOverride?: string | null) => {
    setEnterprises(list);

    const targetUserId = typeof userIdOverride === 'string'
      ? userIdOverride
      : userIdOverride === null
        ? null
        : currentUserId;

    if (targetUserId) {
      persistEnterprisesForUser(targetUserId, list);
    }
  }, [currentUserId, persistEnterprisesForUser]);

  const setCurrentEnterpriseIdSafely = useCallback((enterpriseId: string | null, userIdOverride?: string | null) => {
    setCurrentEnterpriseId(enterpriseId);

    const targetUserId = typeof userIdOverride === 'string'
      ? userIdOverride
      : userIdOverride === null
        ? null
        : currentUserId;

    if (targetUserId) {
      persistCurrentEnterpriseForUser(targetUserId, enterpriseId);
    }
  }, [currentUserId, persistCurrentEnterpriseForUser]);

  const loadEnterprisesFromCache = useCallback((userId: string | null) => {
    if (!userId) {
      setEnterprisesSafely([], null);
      setCurrentEnterpriseIdSafely(null, null);
      return;
    }

    const savedEnterprisesRaw = readUserScopedItem(STORAGE_KEYS.ENTERPRISES, userId);

    if (savedEnterprisesRaw) {
      try {
        const parsedEnterprises: Enterprise[] = JSON.parse(savedEnterprisesRaw);
        setEnterprisesSafely(parsedEnterprises, userId);
      } catch (error) {
        logger.error('? Error parsing cached enterprises:', error);
        setEnterprisesSafely([], userId);
      }
    } else {
      setEnterprisesSafely([], userId);
    }

    const savedCurrentId = readUserScopedItem(STORAGE_KEYS.CURRENT_ENTERPRISE, userId);
    setCurrentEnterpriseIdSafely(savedCurrentId, userId);
  }, [setCurrentEnterpriseIdSafely, setEnterprisesSafely]);

  const loadEnterprises = useCallback(async () => {
    logger.info('?? Loading enterprises from Supabase...');
    setLoading(true);

    let resolvedUserId: string | null = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      resolvedUserId = user?.id ?? null;
      setCurrentUserId(resolvedUserId);

      if (!resolvedUserId) {
        setEnterprisesSafely([], null);
        setCurrentEnterpriseIdSafely(null, null);
        return;
      }

      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          is_default,
          companies (
            id,
            name,
            country,
            default_currency,
            registration_number,
            tax_number,
            address,
            city,
            postal_code,
            phone,
            email,
            website,
            sector,
            fiscal_year_start,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', resolvedUserId);

      if (!error && userCompanies && userCompanies.length > 0) {
        const supabaseEnterprises = userCompanies.map(mapSupabaseEnterprise);

        setEnterprisesSafely(supabaseEnterprises, resolvedUserId);

        const preferredCompanyId = user.user_metadata?.preferred_company_id;
        let resolvedCurrentId: string | null = null;

        if (preferredCompanyId) {
          const preferredEnterprise = supabaseEnterprises.find(e => e.id === preferredCompanyId);
          if (preferredEnterprise) {
            resolvedCurrentId = preferredCompanyId;
          }
        }

        if (!resolvedCurrentId) {
          const defaultCompany = userCompanies.find((uc: any) => uc.is_default);
          resolvedCurrentId = defaultCompany?.company_id || supabaseEnterprises[0]?.id || null;
        }

        setCurrentEnterpriseIdSafely(resolvedCurrentId, resolvedUserId);

        logger.info('? Enterprises loaded from Supabase');
        return;
      }

      logger.info('?? No enterprises fetched from Supabase, falling back to cached data');
      loadEnterprisesFromCache(resolvedUserId);
    } catch (error) {
      logger.error('? Error loading enterprises from Supabase:', error);
      loadEnterprisesFromCache(resolvedUserId ?? currentUserId);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadEnterprisesFromCache, setCurrentEnterpriseIdSafely, setEnterprisesSafely]);

  useEffect(() => {
    loadEnterprises();

    const handleRefresh = () => {
      logger.info('?? Actualisation forcée des entreprises...');
      loadEnterprises();
    };

    window.addEventListener('enterpriseContextRefresh', handleRefresh);
    return () => {
      window.removeEventListener('enterpriseContextRefresh', handleRefresh);
    };
  }, [loadEnterprises]);

  const currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId) || null;

  const addEnterprise = async (enterpriseData: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => {
    logger.info('?? Ajout d\'une nouvelle entreprise:', enterpriseData);

    const newEnterprise: Enterprise = {
      ...enterpriseData,
      id: `enterprise-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };

    const updatedEnterprises = [...enterprises, newEnterprise];
    setEnterprisesSafely(updatedEnterprises);

    toast({
      title: 'Entreprise ajoutée',
      description: `L'entreprise ${newEnterprise.name} a été ajoutée avec succès.`
    });

    logger.info('? Entreprise ajoutée avec succès')
  };

  const updateEnterprise = async (id: string, data: Partial<Enterprise>) => {
    logger.info('?? Mise à jour de l\'entreprise:', id, data);

    const updatedEnterprises = enterprises.map(enterprise =>
      enterprise.id === id
        ? { ...enterprise, ...data, updatedAt: Date.now() }
        : enterprise
    );

    setEnterprisesSafely(updatedEnterprises);

    toast({
      title: 'Entreprise mise à jour',
      description: 'Les informations de l\'entreprise ont été mises à jour avec succès.'
    });

    logger.info('? Entreprise mise à jour avec succès')
  };

  const deleteEnterprise = async (id: string) => {
    logger.info('??? Suppression de l\'entreprise:', id);

    const updatedEnterprises = enterprises.filter(enterprise => enterprise.id !== id);
    setEnterprisesSafely(updatedEnterprises);

    if (currentUserId && updatedEnterprises.length === 0) {
      removeUserScopedItem(STORAGE_KEYS.ENTERPRISES, currentUserId);
      removeUserScopedItem(STORAGE_KEYS.CURRENT_ENTERPRISE, currentUserId);
    }

    if (currentEnterpriseId === id) {
      if (updatedEnterprises.length > 0) {
        setCurrentEnterpriseIdSafely(updatedEnterprises[0].id);
      } else {
        setCurrentEnterpriseIdSafely(null);
      }
    }

    toast({
      title: 'Entreprise supprimée',
      description: 'L\'entreprise a été supprimée avec succès.'
    });

    logger.info('? Entreprise supprimée avec succès')
  };

  const switchEnterprise = (enterpriseId: string) => {
    logger.info('?? Changement d\'entreprise:', enterpriseId);
    setCurrentEnterpriseIdSafely(enterpriseId);

    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (enterprise) {
      toast({
        title: 'Entreprise changée',
        description: `Vous travaillez maintenant sur ${enterprise.name}`
      });
    }
  };

  const getEnterpriseTaxConfig = (enterpriseId: string): EnterpriseTaxConfiguration | null => {
    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (!enterprise) return null;

    return {
      enterpriseId: enterprise.id,
      taxRates: [],
      declarations: [],
      payments: [],
      documents: []
    };
  };

  const value: EnterpriseContextType = {
    enterprises,
    currentEnterprise,
    currentEnterpriseId,
    setCurrentEnterpriseId: (id: string) => setCurrentEnterpriseIdSafely(id),
    addEnterprise,
    updateEnterprise,
    deleteEnterprise,
    getEnterpriseTaxConfig,
    switchEnterprise,
    loading
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};
