import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X,
  Search,
  Zap,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionRow } from './TransactionRow';
import { RulesModal } from './RulesModal';

interface BankTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference: string | null;
  status: 'pending' | 'categorized' | 'reconciled' | 'ignored';
  suggested_account_id?: string | null;
  matched_entry_id?: string | null;
}

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: string;
  class: number;
}

interface CategorizationRule {
  id: string;
  pattern: string;
  account_id: string;
  description_template?: string | null;
  is_regex: boolean;
  priority: number;
}

interface TransactionCategorizationProps {
  bankAccountId: string;
  bankAccountNumber: string;
  onRefresh?: () => void;
}

export const TransactionCategorization: React.FC<TransactionCategorizationProps> = ({
  bankAccountId,
  bankAccountNumber,
  onRefresh,
}) => {
  const { currentCompany } = useAuth();
  const { t } = useTranslation();

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'categorized'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // État pour la catégorisation en masse
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkAccount, setBulkAccount] = useState<string>('');
  const [showRuleModal, setShowRuleModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [bankAccountId, filter, currentCompany?.id]);

  const loadData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);

    try {
      // Charger les transactions
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .order('transaction_date', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'categorized') {
        query = query.in('status', ['categorized', 'reconciled']);
      }

      const { data: txData, error: txError } = await query;
      if (txError) throw txError;
      setTransactions(txData || []);

      // Charger les comptes comptables
      const { data: accData, error: accError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number, name, type, class')
        .eq('company_id', currentCompany.id)
        .order('account_number');
      if (accError) throw accError;
      setAccounts(accData || []);

      // Charger les règles de catégorisation
      const { data: rulesData, error: rulesError } = await supabase
        .from('categorization_rules')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('priority', { ascending: false });
      if (rulesError) throw rulesError;
      setRules(rulesData || []);

      // Appliquer les suggestions automatiques côté client
      if (txData && rulesData) {
        applySuggestions(txData, rulesData);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error(t('errors.loadData', 'Erreur lors du chargement des données'));
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les règles pour suggérer des comptes
  const applySuggestions = (txs: BankTransaction[], rls: CategorizationRule[]) => {
    const updated = txs.map((tx) => {
      if (tx.status !== 'pending' || tx.suggested_account_id) return tx;

      for (const rule of rls) {
        let matches = false;

        if (rule.is_regex) {
          try {
            const pattern = new RegExp(rule.pattern, 'i');
            matches = pattern.test(tx.description);
          } catch (e) {
            console.error('Invalid regex:', rule.pattern);
            continue;
          }
        } else {
          matches = tx.description.toLowerCase().includes(rule.pattern.toLowerCase());
        }

        if (matches) {
          return { ...tx, suggested_account_id: rule.account_id };
        }
      }
      return tx;
    });

    setTransactions(updated);
  };

  // Catégoriser une transaction
  const categorizeTransaction = async (
    transactionId: string,
    accountId: string,
    customDescription?: string
  ) => {
    if (!currentCompany?.id) return;

    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    try {
      // 1. Créer l'écriture comptable
      const journalEntry = {
        company_id: currentCompany.id,
        date: transaction.transaction_date,
        description: customDescription || transaction.description,
        reference: transaction.reference,
        journal_type: 'BQ', // Journal de banque
        status: 'validated',
        source: 'bank_import',
        source_id: transactionId,
      };

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert(journalEntry)
        .select()
        .single();

      if (entryError) throw entryError;

      // 2. Récupérer l'ID du compte banque
      const bankAccountDbId = await getAccountIdByNumber(bankAccountNumber);
      if (!bankAccountDbId) {
        throw new Error('Compte bancaire comptable non trouvé');
      }

      // 3. Créer les lignes d'écriture
      const items = [];

      if (transaction.type === 'debit') {
        // Dépense : Débit compte charge, Crédit compte banque
        items.push({
          journal_entry_id: entry.id,
          account_id: accountId,
          debit_amount: transaction.amount,
          credit_amount: 0,
          description: transaction.description,
        });
        items.push({
          journal_entry_id: entry.id,
          account_id: bankAccountDbId,
          debit_amount: 0,
          credit_amount: transaction.amount,
          description: transaction.description,
        });
      } else {
        // Recette : Débit compte banque, Crédit compte produit
        items.push({
          journal_entry_id: entry.id,
          account_id: bankAccountDbId,
          debit_amount: transaction.amount,
          credit_amount: 0,
          description: transaction.description,
        });
        items.push({
          journal_entry_id: entry.id,
          account_id: accountId,
          debit_amount: 0,
          credit_amount: transaction.amount,
          description: transaction.description,
        });
      }

      const { error: itemsError } = await supabase.from('journal_entry_items').insert(items);
      if (itemsError) throw itemsError;

      // 4. Mettre à jour le statut de la transaction
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          status: 'categorized',
          matched_entry_id: entry.id,
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success(t('success.categorized', 'Transaction catégorisée avec succès'));

      // Rafraîchir la liste
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur catégorisation:', error);
      toast.error(t('errors.categorization', 'Erreur lors de la catégorisation'));
    }
  };

  const getAccountIdByNumber = async (accountNumber: string): Promise<string | null> => {
    const account = accounts.find((a) => a.account_number === accountNumber);
    if (account) return account.id;

    // Chercher en base si pas trouvé localement
    const { data } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', currentCompany?.id)
      .eq('account_number', accountNumber)
      .single();

    return data?.id || null;
  };

  // Catégorisation en masse
  const bulkCategorize = async () => {
    if (!bulkAccount || selectedTransactions.size === 0) return;

    const txIds = Array.from(selectedTransactions);
    let successCount = 0;

    for (const txId of txIds) {
      try {
        await categorizeTransaction(txId, bulkAccount);
        successCount++;
      } catch (error) {
        console.error('Erreur catégorisation transaction:', txId, error);
      }
    }

    toast.success(
      t('success.bulkCategorized', `${successCount} transaction(s) catégorisée(s)`)
    );

    setSelectedTransactions(new Set());
    setBulkAccount('');
  };

  // Ignorer une transaction
  const ignoreTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .update({ status: 'ignored' })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success(t('success.ignored', 'Transaction ignorée'));
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.ignore', 'Erreur lors de l\'ignorement'));
    }
  };

  // Créer une règle à partir d'une transaction
  const createRuleFromTransaction = async (
    transaction: BankTransaction,
    accountId: string,
    pattern: string
  ) => {
    if (!currentCompany?.id) return;

    try {
      const { error } = await supabase.from('categorization_rules').insert({
        company_id: currentCompany.id,
        pattern,
        account_id: accountId,
        is_regex: false,
        priority: 0,
        created_from_transaction_id: transaction.id,
      });

      if (error) throw error;

      toast.success(t('success.ruleCreated', 'Règle créée avec succès'));
      loadData();
    } catch (error) {
      console.error('Erreur création règle:', error);
      toast.error(t('errors.ruleCreation', 'Erreur lors de la création de la règle'));
    }
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    return tx.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Grouper les comptes par classe pour le select
  const groupedAccounts = accounts.reduce((groups, account) => {
    const classLabel = getClassLabel(account.class);
    if (!groups[classLabel]) groups[classLabel] = [];
    groups[classLabel].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  const getClassLabel = (classNum: number): string => {
    const labels: Record<number, string> = {
      1: '1 - Capitaux',
      2: '2 - Immobilisations',
      3: '3 - Stocks',
      4: '4 - Tiers',
      5: '5 - Financiers',
      6: '6 - Charges',
      7: '7 - Produits',
      8: '8 - Comptes spéciaux',
      9: '9 - Analytique',
    };
    return labels[classNum] || `Classe ${classNum}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const suggestedCount = transactions.filter((t) => t.suggested_account_id).length;
  const categorizedCount = transactions.filter(
    (t) => t.status === 'categorized' || t.status === 'reconciled'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-yellow-700">{t('common.pending', 'En attente')}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{suggestedCount}</div>
          <div className="text-sm text-blue-700 dark:text-blue-400">{t('common.suggested', 'Suggestions')}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{categorizedCount}</div>
          <div className="text-sm text-green-700 dark:text-green-400">{t('common.categorized', 'Catégorisées')}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{rules.length}</div>
          <div className="text-sm text-purple-700">{t('common.rules', 'Règles actives')}</div>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 shadow">
        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            En attente ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('categorized')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'categorized'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            Catégorisées
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('searchTransactions', 'Rechercher une transaction...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* Actions en masse */}
        {selectedTransactions.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              {selectedTransactions.size} sélectionnée(s)
            </span>
            <select
              value={bulkAccount}
              onChange={(e) => setBulkAccount(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Choisir un compte...</option>
              {Object.entries(groupedAccounts).map(([group, accs]) => (
                <optgroup key={group} label={group}>
                  {accs.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              onClick={bulkCategorize}
              disabled={!bulkAccount}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              Catégoriser
            </button>
          </div>
        )}

        {/* Bouton règles */}
        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-900/30"
        >
          <Zap className="h-4 w-4" />
          Règles auto
        </button>
      </div>

      {/* Liste des transactions */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTransactions(
                        new Set(
                          filteredTransactions
                            .filter((t) => t.status === 'pending')
                            .map((t) => t.id)
                        )
                      );
                    } else {
                      setSelectedTransactions(new Set());
                    }
                  }}
                  checked={
                    selectedTransactions.size > 0 &&
                    selectedTransactions.size ===
                      filteredTransactions.filter((t) => t.status === 'pending').length
                  }
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Montant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Compte comptable
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                accounts={accounts}
                groupedAccounts={groupedAccounts}
                isSelected={selectedTransactions.has(tx.id)}
                onSelect={(selected) => {
                  const newSet = new Set(selectedTransactions);
                  if (selected) newSet.add(tx.id);
                  else newSet.delete(tx.id);
                  setSelectedTransactions(newSet);
                }}
                onCategorize={(accountId, description) =>
                  categorizeTransaction(tx.id, accountId, description)
                }
                onIgnore={() => ignoreTransaction(tx.id)}
                onCreateRule={(accountId, pattern) =>
                  createRuleFromTransaction(tx, accountId, pattern)
                }
              />
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-300">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">
              {filter === 'pending'
                ? 'Toutes les transactions sont catégorisées !'
                : 'Aucune transaction trouvée'}
            </p>
          </div>
        )}
      </div>

      {/* Modal des règles */}
      {showRuleModal && (
        <RulesModal
          rules={rules}
          accounts={accounts}
          onClose={() => setShowRuleModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
};
