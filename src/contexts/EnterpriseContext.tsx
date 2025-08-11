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

// Entreprise par défaut
const DEFAULT_ENTERPRISE: Enterprise = {
  id: 'default-enterprise',
  name: 'Mon Entreprise',
  legalName: 'Mon Entreprise SAS',
  country: 'FR',
  currency: 'EUR',
  accountingStandard: 'PCG',
  registrationNumber: '',
  vatNumber: '',
  street: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  website: '',
  shareCapital: '10000',
  ceoName: '',
  sector: 'tech',
  fiscalYearStart: 1,
  fiscalYearEnd: 12,
  isSetupCompleted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEnterprises = () => {
    console.log('🏢 Chargement des entreprises...');
    
    const savedEnterprises = localStorage.getItem('casskai_enterprises');
    let enterpriseList: Enterprise[] = [];
    
    if (savedEnterprises) {
      try {
        enterpriseList = JSON.parse(savedEnterprises);
        console.log('📦 Entreprises chargées depuis localStorage:', enterpriseList);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des entreprises:', error);
      }
    }
    
    // Si pas d'entreprises, créer l'entreprise par défaut
    if (enterpriseList.length === 0) {
      enterpriseList = [DEFAULT_ENTERPRISE];
      localStorage.setItem('casskai_enterprises', JSON.stringify(enterpriseList));
      console.log('🏢 Entreprise par défaut créée');
    }
    
    setEnterprises(enterpriseList);
    
    // Définir l'entreprise actuelle
    const savedCurrentId = localStorage.getItem('casskai_current_enterprise');
    if (savedCurrentId && enterpriseList.find(e => e.id === savedCurrentId)) {
      setCurrentEnterpriseId(savedCurrentId);
    } else {
      setCurrentEnterpriseId(enterpriseList[0].id);
      localStorage.setItem('casskai_current_enterprise', enterpriseList[0].id);
    }
    
    console.log('✅ Entreprises chargées avec succès');
  };

  useEffect(() => {
    loadEnterprises();
    setLoading(false);
    
    // Écouter les changements localStorage pour rester synchronisé
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'casskai_enterprises' || e.key === 'casskai_current_enterprise') {
        console.log('📦 localStorage modifié, rechargement des entreprises...');
        loadEnterprises();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId) || null;

  const addEnterprise = async (enterpriseData: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🏢 Ajout d\'une nouvelle entreprise (Supabase):', enterpriseData);
    // Création dans Supabase
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          name: enterpriseData.name,
          country: enterpriseData.address?.country || '',
          default_currency: enterpriseData.currency || 'EUR',
          default_locale: 'fr',
          timezone: 'Europe/Paris',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error || !data || !data[0]) {
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'entreprise dans Supabase."
      });
      return;
    }

    const supabaseEnterprise = data[0];
    // Création locale avec l'ID Supabase
    const newEnterprise: Enterprise = {
      ...enterpriseData,
      id: supabaseEnterprise.id,
    createdAt: new Date(),
    updatedAt: new Date(),
      countryCode: supabaseEnterprise.country,
      address: {
        ...enterpriseData.address,
        country: supabaseEnterprise.country,
      },
      currency: supabaseEnterprise.default_currency || 'EUR',
      isActive: true,
      settings: enterpriseData.settings || {},
      taxRegime: enterpriseData.taxRegime,
    };
    const updatedEnterprises: Enterprise[] = [...enterprises, newEnterprise];
    setEnterprises(updatedEnterprises);
    setCurrentEnterpriseId(newEnterprise.id);
    localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
    localStorage.setItem('casskai_current_enterprise', newEnterprise.id);
    toast({
      title: 'Entreprise ajoutée',
      description: `L'entreprise ${newEnterprise.name} a été ajoutée et sélectionnée.`
    });
    console.log('✅ Entreprise ajoutée et synchronisée avec Supabase');
  };

  const updateEnterprise = async (id: string, data: Partial<Enterprise>) => {
    console.log('🔄 Mise à jour de l\'entreprise:', id, data);
    
    const updatedEnterprises = enterprises.map(enterprise =>
      enterprise.id === id
        ? { ...enterprise, ...data, updatedAt: new Date().toISOString() }
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
    if (currentEnterpriseId === id && updatedEnterprises.length > 0) {
      setCurrentEnterpriseId(updatedEnterprises[0].id);
      localStorage.setItem('casskai_current_enterprise', updatedEnterprises[0].id);
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