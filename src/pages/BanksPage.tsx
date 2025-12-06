/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { bankStorageAdapter, BankStorageTransaction } from '@/services/bankStorageAdapter';
import { TransactionCategorization } from '@/components/banking/TransactionCategorization';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  CreditCard,
  Banknote
} from 'lucide-react';
import { BankAccountsTab } from '@/components/banking/BankAccountsTab';
import { SepaPaymentGenerator } from '@/components/banking/SepaPaymentGenerator';

const BanksPageNew: React.FC = () => {
  const { user, currentCompany } = useAuth();
  const { t } = useTranslation();

  // State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<BankStorageTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'categorization' | 'history' | 'accounts' | 'sepa-transfers'>('import');
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    reconciledTransactions: 0,
    pendingReconciliation: 0,
    discrepancies: 0,
    autoMatchRate: 0
  });

  // Load data on mount
  useEffect(() => {
    if (user?.id && currentCompany?.id) {
      loadData();
    }
  }, [user?.id, currentCompany?.id]);

  // Load all data
  const loadData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      // Check and migrate localStorage data if exists
      const hasLocalData = localStorage.getItem(`casskai_imported_transactions_${user.id}`);
      if (hasLocalData) {
        const account = await bankStorageAdapter.ensureDefaultAccount(currentCompany.id, user.id);
        if (account) {
          const migrationResult = await bankStorageAdapter.migrateLocalStorageData(
            user.id,
            currentCompany.id,
            account.id
          );
          if (migrationResult.success && migrationResult.migrated > 0) {
            toastSuccess(`${migrationResult.migrated} transactions migrées depuis localStorage vers Supabase`);
          }
        }
      }

      // Load accounts
      const accounts = await bankStorageAdapter.loadBankAccounts(currentCompany.id);
      setBankAccounts(accounts);

      // Create default account if none exists
      if (accounts.length === 0) {
        const newAccount = await bankStorageAdapter.ensureDefaultAccount(currentCompany.id, user.id);
        if (newAccount) {
          setBankAccounts([newAccount]);
          setSelectedAccountId(newAccount.id);
        }
      } else {
        setSelectedAccountId(accounts[0].id);
      }

      // Load transactions
      await loadTransactions();

      // Load metrics
      await loadMetrics();

    } catch (error) {
      console.error('Error loading data:', error);
      toastError(error instanceof Error ? error.message : "Impossible de charger les données"
     );
    } finally {
      setLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    if (!currentCompany?.id) return;

    try {
      const txns = await bankStorageAdapter.loadTransactions(
        currentCompany.id,
        selectedAccountId || undefined
      );
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Load metrics
  const loadMetrics = async () => {
    if (!currentCompany?.id) return;

    try {
      const m = await bankStorageAdapter.getReconciliationMetrics(currentCompany.id);
      setMetrics(m);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Handle file import
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany?.id) return;

    setUploading(true);
    try {
      // Ensure account exists
      let accountId = selectedAccountId;
      if (!accountId) {
        const account = await bankStorageAdapter.ensureDefaultAccount(currentCompany.id, user.id);
        if (!account) throw new Error('Failed to create account');
        accountId = account.id;
        setSelectedAccountId(accountId);
        setBankAccounts([account]);
      }

      // Import file
      const result = await bankStorageAdapter.importFile(file, accountId, currentCompany.id);

      if (result.success) {
        toastSuccess(`${result.imported_count} transactions importées, ${result.skipped_count} doublons ignorés`);

        // Reload data
        await loadTransactions();
        await loadMetrics();
      } else {
        toastError(result.message + (result.errors ? ` (${result.errors.length} erreurs)` : ''));
      }
    } catch (error) {
      console.error('Import error:', error);
      toastError(error instanceof Error ? error.message : "Impossible d'importer le fichier"
     );
    } finally {
      setUploading(false);
      // eslint-disable-next-line require-atomic-updates
      event.target.value = ''; // Reset input
    }
  }, [currentCompany?.id, selectedAccountId, user.id]);

  // Handle reconciliation
  const handleReconcile = async (transactionId: string) => {
    try {
      const success = await bankStorageAdapter.reconcileTransaction(transactionId);

      if (success) {
        toastSuccess("La transaction a été marquée comme réconciliée"
       );

        // Reload
        await loadTransactions();
        await loadMetrics();
      }
    } catch (error) {
      console.error('Reconciliation error:', error);
      toastError("Impossible de réconcilier la transaction"
     );
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 dark:text-gray-300">{t('auth.pleaseLogin')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('banking.title')}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {t('banking.subtitle')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
              activeTab === 'import'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            {t('banking.tabs.import')}
          </button>
          <button
            onClick={() => setActiveTab('categorization')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
              activeTab === 'categorization'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="h-4 w-4" />
            {t('banking.tabs.categorization')}
            {metrics.pendingReconciliation > 0 && (
              <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                {metrics.pendingReconciliation}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
              activeTab === 'history'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            {t('banking.tabs.history')}
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
              activeTab === 'accounts'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Comptes bancaires
          </button>
          <button
            onClick={() => setActiveTab('sepa-transfers')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
              activeTab === 'sepa-transfers'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Banknote className="h-4 w-4" />
            Virements SEPA
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('banking.metrics.totalTransactions')}</p>
                <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('banking.metrics.reconciled')}</p>
                <p className="text-2xl font-bold text-green-600">{metrics.reconciledTransactions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('banking.metrics.pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pendingReconciliation}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('banking.metrics.autoMatchRate')}</p>
                <p className="text-2xl font-bold">{(metrics.autoMatchRate * 100).toFixed(0)}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content: Import */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('banking.import.title')}</CardTitle>
            <CardDescription>
              {t('banking.import.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              {t('banking.import.accountLabel')}
            </label>
            <select
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:text-gray-100 border-gray-300 dark:border-gray-600 dark:border-gray-600"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={loading}
            >
              {bankAccounts.length === 0 ? (
                <option value="">{t('banking.import.noAccount')}</option>
              ) : (
                bankAccounts.map((account) => {
                  // Formater l'affichage de l'IBAN
                  const ibanDisplay = account.iban
                    ? `(•••• ${account.iban.replace(/\s/g, '').slice(-4)})`
                    : '(⚠️ IBAN non configuré)';

                  return (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_name} {ibanDisplay}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              {t('banking.import.fileLabel')}
            </label>
            <Input
              type="file"
              className="dark:file:text-gray-200"
              accept=".csv,.ofx,.qif"
              onChange={handleFileImport}
              disabled={uploading || loading}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{t('banking.import.uploading')}</span>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Tab Content: Categorization */}
      {activeTab === 'categorization' && selectedAccountId && (
        <TransactionCategorization
          bankAccountId={selectedAccountId}
          bankAccountNumber="512000"
          onRefresh={loadData}
        />
      )}

      {/* Tab Content: History */}
      {activeTab === 'history' && (
      <Card>
        <CardHeader>
          <CardTitle>{t('banking.history.title', { count: transactions.length })}</CardTitle>
          <CardDescription>
            {t('banking.history.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-300 mt-2">{t('common.loading')}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 dark:text-gray-300">{t('banking.history.noTransactions')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {t('banking.history.importPrompt')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('banking.history.table.date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('banking.history.table.description')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('banking.history.table.category')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('banking.history.table.amount')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('banking.history.table.status')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 100).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:bg-gray-900/30">
                      <td className="px-4 py-3 text-sm">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {transaction.category || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex items-center justify-end gap-1">
                          {transaction.amount >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {transaction.amount.toFixed(2)} €
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {transaction.status === 'reconciled' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('banking.history.status.reconciled')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('banking.history.status.pending')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {transaction.status !== 'reconciled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReconcile(transaction.id)}
                          >
                            {t('banking.history.actions.reconcile')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length > 100 && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-300">
                  {t('banking.history.pagination', { shown: 100, total: transactions.length })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Tab Content: Bank Accounts */}
      {activeTab === 'accounts' && (
        <BankAccountsTab
          companyId={currentCompany?.id || ''}
          accounts={bankAccounts}
          onRefresh={loadData}
        />
      )}

      {/* Tab Content: SEPA Transfers */}
      {activeTab === 'sepa-transfers' && (
        <SepaPaymentGenerator onNavigateToAccounts={() => setActiveTab('accounts')} />
      )}
    </div>
  );
};

export default BanksPageNew;
