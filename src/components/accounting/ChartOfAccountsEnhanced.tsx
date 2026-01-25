// Composant amélioré du Plan Comptable avec gestion des mappings budgétaires
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { getBudgetCategoryLabel } from '@/utils/budgetCategoryMapping';
import { logger } from '@/lib/logger';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Search,
  Filter,
  AlertTriangle,
  ListTree,
  Download,
  Link,
  Unlink,
  Plus
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
  const { t, locale } = useLocale();
  const { enterprises, currentEnterprise, currentEnterpriseId: contextEnterpriseId } = useEnterprise();
  const companyId = currentEnterpriseId ?? contextEnterpriseId ?? undefined;
  const resolvedCompany = useMemo(() => {
    if (!companyId) return null;
    return enterprises.find((enterprise) => enterprise.id === companyId) || currentEnterprise || null;
  }, [companyId, enterprises, currentEnterprise]);
  const {
    accounts,
    loading,
    error: _error,
    fetchAccounts,
    refresh
  } = useAccounting(companyId || '');
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [initializingChart, setInitializingChart] = useState(false);
  const [savingMapping, setSavingMapping] = useState<string | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  useBodyScrollLock(showAddAccountModal);
  const [newAccount, setNewAccount] = useState({
    number: '',
    name: '',
    parentId: '__none__'
  });
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
        logger.error('ChartOfAccountsEnhanced', 'Failed to load budget categories:', err);
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
          .select('account_number, category_id')
          .eq('company_id', companyId);
        if (error) throw error;
        const mappingsMap = new Map<string, string>();
        data?.forEach(mapping => {
          mappingsMap.set(mapping.account_number, mapping.category_id);
        });
        setAccountMappings(mappingsMap);
      } catch (err) {
        logger.error('ChartOfAccountsEnhanced', 'Failed to load mappings:', err);
      }
    };
    loadExistingMappings();
  }, [companyId, accounts]);
  // Initialiser le plan comptable standard
  const handleInitializeStandardPlan = async () => {
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
      logger.debug('ChartOfAccountsEnhanced', '🔧 Initializing chart of accounts for company:', companyId);
      logger.debug('ChartOfAccountsEnhanced', '🌍 Country:', resolvedCompany?.countryCode || 'FR');
      const { data, error } = await supabase.rpc('initialize_chart_of_accounts', {
        p_company_id: companyId,
        p_country: resolvedCompany?.countryCode || 'FR'
      });
      if (error) {
        logger.error('ChartOfAccountsEnhanced', '❌ RPC Error:', error);
        throw error;
      }
      logger.debug('ChartOfAccountsEnhanced', '✅ RPC Response:', data);
      if (data?.success) {
        toast({
          title: 'Succès',
          description: data.message || `${data.accounts_created ?? 0} comptes créés avec succès`
        });
        try {
          if (typeof fetchAccounts === 'function') {
            await fetchAccounts();
          } else if (typeof refresh === 'function') {
            await Promise.resolve(refresh());
          } else {
            setTimeout(() => window.location.reload(), 1000);
          }
        } catch (reloadError) {
          logger.error('ChartOfAccountsEnhanced', '❗ Failed to refresh accounts after init:', reloadError);
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: data?.error || 'Erreur lors de l\'initialisation'
        });
      }
    } catch (err) {
      logger.error('ChartOfAccountsEnhanced', '❌ Error initializing chart of accounts:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de l\'initialisation du plan comptable'
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
          .eq('account_number', accountNumber);
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
            account_number: accountNumber
          }, {
            onConflict: 'company_id,category_id,account_number'
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
      logger.error('ChartOfAccountsEnhanced', 'Save mapping failed:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (err as Error).message || 'Impossible de sauvegarder le mapping'
      });
    } finally {
      setSavingMapping(null);
    }
  };
  // Créer un compte auxiliaire
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Aucune entreprise sélectionnée'
      });
      return;
    }
    try {
      // Déterminer le parent réel (null si "__none__")
      const realParentId = newAccount.parentId === '__none__' ? null : newAccount.parentId;
      // Récupérer les infos du compte parent si présent
      const parentAccount = realParentId ? accounts?.find(a => a.id === realParentId) : null;
      if (realParentId && !parentAccount) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Compte de rattachement non trouvé'
        });
        return;
      }
      // Déterminer les propriétés du compte
      let accountType: string;
      let accountClass: number | null;
      let level: number;
      if (parentAccount) {
        // Compte auxiliaire : hérite du parent
        accountType = parentAccount.account_type;
        accountClass = parentAccount.account_class ?? null;
        level = (parentAccount.level || 0) + 1;
      } else {
        // Compte principal : détermine type/classe depuis le numéro
        const firstDigit = newAccount.number.charAt(0);
        accountClass = parseInt(firstDigit) || null;
        // Déterminer le type selon la classe
        switch (firstDigit) {
          case '1': accountType = 'equity'; break;
          case '2': accountType = 'asset'; break;
          case '3': accountType = 'asset'; break;
          case '4': accountType = 'asset'; break;
          case '5': accountType = 'asset'; break;
          case '6': accountType = 'expense'; break;
          case '7': accountType = 'revenue'; break;
          default: accountType = 'asset';
        }
        level = 0;
      }
      const { data: _data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          company_id: companyId,
          account_number: newAccount.number,
          account_name: newAccount.name,
          account_type: accountType,
          account_class: accountClass,
          parent_account_id: realParentId,
          level,
          is_detail_account: !!parentAccount,
          is_active: true
        })
        .select()
        .single();
      if (error) throw error;
      toast({
        title: 'Succès',
        description: parentAccount ? 'Compte auxiliaire créé avec succès' : 'Compte principal créé avec succès'
      });
      setShowAddAccountModal(false);
      setNewAccount({ number: '', name: '', parentId: '__none__' });
      // Recharger les comptes
      if (typeof fetchAccounts === 'function') {
        await fetchAccounts();
      } else if (typeof refresh === 'function') {
        await Promise.resolve(refresh());
      }
    } catch (err: any) {
      logger.error('ChartOfAccountsEnhanced', 'Erreur création compte:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (err as Error).message || 'Erreur lors de la création du compte'
      });
    }
  };
  // Filtrer les comptes
  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = !searchTerm ||
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !classFilter || classFilter === 'all' || String(account.account_class) === classFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || account.account_type === typeFilter;
    return matchesSearch && matchesClass && matchesType;
  });
  // Grouper les catégories par type pour le select
  const categoriesByType = budgetCategories
    .filter(cat => cat.id && cat.id.trim() !== '') // Filter out empty IDs
    .reduce((acc, cat) => {
      if (!acc[cat.category_type]) acc[cat.category_type] = [];
      acc[cat.category_type].push(cat);
      return acc;
    }, {} as Record<string, BudgetCategory[]>);
  const renderCategoryBadge = (categoryId: string | null, accountNumber: string) => {
    // Si pas de mapping manuel, afficher le mapping automatique
    if (!categoryId) {
      const currentLocale = (locale || 'fr') as 'fr' | 'en' | 'es';
      const { label, color } = getBudgetCategoryLabel(accountNumber, currentLocale);
      return (
        <Badge
          variant="outline"
          className="text-white border-0"
          style={{ backgroundColor: color }}
        >
          {label}
        </Badge>
      );
    }
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
            <Button
              onClick={() => setShowAddAccountModal(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Compte auxiliaire
            </Button>
            {(!accounts || accounts.length === 0) && (
              <Button
                onClick={handleInitializeStandardPlan}
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
              <SelectItem value="all">Toutes les classes</SelectItem>
              <SelectItem value="1">1 - Capitaux</SelectItem>
              <SelectItem value="2">2 - Immobilisations</SelectItem>
              <SelectItem value="3">3 - Stocks</SelectItem>
              <SelectItem value="4">4 - Tiers</SelectItem>
              <SelectItem value="5">5 - Financiers</SelectItem>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Aucun compte</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Commencez par initialiser le plan comptable standard de votre pays
            </p>
            <div className="mt-6">
              <Button onClick={handleInitializeStandardPlan} disabled={initializingChart}>
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
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell className="text-sm">
                        {t(`accountTypes.${account.account_type}`, t(`accountTypes.${account.account_type?.toUpperCase()}`, account.account_type))}
                      </TableCell>
                      <TableCell className="text-sm">{account.account_class}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={currentMapping || 'none'}
                            onValueChange={(value) => handleSaveMapping(account.account_number, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {renderCategoryBadge(currentMapping || null, account.account_number)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Unlink className="w-3 h-3 mr-2" />
                                  Aucune catégorie
                                </span>
                              </SelectItem>
                              {Object.entries(categoriesByType).map(([type, cats]) => (
                                <React.Fragment key={type}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
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
      {/* Modale d'ajout de compte auxiliaire */}
      {showAddAccountModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowAddAccountModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Nouveau compte</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de compte</label>
                <Input
                  placeholder="Ex: 401001"
                  value={newAccount.number}
                  onChange={(e) => setNewAccount({...newAccount, number: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Libellé</label>
                <Input
                  placeholder="Ex: Fournisseur ABC"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compte de rattachement</label>
                <Select
                  value={newAccount.parentId}
                  onValueChange={(value) => setNewAccount({...newAccount, parentId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte parent" />
                  </SelectTrigger>
                  {/* ✅ Correction bug z-index: SelectContent avec z-index très élevé pour être au-dessus du modal */}
                  <SelectContent className="z-[99999]" position="popper" sideOffset={5}>
                    <SelectItem value="__none__">
                      {t('noParent', 'Aucun (compte principal)')}
                    </SelectItem>
                    {accounts?.filter(account => !account.is_detail_account).map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_number} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddAccountModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
}