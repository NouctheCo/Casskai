import React, { useEffect, useMemo, useState } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Check, X, ChevronDown, Sparkles, Zap, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

interface JournalEntryOption {
  id: string;
  entry_date: string;
  reference_number?: string | null;
  description: string;
  status: string;
  amount: number;
  source_type?: string | null;
  source_reference?: string | null;
}

interface TransactionRowProps {
  transaction: BankTransaction;
  accounts: Account[];
  groupedAccounts: Record<string, Account[]>;
  journalEntries: JournalEntryOption[];
  suggestedMatchId?: string;
  candidateEntryIds: string[];
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onCategorize: (accountId: string, description?: string) => void;
  onIgnore: () => void;
  onDelete: () => void;
  onMatchEntry: (entryId: string) => void;
  onCreateRule: (accountId: string, pattern: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  accounts,
  groupedAccounts,
  journalEntries,
  suggestedMatchId,
  candidateEntryIds,
  isSelected,
  onSelect,
  onCategorize,
  onIgnore,
  onDelete,
  onMatchEntry,
  onCreateRule,
}) => {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState(
    transaction.suggested_account_id || ''
  );
  const [showDetails, setShowDetails] = useState(false);
  const [customDescription, setCustomDescription] = useState(transaction.description);
  const [rulePattern, setRulePattern] = useState(
    transaction.description.split(' ')[0] || transaction.description.substring(0, 20)
  );
  const [selectedMatchEntryId, setSelectedMatchEntryId] = useState(suggestedMatchId || '');

  useEffect(() => {
    setSelectedMatchEntryId(suggestedMatchId || '');
  }, [suggestedMatchId]);

  const suggestedAccount = transaction.suggested_account_id
    ? accounts.find((a) => a.id === transaction.suggested_account_id)
    : null;
  const canMatch = transaction.status === 'pending';
  const entryById = useMemo(() => {
    return new Map(journalEntries.map((entry) => [entry.id, entry]));
  }, [journalEntries]);
  const candidateEntries = useMemo(() => {
    return candidateEntryIds
      .map((id) => entryById.get(id))
      .filter((entry): entry is JournalEntryOption => Boolean(entry));
  }, [candidateEntryIds, entryById]);
  const candidateIdSet = useMemo(() => new Set(candidateEntryIds), [candidateEntryIds]);
  const otherEntries = useMemo(() => {
    return journalEntries.filter((entry) => !candidateIdSet.has(entry.id));
  }, [journalEntries, candidateIdSet]);

  const handleValidate = () => {
    if (!selectedAccount) return;
    onCategorize(selectedAccount, customDescription);
  };

  const handleCreateRule = () => {
    if (!selectedAccount || !rulePattern.trim()) return;
    onCreateRule(selectedAccount, rulePattern.trim());
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'credit' ? '+' : '-';
    return <>{sign}<CurrencyAmount amount={amount} /></>;
  };

  const formatEntryLabel = (entry: JournalEntryOption) => {
    const date = formatDate(entry.entry_date);
    const amount = entry.amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const ref = entry.reference_number ? ` | ${entry.reference_number}` : '';
    const sourceRef = entry.source_reference ? ` | ${entry.source_reference}` : '';
    return `${date} | ${amount}${ref}${sourceRef} | ${entry.description}`;
  };

  return (
    <>
      <tr
        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
          transaction.status === 'categorized' || transaction.status === 'reconciled'
            ? 'bg-green-50/50 dark:bg-green-900/10'
            : ''
        }`}
      >
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            disabled={transaction.status !== 'pending'}
            className="rounded"
            aria-label="Sélectionner cette transaction"
          />
        </td>

        <td className="px-4 py-3 text-sm">{formatDate(transaction.transaction_date)}</td>

        <td className="px-4 py-3">
          <div className="font-medium text-sm">{transaction.description}</div>
          {transaction.reference && (
            <div className="text-xs text-gray-500 dark:text-gray-300">Réf: {transaction.reference}</div>
          )}
          {suggestedAccount && transaction.status === 'pending' && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                Suggestion: {suggestedAccount.account_number} - {suggestedAccount.account_name}
              </span>
            </div>
          )}
        </td>

        <td
          className={`px-4 py-3 text-right font-medium ${
            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </td>

        <td className="px-4 py-3">
          {transaction.status === 'pending' ? (
            <select
              aria-label="Sélectionner le compte comptable pour cette transaction"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner un compte...</option>
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
          ) : (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" />
              {transaction.status === 'categorized' ? 'Catégorisée' : 'Rapprochée'}
            </span>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {transaction.status === 'pending' && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleValidate}
                disabled={!selectedAccount}
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                title={t('banking.actions.validate', 'Valider')}
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                title={t('banking.actions.details', 'Détails')}
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={onIgnore}
                className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 rounded transition dark:bg-gray-900/50"
                title={t('banking.actions.ignore', 'Ignorer')}
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                title={t('banking.actions.delete', 'Supprimer')}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Ligne de détails étendue */}
      {showDetails && (
        <tr className="bg-blue-50 dark:bg-blue-900/20">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Libellé comptable personnalisé */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('banking.labels.accountingLabel', 'Libellé comptable')}</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary"
                  placeholder={t('banking.labels.editLabel', 'Modifier le libellé...')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {t('banking.labels.labelHint', "Ce libellé apparaîtra dans l'écriture comptable")}
                </p>
              </div>

              {/* Créer une règle automatique */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('banking.rules.create', 'Créer une règle automatique')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('banking.rules.pattern', 'Motif (ex: AMAZON)')}
                    value={rulePattern}
                    onChange={(e) => setRulePattern(e.target.value)}
                    className="flex-1 px-3 py-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleCreateRule}
                    disabled={!selectedAccount || !rulePattern.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                    title={t('banking.rules.createButton', 'Créer la règle')}
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {t('banking.rules.hint', 'Les futures transactions contenant ce motif seront suggérées automatiquement')}
                </p>
              </div>

              {/* Rapprochement comptable */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('banking.reconciliation.title', 'Rapprochement comptable')}
                </label>
                <select
                  aria-label={t('banking.reconciliation.selectEntry', 'Sélectionner une écriture comptable')}
                  value={selectedMatchEntryId}
                  onChange={(e) => setSelectedMatchEntryId(e.target.value)}
                  disabled={!canMatch}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary disabled:opacity-60"
                >
                  <option value="">{t('banking.reconciliation.selectPlaceholder', 'Sélectionner une écriture...')}</option>
                  {candidateEntries.length > 0 && (
                    <optgroup label={t('banking.reconciliation.suggestionsGroup', 'Suggestions')}>
                      {candidateEntries.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {formatEntryLabel(entry)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherEntries.length > 0 && (
                    <optgroup label={t('banking.reconciliation.allEntriesGroup', 'Toutes les écritures')}>
                      {otherEntries.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {formatEntryLabel(entry)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => selectedMatchEntryId && onMatchEntry(selectedMatchEntryId)}
                    disabled={!selectedMatchEntryId || !canMatch}
                    className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                  >
                    {t('banking.reconciliation.button', 'Rapprocher')}
                  </button>
                  {suggestedMatchId && (
                    <span className="text-xs text-blue-600">
                      {t('banking.reconciliation.autoSuggestion', 'Suggestion auto disponible')}
                    </span>
                  )}
                </div>
              </div>

              {/* Aperçu écriture */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('banking.preview.title', 'Aperçu écriture')}</label>
                <div className="text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                  {selectedAccount ? (
                    <>
                      {transaction.type === 'debit' ? (
                        <>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-300">
                              {t('banking.preview.debitShort', 'D:')} {accounts.find((a) => a.id === selectedAccount)?.account_number}
                            </span>
                            <span className="font-medium">
                              <CurrencyAmount amount={transaction.amount} />
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>{t('banking.preview.creditShort', 'C:')} 512000 (Banque)</span>
                            <span className="font-medium">
                              <CurrencyAmount amount={transaction.amount} />
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between mb-1 text-green-600">
                            <span>{t('banking.preview.debitShort', 'D:')} 512000 (Banque)</span>
                            <span className="font-medium">
                              <CurrencyAmount amount={transaction.amount} />
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">
                              {t('banking.preview.creditShort', 'C:')} {accounts.find((a) => a.id === selectedAccount)?.account_number}
                            </span>
                            <span className="font-medium">
                              <CurrencyAmount amount={transaction.amount} />
                            </span>
                          </div>
                        </>
                      )}
                      <div className="border-t mt-2 pt-2 text-xs text-gray-500 dark:text-gray-300">
                        {t('banking.preview.balanced', 'Équilibre: D = C =')} <CurrencyAmount amount={transaction.amount} />
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-center py-2">
                      {t('banking.preview.selectAccount', "Sélectionnez un compte pour voir l'aperçu")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

