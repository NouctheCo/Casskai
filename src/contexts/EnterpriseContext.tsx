import React, { createContext, useContext, useState, useEffect } from 'react';
import { Enterprise, EnterpriseTaxConfiguration } from '../types/enterprise.types';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';

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

// Entreprise par défaut supprimée - causait des erreurs UUID
// L'utilisateur doit maintenant terminer l'onboarding pour créer sa première entreprise

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEnterprises = async () => {
    // First try to load from Supabase
    console.log('🏢 Loading enterprises from Supabase...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
          .eq('user_id', user.id);

        if (!error && userCompanies && userCompanies.length > 0) {
          // Convert Supabase format to Enterprise format
          const enterprises = userCompanies.map((uc: any): Enterprise => ({
            id: uc.companies.id,
            name: uc.companies.name,
            registrationNumber: uc.companies.registration_number || '',
            vatNumber: uc.companies.tax_number || '',
            countryCode: uc.companies.country || 'FR',
            address: {
              street: uc.companies.address || '',
              postalCode: uc.companies.postal_code || '',
              city: uc.companies.city || '',
              country: uc.companies.country || 'FR'
            },
            taxRegime: {
              id: 'default',
              code: 'NORMAL',
              name: 'Régime réel normal',
              type: 'realNormal' as const,
              vatPeriod: 'monthly' as const
            },
            fiscalYearStart: uc.companies.fiscal_year_start || 1,
            fiscalYearEnd: 12,
            currency: uc.companies.default_currency || 'EUR',
            createdAt: new Date(uc.companies.created_at).getTime(),
            updatedAt: new Date(uc.companies.updated_at).getTime(),
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
          }));

          setEnterprises(enterprises);
          
          // Determine current enterprise based on preferred_company_id or default
          const preferredCompanyId = user.user_metadata?.preferred_company_id;
          let currentEnterpriseId = null;

          if (preferredCompanyId) {
            const preferredEnterprise = enterprises.find(e => e.id === preferredCompanyId);
            if (preferredEnterprise) {
              currentEnterpriseId = preferredCompanyId;
            }
          }

          if (!currentEnterpriseId) {
            const defaultCompany = userCompanies.find((uc: any) => uc.is_default);
            currentEnterpriseId = defaultCompany?.company_id || enterprises[0]?.id || null;
          }

          setCurrentEnterpriseId(currentEnterpriseId);
          
          // Cache in localStorage
          localStorage.setItem('casskai_enterprises', JSON.stringify(enterprises));
          if (currentEnterpriseId) {
            localStorage.setItem('casskai_current_enterprise', currentEnterpriseId);
          }
          
          setLoading(false);
          console.log('✅ Enterprises loaded from Supabase');
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error loading enterprises from Supabase:', error instanceof Error ? error.message : String(error));
    }

    // Fallback to localStorage
    console.log('🏢 Falling back to localStorage...');
    
    const savedEnterprises = localStorage.getItem('casskai_enterprises');
    let enterpriseList: Enterprise[] = [];
    
    if (savedEnterprises) {
      try {
        enterpriseList = JSON.parse(savedEnterprises);
        console.log('📦 Enterprises loaded from localStorage:', enterpriseList);
      } catch (error) {
        console.error('❌ Error parsing enterprises from localStorage:', error instanceof Error ? error.message : String(error));
      }
    }
    
    // If no enterprises, wait for onboarding to create one
    if (enterpriseList.length === 0) {
      console.log('🏢 No enterprises found. User needs to complete onboarding.');

      // Ne pas utiliser l'entreprise par défaut avec un ID invalide
      // L'utilisateur doit terminer l'onboarding pour créer sa première entreprise
    }
    
    setEnterprises(enterpriseList);
    
    // Determine current enterprise
    const savedCurrentId = localStorage.getItem('casskai_current_enterprise');
    if (savedCurrentId && enterpriseList.find(e => e.id === savedCurrentId)) {
      setCurrentEnterpriseId(savedCurrentId);
    } else if (enterpriseList.length > 0) {
      setCurrentEnterpriseId(enterpriseList[0].id);
      localStorage.setItem('casskai_current_enterprise', enterpriseList[0].id);
    } else {
      setCurrentEnterpriseId(null);
    }
    
    setLoading(false);
    console.log('✅ Enterprises loaded from localStorage');
  };

  useEffect(() => {
    loadEnterprises();
    
    // Listen for custom refresh event
    const handleRefresh = () => {
      console.log('🔄 Actualisation forcée des entreprises...');
      loadEnterprises();
    };
    
    window.addEventListener('enterpriseContextRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('enterpriseContextRefresh', handleRefresh);
    };
  }, []);

  const currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId) || null;

  const addEnterprise = async (enterpriseData: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🏢 Ajout d\'une nouvelle entreprise:', enterpriseData);
    
    const newEnterprise: Enterprise = {
      ...enterpriseData,
      id: `enterprise-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedEnterprises = [...enterprises, newEnterprise];
    setEnterprises(updatedEnterprises);
    localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
    
    toast({
      title: 'Entreprise ajoutée',
      description: `L'entreprise ${newEnterprise.name} a été ajoutée avec succès.`
    });
    
    console.log('✅ Entreprise ajoutée avec succès');
  };

  const updateEnterprise = async (id: string, data: Partial<Enterprise>) => {
    console.log('🔄 Mise à jour de l\'entreprise:', id, data);

    const updatedEnterprises = enterprises.map(enterprise =>
      enterprise.id === id
        ? { ...enterprise, ...data, updatedAt: Date.now() }
        : enterprise
    );

    setEnterprises(updatedEnterprises);
    localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
    
    toast({
      title: 'Entreprise mise à jour',
      description: 'Les informations de l\'entreprise ont été mises à jour avec succès.'
    });
    
    console.log('✅ Entreprise mise à jour avec succès');
  };

  const deleteEnterprise = async (id: string) => {
    console.log('🗑️ Suppression de l\'entreprise:', id);
    
    const updatedEnterprises = enterprises.filter(enterprise => enterprise.id !== id);
    setEnterprises(updatedEnterprises);
    localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
    
    // Si l'entreprise supprimée était l'entreprise actuelle, changer pour une autre
    if (currentEnterpriseId === id) {
      if (updatedEnterprises.length > 0) {
        setCurrentEnterpriseId(updatedEnterprises[0].id);
        localStorage.setItem('casskai_current_enterprise', updatedEnterprises[0].id);
      } else {
        setCurrentEnterpriseId(null);
        localStorage.removeItem('casskai_current_enterprise');
      }
    }
    
    toast({
      title: 'Entreprise supprimée',
      description: 'L\'entreprise a été supprimée avec succès.'
    });
    
    console.log('✅ Entreprise supprimée avec succès');
  };

  const switchEnterprise = (enterpriseId: string) => {
    console.log('🔄 Changement d\'entreprise:', enterpriseId);
    setCurrentEnterpriseId(enterpriseId);
    localStorage.setItem('casskai_current_enterprise', enterpriseId);
    
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

    // Configuration fiscale par défaut basée sur le pays
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
    setCurrentEnterpriseId,
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