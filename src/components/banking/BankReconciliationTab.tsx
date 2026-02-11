/**
 * CassKai - Bank Reconciliation Tab
 *
 * Phase 1 (P0) - CRITICAL Feature
 *
 * Fonctionnalités:
 * - Affichage transactions non rapprochées
 * - Suggestions automatiques avec scoring
 * - Validation manuelle et automatique
 * - Statistiques temps réel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { EmptyList } from '@/components/ui/EmptyState';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  AlertCircle,
  Zap,
  FileText,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import * as bankReconciliationService from '@/services/bankReconciliationService';
import type {
  BankTransaction,
  PendingBankTransaction,
  MatchSuggestion,
  ReconciliationStats
} from '@/services/bankReconciliationService';

interface ExpandedTransactions {
  [transactionId: string]: boolean;
}

export default function BankReconciliationTab() {
  const { t } = useTranslation();
  const { currentCompany, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<PendingBankTransaction[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [expandedTransactions, setExpandedTransactions] = useState<ExpandedTransactions>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: string]: boolean }>({});

  const currency = currentCompany?.default_currency || getCurrentCompanyCurrency();

  /**
   * Charge les statistiques de rapprochement
   */
  const loadStats = useCallback(async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await bankReconciliationService.getReconciliationStats(
        currentCompany.id
      );

      if (error) throw error;
      setStats(data);
    } catch (error) {
      logger.error('BankReconciliationTab', 'Error loading stats:', error);
    }
  }, [currentCompany?.id]);

  /**
   * Charge les transactions en attente
   */
  const loadPendingTransactions = useCallback(async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      logger.debug('BankReconciliationTab', 'Loading pending transactions...');

      const { data, error } = await bankReconciliationService.getPendingBankTransactions(
        currentCompany.id
      );

      if (error) throw error;

      setPendingTransactions(data || []);

      logger.debug('BankReconciliationTab', 'Pending transactions loaded:', {
        count: data?.length || 0
      });
    } catch (error) {
      logger.error('BankReconciliationTab', 'Error loading pending transactions:', error);
      toastError(t('bankReconciliation.autoReconcileError'));
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, t]);

  /**
   * Charge les suggestions pour une transaction
   */
  const loadSuggestionsForTransaction = useCallback(async (transaction: BankTransaction) => {
    if (!currentCompany?.id) return;

    setLoadingSuggestions(prev => ({ ...prev, [transaction.id]: true }));

    try {
      const { data, error } = await bankReconciliationService.getSuggestedMatches(
        currentCompany.id,
        transaction,
        50 // Min confidence 50%
      );

      if (error) throw error;

      // Mettre à jour les suggestions pour cette transaction
      setPendingTransactions(prev =>
        prev.map(t =>
          t.id === transaction.id
            ? { ...t, suggestions: data || [] }
            : t
        )
      );
    } catch (error) {
      logger.error('BankReconciliationTab', 'Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [transaction.id]: false }));
    }
  }, [currentCompany?.id]);

  /**
   * Toggle l'affichage des suggestions
   */
  const toggleSuggestions = useCallback(async (transaction: PendingBankTransaction) => {
    const isExpanded = expandedTransactions[transaction.id];

    // Si on expand et qu'il n'y a pas encore de suggestions, les charger
    if (!isExpanded && transaction.suggestions.length === 0) {
      await loadSuggestionsForTransaction(transaction);
    }

    setExpandedTransactions(prev => ({
      ...prev,
      [transaction.id]: !isExpanded
    }));
  }, [expandedTransactions, loadSuggestionsForTransaction]);

  /**
   * Valide un rapprochement
   */
  const validateReconciliation = useCallback(async (
    transaction: PendingBankTransaction,
    suggestion: MatchSuggestion
  ) => {
    if (!currentCompany?.id || !user?.id) return;

    try {
      logger.debug('BankReconciliationTab', 'Creating reconciliation...', {
        transactionId: transaction.id,
        suggestionId: suggestion.journalEntryId
      });

      const { data, error } = await bankReconciliationService.createReconciliation(
        currentCompany.id,
        transaction.bank_account_id,
        transaction.id,
        suggestion.journalEntryId,
        'manual',
        suggestion.confidenceScore,
        `Manuel: ${suggestion.matchReasons.join(', ')}`,
        user.id
      );

      if (error) throw error;

      toastSuccess(t('bankReconciliation.reconciliationCreated'));

      // Recharger les données
      await Promise.all([
        loadPendingTransactions(),
        loadStats()
      ]);
    } catch (error) {
      logger.error('BankReconciliationTab', 'Error creating reconciliation:', error);
      toastError(t('bankReconciliation.reconciliationError'));
    }
  }, [currentCompany?.id, user?.id, t, loadPendingTransactions, loadStats]);

  /**
   * Lance le rapprochement automatique batch
   */
  const runAutoReconciliation = useCallback(async () => {
    if (!currentCompany?.id) return;

    setAutoReconciling(true);
    try {
      logger.debug('BankReconciliationTab', 'Starting auto-reconciliation...');

      const { data, error } = await bankReconciliationService.autoReconcileBatch(
        currentCompany.id,
        undefined,
        85 // Min confidence 85%
      );

      if (error) throw error;

      toastSuccess(t('bankReconciliation.autoReconcileSuccess', {
        matched: data?.matched || 0,
        processed: data?.processed || 0
      }));

      // Recharger les données
      await Promise.all([
        loadPendingTransactions(),
        loadStats()
      ]);
    } catch (error) {
      logger.error('BankReconciliationTab', 'Error in auto-reconciliation:', error);
      toastError(t('bankReconciliation.autoReconcileError'));
    } finally {
      setAutoReconciling(false);
    }
  }, [currentCompany?.id, t, loadPendingTransactions, loadStats]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    if (currentCompany?.id) {
      Promise.all([
        loadPendingTransactions(),
        loadStats()
      ]);
    }
  }, [currentCompany?.id, loadPendingTransactions, loadStats]);

  /**
   * Retourne un badge de confiance coloré
   */
  const getConfidenceBadge = (score: number) => {
    if (score >= 85) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t('bankReconciliation.highConfidence')}
        </Badge>
      );
    } else if (score >= 70) {
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          {t('bankReconciliation.mediumConfidence')}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {t('bankReconciliation.lowConfidence')}
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('bankReconciliation.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('bankReconciliation.subtitle')}
          </p>
        </div>

        <Button
          onClick={runAutoReconciliation}
          disabled={autoReconciling || loading || pendingTransactions.length === 0}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {autoReconciling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('bankReconciliation.autoReconcileInProgress')}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {t('bankReconciliation.startAutoReconcile')}
            </>
          )}
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.total')}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.pending')}
                  </p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.reconciled')}
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {stats.reconciled}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.automatic')}
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.automatic}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.manual')}
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.manual}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('bankReconciliation.averageConfidence')}
                  </p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {stats.averageConfidence}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions en attente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>{t('bankReconciliation.pendingTransactions')}</span>
            {pendingTransactions.length > 0 && (
              <Badge variant="secondary">{pendingTransactions.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('bankReconciliation.autoReconcileDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {t('bankReconciliation.loadingTransactions')}
              </span>
            </div>
          ) : pendingTransactions.length === 0 ? (
            <EmptyList
              icon={CheckCircle2}
              title={t('bankReconciliation.noPendingTransactions')}
              description={t('bankReconciliation.noPendingTransactionsDescription')}
            />
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => {
                const isExpanded = expandedTransactions[transaction.id];
                const isLoadingSuggestions = loadingSuggestions[transaction.id];

                return (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    {/* Transaction Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(transaction.transaction_date).toLocaleDateString('fr-FR')}
                          </span>

                          <DollarSign className="w-4 h-4 text-gray-400 ml-4" />
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">
                            <CurrencyAmount amount={Math.abs(transaction.amount)} />
                          </span>

                          <Badge variant={transaction.amount > 0 ? 'default' : 'secondary'}>
                            {transaction.amount > 0 ? 'Crédit' : 'Débit'}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {transaction.description}
                        </p>

                        {transaction.reference && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('bankReconciliation.reference')}: <span className="font-mono">{transaction.reference}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSuggestions(transaction)}
                        disabled={isLoadingSuggestions}
                      >
                        {isLoadingSuggestions ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            {t('bankReconciliation.hideSuggestions')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            {t('bankReconciliation.viewSuggestions', {
                              count: transaction.suggestions.length
                            })}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Suggestions */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {transaction.suggestions.length === 0 ? (
                          <div className="text-center py-6">
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('bankReconciliation.noSuggestions')}
                            </p>
                          </div>
                        ) : (
                          transaction.suggestions.map((suggestion, index) => (
                            <div
                              key={suggestion.journalEntryId}
                              className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    {index === 0 && (
                                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                        {t('bankReconciliation.topMatch')}
                                      </Badge>
                                    )}
                                    {getConfidenceBadge(suggestion.confidenceScore)}
                                    <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                                      {t('bankReconciliation.matchScore', {
                                        score: suggestion.confidenceScore
                                      })}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('bankReconciliation.journalEntryNumber')}
                                      </p>
                                      <p className="font-mono font-medium text-gray-900 dark:text-white">
                                        {suggestion.journalEntryNumber}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('bankReconciliation.entryDate')}
                                      </p>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(suggestion.date).toLocaleDateString('fr-FR')}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('bankReconciliation.accountCode')}
                                      </p>
                                      <p className="font-mono font-medium text-gray-900 dark:text-white">
                                        {suggestion.accountCode} - {suggestion.accountName}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('bankReconciliation.entryAmount')}
                                      </p>
                                      <p className="font-mono font-semibold text-gray-900 dark:text-white">
                                        <CurrencyAmount amount={Math.abs(suggestion.amount)} />
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {t('bankReconciliation.description')}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {suggestion.description}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {t('bankReconciliation.matchReasons')}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {suggestion.matchReasons.map((reason, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {reason}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => validateReconciliation(transaction, suggestion)}
                                  className="ml-4"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  {t('bankReconciliation.validateMatch')}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
