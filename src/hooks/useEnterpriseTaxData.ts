import { useState, useEffect, useCallback } from 'react';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { TaxRate, TaxDeclaration, TaxPayment } from '../types/tax.types';
import { supabase } from '../lib/supabase';

// Helper to format Supabase errors
function handleSupabaseError(error: unknown, context: string) {
  if (error instanceof Error) {
    return { message: `[${context}] ${error.message}` };
  }
  return { message: `[${context}] ${JSON.stringify(error)}` };
}
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { format, addMonths, addQuarters, addYears, isBefore } from 'date-fns';

export function useEnterpriseTaxData() {
  const { currentEnterpriseId, currentEnterprise } = useEnterprise();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [payments, setPayments] = useState<TaxPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Charger les données fiscales de l'entreprise
  useEffect(() => {
    if (currentEnterpriseId) {
      loadTaxData();
    } else {
      // Réinitialiser les données si aucune entreprise n'est sélectionnée
      setTaxRates([]);
      setDeclarations([]);
      setPayments([]);
      setLoading(false);
      setError(null);
    }
  }, [currentEnterpriseId]);

  const loadTaxData = async () => {
    if (!currentEnterpriseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Charger les taux de taxe
      const { data: taxRatesData, error: taxRatesError } = await supabase
        .from('company_tax_rates')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .order('name');
      
      if (taxRatesError) throw taxRatesError;
      
      // 2. Charger les déclarations
      const { data: declarationsData, error: declarationsError } = await supabase
        .from('company_tax_declarations')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .order('due_date');
      
      if (declarationsError) throw declarationsError;
      
      // 3. Charger les paiements
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('company_tax_payments')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .order('payment_date', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      // Mettre à jour l'état avec les données chargées
      setTaxRates(mapTaxRatesFromDB(taxRatesData || []));
      setDeclarations(mapDeclarationsFromDB(declarationsData || []));
      setPayments(mapPaymentsFromDB(paymentsData || []));
      
      // Si aucune donnée n'est trouvée, initialiser avec des données par défaut
      if ((taxRatesData?.length || 0) === 0) {
        await initializeDefaultTaxRates();
      }
      
      if ((declarationsData?.length || 0) === 0) {
        await initializeDefaultDeclarations();
      }
      
    } catch (err) {
      console.error('Error loading tax data:', err);
      const errorInfo = handleSupabaseError(err, 'Loading tax data');
      setError(new Error(errorInfo.message));
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de charger les données fiscales'
      });
      
      // Utiliser les données du localStorage comme fallback
      const savedData = localStorage.getItem(`taxData_${currentEnterpriseId}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setTaxRates(data.taxRates || []);
          setDeclarations(data.declarations || []);
          setPayments(data.payments || []);
        } catch (parseError) {
          console.error('Error parsing saved tax data:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialiser les taux de taxe par défaut
  const initializeDefaultTaxRates = async () => {
    if (!currentEnterpriseId || !currentEnterprise || !user) return;
    
    try {
      const defaultRates = getDefaultTaxRatesForCountry(currentEnterprise.countryCode);
      
      // Convertir en format DB
      const taxRatesToInsert = defaultRates.map(rate => ({
        company_id: currentEnterpriseId,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        description: rate.description || '',
        is_default: rate.isDefault || false,
        is_active: true,
        valid_from: new Date().toISOString(),
        created_by: user.id
      }));
      
      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('company_tax_rates')
        .insert(taxRatesToInsert)
        .select();
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setTaxRates(mapTaxRatesFromDB(data || []));
      
    } catch (err) {
      console.error('Error initializing default tax rates:', err);
      // Ne pas bloquer l'application si l'initialisation échoue
    }
  };

  // Initialiser les déclarations par défaut
  const initializeDefaultDeclarations = async () => {
    if (!currentEnterpriseId || !currentEnterprise) return;
    
    try {
      const defaultDeclarations = generateDefaultDeclarations(currentEnterprise);
      
      // Convertir en format DB
      const declarationsToInsert = defaultDeclarations.map(decl => ({
        company_id: currentEnterpriseId,
        type: decl.type,
        name: decl.name,
        period_start: decl.period?.start.toISOString() || new Date().toISOString(),
        period_end: decl.period?.end.toISOString() || new Date().toISOString(),
        due_date: decl.dueDate.toISOString(),
        status: decl.status,
        amount: decl.amount,
        description: decl.description || '',
        currency: currentEnterprise.currency || 'EUR'
      }));
      
      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('company_tax_declarations')
        .insert(declarationsToInsert)
        .select();
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setDeclarations(mapDeclarationsFromDB(data || []));
      
    } catch (err) {
      console.error('Error initializing default declarations:', err);
      // Ne pas bloquer l'application si l'initialisation échoue
    }
  };

  // Sauvegarder les données dans localStorage comme backup
  const saveTaxDataToLocalStorage = useCallback(() => {
    if (currentEnterpriseId) {
      const data = {
        taxRates,
        declarations,
        payments,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`taxData_${currentEnterpriseId}`, JSON.stringify(data));
    }
  }, [currentEnterpriseId, taxRates, declarations, payments]);

  // Sauvegarder automatiquement quand les données changent
  useEffect(() => {
    if (!loading && currentEnterpriseId) {
      saveTaxDataToLocalStorage();
    }
  }, [taxRates, declarations, payments, loading, saveTaxDataToLocalStorage]);

  // Méthodes pour modifier les données
  const addTaxRate = async (rate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentEnterpriseId || !user) {
      throw new Error('Entreprise ou utilisateur non disponible');
    }
    
    try {
      // Préparer les données pour Supabase
      const taxRateData = {
        company_id: currentEnterpriseId,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        description: rate.description || '',
        is_default: rate.isDefault || false,
        is_active: rate.isActive !== false,
        valid_from: new Date().toISOString(),
        created_by: user.id
      };
      
      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('company_tax_rates')
        .insert([taxRateData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convertir en modèle TaxRate
      const newRate: TaxRate = {
        id: data.id,
        name: data.name,
        rate: data.rate,
        type: data.type as any,
        description: data.description,
        countryCode: currentEnterprise?.countryCode || 'FR',
        isActive: data.is_active,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      // Mettre à jour l'état
      setTaxRates(prev => [...prev, newRate]);
      
      return newRate;
    } catch (err) {
      console.error('Error adding tax rate:', err);
      const errorInfo = handleSupabaseError(err, 'Adding tax rate');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible d\'ajouter le taux de taxe'
      });
      throw new Error(errorInfo.message);
    }
  };

  const updateTaxRate = async (id: string, updates: Partial<TaxRate>) => {
    if (!currentEnterpriseId) {
      throw new Error('Entreprise non disponible');
    }
    
    try {
      // Préparer les données pour Supabase
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.rate !== undefined) updateData.rate = updates.rate;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
      
      // Mettre à jour dans la base de données
      const { data, error } = await supabase
        .from('company_tax_rates')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', currentEnterpriseId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setTaxRates(prev => prev.map(rate => 
        rate.id === id 
          ? { 
              ...rate, 
              ...updates, 
              updatedAt: new Date() 
            }
          : rate
      ));
      
    } catch (err) {
      console.error('Error updating tax rate:', err);
      const errorInfo = handleSupabaseError(err, 'Updating tax rate');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de mettre à jour le taux de taxe'
      });
      throw new Error(errorInfo.message);
    }
  };

  const deleteTaxRate = async (id: string) => {
    if (!currentEnterpriseId) {
      throw new Error('Entreprise non disponible');
    }
    
    try {
      // Supprimer de la base de données
      const { error } = await supabase
        .from('company_tax_rates')
        .delete()
        .eq('id', id)
        .eq('company_id', currentEnterpriseId);
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setTaxRates(prev => prev.filter(rate => rate.id !== id));
      
    } catch (err) {
      console.error('Error deleting tax rate:', err);
      const errorInfo = handleSupabaseError(err, 'Deleting tax rate');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de supprimer le taux de taxe'
      });
      throw new Error(errorInfo.message);
    }
  };

  const addDeclaration = async (declaration: Omit<TaxDeclaration, 'id'>) => {
    if (!currentEnterpriseId) {
      throw new Error('Entreprise non disponible');
    }
    
    try {
      // Préparer les données pour Supabase
      const declarationData = {
        company_id: currentEnterpriseId,
        type: declaration.type,
        name: declaration.name,
        period_start: declaration.period?.start.toISOString() || null,
        period_end: declaration.period?.end.toISOString() || null,
        due_date: declaration.dueDate.toISOString(),
        status: declaration.status,
        amount: declaration.amount,
        description: declaration.description || '',
        currency: currentEnterprise?.currency || 'EUR'
      };
      
      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('company_tax_declarations')
        .insert([declarationData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convertir en modèle TaxDeclaration
      const newDeclaration: TaxDeclaration = {
        id: data.id,
        type: data.type as any,
        name: data.name,
        dueDate: new Date(data.due_date),
        status: data.status as any,
        amount: data.amount,
        description: data.description,
        companyId: data.company_id,
        countryCode: currentEnterprise?.countryCode || 'FR',
        period: data.period_start && data.period_end ? {
          start: new Date(data.period_start),
          end: new Date(data.period_end)
        } : undefined
      };
      
      // Mettre à jour l'état
      setDeclarations(prev => [...prev, newDeclaration]);
      
      return newDeclaration;
    } catch (err) {
      console.error('Error adding declaration:', err);
      const errorInfo = handleSupabaseError(err, 'Adding declaration');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible d\'ajouter la déclaration'
      });
      throw new Error(errorInfo.message);
    }
  };

  const updateDeclaration = async (id: string, updates: Partial<TaxDeclaration>) => {
    if (!currentEnterpriseId) {
      throw new Error('Entreprise non disponible');
    }
    
    try {
      // Préparer les données pour Supabase
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate.toISOString();
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.period !== undefined) {
        updateData.period_start = updates.period.start.toISOString();
        updateData.period_end = updates.period.end.toISOString();
      }
      if (updates.submittedDate !== undefined) updateData.submitted_date = updates.submittedDate.toISOString();
      if (updates.submittedBy !== undefined) updateData.submitted_by = updates.submittedBy;
      
      // Mettre à jour dans la base de données
      const { data, error } = await supabase
        .from('company_tax_declarations')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', currentEnterpriseId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setDeclarations(prev => prev.map(decl => 
        decl.id === id 
          ? { ...decl, ...updates }
          : decl
      ));
      
    } catch (err) {
      console.error('Error updating declaration:', err);
      const errorInfo = handleSupabaseError(err, 'Updating declaration');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de mettre à jour la déclaration'
      });
      throw new Error(errorInfo.message);
    }
  };

  const markDeclarationAsSubmitted = async (id: string) => {
    if (!currentEnterpriseId || !user) {
      throw new Error('Entreprise ou utilisateur non disponible');
    }
    
    try {
      // Mettre à jour dans la base de données
      const { data, error } = await supabase
        .from('company_tax_declarations')
        .update({
          status: 'submitted',
          submitted_date: new Date().toISOString(),
          submitted_by: user.id
        })
        .eq('id', id)
        .eq('company_id', currentEnterpriseId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Mettre à jour l'état
      setDeclarations(prev => prev.map(decl => 
        decl.id === id 
          ? { 
              ...decl, 
              status: 'submitted',
              submittedDate: new Date(),
              submittedBy: user.id
            }
          : decl
      ));
      
    } catch (err) {
      console.error('Error marking declaration as submitted:', err);
      const errorInfo = handleSupabaseError(err, 'Marking declaration as submitted');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible de marquer la déclaration comme soumise'
      });
      throw new Error(errorInfo.message);
    }
  };

  const addPayment = async (payment: Omit<TaxPayment, 'id'>) => {
    if (!currentEnterpriseId) {
      throw new Error('Entreprise non disponible');
    }
    
    try {
      // Préparer les données pour Supabase
      const paymentData = {
        company_id: currentEnterpriseId,
        declaration_id: payment.declarationId,
        amount: payment.amount,
        currency: payment.currency || currentEnterprise?.currency || 'EUR',
        payment_date: payment.paymentDate.toISOString(),
        payment_method: payment.paymentMethod,
        reference: payment.reference,
        status: payment.status,
        receipt_url: payment.receiptUrl,
        created_by: user?.id
      };
      
      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('company_tax_payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convertir en modèle TaxPayment
      const newPayment: TaxPayment = {
        id: data.id,
        declarationId: data.declaration_id,
        amount: data.amount,
        currency: data.currency,
        paymentDate: new Date(data.payment_date),
        paymentMethod: data.payment_method as any,
        reference: data.reference,
        status: data.status as any,
        receiptUrl: data.receipt_url
      };
      
      // Mettre à jour l'état
      setPayments(prev => [...prev, newPayment]);
      
      return newPayment;
    } catch (err) {
      console.error('Error adding payment:', err);
      const errorInfo = handleSupabaseError(err, 'Adding payment');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorInfo.message || 'Impossible d\'ajouter le paiement'
      });
      throw new Error(errorInfo.message);
    }
  };

  // Calculs et statistiques
  const getTotalTaxDue = () => {
    return declarations
      .filter(d => ['pending', 'overdue'].includes(d.status))
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  const getOverdueDeclarations = () => {
    const now = new Date();
    return declarations.filter(d => 
      d.status === 'pending' && new Date(d.dueDate) < now
    );
  };

  const getUpcomingDeclarations = (days: number = 30) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return declarations.filter(d => {
      const dueDate = new Date(d.dueDate);
      return d.status === 'pending' && dueDate >= now && dueDate <= futureDate;
    });
  };

  // Fonctions utilitaires pour mapper les données de la DB vers les modèles
  function mapTaxRatesFromDB(dbRates: any[]): TaxRate[] {
    return dbRates.map(rate => ({
      id: rate.id,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      description: rate.description,
      countryCode: currentEnterprise?.countryCode || 'FR',
      isActive: rate.is_active,
      isDefault: rate.is_default,
      createdAt: new Date(rate.created_at),
      updatedAt: new Date(rate.updated_at),
      createdBy: rate.created_by
    }));
  }

  function mapDeclarationsFromDB(dbDeclarations: any[]): TaxDeclaration[] {
    return dbDeclarations.map(decl => ({
      id: decl.id,
      type: decl.type as any,
      name: decl.name,
      dueDate: new Date(decl.due_date),
      status: decl.status as any,
      amount: decl.amount,
      description: decl.description,
      companyId: decl.company_id,
      countryCode: currentEnterprise?.countryCode || 'FR',
      period: decl.period_start && decl.period_end ? {
        start: new Date(decl.period_start),
        end: new Date(decl.period_end)
      } : undefined,
      submittedDate: decl.submitted_date ? new Date(decl.submitted_date) : undefined,
      submittedBy: decl.submitted_by
    }));
  }

  function mapPaymentsFromDB(dbPayments: any[]): TaxPayment[] {
    return dbPayments.map(payment => ({
      id: payment.id,
      declarationId: payment.declaration_id,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: new Date(payment.payment_date),
      paymentMethod: payment.payment_method as any,
      reference: payment.reference,
      status: payment.status as any,
      receiptUrl: payment.receipt_url
    }));
  }

  return {
    // Données
    taxRates,
    declarations,
    payments,
    loading,
    error,
    
    // Méthodes pour les taux
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    
    // Méthodes pour les déclarations
    addDeclaration,
    updateDeclaration,
    markDeclarationAsSubmitted,
    
    // Méthodes pour les paiements
    addPayment,
    
    // Statistiques
    getTotalTaxDue,
    getOverdueDeclarations,
    getUpcomingDeclarations,
    
    // Utilitaires
    refreshData: loadTaxData
  };
}

// Fonctions utilitaires
function getDefaultTaxRatesForCountry(countryCode: string): TaxRate[] {
  const now = new Date();
  
  const rates: Record<string, TaxRate[]> = {
    FR: [
      { 
        id: '1', 
        name: 'TVA Standard', 
        rate: 20.0, 
        type: 'TVA', 
        description: 'Taux normal de TVA',
        countryCode: 'FR',
        isActive: true,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: '2', 
        name: 'TVA Réduite', 
        rate: 10.0, 
        type: 'TVA', 
        description: 'Restauration, transport',
        countryCode: 'FR',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: '3', 
        name: 'TVA Super-réduite', 
        rate: 5.5, 
        type: 'TVA', 
        description: 'Produits de première nécessité',
        countryCode: 'FR',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    BE: [
      { 
        id: '1', 
        name: 'TVA Standard', 
        rate: 21.0, 
        type: 'TVA', 
        description: 'Taux normal de TVA',
        countryCode: 'BE',
        isActive: true,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: '2', 
        name: 'TVA Réduite', 
        rate: 12.0, 
        type: 'TVA', 
        description: 'Taux réduit',
        countryCode: 'BE',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    CH: [
      { 
        id: '1', 
        name: 'TVA Standard', 
        rate: 7.7, 
        type: 'TVA', 
        description: 'Taux normal de TVA',
        countryCode: 'CH',
        isActive: true,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: '2', 
        name: 'TVA Réduite', 
        rate: 3.7, 
        type: 'TVA', 
        description: 'Taux réduit',
        countryCode: 'CH',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    LU: [
      { 
        id: '1', 
        name: 'TVA Standard', 
        rate: 17.0, 
        type: 'TVA', 
        description: 'Taux normal de TVA',
        countryCode: 'LU',
        isActive: true,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: '2', 
        name: 'TVA Réduite', 
        rate: 8.0, 
        type: 'TVA', 
        description: 'Taux réduit',
        countryCode: 'LU',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]
  };
  
  return rates[countryCode] || rates.FR;
}

function generateDefaultDeclarations(enterprise: any): TaxDeclaration[] {
  const declarations: TaxDeclaration[] = [];
  const now = new Date();
  
  // Générer les déclarations TVA selon la périodicité
  if (enterprise.taxRegime.vatPeriod === 'monthly') {
    for (let i = 0; i < 6; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 20);
      
      declarations.push({
        id: `vat_${periodStart.getTime()}`,
        type: 'TVA',
        name: `TVA ${format(periodStart, 'MMMM yyyy')}`,
        dueDate,
        status: 'pending',
        amount: Math.floor(Math.random() * 5000) + 1000, // Montant aléatoire pour la démo
        companyId: enterprise.id,
        countryCode: enterprise.countryCode,
        period: {
          start: periodStart,
          end: periodEnd
        }
      });
    }
  } else if (enterprise.taxRegime.vatPeriod === 'quarterly') {
    for (let i = 0; i < 2; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() + i * 3, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + (i + 1) * 3, 0);
      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i + 1) * 3, 20);
      
      declarations.push({
        id: `vat_q${i + 1}_${now.getFullYear()}`,
        type: 'TVA',
        name: `TVA T${i + 1} ${now.getFullYear()}`,
        dueDate,
        status: 'pending',
        amount: Math.floor(Math.random() * 10000) + 2000, // Montant aléatoire pour la démo
        companyId: enterprise.id,
        countryCode: enterprise.countryCode,
        period: {
          start: periodStart,
          end: periodEnd
        }
      });
    }
  }
  
  // Ajouter une déclaration d'impôt sur les sociétés
  if (enterprise.taxRegime.type !== 'microEnterprise') {
    const fiscalYearEnd = new Date(now.getFullYear(), enterprise.fiscalYearEnd - 1, 0);
    const isDeadlinePassed = isBefore(fiscalYearEnd, now);
    
    declarations.push({
      id: `is_${now.getFullYear()}`,
      type: 'IS',
      name: `IS ${now.getFullYear()}`,
      dueDate: new Date(now.getFullYear(), 4, 15), // 15 mai
      status: isDeadlinePassed ? 'overdue' : 'pending',
      amount: Math.floor(Math.random() * 20000) + 5000, // Montant aléatoire pour la démo
      companyId: enterprise.id,
      countryCode: enterprise.countryCode,
      period: {
        start: new Date(now.getFullYear() - 1, enterprise.fiscalYearStart - 1, 1),
        end: fiscalYearEnd
      }
    });
  }
  
  return declarations;
}