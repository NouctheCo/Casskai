// Composant amélioré du Plan Comptable avec gestion des mappings budgétaires
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAccounting } from '@/hooks/useAccounting';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/lib/supabase';
import {
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  ListTree,
  Download,
  CheckCircle,
  Link,
  Unlink
} from 'lucide-react';
import type { Account } from '@/types/database.types';

// Type étendu pour les comptes du plan comptable
interface ChartOfAccount extends Account {
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id?: string;
  level: number;
  balance_debit: number;
  balance_credit: number;
  current_balance: number;
}

interface ChartOfAccount {
  id: string;
  company_id: string;
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id?: string;
  level: number;
  is_active: boolean;
  balance_debit: number;
  balance_credit: number;
  current_balance: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface BudgetCategory {
  id: string;
  category: string;
  subcategory: string | null;
  category_type: 'revenue' | 'expense' | 'capex';
}

interface AccountMapping {
  accountNumber: string;
  categoryId: string | null;
}

export default function ChartOfAccountsEnhanced({ currentEnterpriseId }: { currentEnterpriseId?: string }) {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();

  const companyId = currentEnterpriseId || currentCompany?.id;

  const {
    accounts,
    loading,
    error,
    fetchAccounts,
    refresh
  } = useAccounting(companyId);

  // Type assertion pour les comptes du plan comptable
  const chartAccounts = accounts as any[];

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [initializingChart, setInitializingChart] = useState(false);
  const [savingMapping, setSavingMapping] = useState<string | null>(null);
  const [hasChartOfAccounts, setHasChartOfAccounts] = useState<boolean | null>(null);

  // Vérifier si le plan comptable existe et l'initialiser automatiquement si nécessaire
  useEffect(() => {
    if (!companyId) return;

    const checkAndInitializeChart = async () => {
      try {
        // Vérifier s'il y a déjà des comptes dans chart_of_accounts
        const { data: chartAccounts, error: chartError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        if (chartError) {
          console.warn('Erreur vérification chart_of_accounts:', chartError);
        }

        // Vérifier aussi dans la table accounts (legacy)
        const { data: legacyAccounts, error: legacyError } = await supabase
          .from('accounts')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        if (legacyError) {
          console.warn('Erreur vérification accounts:', legacyError);
        }

        const hasChart = (chartAccounts && chartAccounts.length > 0) || (legacyAccounts && legacyAccounts.length > 0);
        setHasChartOfAccounts(hasChart);

        // Si aucun plan comptable n'existe, l'initialiser automatiquement
        if (!hasChart) {
          console.log('🔧 Plan comptable vide détecté, initialisation automatique...');

          // Récupérer le pays de l'entreprise
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('country_code')
            .eq('id', companyId)
            .single();

          if (companyError) {
            console.warn('Erreur récupération pays entreprise:', companyError);
            return;
          }

          const countryCode = companyData?.country_code || 'FR';

          // Initialiser automatiquement le plan comptable
          const { data: initResult, error: initError } = await supabase.rpc('initialize_company_chart_of_accounts', {
            p_company_id: companyId,
            p_country_code: countryCode
          });

          if (initError) {
            console.error('Erreur initialisation automatique:', initError);
            // Ne pas afficher d'erreur à l'utilisateur pour l'instant
            return;
          }

          console.log(`✅ Plan comptable initialisé automatiquement: ${initResult || 0} comptes créés`);
          setHasChartOfAccounts(true);

          // Rafraîchir les données
          await refresh();
        }
      } catch (err) {
        console.error('Erreur vérification/initialisation plan comptable:', err);
      }
    };

    checkAndInitializeChart();
  }, [companyId, refresh]);

  // Charger les catégories budgétaires disponibles
  useEffect(() => {
    if (!companyId) return;

    const loadBudgetCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('budget_categories')
          .select('id, category, subcategory, category_type')
          .eq('company_id', companyId);

        if (error) throw error;
        setBudgetCategories(data || []);
      } catch (err) {
        console.error('Error loading budget categories:', err);
      }
    };

    loadBudgetCategories();
  }, [companyId]);

  // Charger les mappings existants
  useEffect(() => {
    if (!companyId || !chartAccounts || chartAccounts.length === 0) return;

    const loadExistingMappings = async () => {
      try {
        const { data, error } = await supabase
          .from('category_account_map')
          .select('account_code, category_id')
          .eq('company_id', companyId);

        if (error) throw error;

        const mappingsMap = new Map<string, string>();
        data?.forEach(mapping => {
          mappingsMap.set(mapping.account_code, mapping.category_id);
        });
        setAccountMappings(mappingsMap);
      } catch (err) {
        console.error('Error loading mappings:', err);
      }
    };

    loadExistingMappings();
  }, [companyId, chartAccounts]);

  // Initialiser le plan comptable standard
  const handleInitializeChart = async () => {
    if (!companyId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Aucune entreprise sélectionnée'
      });
      return;
    }

    setInitializingChart(true);

    try {
      // Récupérer le pays de l'entreprise
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('country_code')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const countryCode = companyData?.country_code || 'FR';

      // Appeler la fonction RPC Supabase
      const { data, error } = await supabase.rpc('initialize_company_chart_of_accounts', {
        p_company_id: companyId,
        p_country_code: countryCode
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${data} comptes standard ont été créés`
      });

      // Rafraîchir la liste
      await refresh();

    } catch (err: any) {
      console.error('Error initializing chart:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Impossible d\'initialiser le plan comptable'
      });
    } finally {
      setInitializingChart(false);
    }
  };

  // Sauvegarder un mapping compte ↔ catégorie
  const handleSaveMapping = async (accountNumber: string, categoryId: string | null) => {
    if (!companyId) return;

    setSavingMapping(accountNumber);

    try {
      // Si categoryId est null, supprimer le mapping
      if (!categoryId || categoryId === 'none') {
        const { error } = await supabase
          .from('category_account_map')
          .delete()
          .eq('company_id', companyId)
          .eq('account_code', accountNumber);

        if (error) throw error;

        // Mettre à jour l'état local
        const newMappings = new Map(accountMappings);
        newMappings.delete(accountNumber);
        setAccountMappings(newMappings);

        toast({
          title: 'Mapping supprimé',
          description: `Le compte ${accountNumber} n'est plus mappé`
        });
      } else {
        // Insérer ou mettre à jour le mapping
        const { error } = await supabase
          .from('category_account_map')
          .upsert({
            company_id: companyId,
            category_id: categoryId,
            account_code: accountNumber
          }, {
            onConflict: 'company_id,category_id,account_code'
          });

        if (error) throw error;

        // Mettre à jour l'état local
        const newMappings = new Map(accountMappings);
        newMappings.set(accountNumber, categoryId);
        setAccountMappings(newMappings);

        const category = budgetCategories.find(c => c.id === categoryId);
        toast({
          title: 'Mapping enregistré',
          description: `${accountNumber} → ${category?.category}${category?.subcategory ? ` / ${category.subcategory}` : ''}`
        });
      }
    } catch (err: any) {
      console.error('Error saving mapping:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Impossible de sauvegarder le mapping'
      });
    } finally {
      setSavingMapping(null);
    }
  };

  // Filtrer les comptes
  const filteredAccounts = chartAccounts?.filter(account => {
    const matchesSearch = !searchTerm ||
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = !classFilter || classFilter === 'all' || String(account.account_number.charAt(0)) === classFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || account.account_type === typeFilter;

    return matchesSearch && matchesClass && matchesType;
  });

  // Grouper les catégories par type pour le select
  const categoriesByType = budgetCategories.reduce((acc, cat) => {
    if (!acc[cat.category_type]) acc[cat.category_type] = [];
    acc[cat.category_type].push(cat);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  const renderCategoryBadge = (categoryId: string | null) => {
    if (!categoryId) return <Badge variant="outline" className="text-gray-400"><Unlink className="w-3 h-3 mr-1" />Non mappé</Badge>;

    const category = budgetCategories.find(c => c.id === categoryId);
    if (!category) return null;

    const typeColors = {
      revenue: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
      expense: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200',
      capex: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200'
    };

    return (
      <Badge variant="outline" className={typeColors[category.category_type]}>
        <Link className="w-3 h-3 mr-1" />
        {category.category}{category.subcategory ? ` / ${category.subcategory}` : ''}
      </Badge>
    );
  };

  if (!companyId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Aucune entreprise sélectionnée</h2>
        <p className="text-muted-foreground">Veuillez sélectionner une entreprise pour accéder au plan comptable</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <ListTree className="mr-2 h-6 w-6 text-primary" />
              Plan Comptable
            </CardTitle>
            <CardDescription>
              Gérez vos comptes et associez-les à vos catégories budgétaires
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChartOfAccounts === false && (
              <Button
                onClick={handleInitializeChart}
                disabled={initializingChart}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                {initializingChart ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Initialisation manuelle...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Initialisation manuelle du plan
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un compte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              <SelectItem value="1">1 - Capitaux</SelectItem>
              <SelectItem value="2">2 - Immobilisations</SelectItem>
              <SelectItem value="3">3 - Stocks</SelectItem>
              <SelectItem value="4">4 - Tiers</SelectItem>
              <SelectItem value="5">5 - Financiers</SelectItem>
              <SelectItem value="6">6 - Charges</SelectItem>
              <SelectItem value="7">7 - Produits</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="asset">Actif</SelectItem>
              <SelectItem value="liability">Passif</SelectItem>
              <SelectItem value="equity">Capitaux propres</SelectItem>
              <SelectItem value="revenue">Produits</SelectItem>
              <SelectItem value="expense">Charges</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {!companyId ? (
          <div className="text-center py-10">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Erreur de configuration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Impossible de charger le plan comptable. Veuillez actualiser la page.
            </p>
          </div>
        ) : loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Catégorie Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !accounts || accounts.length === 0 ? (
          <div className="text-center py-10">
            <ListTree className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Aucun compte</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Commencez par initialiser le plan comptable standard de votre pays
            </p>
            <div className="mt-6">
              <Button onClick={handleInitializeChart} disabled={initializingChart}>
                {initializingChart ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Initialisation...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Initialiser plan standard
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredAccounts?.length || 0} comptes • {accountMappings.size} mappés sur {chartAccounts.length}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold w-[120px]">Compte</TableHead>
                  <TableHead className="font-semibold">Libellé</TableHead>
                  <TableHead className="font-semibold w-[120px]">Type</TableHead>
                  <TableHead className="font-semibold w-[100px]">Classe</TableHead>
                  <TableHead className="font-semibold w-[300px]">Catégorie Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts?.map((account) => {
                  const currentMapping = accountMappings.get(account.account_number);
                  const isSaving = savingMapping === account.account_number;

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-sm">{account.account_number}</TableCell>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className={
                          account.account_type === 'asset' ? 'border-blue-300 text-blue-700' :
                          account.account_type === 'liability' ? 'border-orange-300 text-orange-700' :
                          account.account_type === 'equity' ? 'border-green-300 text-green-700' :
                          account.account_type === 'revenue' ? 'border-purple-300 text-purple-700' :
                          'border-red-300 text-red-700'
                        }>
                          {account.account_type === 'asset' ? 'Actif' :
                           account.account_type === 'liability' ? 'Passif' :
                           account.account_type === 'equity' ? 'Capitaux' :
                           account.account_type === 'revenue' ? 'Produits' : 'Charges'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="border-gray-300">
                          Classe {account.account_number.charAt(0)} - {
                            account.account_number.charAt(0) === '1' ? 'Capitaux' :
                            account.account_number.charAt(0) === '2' ? 'Immobilisations' :
                            account.account_number.charAt(0) === '3' ? 'Stocks' :
                            account.account_number.charAt(0) === '4' ? 'Tiers' :
                            account.account_number.charAt(0) === '5' ? 'Financiers' :
                            account.account_number.charAt(0) === '6' ? 'Charges' :
                            account.account_number.charAt(0) === '7' ? 'Produits' : 'Autre'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={currentMapping || 'none'}
                            onValueChange={(value) => handleSaveMapping(account.account_number, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {renderCategoryBadge(currentMapping || null)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="flex items-center text-gray-500">
                                  <Unlink className="w-3 h-3 mr-2" />
                                  Aucune catégorie
                                </span>
                              </SelectItem>

                              {Object.entries(categoriesByType).map(([type, cats]) => (
                                <React.Fragment key={type}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                                    {type === 'revenue' ? '💰 Revenus' : type === 'expense' ? '📉 Charges' : '🏗️ Investissements'}
                                  </div>
                                  {cats.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.category}{cat.subcategory ? ` / ${cat.subcategory}` : ''}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              ))}
                            </SelectContent>
                          </Select>
                          {isSaving && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                              Enregistrement...
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
