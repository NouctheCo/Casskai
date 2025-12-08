/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Page de gestion des immobilisations
 * - Registre des immobilisations
 * - Plans d'amortissement
 * - Calculs automatiques
 * - Écritures comptables
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  TrendingDown,
  Calculator,
  FileText,
  Archive,
  Settings,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import assetsService from '@/services/assetsService';
import type {
  AssetListItem,
  AssetStatistics,
  AssetFilters,
  AssetCategory,
  AssetStatus,
  DepreciationMethod,
} from '@/types/assets.types';
import { formatCurrency } from '@/lib/utils';

// Sous-composants (à créer séparément pour modularité)
import { AssetFormDialog } from '@/components/assets/AssetFormDialog';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { CategoryManagementDialog } from '@/components/assets/CategoryManagementDialog';
import { DepreciationScheduleDialog } from '@/components/assets/DepreciationScheduleDialog';
import { GenerateEntriesDialog } from '@/components/assets/GenerateEntriesDialog';

const AssetsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();

  // États
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [filters, setFilters] = useState<AssetFilters>({ status: 'all' });
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Dialogs
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showDepreciationSchedule, setShowDepreciationSchedule] = useState(false);
  const [showGenerateEntries, setShowGenerateEntries] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (currentCompany?.id) {
      loadAssets();
    }
  }, [filters, currentCompany?.id]);

  /**
   * Charger toutes les données
   */
  const loadData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      await Promise.all([
        loadAssets(),
        loadCategories(),
        loadStatistics(),
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(t('assets.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger les immobilisations
   */
  const loadAssets = async () => {
    if (!currentCompany?.id) return;

    try {
      const data = await assetsService.getAssets(currentCompany.id, filters);
      setAssets(data);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      throw error;
    }
  };

  /**
   * Charger les catégories depuis le plan comptable (comptes classe 2)
   */
  const loadCategories = async () => {
    if (!currentCompany?.id) {
      console.log('[AssetsPage] companyId non disponible pour charger les catégories');
      return;
    }

    try {
      console.log('[AssetsPage] Chargement des catégories pour company:', currentCompany.id);
      // Charger les comptes 21x (immobilisations corporelles) depuis le plan comptable
      const { data: chartOfAccounts, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number, account_name, created_at')
        .eq('company_id', currentCompany.id)
        .like('account_number', '21%')
        .order('account_number');

      if (error) throw error;

      console.log('[AssetsPage] Comptes 21x chargés:', chartOfAccounts);

      // Filtrer pour garder uniquement les comptes principaux (211, 213, 215, 2181, 2182, etc.)
      const mainCategories = chartOfAccounts?.filter(acc =>
        acc.account_number.length <= 4 && acc.account_number.startsWith('21')
      ) || [];

      console.log('[AssetsPage] Catégories principales filtrées:', mainCategories);

      // Convertir en format AssetCategory
      const categoriesData: AssetCategory[] = mainCategories.map(acc => ({
        id: acc.id,
        company_id: currentCompany.id,
        code: acc.account_number,
        name: acc.account_name,
        account_asset: acc.account_number,
        default_depreciation_method: 'linear' as DepreciationMethod,
        default_duration_years: 5,
        default_residual_value: 0,
        is_active: true,
        created_at: acc.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      console.log('[AssetsPage] Catégories converties:', categoriesData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('[AssetsPage] Error loading categories:', error);
      throw error;
    }
  };

  /**
   * Charger les statistiques
   */
  const loadStatistics = async () => {
    if (!currentCompany?.id) return;

    try {
      const data = await assetsService.getAssetStatistics(currentCompany.id);
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
      throw error;
    }
  };

  /**
   * Gérer le changement de filtre de recherche
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  /**
   * Gérer le changement de filtre de statut
   */
  const handleStatusFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as AssetStatus | 'all'
    }));
  };

  /**
   * Gérer le changement de filtre de catégorie
   */
  const handleCategoryFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      category_id: value === 'all' ? undefined : value
    }));
  };

  /**
   * Ouvrir le détail d'une immobilisation
   */
  const handleAssetClick = (assetId: string) => {
    setSelectedAssetId(assetId);
    setShowAssetDetail(true);
  };

  /**
   * Ouvrir le plan d'amortissement
   */
  const handleViewSchedule = (assetId: string) => {
    setSelectedAssetId(assetId);
    setShowDepreciationSchedule(true);
  };

  /**
   * Badge de statut
   */
  const getStatusBadge = (status: AssetStatus) => {
    const variants: Record<AssetStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
      active: { label: t('assets.status.active'), variant: 'success' },
      fully_depreciated: { label: t('assets.status.fullyDepreciated'), variant: 'default' },
      disposed: { label: t('assets.status.disposed'), variant: 'destructive' },
      under_maintenance: { label: t('assets.status.underMaintenance'), variant: 'warning' },
    };

    const { label, variant } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  /**
   * Badge de méthode d'amortissement
   */
  const getDepreciationMethodLabel = (method: DepreciationMethod): string => {
    const labels: Record<DepreciationMethod, string> = {
      linear: t('assets.depreciationMethod.linear'),
      declining_balance: t('assets.depreciationMethod.decliningBalance'),
      units_of_production: t('assets.depreciationMethod.unitsOfProduction'),
    };
    return labels[method];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            {t('assets.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('assets.subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoryManagement(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('assets.categories.manage')}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowGenerateEntries(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('assets.actions.generateEntries')}
          </Button>

          <Button onClick={() => setShowAssetForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('assets.actions.createAsset')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('assets.kpi.totalAssets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_assets || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {statistics?.active_assets || 0} {t('assets.kpi.active')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('assets.kpi.grossValue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.total_acquisition_value || 0, 'EUR')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('assets.kpi.acquisitionValue')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              {t('assets.kpi.depreciation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(statistics?.total_depreciation || 0, 'EUR')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('assets.kpi.cumulative')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('assets.kpi.netBookValue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(statistics?.total_net_book_value || 0, 'EUR')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              VNC = {t('assets.kpi.gross')} - {t('assets.kpi.amortization')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte écritures en attente */}
      {statistics && statistics.pending_depreciation_entries > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  {statistics.pending_depreciation_entries} {t('assets.warnings.pendingEntries')}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {t('assets.warnings.pendingEntriesDescription')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowGenerateEntries(true)}
              className="border-orange-500 text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/30"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('assets.actions.generateNow')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('assets.filters.search')}
                  value={filters.search || ''}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre statut */}
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('assets.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('assets.status.active')}</SelectItem>
                <SelectItem value="fully_depreciated">{t('assets.status.fullyDepreciated')}</SelectItem>
                <SelectItem value="disposed">{t('assets.status.disposed')}</SelectItem>
                <SelectItem value="under_maintenance">{t('assets.status.underMaintenance')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre catégorie */}
            <Select
              value={filters.category_id || 'all'}
              onValueChange={handleCategoryFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('assets.filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des immobilisations */}
      <Card>
        <CardHeader>
          <CardTitle>{t('assets.registry.title')}</CardTitle>
          <CardDescription>
            {assets.length} {t('assets.registry.count', { count: assets.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('assets.table.assetNumber')}</TableHead>
                <TableHead>{t('assets.table.name')}</TableHead>
                <TableHead>{t('assets.table.category')}</TableHead>
                <TableHead>{t('assets.table.acquisitionDate')}</TableHead>
                <TableHead className="text-right">{t('assets.table.acquisitionValue')}</TableHead>
                <TableHead className="text-right">{t('assets.table.netBookValue')}</TableHead>
                <TableHead>{t('assets.table.method')}</TableHead>
                <TableHead>{t('assets.table.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>{t('common.loading')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Archive className="w-12 h-12" />
                      <p>{t('assets.registry.empty')}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssetForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('assets.actions.createFirst')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleAssetClick(asset.id)}
                  >
                    <TableCell className="font-medium">
                      {asset.asset_number || '-'}
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category_name || '-'}</TableCell>
                    <TableCell>
                      {new Date(asset.acquisition_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.acquisition_value, 'EUR')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(asset.net_book_value, 'EUR')}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {getDepreciationMethodLabel(asset.depreciation_method)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSchedule(asset.id);
                        }}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showAssetForm && (
        <AssetFormDialog
          open={showAssetForm}
          onClose={() => {
            setShowAssetForm(false);
            loadData();
          }}
          categories={categories}
          onCategoryCreated={loadCategories}
        />
      )}

      {showAssetDetail && selectedAssetId && (
        <AssetDetailDialog
          open={showAssetDetail}
          onClose={() => {
            setShowAssetDetail(false);
            setSelectedAssetId(null);
            loadData();
          }}
          assetId={selectedAssetId}
        />
      )}

      {showCategoryManagement && (
        <CategoryManagementDialog
          open={showCategoryManagement}
          onClose={() => {
            setShowCategoryManagement(false);
            loadCategories();
          }}
        />
      )}

      {showDepreciationSchedule && selectedAssetId && (
        <DepreciationScheduleDialog
          open={showDepreciationSchedule}
          onClose={() => {
            setShowDepreciationSchedule(false);
            setSelectedAssetId(null);
          }}
          assetId={selectedAssetId}
        />
      )}

      {showGenerateEntries && (
        <GenerateEntriesDialog
          open={showGenerateEntries}
          onClose={() => {
            setShowGenerateEntries(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default AssetsPage;
