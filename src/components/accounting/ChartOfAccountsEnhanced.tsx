// Composant amélioré du Plan Comptable avec gestion des mappings budgétaires
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAccounting } from '@/hooks/useAccounting';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAccountFilters } from '@/hooks/useAccountFilters';
import { useBudgetMappings } from '@/hooks/useBudgetMappings';
import { AccountFiltersToolbar } from './AccountFiltersToolbar';
import { AccountRow } from './AccountRow';
import { CreateAccountDialog } from './CreateAccountDialog';
import { configService } from '@/services/configService'; // Importer le service de configuration
import {
  AlertTriangle,
  ListTree,
  Download,
  Link,
  Unlink
} from 'lucide-react';
import { logger } from '@/utils/logger';

export default function ChartOfAccountsEnhanced({ currentEnterpriseId }: { currentEnterpriseId?: string }) {
  const { currentCompany } = useAuth();
  const { toast } = useToast();

  const companyId = currentEnterpriseId || currentCompany?.id;

  const {
    accounts,
    loading,
    refresh
  } = useAccounting(companyId);

  const [initializingChart, setInitializingChart] = useState(false);
  const [savingMapping, setSavingMapping] = useState<string | null>(null);
  const [hasChartOfAccounts, setHasChartOfAccounts] = useState<boolean | null>(null);
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);

  // Utiliser le hook de filtrage
  const {
    searchTerm,
    setSearchTerm,
    classFilter,
    setClassFilter,
    typeFilter,
    setTypeFilter
  } = useAccountFilters();

  // Utiliser le hook de mappings budgétaires
  const {
    budgetCategories,
    accountMappings,
    saveMapping
  } = useBudgetMappings(companyId);

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
          logger.warn('Erreur vérification chart_of_accounts:', chartError)
        }

        // Vérifier aussi dans la table accounts (legacy)
        const { data: legacyAccounts, error: legacyError } = await supabase
          .from('accounts')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        if (legacyError) {
          logger.warn('Erreur vérification accounts:', legacyError)
        }

        const hasChart = (chartAccounts && chartAccounts.length > 0) || (legacyAccounts && legacyAccounts.length > 0);
        setHasChartOfAccounts(hasChart);

        // Si aucun plan comptable n'existe, l'initialiser automatiquement
        if (!hasChart) {
          logger.warn('Plan comptable vide détecté, initialisation automatique...');

          // Récupérer le pays de l'entreprise
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('country_code, country')
            .eq('id', companyId)
            .single();

          if (companyError) {
            logger.warn('Erreur récupération pays entreprise:', companyError);
            return;
          }

          const countryCode = companyData?.country_code || companyData?.country || 'FR';

          // Initialiser automatiquement le plan comptable
          const { data: initResult, error: initError } = await supabase.rpc('initialize_company_chart_of_accounts', {
            p_company_id: companyId,
            p_country_code: countryCode
          });

          if (initError || !initResult || initResult === 0) {
            logger.error('Erreur initialisation automatique:', initError);
            toast({
              variant: 'destructive',
              title: 'Initialisation automatique échouée',
              description: "Impossible de charger le plan comptable. Vérifiez que le pays de l'entreprise est bien configuré."
            });
            return;
          }

          logger.warn(`Plan comptable initialisé automatiquement: ${initResult || 0} comptes créés`);
          setHasChartOfAccounts(true);

          // Rafraîchir les données
          await refresh();
        }
      } catch (err) {
        logger.error('Erreur vérification/initialisation plan comptable:', err)
      }
    };

    checkAndInitializeChart();
  }, [companyId, refresh]);

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
        .select('country_code, country')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const countryCode = companyData?.country_code || companyData?.country || 'FR';

      // Utiliser le configService pour obtenir le plan comptable
      const defaultAccounts = configService.getDefaultChartOfAccounts(countryCode);

      if (!defaultAccounts || defaultAccounts.length === 0) {
        throw new Error("Le plan comptable pour le pays sélectionné n'est pas disponible.");
      }

      // Préparer les données pour l'insertion, en s'assurant de ne pas inclure de colonnes superflues
      const accountsToInsert = defaultAccounts.map(acc => ({
        company_id: companyId,
        account_number: acc.code, // Mapper 'code' vers 'account_number'
        account_name: acc.name,
        account_type: acc.type,
        account_class: parseInt(acc.code.charAt(0), 10),
        is_active: true
      }));

      // Insérer les comptes dans la base de données
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert(accountsToInsert)
        .select();


      if (error) {
        // Log plus détaillé de l'erreur d'insertion
        logger.error("Erreur détaillée de l'insertion Supabase:", error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      toast({
        title: 'Succès',
        description: `${data.length} comptes standard ont été créés`
      });

      // Rafraîchir la liste
      await refresh();

    } catch (err: unknown) {
      logger.error('Error initializing chart:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'initialisation',
        description: 'Impossible de créer le plan comptable. Vérifiez que le pays de votre entreprise est correctement configuré.'
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
      const success = await saveMapping(accountNumber, categoryId === 'none' ? null : categoryId);

      if (success) {
        if (!categoryId || categoryId === 'none') {
          toast({
            title: 'Mapping supprimé',
            description: `Le compte ${accountNumber} n'est plus mappé`
          });
        } else {
          const category = budgetCategories.find(c => c.id === categoryId);
          toast({
            title: 'Mapping enregistré',
            description: `${accountNumber} → ${category?.category}${category?.subcategory ? ` / ${category.subcategory}` : ''}`
          });
        }
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (err: unknown) {
      logger.error('Error saving mapping:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de sauvegarder le mapping'
      });
    } finally {
      setSavingMapping(null);
    }
  };

  // Filtrer les comptes
  const filteredAccounts = accounts?.filter(account => {
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
  }, {} as Record<string, typeof budgetCategories>);

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
          <AccountFiltersToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onRefresh={refresh}
            onCreateAccount={() => setCreateAccountDialogOpen(true)}
          />
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
                {filteredAccounts?.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    currentMapping={accountMappings.get(account.account_number)}
                    isSaving={savingMapping === account.account_number}
                    categoriesByType={categoriesByType}
                    onSaveMapping={handleSaveMapping}
                    renderCategoryBadge={renderCategoryBadge}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateAccountDialog
        open={createAccountDialogOpen}
        onOpenChange={setCreateAccountDialogOpen}
        onAccountCreated={() => {
          refresh();
          toast({
            title: 'Succès',
            description: 'Le compte a été créé avec succès'
          });
        }}
        companyId={companyId || ''}
      />
    </Card>
  );
}
