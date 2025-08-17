/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback } from 'react';
import { Enterprise, EnterpriseTaxConfiguration } from '../types/enterprise.types';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';
import { EnterpriseContext, EnterpriseContextType } from './EnterpriseContextBase';
export { useEnterprise } from '@/hooks/useEnterpriseContext';

// Note: useEnterprise hook is defined in hooks/useEnterpriseContext.ts to avoid Fast Refresh issues

// Entreprise par défaut
const DEFAULT_ENTERPRISE: Enterprise = {
  id: 'default-enterprise',
  name: 'Mon Entreprise',
  registrationNumber: '',
  vatNumber: '',
  countryCode: 'FR',
  address: {
    street: '',
    postalCode: '',
    city: '',
    country: 'FR',
  },
  taxRegime: {
    id: 'default',
    code: 'default',
    name: 'Régime par défaut',
    type: 'other',
    vatPeriod: 'none',
  },
  fiscalYearStart: 1,
  fiscalYearEnd: 12,
  currency: 'EUR',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  settings: {
    defaultVATRate: '20%',
    defaultPaymentTerms: 30,
    taxReminderDays: 7,
    autoCalculateTax: true,
    roundingRule: 'nearest',
    emailNotifications: true,
    language: 'fr',
    timezone: 'Europe/Paris',
  },
};

// eslint-disable-next-line max-lines-per-function
export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEnterprises = useCallback(() => {
    console.warn('🏢 Chargement des entreprises...');
    
    const savedEnterprises = localStorage.getItem('casskai_enterprises');
    let enterpriseList: Enterprise[] = [];
    
    if (savedEnterprises) {
      try {
  enterpriseList = JSON.parse(savedEnterprises);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des entreprises:', error);
      }
    }
    
    // Si pas d'entreprises, créer l'entreprise par défaut
    if (enterpriseList.length === 0) {
      enterpriseList = [DEFAULT_ENTERPRISE];
      localStorage.setItem('casskai_enterprises', JSON.stringify(enterpriseList));
  console.warn('🏢 Entreprise par défaut créée');
    }
    
    setEnterprises(enterpriseList);
    
    // Définir l'entreprise actuelle avec logique améliorée
    const savedCurrentId = localStorage.getItem('casskai_current_enterprise');
    if (savedCurrentId) {
      const foundEnterprise = enterpriseList.find(e => e.id === savedCurrentId);
      if (foundEnterprise) {
        setCurrentEnterpriseId(savedCurrentId);
  console.warn('✅ Entreprise actuelle définie:', foundEnterprise.name);
      } else {
        // Si l'ID sauvegardé n'existe pas, essayer de trouver par nom ou prendre la première
  console.warn('⚠️ Entreprise sauvegardée introuvable, utilisation de la première disponible');
        setCurrentEnterpriseId(enterpriseList[0].id);
        localStorage.setItem('casskai_current_enterprise', enterpriseList[0].id);
      }
    } else {
      setCurrentEnterpriseId(enterpriseList[0].id);
      localStorage.setItem('casskai_current_enterprise', enterpriseList[0].id);
    }
    
  // Loaded
  }, []);

  // Fonction pour forcer la synchronisation après onboarding
  const synchronizeAfterOnboarding = useCallback(() => {
  console.warn('🔄 Synchronisation post-onboarding...');
    loadEnterprises();
    
    // Force un refresh des états pour déclencher les re-renders
    const currentId = localStorage.getItem('casskai_current_enterprise');
    if (currentId) {
      setTimeout(() => {
        setCurrentEnterpriseId(currentId);
      }, 100);
    }
  }, [loadEnterprises]);

  useEffect(() => {
    loadEnterprises();
    setLoading(false);
    
    // Écouter les changements localStorage pour rester synchronisé
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'casskai_enterprises' || e.key === 'casskai_current_enterprise') {
  console.warn('📦 localStorage modifié, rechargement des entreprises...');
        loadEnterprises();
      }
    };
    
    // Écouter les signaux de synchronisation après onboarding
  const handleSyncNeeded = (_e: CustomEvent) => {
  console.warn('📡 Signal de synchronisation reçu');
      synchronizeAfterOnboarding();
    };
    
    window.addEventListener('storage', handleStorageChange);
  window.addEventListener('enterprise-sync-needed', handleSyncNeeded as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('enterprise-sync-needed', handleSyncNeeded as EventListener);
    };
  }, [loadEnterprises, synchronizeAfterOnboarding]);

  const currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId) || null;

  const addEnterprise = async (enterpriseData: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => {
  console.warn('🏢 Ajout d\'une nouvelle entreprise (Supabase)');
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
      settings: enterpriseData.settings || DEFAULT_ENTERPRISE.settings,
      taxRegime: enterpriseData.taxRegime || DEFAULT_ENTERPRISE.taxRegime,
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
  console.warn('✅ Entreprise ajoutée et synchronisée avec Supabase');
  };

  const updateEnterprise = async (id: string, data: Partial<Enterprise>) => {
  console.warn('🔄 Mise à jour de l\'entreprise');
    
    const updatedEnterprises = enterprises.map(enterprise =>
      enterprise.id === id
        ? { ...enterprise, ...data, updatedAt: new Date() }
        : enterprise
    );
    
    setEnterprises(updatedEnterprises);
    localStorage.setItem('casskai_enterprises', JSON.stringify(updatedEnterprises));
    
    toast({
      title: 'Entreprise mise à jour',
      description: 'Les informations de l\'entreprise ont été mises à jour avec succès.'
    });
    
  // updated
  };

  const deleteEnterprise = async (id: string) => {
  console.warn('🗑️ Suppression de l\'entreprise');
    
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
    
  // deleted
  };

  const switchEnterprise = (enterpriseId: string) => {
  console.warn('🔄 Changement d\'entreprise');
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
    synchronizeAfterOnboarding,
    loading
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};