// Composant amélioré du Plan Comptable avec gestion des mappings budgétaires
import React, { useState, useEffect } from 'react';
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
  Search,
  Filter,
  AlertTriangle,
  ListTree,
  Download,
  Link,
  Unlink
} from 'lucide-react';

interface BudgetCategory {
  id: string;
  category: string;
  subcategory: string | null;
  category_type: 'revenue' | 'expense' | 'capex';
}

export default function ChartOfAccountsEnhanced({ currentEnterpriseId }: { currentEnterpriseId?: string }) {
  const { user: _user } = useAuth();
  const { toast } = useToast();
  const { t: _t } = useLocale();

  const companyId = currentEnterpriseId;

  const {
    accounts,
    loading,
    error: _error,
    fetchAccounts: _fetchAccounts,
    refresh
  } = useAccounting(companyId);

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [initializingChart, setInitializingChart] = useState(false);
  const [savingMapping, setSavingMapping] = useState<string | null>(null);

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
        console.error('...', error);
      }
    };

    loadBudgetCategories();
  }, [companyId]);

  // Charger les mappings existants
  useEffect(() => {
    if (!companyId || !accounts || accounts.length === 0) return;

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
        console.error('...', error);
      }
    };

    loadExistingMappings();
  }, [companyId, accounts]);

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
      console.error('...', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message || 'Impossible d\'initialiser le plan comptable'
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
      console.error('...', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message || 'Impossible de sauvegarder le mapping'
      });
    } finally {
      setSavingMapping(null);
    }
  };

  // Filtrer les comptes
  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = !searchTerm ||
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = !classFilter || String(account.class) === classFilter;
    const matchesType = !typeFilter || account.type === typeFilter;

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
            {(!accounts || accounts.length === 0) && (
              <Button
                onClick={handleInitializeChart}
                disabled={initializingChart}
                variant="default"
              >
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
              <SelectItem value="">Toutes les classes</SelectItem>
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
              <SelectItem value="">Tous les types</SelectItem>
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
        {loading ? (
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
              {filteredAccounts?.length || 0} comptes • {accountMappings.size} mappés sur {accounts.length}
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
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-sm">{account.type}</TableCell>
                      <TableCell className="text-sm">{account.class}</TableCell>
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
