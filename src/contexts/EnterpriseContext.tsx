// contexts/EnterpriseContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Enterprise, EnterpriseTaxConfiguration } from '../types/enterprise.types';
// import { SYSCOHADA_CLASSES, SYSCOHADA_ACCOUNTS } from '../data/accounts-syscohada';
// import { TaxRate, TaxDeclaration, TaxPayment, TaxDocument } from '../types/tax.types';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/use-toast';
import { supabase, handleSupabaseError } from '../lib/supabase';

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

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [currentEnterpriseId, setCurrentEnterpriseId] = useState<string | null>(null);
  const [taxConfigurations, setTaxConfigurations] = useState<Map<string, EnterpriseTaxConfiguration>>(new Map());
  const [loading, setLoading] = useState(true);

  // Charger les entreprises depuis Supabase
  useEffect(() => {
    const loadEnterprises = async () => {
      console.log('🔄 Initialisation démarrée');
      if (!user) {
        console.log('⏹️ Aucun utilisateur connecté, arrêt de l\'init.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('📡 Récupération des entreprises pour user:', user);
        const { data: userCompanies, error: userCompaniesError } = await supabase
          .from('user_companies')
          .select(`
            company_id,
            companies (
              id, 
              name, 
              country,
              default_currency,
              default_locale,
              timezone,
              is_active,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id);

        console.log('📦 Résultat Supabase:', { userCompanies, userCompaniesError });
        if (userCompaniesError) {
          console.log('❌ Erreur Supabase:', userCompaniesError);
          throw userCompaniesError;
        }

        const userEnterprises: Enterprise[] = (userCompanies as any[])
          .filter((uc: any) => uc.companies)
          .map((uc: any) => {
            const company = uc.companies as any;
            return {
              id: company.id,
              name: company.name || 'Entreprise sans nom',
              registrationNumber: '000000000',
              vatNumber: undefined,
              countryCode: company.country || 'FR',
              address: {
                street: '',
                postalCode: '',
                city: '',
                country: 'France'
              },
              taxRegime: {
                id: '1',
                code: 'REAL_NORMAL',
                name: 'Réel Normal',
                type: 'realNormal',
                vatPeriod: 'monthly',
                corporateTaxRate: 25
              },
              fiscalYearStart: 1,
              fiscalYearEnd: 12,
              currency: company.default_currency || 'EUR',
              createdAt: new Date(company.created_at),
              updatedAt: new Date(company.updated_at),
              isActive: company.is_active !== false,
              settings: {
                defaultVATRate: '20',
                defaultPaymentTerms: 30,
                taxReminderDays: 7,
                autoCalculateTax: true,
                roundingRule: 'nearest',
                emailNotifications: true,
                language: company.default_locale || 'fr',
                timezone: company.timezone || 'Europe/Paris'
              }
            };
          });
        console.log('🗂️ Entreprises transformées:', userEnterprises);

        if (userEnterprises.length === 0) {
          console.warn('No enterprises found for user, creating default');
          const defaultEnterprise: Enterprise = {
            id: '1',
            name: 'Mon Entreprise',
            registrationNumber: '123456789',
            vatNumber: 'FR12345678901',
            countryCode: 'FR',
            address: {
              street: '1 rue de la Paix',
              postalCode: '75001',
              city: 'Paris',
              country: 'France'
            },
            taxRegime: {
              id: '1',
              code: 'REAL_NORMAL',
              name: 'Réel Normal',
              type: 'realNormal',
              vatPeriod: 'monthly',
              corporateTaxRate: 25
            },
            fiscalYearStart: 1,
            fiscalYearEnd: 12,
            currency: 'EUR',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            settings: {
              defaultVATRate: '20',
              defaultPaymentTerms: 30,
              taxReminderDays: 7,
              autoCalculateTax: true,
              roundingRule: 'nearest',
              emailNotifications: true,
              language: 'fr',
              timezone: 'Europe/Paris'
            }
          };
          setEnterprises([defaultEnterprise]);
        } else {
          setEnterprises(userEnterprises);
        }

        // Sélection de l'entreprise courante
        const lastSelectedId = localStorage.getItem('currentEnterpriseId');
        if (lastSelectedId && userEnterprises.some(e => e.id === lastSelectedId)) {
          setCurrentEnterpriseId(lastSelectedId);
          console.log('🏢 Entreprise sélectionnée (stockée):', lastSelectedId);
        } else if (userEnterprises.length > 0) {
          setCurrentEnterpriseId(userEnterprises[0].id);
          console.log('🏢 Entreprise sélectionnée (par défaut):', userEnterprises[0].id);
        }

        // Charger les configurations fiscales
        try {
          console.log('📑 Chargement des configurations fiscales pour:', userEnterprises.map(e => e.id));
          await loadTaxConfigurations(userEnterprises.map(e => e.id));
          console.log('✅ Configurations fiscales chargées');
        } catch (taxError) {
          console.error('Error loading tax configurations:', taxError);
        }

      } catch (error) {
        console.error('Error loading enterprises:', error);
        handleSupabaseError(error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les entreprises'
        });
      } finally {
        setLoading(false);
        console.log('✅ Initialisation terminée');
      }
    };

    loadEnterprises();
  }, [user, toast]);

  // Charger les configurations fiscales pour toutes les entreprises
  const loadTaxConfigurations = async (enterpriseIds: string[]) => {
    if (!enterpriseIds.length) return;

    try {
      // Vérifier si les tables existent avant de faire les requêtes
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['company_tax_rates', 'company_tax_declarations', 'company_tax_payments', 'company_tax_documents'])
        .eq('table_schema', 'public');

      if (tableCheckError) {
        console.error('Error checking tax tables existence:', tableCheckError);
        return;
      }

      // Si les tables n'existent pas, ne pas essayer de charger les données
      const existingTables = tableExists.map(t => t.table_name);
      if (!existingTables.includes('company_tax_rates')) {
        console.warn('Tax tables do not exist yet. Skipping tax data loading.');
        return;
      }

      // Charger les taux de taxe
      const { data: taxRates, error: taxRatesError } = await supabase
        .from('company_tax_rates')
        .select('*')
        .in('company_id', enterpriseIds);

      if (taxRatesError) throw taxRatesError;

      // Charger les déclarations
      const { data: declarations, error: declarationsError } = await supabase
        .from('company_tax_declarations')
        .select('*')
        .in('company_id', enterpriseIds);

      if (declarationsError) throw declarationsError;

      // Charger les paiements
      const { data: payments, error: paymentsError } = await supabase
        .from('company_tax_payments')
        .select('*')
        .in('company_id', enterpriseIds);

      if (paymentsError) throw paymentsError;

      // Charger les documents
      const { data: documents, error: documentsError } = await supabase
        .from('company_tax_documents')
        .select('*')
        .in('company_id', enterpriseIds);

      if (documentsError) throw documentsError;

      // Organiser les données par entreprise
      const newConfigurations = new Map<string, EnterpriseTaxConfiguration>();

      for (const enterpriseId of enterpriseIds) {
        const enterpriseTaxRates = taxRates?.filter(tr => tr.company_id === enterpriseId) || [];
        const enterpriseDeclarations = declarations?.filter(d => d.company_id === enterpriseId) || [];
        const enterprisePayments = payments?.filter(p => p.company_id === enterpriseId) || [];
        const enterpriseDocuments = documents?.filter(d => d.company_id === enterpriseId) || [];

        newConfigurations.set(enterpriseId, {
          enterpriseId,
          taxRates: enterpriseTaxRates,
          declarations: enterpriseDeclarations,
          payments: enterprisePayments,
          documents: enterpriseDocuments
        });
      }

      setTaxConfigurations(newConfigurations);

    } catch (error) {
      console.error('Error loading tax configurations:', error);
      // Ne pas bloquer l'application si les configurations fiscales ne peuvent pas être chargées
      // Les configurations par défaut seront utilisées
    }
  };

  // Sauvegarder l'entreprise courante
  useEffect(() => {
    if (currentEnterpriseId) {
      localStorage.setItem('currentEnterpriseId', currentEnterpriseId);
    }
  }, [currentEnterpriseId]);

  const currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId) || null;

  const addEnterprise = async (enterpriseData: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une entreprise'
      });
      return;
    }

    try {
      // Préparer les données pour Supabase
      const companyData = {
        name: enterpriseData.name,
        country: enterpriseData.countryCode,
        default_currency: enterpriseData.currency,
        default_locale: enterpriseData.settings.language,
        timezone: enterpriseData.settings.timezone,
        is_active: true
      };

      // Créer l'entreprise dans Supabase
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (companyError) throw companyError;

      // Lier l'entreprise à l'utilisateur
      const { error: linkError } = await supabase
        .from('user_companies')
        .insert([{
          user_id: user.id,
          company_id: newCompany.id,
          is_default: enterprises.length === 0 // Première entreprise = par défaut
        }]);

      if (linkError) throw linkError;

      // Créer les taux de taxe par défaut
      const defaultTaxRates = getDefaultTaxRatesForCountry(enterpriseData.countryCode, newCompany.id);
      if (Array.isArray(defaultTaxRates) && defaultTaxRates.length > 0) {
        // Vérifier si la table company_tax_rates existe
        const { data: tableExists, error: tableCheckError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'company_tax_rates')
          .eq('table_schema', 'public');

        if (tableCheckError) {
          console.error('Error checking tax table existence:', tableCheckError);
        } else if (tableExists && tableExists.length > 0) {
          // La table existe, on peut insérer les taux
          const { error: taxRatesError } = await supabase
            .from('company_tax_rates')
            .insert((defaultTaxRates as any[]).map((rate: any) => ({
              company_id: newCompany.id,
              name: rate.name,
              rate: rate.rate,
              type: rate.type,
              description: rate.description || '',
              is_default: rate.isDefault || rate.is_default || false,
              is_active: true,
              valid_from: new Date().toISOString(),
              created_by: user.id
            })));

          if (taxRatesError) {
            console.error('Error creating default tax rates:', taxRatesError);
            // Ne pas bloquer la création de l'entreprise si les taux ne peuvent pas être créés
          }
        } else {
          console.warn('company_tax_rates table does not exist yet. Skipping default tax rates creation.');
        }
      }

      // Convertir les données Supabase en modèle Enterprise
      const newEnterprise: Enterprise = {
        id: newCompany.id,
        name: newCompany.name,
        registrationNumber: enterpriseData.registrationNumber,
        vatNumber: enterpriseData.vatNumber,
        countryCode: newCompany.country || 'FR',
        address: enterpriseData.address,
        taxRegime: enterpriseData.taxRegime,
        fiscalYearStart: enterpriseData.fiscalYearStart,
        fiscalYearEnd: enterpriseData.fiscalYearEnd,
        currency: newCompany.default_currency || 'EUR',
        createdAt: new Date(newCompany.created_at),
        updatedAt: new Date(newCompany.updated_at),
        isActive: newCompany.is_active !== false,
        settings: enterpriseData.settings
      };

      // Mettre à jour l'état local
      setEnterprises(prev => [...prev, newEnterprise]);

      // Créer une configuration fiscale vide pour la nouvelle entreprise
      const newConfig: EnterpriseTaxConfiguration = {
        enterpriseId: newEnterprise.id,
        taxRates: defaultTaxRates,
        declarations: [],
        payments: [],
        documents: []
      };

      setTaxConfigurations(prev => new Map(prev).set(newEnterprise.id, newConfig));

      toast({
        title: 'Succès',
        description: 'Entreprise créée avec succès'
      });

      // Sélectionner automatiquement la nouvelle entreprise
      setCurrentEnterpriseId(newEnterprise.id);
    } catch (error) {
      console.error('Error creating enterprise:', error);
      const errorInfo = handleSupabaseError(error, 'Creating enterprise');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de créer l\'entreprise'
      });
    }
  };

  const updateEnterprise = async (id: string, data: Partial<Enterprise>) => {
    try {
      // Préparer les données pour Supabase
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.countryCode !== undefined) updateData.country = data.countryCode;
      if (data.currency !== undefined) updateData.default_currency = data.currency;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.settings?.language !== undefined) updateData.default_locale = data.settings.language;
      if (data.settings?.timezone !== undefined) updateData.timezone = data.settings.timezone;

      // Mettre à jour l'entreprise dans Supabase
      const { data: updatedCompany, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'état local
      setEnterprises(prev => prev.map(e => 
        e.id === id 
          ? { 
              ...e, 
              ...data, 
              updatedAt: new Date() 
            }
          : e
      ));

      toast({
        title: 'Succès',
        description: 'Entreprise mise à jour avec succès'
      });
    } catch (error) {
      console.error('Error updating enterprise:', error);
      const errorInfo = handleSupabaseError(error, 'Updating enterprise');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de mettre à jour l\'entreprise'
      });
    }
  };

  const deleteEnterprise = async (id: string) => {
    try {
      if (enterprises.length === 1) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez conserver au moins une entreprise'
        });
        return;
      }

      // Supprimer l'entreprise de Supabase
      // Note: La suppression en cascade devrait supprimer automatiquement les enregistrements associés
      // comme les user_companies, company_tax_rates, etc.
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour l'état local
      setEnterprises(prev => prev.filter(e => e.id !== id));
      setTaxConfigurations(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      // Si l'entreprise supprimée était l'entreprise courante, sélectionner la première
      if (currentEnterpriseId === id) {
        const remainingEnterprises = enterprises.filter(e => e.id !== id);
        if (remainingEnterprises.length > 0) {
          setCurrentEnterpriseId(remainingEnterprises[0].id);
        }
      }

      toast({
        title: 'Succès',
        description: 'Entreprise supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting enterprise:', error);
      const errorInfo = handleSupabaseError(error, 'Deleting enterprise');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de supprimer l\'entreprise'
      });
    }
  };

  const getEnterpriseTaxConfig = (enterpriseId: string): EnterpriseTaxConfiguration | null => {
    return taxConfigurations.get(enterpriseId) || null;
  };

  const switchEnterprise = (enterpriseId: string) => {
    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (enterprise) {
      setCurrentEnterpriseId(enterpriseId);
      toast({
        title: 'Entreprise sélectionnée',
        description: `Vous travaillez maintenant sur ${enterprise.name}`
      });
    }
  };

  const value = {
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

// Fonction helper pour obtenir les taux par défaut selon le pays
function getDefaultTaxRatesForCountry(countryCode: string, enterpriseId: string) {
  // Pays d'Afrique de l'Ouest utilisant SYSCOHADA
  const SYSCOHADA_COUNTRIES = ['BJ', 'CI', 'SN', 'TG', 'ML', 'NE', 'BF', 'GN'];
  if (SYSCOHADA_COUNTRIES.includes(countryCode)) {
    // Exemple : structure compatible TaxRate
    const now = new Date();
    return [{
      id: `${enterpriseId}-1`,
      company_id: enterpriseId,
      name: 'SYSCOHADA - TVA',
      rate: 18,
      type: 'TVA' as const,
      is_default: true,
      is_active: true,
      valid_from: now.toISOString(),
      countryCode,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }];
  }
  // Sinon, logique européenne classique
  const now = new Date();
  const rates = {
    FR: [
      { id: `${enterpriseId}-1`, company_id: enterpriseId, name: 'TVA Standard', rate: 20, type: 'TVA' as const, is_default: true, is_active: true, valid_from: now.toISOString(), countryCode: 'FR', isActive: true, createdAt: now, updatedAt: now },
      { id: `${enterpriseId}-2`, company_id: enterpriseId, name: 'TVA Réduite', rate: 10, type: 'TVA' as const, is_default: false, is_active: true, valid_from: now.toISOString(), countryCode: 'FR', isActive: true, createdAt: now, updatedAt: now },
      { id: `${enterpriseId}-3`, company_id: enterpriseId, name: 'TVA Super-réduite', rate: 5.5, type: 'TVA' as const, is_default: false, is_active: true, valid_from: now.toISOString(), countryCode: 'FR', isActive: true, createdAt: now, updatedAt: now },
    ],
    BE: [
      { id: `${enterpriseId}-1`, company_id: enterpriseId, name: 'TVA Standard', rate: 21, type: 'TVA' as const, is_default: true, is_active: true, valid_from: now.toISOString(), countryCode: 'BE', isActive: true, createdAt: now, updatedAt: now },
      { id: `${enterpriseId}-2`, company_id: enterpriseId, name: 'TVA Réduite', rate: 12, type: 'TVA' as const, is_default: false, is_active: true, valid_from: now.toISOString(), countryCode: 'BE', isActive: true, createdAt: now, updatedAt: now },
    ],
    CH: [
      { id: `${enterpriseId}-1`, company_id: enterpriseId, name: 'TVA Standard', rate: 7.7, type: 'TVA' as const, is_default: true, is_active: true, valid_from: now.toISOString(), countryCode: 'CH', isActive: true, createdAt: now, updatedAt: now },
      { id: `${enterpriseId}-2`, company_id: enterpriseId, name: 'TVA Réduite', rate: 3.7, type: 'TVA' as const, is_default: false, is_active: true, valid_from: now.toISOString(), countryCode: 'CH', isActive: true, createdAt: now, updatedAt: now },
    ],
    LU: [
      { id: `${enterpriseId}-1`, company_id: enterpriseId, name: 'TVA Standard', rate: 17, type: 'TVA' as const, is_default: true, is_active: true, valid_from: now.toISOString(), countryCode: 'LU', isActive: true, createdAt: now, updatedAt: now },
      { id: `${enterpriseId}-2`, company_id: enterpriseId, name: 'TVA Intermédiaire', rate: 14, type: 'TVA' as const, is_default: false, is_active: true, valid_from: now.toISOString(), countryCode: 'LU', isActive: true, createdAt: now, updatedAt: now },
    ]
  };
  return rates[countryCode as keyof typeof rates] || rates.FR;
}