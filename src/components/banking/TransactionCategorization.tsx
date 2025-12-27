import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Zap,
  RefreshCw,
  CheckCircle2,
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
  account_name: string;
  account_type: string;
  account_class: number;
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
  const [bankingAccount, setBankingAccount] = useState<Account | null>(null);
  const [bankingAccountOptions, setBankingAccountOptions] = useState<Account[]>([]);
  const [selectedBankingAccount, setSelectedBankingAccount] = useState<string>('');

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
        .select('id, account_number, account_name, account_type, account_class')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('account_number');
      if (accError) throw accError;
      setAccounts(accData || []);

      // 🏦 Charger les comptes 512 (Banque) et chercher ceux auxiliarisés du client
      if (accData) {
        const bankingAccounts = accData.filter(
          (a) => a.account_number?.startsWith('512')
        );
        setBankingAccountOptions(bankingAccounts);

        // Si un seul compte 512, le sélectionner automatiquement
        if (bankingAccounts.length === 1) {
          setBankingAccount(bankingAccounts[0]);
          setSelectedBankingAccount(bankingAccounts[0].id);
        } else if (bankingAccounts.length > 1) {
          // Chercher un compte auxiliarisé du client si possible
          // Pour l'instant, laisser l'user choisir
          console.log('📋 Plusieurs comptes 512 trouvés, l\'utilisateur doit choisir');
        }
      }

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
          } catch (_e) {
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

    // Vérifier qu'un compte 512 est sélectionné
    if (!selectedBankingAccount) {
      toast.error('Veuillez sélectionner un compte bancaire (512)');
      return;
    }

    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    try {
      // 1. Récupérer ou créer le journal de banque
      let { data: bankJournals } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('type', 'bank')
        .limit(1);

      let bankJournal;

      if (!bankJournals || bankJournals.length === 0) {
        // Créer automatiquement un journal de banque
        const { data: newJournal, error: createError } = await supabase
          .from('journals')
          .insert({
            company_id: currentCompany.id,
            code: 'BQ',
            name: 'Banque',
            type: 'bank',
            is_active: true
          })
          .select('id')
          .single();

        if (createError || !newJournal) {
          throw new Error('Impossible de créer le journal de banque');
        }
        bankJournal = newJournal;
      } else {
        bankJournal = bankJournals[0];
      }

      // 2. Créer l'écriture comptable
      const journalEntry = {
        company_id: currentCompany.id,
        journal_id: bankJournal.id,
        entry_date: transaction.transaction_date,
        description: customDescription || transaction.description,
        reference_number: transaction.reference,
        status: 'draft',  // 📋 Statut brouillon pour permettre les modifications en comptabilité
      };

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert(journalEntry)
        .select()
        .single();

      if (entryError) throw entryError;

      console.log('✅ Écriture créée:', entry.id);

      // 3. Récupérer les comptes comptables
      const selectedAccount = accounts.find(a => a.id === accountId);
      const bankAccountData = accounts.find(a => a.id === selectedBankingAccount);

      if (!selectedAccount || !bankAccountData) {
        throw new Error('Compte introuvable dans le plan comptable');
      }

      const lines = [];

      // Déterminer si c'est une dépense (montant négatif) ou une recette (montant positif)
      const absAmount = Math.abs(transaction.amount);
      const isExpense = transaction.amount < 0;

      if (isExpense) {
        // Dépense : Débit compte charge, Crédit compte banque
        lines.push({
          journal_entry_id: entry.id,
          company_id: currentCompany.id,
          account_id: accountId,
          debit_amount: absAmount,
          credit_amount: 0,
          description: transaction.description,
          line_order: 1,
          account_number: selectedAccount.account_number,
          account_name: selectedAccount.account_name,
        });
        lines.push({
          journal_entry_id: entry.id,
          company_id: currentCompany.id,
          account_id: selectedBankingAccount,
          debit_amount: 0,
          credit_amount: absAmount,
          description: transaction.description,
          line_order: 2,
          account_number: bankAccountData.account_number,
          account_name: bankAccountData.account_name,
        });
      } else {
        // Recette : Débit compte banque, Crédit compte produit
        lines.push({
          journal_entry_id: entry.id,
          company_id: currentCompany.id,
          account_id: selectedBankingAccount,
          debit_amount: absAmount,
          credit_amount: 0,
          description: transaction.description,
          line_order: 1,
          account_number: bankAccountData.account_number,
          account_name: bankAccountData.account_name,
        });
        lines.push({
          journal_entry_id: entry.id,
          company_id: currentCompany.id,
          account_id: accountId,
          debit_amount: 0,
          credit_amount: absAmount,
          description: transaction.description,
          line_order: 2,
          account_number: selectedAccount.account_number,
          account_name: selectedAccount.account_name,
        });
      }

      console.log('📝 Insertion des lignes d\'écriture:', lines);
      const { data: insertedLines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines)
        .select();

      if (linesError) {
        console.error('❌ Erreur insertion lignes:', linesError);
        throw new Error(`Erreur insertion lignes: ${linesError.message}`);
      }

      console.log('✅ Lignes insérées:', insertedLines);

      // 4. Mettre à jour le statut de la transaction (reconciled = catégorisée et validée)
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          status: 'reconciled',
          is_reconciled: true,
          matched_entry_id: entry.id,
          reconciliation_date: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('❌ Erreur mise à jour transaction:', updateError);
        throw updateError;
      }

      console.log('✅ Transaction mise à jour avec succès');
      toast.success(t('success.categorized', 'Transaction catégorisée et rapprochée avec succès'));

      // Rafraîchir la liste
      await loadData();
      onRefresh?.();
    } catch (error: any) {
      console.error('❌ Erreur catégorisation:', error);
      toast.error(error?.message || t('errors.categorization', 'Erreur lors de la catégorisation'));
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
      .limit(1);

    return (data && data.length > 0) ? data[0].id : null;
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

  // Fonction pour obtenir le label d'une classe comptable
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

  // Grouper les comptes par classe pour le select
  const groupedAccounts = accounts.reduce((groups, account) => {
    const classLabel = getClassLabel(account.account_class);
    if (!groups[classLabel]) groups[classLabel] = [];
    groups[classLabel].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

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
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        {/* Sélection du compte bancaire 512 */}
        {bankingAccountOptions.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Compte bancaire:</span>
            <select
              value={selectedBankingAccount}
              onChange={(e) => {
                setSelectedBankingAccount(e.target.value);
                const selected = bankingAccountOptions.find(a => a.id === e.target.value);
                setBankingAccount(selected || null);
              }}
              className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Sélectionner...</option>
              {bankingAccountOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_number} - {acc.account_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {bankingAccountOptions.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            ⚠️ Aucun compte bancaire (512) trouvé. Créez-en un en comptabilité.
          </div>
        )}
        
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
                      {acc.account_number} - {acc.account_name}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
