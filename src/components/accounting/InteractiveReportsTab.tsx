/**
 * CassKai - Interactive Reports with Drill-Down
 *
 * Phase 2 (P1) - High-Impact Feature
 *
 * Fonctionnalités:
 * - Drill-down 3 niveaux: Bilan → Compte auxiliaire → Écritures sources
 * - Graphiques interactifs Recharts
 * - Export Excel avec formules et macros
 * - Navigation breadcrumb
 * - Performance optimisée
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import {
  ChevronRight,
  ChevronLeft,
  Download,
  BarChart3,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Home,
  Eye,
  Table as TableIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { reportGenerationService } from '@/services/reportGenerationService';
import { accountingDataService } from '@/services/accountingDataService';
import { formatCurrency, getCurrentCompanyCurrency } from '@/lib/utils';
// Local type matching the shape returned by accountingDataService.getAccountEntries
interface AccountEntryRow {
  id: string;
  journal_entry_number: string;
  entry_date: string;
  description: string;
  reference: string | null;
  debit: number;
  credit: number;
  balance: number;
}

// Types pour le drill-down
type DrillLevel = 'balance_sheet' | 'account_detail' | 'journal_entries';

interface DrillDownState {
  level: DrillLevel;
  accountCode?: string;
  accountName?: string;
  periodStart: string;
  periodEnd: string;
}

interface BalanceSheetLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  category: 'actif' | 'passif';
}

interface AccountDetail {
  accountCode: string;
  accountName: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: AccountEntryRow[];
}

interface ChartDataItem {
  name?: string;
  value?: number;
  balance?: number;
  category?: string;
  month?: string;
  date?: string;
  debit?: number;
  credit?: number;
}

export default function InteractiveReportsTab() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // État du drill-down
  const [drillState, setDrillState] = useState<DrillDownState>({
    level: 'balance_sheet',
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  });

  // Données des niveaux
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetLine[]>([]);
  const [accountDetailData, setAccountDetailData] = useState<AccountDetail | null>(null);
  const [journalEntries, setJournalEntries] = useState<AccountEntryRow[]>([]);

  // Données pour graphiques
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  const currency = currentCompany?.default_currency || getCurrentCompanyCurrency();

  /**
   * Niveau 1: Chargement du Bilan complet
   */
  const loadBalanceSheet = useCallback(async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      logger.debug('InteractiveReportsTab', 'Loading balance sheet...');

      // Charger tous les comptes avec leurs balances
      const result = await accountingDataService.getTrialBalance(
        currentCompany.id,
        drillState.periodStart,
        drillState.periodEnd
      );

      if (!result.data) {
        throw new Error(t('interactiveReports.errorLoadingBalanceSheet'));
      }

      // Transformer en lignes de bilan (Actif/Passif)
      const balanceLines: BalanceSheetLine[] = result.data.map((account: { account_code: string; account_name: string; total_debit: number; total_credit: number; balance: number }) => ({
        accountCode: account.account_code,
        accountName: account.account_name,
        debit: account.total_debit || 0,
        credit: account.total_credit || 0,
        balance: (account.total_debit || 0) - (account.total_credit || 0),
        category: determineCategory(account.account_code)
      }));

      setBalanceSheetData(balanceLines);

      // Préparer données pour graphiques (Top 10 comptes)
      const topAccounts = [...balanceLines]
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
        .slice(0, 10)
        .map(acc => ({
          name: `${acc.accountCode} - ${acc.accountName.substring(0, 20)}`,
          value: Math.abs(acc.balance),
          balance: acc.balance,
          category: acc.category
        }));

      setChartData(topAccounts);

      logger.debug('InteractiveReportsTab', 'Balance sheet loaded:', {
        totalAccounts: balanceLines.length,
        topAccounts: topAccounts.length
      });
    } catch (error) {
      logger.error('InteractiveReportsTab', 'Error loading balance sheet:', error);
      toastError(t('interactiveReports.errorLoadingBalanceSheet'));
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, drillState.periodStart, drillState.periodEnd]);

  /**
   * Niveau 2: Drill-down vers un compte auxiliaire
   */
  const loadAccountDetail = useCallback(async (accountCode: string, accountName: string) => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      logger.debug('InteractiveReportsTab', 'Loading account detail:', { accountCode, accountName });

      // Charger toutes les écritures du compte
      const result = await accountingDataService.getAccountEntries(
        currentCompany.id,
        accountCode,
        drillState.periodStart,
        drillState.periodEnd
      );

      if (!result.data) {
        throw new Error(t('interactiveReports.errorLoadingAccountEntries'));
      }

      const entries = result.data as AccountEntryRow[];

      // Calculer les totaux
      const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      const closingBalance = totalDebit - totalCredit;

      const accountDetail: AccountDetail = {
        accountCode,
        accountName,
        openingBalance: 0, // TODO: calculer depuis N-1
        totalDebit,
        totalCredit,
        closingBalance,
        entries
      };

      setAccountDetailData(accountDetail);

      // Préparer graphique d'évolution mensuelle
      const monthlyData = calculateMonthlyEvolution(entries);
      setChartData(monthlyData);

      // Passer au niveau 2
      setDrillState(prev => ({
        ...prev,
        level: 'account_detail',
        accountCode,
        accountName
      }));

      logger.debug('InteractiveReportsTab', 'Account detail loaded:', {
        entries: entries.length,
        totalDebit,
        totalCredit,
        closingBalance
      });
    } catch (error) {
      logger.error('InteractiveReportsTab', 'Error loading account detail:', error);
      toastError(t('interactiveReports.errorLoadingAccountDetail'));
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, drillState.periodStart, drillState.periodEnd]);

  /**
   * Niveau 3: Drill-down vers les écritures sources
   */
  const loadJournalEntries = useCallback((entries: AccountEntryRow[]) => {
    logger.debug('InteractiveReportsTab', 'Loading journal entries:', { count: entries.length });

    setJournalEntries(entries);

    // Préparer graphique chronologique
    const chronologicalData = entries
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
      .map(entry => ({
        date: new Date(entry.entry_date).toLocaleDateString('fr-FR'),
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        balance: (entry.debit || 0) - (entry.credit || 0)
      }));

    setChartData(chronologicalData);

    setDrillState(prev => ({
      ...prev,
      level: 'journal_entries'
    }));
  }, []);

  /**
   * Navigation: Retour au niveau précédent
   */
  const navigateBack = useCallback(() => {
    logger.debug('InteractiveReportsTab', 'Navigating back from level:', drillState.level);

    if (drillState.level === 'journal_entries') {
      // Retour au compte
      setDrillState(prev => ({ ...prev, level: 'account_detail' }));
      setJournalEntries([]);
    } else if (drillState.level === 'account_detail') {
      // Retour au bilan
      setDrillState(prev => ({
        ...prev,
        level: 'balance_sheet',
        accountCode: undefined,
        accountName: undefined
      }));
      setAccountDetailData(null);
      loadBalanceSheet();
    }
  }, [drillState.level, loadBalanceSheet]);

  /**
   * Navigation: Retour à l'accueil (bilan)
   */
  const navigateHome = useCallback(() => {
    logger.debug('InteractiveReportsTab', 'Navigating home');

    setDrillState(prev => ({
      ...prev,
      level: 'balance_sheet',
      accountCode: undefined,
      accountName: undefined
    }));
    setAccountDetailData(null);
    setJournalEntries([]);
    loadBalanceSheet();
  }, [loadBalanceSheet]);

  /**
   * Export Excel interactif avec formules
   */
  const handleExportExcel = useCallback(async () => {
    if (!currentCompany?.id) return;

    setExporting(true);
    try {
      logger.debug('InteractiveReportsTab', 'Exporting to Excel...');

      const filters = {
        companyId: currentCompany.id,
        startDate: drillState.periodStart,
        endDate: drillState.periodEnd
      };

      const exportOptions = {
        format: 'excel' as const,
        title: t('interactiveReports.interactiveBalanceSheetExport', {
          date: new Date().toLocaleDateString('fr-FR')
        }),
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address || undefined,
          phone: currentCompany.phone || undefined,
          email: currentCompany.email || undefined
        },
        includeFormulas: true, // Formules Excel
        includeCharts: true,   // Graphiques Excel
        includeMacros: false   // Pas de macros (sécurité)
      };

      const downloadUrl = await reportGenerationService.generateBalanceSheet(
        filters,
        exportOptions
      );

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Bilan-Interactif-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();

        toastSuccess(t('interactiveReports.exportSuccess'));
      }

      logger.debug('InteractiveReportsTab', 'Export successful');
    } catch (error) {
      logger.error('InteractiveReportsTab', 'Error exporting to Excel:', error);
      toastError(t('interactiveReports.exportError'));
    } finally {
      setExporting(false);
    }
  }, [currentCompany, drillState.periodStart, drillState.periodEnd]);

  /**
   * Chargement initial du bilan
   */
  useEffect(() => {
    if (drillState.level === 'balance_sheet') {
      loadBalanceSheet();
    }
  }, [drillState.level, loadBalanceSheet]);

  /**
   * Helper: Déterminer catégorie Actif/Passif depuis code compte
   */
  function determineCategory(accountCode: string): 'actif' | 'passif' {
    const firstDigit = accountCode.charAt(0);
    // Classes 1-5: Passif et Actif selon PCG
    // Classes 2-3: Actif immobilisé et circulant
    // Classes 1, 4, 5: Capitaux propres, dettes, financier (mixte)
    // Simplification: 2,3,4 (avec 41x clients) = Actif
    if (['2', '3'].includes(firstDigit) || accountCode.startsWith('41')) {
      return 'actif';
    }
    return 'passif';
  }

  /**
   * Helper: Calculer évolution mensuelle
   */
  function calculateMonthlyEvolution(entries: AccountEntryRow[]) {
    const monthlyMap = new Map<string, { debit: number; credit: number; balance: number }>();

    entries.forEach(entry => {
      const month = new Date(entry.entry_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short'
      });

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { debit: 0, credit: 0, balance: 0 });
      }

      const data = monthlyMap.get(month)!;
      data.debit += entry.debit || 0;
      data.credit += entry.credit || 0;
      data.balance += (entry.debit || 0) - (entry.credit || 0);
    });

    return Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const [monthA] = a;
        const [monthB] = b;
        return new Date(monthA).getTime() - new Date(monthB).getTime();
      })
      .map(([month, data]) => ({
        month,
        debit: data.debit,
        credit: data.credit,
        balance: data.balance
      }));
  }

  /**
   * Couleurs pour graphiques
   */
  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316'];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateHome}
                disabled={drillState.level === 'balance_sheet'}
              >
                <Home className="w-4 h-4 mr-1" />
                {t('interactiveReports.balanceSheet')}
              </Button>

              {drillState.level !== 'balance_sheet' && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrillState(prev => ({ ...prev, level: 'account_detail' }))}
                    disabled={drillState.level === 'account_detail'}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    {drillState.accountCode} - {drillState.accountName}
                  </Button>
                </>
              )}

              {drillState.level === 'journal_entries' && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('interactiveReports.entriesCount', { count: journalEntries.length })}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {drillState.level !== 'balance_sheet' && (
                <Button variant="outline" size="sm" onClick={navigateBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t('interactiveReports.back')}
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {t('interactiveReports.exporting')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    {t('interactiveReports.exportExcel')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique interactif selon niveau */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span>
                {drillState.level === 'balance_sheet' && t('interactiveReports.topAccountsChart')}
                {drillState.level === 'account_detail' && t('interactiveReports.monthlyEvolutionChart')}
                {drillState.level === 'journal_entries' && t('interactiveReports.chronologicalMovementsChart')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {drillState.level === 'balance_sheet' && (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: { name?: string; value?: number }) => `${entry.name}: ${formatCurrency(entry.value ?? 0, currency)}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}

            {drillState.level === 'account_detail' && (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="debit"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorDebit)"
                    name={t('interactiveReports.chartDebit')}
                  />
                  <Area
                    type="monotone"
                    dataKey="credit"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorCredit)"
                    name={t('interactiveReports.chartCredit')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {drillState.level === 'journal_entries' && (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="debit"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name={t('interactiveReports.chartDebit')}
                  />
                  <Line
                    type="monotone"
                    dataKey="credit"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name={t('interactiveReports.chartCredit')}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#10B981"
                    strokeWidth={2}
                    name={t('interactiveReports.chartBalance')}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Niveau 1: Bilan (Liste des comptes) */}
      {drillState.level === 'balance_sheet' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TableIcon className="w-5 h-5 text-blue-500" />
                <span>{t('interactiveReports.balanceSheetTitle')}</span>
              </div>
              <Badge variant="secondary">
                {t('interactiveReports.accountsCount', { count: balanceSheetData.length })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">{t('interactiveReports.loadingBalanceSheet')}</span>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {balanceSheetData.map((line, index) => (
                  <div
                    key={index}
                    onClick={() => loadAccountDetail(line.accountCode, line.accountName)}
                    className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        line.category === 'actif'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {line.category === 'actif' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-medium text-gray-900 dark:text-white">
                            {line.accountCode}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {line.category === 'actif' ? t('interactiveReports.asset') : t('interactiveReports.liability')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {line.accountName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.debit')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          <CurrencyAmount amount={line.debit} />
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.credit')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          <CurrencyAmount amount={line.credit} />
                        </p>
                      </div>

                      <div className="text-right min-w-[140px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.balance')}</p>
                        <p className={`font-bold ${
                          line.balance > 0
                            ? 'text-green-600 dark:text-green-400'
                            : line.balance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          <CurrencyAmount amount={Math.abs(line.balance)} />
                          {line.balance !== 0 && (
                            <span className="ml-1 text-xs">
                              {line.balance > 0 ? t('interactiveReports.debitShort') : t('interactiveReports.creditShort')}
                            </span>
                          )}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Niveau 2: Détail du compte */}
      {drillState.level === 'account_detail' && accountDetailData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>
                  {t('interactiveReports.accountDetail')} {accountDetailData.accountCode} - {accountDetailData.accountName}
                </span>
              </div>
              <Badge variant="secondary">
                {t('interactiveReports.entriesCount', { count: accountDetailData.entries.length })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Résumé du compte */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('interactiveReports.openingBalance')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      <CurrencyAmount amount={accountDetailData.openingBalance} />
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('interactiveReports.totalDebit')}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      <CurrencyAmount amount={accountDetailData.totalDebit} />
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('interactiveReports.totalCredit')}</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      <CurrencyAmount amount={accountDetailData.totalCredit} />
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('interactiveReports.closingBalance')}</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      <CurrencyAmount amount={Math.abs(accountDetailData.closingBalance)} />
                      {accountDetailData.closingBalance !== 0 && (
                        <span className="ml-1 text-sm">
                          {accountDetailData.closingBalance > 0 ? t('interactiveReports.debitShort') : t('interactiveReports.creditShort')}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Liste des écritures regroupées */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('interactiveReports.journalEntries')}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadJournalEntries(accountDetailData.entries)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t('interactiveReports.viewAllEntries')}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {accountDetailData.entries.slice(0, 10).map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {entry.journal_entry_number}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.debit')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.debit ? <CurrencyAmount amount={entry.debit} /> : '-'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.credit')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.credit ? <CurrencyAmount amount={entry.credit} /> : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {accountDetailData.entries.length > 10 && (
                    <div className="text-center py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadJournalEntries(accountDetailData.entries)}
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        {t('interactiveReports.viewMoreEntries', { count: accountDetailData.entries.length - 10 })}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Niveau 3: Écritures sources détaillées */}
      {drillState.level === 'journal_entries' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <span>{t('interactiveReports.entryDetails')}</span>
              </div>
              <Badge variant="secondary">
                {t('interactiveReports.entriesCount', { count: journalEntries.length })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {journalEntries.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {entry.journal_entry_number}
                        </span>
                        <Badge variant="outline">
                          {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.description}
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      {entry.debit && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.debit')}</p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            <CurrencyAmount amount={entry.debit} />
                          </p>
                        </div>
                      )}

                      {entry.credit && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('interactiveReports.credit')}</p>
                          <p className="font-bold text-red-600 dark:text-red-400">
                            <CurrencyAmount amount={entry.credit} />
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.reference && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('interactiveReports.reference')}: <span className="font-mono">{entry.reference}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
