import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, BarChart3, PieChart, Calendar, Loader2, Building, TrendingUp, TrendingDown, DollarSign, FileBarChart, AlertCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subYears } from 'date-fns';
import { journalEntryService } from '@/services/journalEntryService';

export default function ReportsPage() {
  const { t, formatCurrency } = useLocale();
  const { currentEnterpriseId } = useAuth();
  const { toast } = useToast();

  // States
  const [selectedPeriod, setSelectedPeriod] = useState('current-year');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalculatingBalances, setRecalculatingBalances] = useState(false);

  // Calcul des périodes
  const periods = useMemo(() => {
    const now = new Date();
    return {
      'current-year': {
        label: t('reports.currentYear', { defaultValue: 'Année en cours' }),
        start: startOfYear(now),
        end: endOfYear(now)
      },
      'last-year': {
        label: t('reports.lastYear', { defaultValue: 'Année précédente' }),
        start: startOfYear(subYears(now, 1)),
        end: endOfYear(subYears(now, 1))
      },
      'current-month': {
        label: t('reports.currentMonth', { defaultValue: 'Mois en cours' }),
        start: startOfMonth(now),
        end: endOfMonth(now)
      },
      'last-month': {
        label: t('reports.lastMonth', { defaultValue: 'Mois précédent' }),
        start: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)),
        end: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1))
      }
    };
  }, [t]);

  // Types de rapports
  const reportTypes = useMemo(() => [
    { 
      id: 'balance-sheet',
      name: t('reports.balanceSheet', { defaultValue: 'Bilan' }), 
      icon: BarChart3, 
      description: t('reports.balanceSheetDesc', { 
        defaultValue: 'Situation patrimoniale à une date donnée' 
      }),
      color: 'bg-blue-500'
    },
    { 
      id: 'income-statement',
      name: t('reports.incomeStatement', { defaultValue: 'Compte de résultat' }), 
      icon: TrendingUp, 
      description: t('reports.incomeStatementDesc', { 
        defaultValue: 'Performance financière sur une période' 
      }),
      color: 'bg-green-500'
    },
    { 
      id: 'cash-flow',
      name: t('reports.cashFlowStatement', { defaultValue: 'Flux de trésorerie' }), 
      icon: DollarSign, 
      description: t('reports.cashFlowDesc', { 
        defaultValue: 'Mouvements de trésorerie' 
      }),
      color: 'bg-purple-500'
    },
    { 
      id: 'trial-balance',
      name: t('reports.trialBalance', { defaultValue: 'Balance générale' }), 
      icon: FileBarChart, 
      description: t('reports.trialBalanceDesc', { 
        defaultValue: 'Soldes de tous les comptes' 
      }),
      color: 'bg-orange-500'
    }
  ], [t]);

  // Recalculate account balances
  const recalculateAccountBalances = useCallback(async () => {
    if (!currentEnterpriseId) return;
    
    setRecalculatingBalances(true);
    try {
      const result = await journalEntryService.calculateAccountBalances(currentEnterpriseId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to recalculate account balances');
      }
      toast({
        title: t('success', { defaultValue: 'Succès' }),
        description: t('reports.balancesRecalculated', { 
          defaultValue: 'Soldes des comptes recalculés avec succès' 
        })
      });
    } catch (error) {
      console.error('Error recalculating account balances:', error);
      toast({
        variant: 'destructive',
        title: t('error', { defaultValue: 'Erreur' }),
        description: t('reports.balancesRecalculationError', { 
          defaultValue: 'Erreur lors du recalcul des soldes des comptes' 
        })
      });
    } finally {
      setRecalculatingBalances(false);
    }
  }, [currentEnterpriseId, toast, t]);

  // Chargement des données
  const fetchAccountingData = useCallback(async () => {
    if (!currentEnterpriseId) return;
    
    setLoading(true);
    try {
      // Charger les comptes
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', currentEnterpriseId)
        .order('account_number');

      if (accountsError) throw accountsError;

      // Charger les écritures avec leurs lignes
      const period = periods[selectedPeriod];
      const { data: entriesData, error: entriesError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_items (
            *,
            accounts (*)
          )
        `)
        .eq('company_id', currentEnterpriseId)
        .gte('entry_date', format(period.start, 'yyyy-MM-dd'))
        .lte('entry_date', format(period.end, 'yyyy-MM-dd'));

      if (entriesError) throw entriesError;

      setAccounts(accountsData || []);
      setJournalEntries(entriesData || []);

    } catch (error) {
      console.error('Error fetching accounting data:', error);
      toast({
        title: t('error', { defaultValue: 'Erreur' }),
        description: t('reports.dataLoadError', { 
          defaultValue: 'Erreur lors du chargement des données comptables' 
        }),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, selectedPeriod, periods, toast, t]);

  useEffect(() => {
    fetchAccountingData();
  }, [fetchAccountingData]);

  // Génération du bilan
  const generateBalanceSheet = useCallback(() => {
    // Use account balances directly from the database
    const assets = {}; // Actif (classes 1, 2, 3)
    const liabilities = {}; // Passif (classes 4, 5, 7)
    
    accounts.forEach(account => {
      const accountClass = account.account_number.charAt(0);
      const balance = parseFloat(account.balance || 0);
      
      if (['1', '2', '3'].includes(accountClass)) {
        // Actif
        const category = accountClass === '1' ? 'immobilisations' :
                        accountClass === '2' ? 'stocks' : 'creances';
        
        if (!assets[category]) assets[category] = { label: '', accounts: [], total: 0 };
        assets[category].accounts.push(account);
        assets[category].total += balance;
      } else if (['4', '5', '7'].includes(accountClass)) {
        // Passif
        const category = accountClass === '4' ? 'dettes' : 
                         accountClass === '7' ? 'produits' : 'tresorerie';
        
        if (!liabilities[category]) liabilities[category] = { label: '', accounts: [], total: 0 };
        liabilities[category].accounts.push(account);
        liabilities[category].total += Math.abs(balance);
      }
    });

    // Ajouter les libellés
    if (assets.immobilisations) assets.immobilisations.label = t('reports.fixedAssets', { defaultValue: 'Immobilisations' });
    if (assets.stocks) assets.stocks.label = t('reports.inventory', { defaultValue: 'Stocks' });
    if (assets.creances) assets.creances.label = t('reports.receivables', { defaultValue: 'Créances' });
    if (liabilities.dettes) liabilities.dettes.label = t('reports.payables', { defaultValue: 'Dettes' });
    if (liabilities.tresorerie) liabilities.tresorerie.label = t('reports.cash', { defaultValue: 'Trésorerie' });
    if (liabilities.produits) liabilities.produits.label = t('reports.revenues', { defaultValue: 'Produits' });

    const totalAssets = Object.values(assets).reduce((sum, cat) => sum + cat.total, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, cat) => sum + cat.total, 0);

    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      balanced: Math.abs(totalAssets - totalLiabilities) < 0.01
    };
  }, [accounts, t]);

  // Génération du compte de résultat
  const generateIncomeStatement = useCallback(() => {
    // Use account balances directly from the database
    const revenues = {}; // Produits (classe 7)
    const expenses = {}; // Charges (classe 6)
    
    accounts.forEach(account => {
      const accountClass = account.account_number.charAt(0);
      const balance = Math.abs(parseFloat(account.balance || 0));
      
      if (accountClass === '7') {
        // Produits
        const subClass = account.account_number.substring(0, 2);
        const category = subClass === '70' ? 'sales' :
                        subClass === '75' ? 'other_revenues' : 'financial_revenues';
        
        if (!revenues[category]) revenues[category] = { label: '', accounts: [], total: 0 };
        revenues[category].accounts.push(account);
        revenues[category].total += balance;
      } else if (accountClass === '6') {
        // Charges
        const subClass = account.account_number.substring(0, 2);
        const category = subClass === '60' ? 'purchases' :
                        subClass === '61' ? 'external_expenses' :
                        subClass === '64' ? 'personnel_expenses' : 'other_expenses';
        
        if (!expenses[category]) expenses[category] = { label: '', accounts: [], total: 0 };
        expenses[category].accounts.push(account);
        expenses[category].total += balance;
      }
    });

    // Ajouter les libellés
    if (revenues.sales) revenues.sales.label = t('reports.salesRevenue', { defaultValue: 'Chiffre d\'affaires' });
    if (revenues.other_revenues) revenues.other_revenues.label = t('reports.otherRevenues', { defaultValue: 'Autres produits' });
    if (revenues.financial_revenues) revenues.financial_revenues.label = t('reports.financialRevenues', { defaultValue: 'Produits financiers' });
    
    if (expenses.purchases) expenses.purchases.label = t('reports.purchases', { defaultValue: 'Achats' });
    if (expenses.external_expenses) expenses.external_expenses.label = t('reports.externalExpenses', { defaultValue: 'Services extérieurs' });
    if (expenses.personnel_expenses) expenses.personnel_expenses.label = t('reports.personnelExpenses', { defaultValue: 'Charges de personnel' });
    if (expenses.other_expenses) expenses.other_expenses.label = t('reports.otherExpenses', { defaultValue: 'Autres charges' });

    const totalRevenues = Object.values(revenues).reduce((sum, cat) => sum + cat.total, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, cat) => sum + cat.total, 0);
    const netResult = totalRevenues - totalExpenses;

    return {
      revenues,
      expenses,
      totalRevenues,
      totalExpenses,
      netResult,
      profitable: netResult > 0
    };
  }, [accounts, t]);

  // Génération de la balance générale
  const generateTrialBalance = useCallback(() => {
    // Use account balances directly from the database
    const accountsWithBalances = accounts
      .filter(account => parseFloat(account.balance || 0) !== 0)
      .map(account => {
        // Determine debit and credit based on account type and balance
        const balance = parseFloat(account.balance || 0);
        const accountClass = account.account_number.charAt(0);
        let debit_total = 0;
        let credit_total = 0;
        
        if (['1', '2', '3', '6'].includes(accountClass)) {
          // For asset and expense accounts, positive balance is debit
          if (balance > 0) {
            debit_total = balance;
          } else {
            credit_total = Math.abs(balance);
          }
        } else {
          // For liability, equity, and revenue accounts, positive balance is credit
          if (balance > 0) {
            credit_total = balance;
          } else {
            debit_total = Math.abs(balance);
          }
        }
        
        return {
          ...account,
          debit_total,
          credit_total
        };
      })
      .sort((a, b) => a.account_number.localeCompare(b.account_number));

    const totalDebits = accountsWithBalances.reduce((sum, account) => sum + account.debit_total, 0);
    const totalCredits = accountsWithBalances.reduce((sum, account) => sum + account.credit_total, 0);

    return {
      accounts: accountsWithBalances,
      totalDebits,
      totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  }, [accounts]);

  // Gestion de la génération de rapport
  const handleGenerateReport = useCallback(async (reportType) => {
    if (!currentEnterpriseId) {
      toast({
        title: t('error', { defaultValue: 'Erreur' }),
        description: t('reports.noCompanySelected', { 
          defaultValue: 'Aucune entreprise sélectionnée' 
        }),
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setSelectedReport(reportType);

    try {
      let data;
      switch (reportType.id) {
        case 'balance-sheet':
          data = generateBalanceSheet();
          break;
        case 'income-statement':
          data = generateIncomeStatement();
          break;
        case 'trial-balance':
          data = generateTrialBalance();
          break;
        case 'cash-flow':
          data = { message: t('reports.comingSoon', { defaultValue: 'Bientôt disponible' }) };
          break;
        default:
          data = {};
      }

      setReportData(data);
      setIsDialogOpen(true);

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: t('error', { defaultValue: 'Erreur' }),
        description: t('reports.generationError', { 
          defaultValue: 'Erreur lors de la génération du rapport' 
        }),
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentEnterpriseId, generateBalanceSheet, generateIncomeStatement, generateTrialBalance, toast, t]);

  // Export PDF/Excel (simulation)
  const handleExport = useCallback((format) => {
    toast({
      title: t('reports.exportStarted', { defaultValue: 'Export démarré' }),
      description: t('reports.exportMessage', { 
        defaultValue: `Export ${format.toUpperCase()} en cours de préparation...` 
      })
    });
  }, [toast, t]);

  // Composant de rendu du rapport
  const renderReportContent = () => {
    if (!reportData || !selectedReport) return null;

    switch (selectedReport.id) {
      case 'balance-sheet':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Actif */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">
                  {t('reports.assets', { defaultValue: 'ACTIF' })}
                </h3>
                {Object.entries(reportData.assets).map(([key, category]) => (
                  <div key={key} className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {category.label}
                    </h4>
                    {category.accounts.slice(0, 3).map(account => (
                      <div key={account.account_number} className="flex justify-between text-sm py-1">
                        <span>{account.account_number} - {account.name}</span>
                        <span>{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium text-sm border-t pt-1">
                      <span>{t('reports.subtotal', { defaultValue: 'Sous-total' })}</span>
                      <span>{formatCurrency(category.total)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                  <span>{t('reports.totalAssets', { defaultValue: 'TOTAL ACTIF' })}</span>
                  <span>{formatCurrency(reportData.totalAssets)}</span>
                </div>
              </div>

              {/* Passif */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">
                  {t('reports.liabilities', { defaultValue: 'PASSIF' })}
                </h3>
                {Object.entries(reportData.liabilities).map(([key, category]) => (
                  <div key={key} className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {category.label}
                    </h4>
                    {category.accounts.slice(0, 3).map(account => (
                      <div key={account.account_number} className="flex justify-between text-sm py-1">
                        <span>{account.account_number} - {account.name}</span>
                        <span>{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium text-sm border-t pt-1">
                      <span>{t('reports.subtotal', { defaultValue: 'Sous-total' })}</span>
                      <span>{formatCurrency(category.total)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                  <span>{t('reports.totalLiabilities', { defaultValue: 'TOTAL PASSIF' })}</span>
                  <span>{formatCurrency(reportData.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Indicateur d'équilibre */}
            <div className={`p-4 rounded-lg ${reportData.balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center gap-2">
                {reportData.balanced ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {reportData.balanced 
                    ? t('reports.balanced', { defaultValue: 'Bilan équilibré' })
                    : t('reports.unbalanced', { defaultValue: 'Bilan déséquilibré' })
                  }
                </span>
              </div>
            </div>
          </div>
        );

      case 'income-statement':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Produits */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">
                  {t('reports.revenues', { defaultValue: 'PRODUITS' })}
                </h3>
                {Object.entries(reportData.revenues).map(([key, category]) => (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between font-medium">
                      <span>{category.label}</span>
                      <span>{formatCurrency(category.total)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                  <span>{t('reports.totalRevenues', { defaultValue: 'TOTAL PRODUITS' })}</span>
                  <span>{formatCurrency(reportData.totalRevenues)}</span>
                </div>
              </div>

              {/* Charges */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600">
                  {t('reports.expenses', { defaultValue: 'CHARGES' })}
                </h3>
                {Object.entries(reportData.expenses).map(([key, category]) => (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between font-medium">
                      <span>{category.label}</span>
                      <span>{formatCurrency(category.total)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                  <span>{t('reports.totalExpenses', { defaultValue: 'TOTAL CHARGES' })}</span>
                  <span>{formatCurrency(reportData.totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Résultat net */}
            <div className={`p-4 rounded-lg ${reportData.profitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reportData.profitable ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span className="font-bold text-lg">
                    {t('reports.netResult', { defaultValue: 'RÉSULTAT NET' })}
                  </span>
                </div>
                <span className="font-bold text-xl">
                  {formatCurrency(reportData.netResult)}
                </span>
              </div>
            </div>
          </div>
        );

      case 'trial-balance':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t('reports.accountNumber', { defaultValue: 'N° Compte' })}</th>
                    <th className="text-left py-2">{t('reports.accountName', { defaultValue: 'Libellé' })}</th>
                    <th className="text-right py-2">{t('reports.debit', { defaultValue: 'Débit' })}</th>
                    <th className="text-right py-2">{t('reports.credit', { defaultValue: 'Crédit' })}</th>
                    <th className="text-right py-2">{t('reports.balance', { defaultValue: 'Solde' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.accounts.slice(0, 10).map(account => (
                    <tr key={account.account_number} className="border-b">
                      <td className="py-1">{account.account_number}</td>
                      <td className="py-1">{account.name}</td>
                      <td className="text-right py-1">{formatCurrency(account.debit_total)}</td>
                      <td className="text-right py-1">{formatCurrency(account.credit_total)}</td>
                      <td className="text-right py-1">{formatCurrency(account.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan="2" className="py-2">{t('reports.total', { defaultValue: 'TOTAL' })}</td>
                    <td className="text-right py-2">{formatCurrency(reportData.totalDebits)}</td>
                    <td className="text-right py-2">{formatCurrency(reportData.totalCredits)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {reportData.accounts.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                {t('reports.showingFirstAccounts', { 
                  defaultValue: `Affichage des 10 premiers comptes sur ${reportData.accounts.length}` 
                })}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>{reportData.message}</p>
          </div>
        );
    }
  };

  if (!currentEnterpriseId) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64"
      >
        <Building className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t('reports.noCompanySelected', { defaultValue: 'Aucune entreprise sélectionnée' })}
        </h2>
        <p className="text-muted-foreground">
          {t('reports.selectCompanyPrompt', { 
            defaultValue: 'Sélectionnez une entreprise pour générer des rapports' 
          })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('reports.financialReports', { defaultValue: 'Rapports Financiers' })}
          </h1>
          <p className="text-muted-foreground">
            {t('reports.generateAndAnalyze', { 
              defaultValue: 'Générez et analysez vos rapports comptables' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periods).map(([key, period]) => (
                <SelectItem key={key} value={key}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={recalculateAccountBalances} 
            disabled={recalculatingBalances}
          >
            {recalculatingBalances ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            {t('reports.recalculateBalances', { defaultValue: 'Recalculer les soldes' })}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {reportTypes.map((report, index) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0px 8px 15px rgba(0,0,0,0.07)" }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.color} text-white`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[120px]">
                  <Button 
                    onClick={() => handleGenerateReport(report)}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    {t('reports.generateReport', { defaultValue: 'Générer le rapport' })}
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={isGenerating}
                  >
                    {t('reports.exportPdf', { defaultValue: 'Export PDF' })}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('excel')}
                    disabled={isGenerating}
                  >
                    {t('reports.exportExcel', { defaultValue: 'Export Excel' })}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Section Analytics personnalisée */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.customAnalysis', { defaultValue: 'Analyses Personnalisées' })}</CardTitle>
          <CardDescription>
            {t('reports.customAnalysisDesc', { 
              defaultValue: 'Créez des analyses sur mesure selon vos besoins' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <PieChart className="mx-auto h-12 w-12 text-primary/50" />
            <p className="mt-4 text-muted-foreground">
              {t('reports.comingSoon', { defaultValue: 'Bientôt disponible' })}
            </p>
            <Button variant="link" className="mt-2">
              {t('reports.requestDemo', { defaultValue: 'Demander une démo' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour afficher les rapports */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <>
                  <selectedReport.icon className="h-5 w-5" />
                  {selectedReport.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('reports.periodLabel', { defaultValue: 'Période' })}: {periods[selectedPeriod]?.label}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {renderReportContent()}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('reports.exportPdf', { defaultValue: 'Export PDF' })}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('excel')}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('reports.exportExcel', { defaultValue: 'Export Excel' })}
              </Button>
            </div>
            <Button onClick={() => setIsDialogOpen(false)}>
              {t('reports.close', { defaultValue: 'Fermer' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}