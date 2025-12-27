import React, { useState } from 'react';
import { Check, X, ChevronDown, Sparkles, Zap } from 'lucide-react';
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

interface TransactionRowProps {
  transaction: BankTransaction;
  accounts: Account[];
  groupedAccounts: Record<string, Account[]>;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onCategorize: (accountId: string, description?: string) => void;
  onIgnore: () => void;
  onCreateRule: (accountId: string, pattern: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  accounts,
  groupedAccounts,
  isSelected,
  onSelect,
  onCategorize,
  onIgnore,
  onCreateRule,
}) => {
  const { t: _t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState(
    transaction.suggested_account_id || ''
  );
  const [showDetails, setShowDetails] = useState(false);
  const [customDescription, setCustomDescription] = useState(transaction.description);
  const [rulePattern, setRulePattern] = useState(
    transaction.description.split(' ')[0] || transaction.description.substring(0, 20)
  );

  const suggestedAccount = transaction.suggested_account_id
    ? accounts.find((a) => a.id === transaction.suggested_account_id)
    : null;

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
    return `${sign}${amount.toFixed(2)} €`;
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
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary"
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
                className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Valider"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                title="Détails"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={onIgnore}
                className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 rounded transition dark:bg-gray-900/50"
                title="Ignorer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Ligne de détails étendue */}
      {showDetails && (
        <tr className="bg-blue-50 dark:bg-blue-900/20">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Libellé comptable personnalisé */}
              <div>
                <label className="block text-sm font-medium mb-1">Libellé comptable</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
                  placeholder="Modifier le libellé..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  Ce libellé apparaîtra dans l'écriture comptable
                </p>
              </div>

              {/* Créer une règle automatique */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Créer une règle automatique
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Motif (ex: AMAZON)"
                    value={rulePattern}
                    onChange={(e) => setRulePattern(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleCreateRule}
                    disabled={!selectedAccount || !rulePattern.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                    title="Créer la règle"
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  Les futures transactions contenant ce motif seront suggérées automatiquement
                </p>
              </div>

              {/* Aperçu écriture */}
              <div>
                <label className="block text-sm font-medium mb-1">Aperçu écriture</label>
                <div className="text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                  {selectedAccount ? (
                    <>
                      {transaction.type === 'debit' ? (
                        <>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-300">
                              D: {accounts.find((a) => a.id === selectedAccount)?.account_number}
                            </span>
                            <span className="font-medium">
                              {transaction.amount.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>C: 512000 (Banque)</span>
                            <span className="font-medium">
                              {transaction.amount.toFixed(2)} €
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between mb-1 text-green-600">
                            <span>D: 512000 (Banque)</span>
                            <span className="font-medium">
                              {transaction.amount.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">
                              C: {accounts.find((a) => a.id === selectedAccount)?.account_number}
                            </span>
                            <span className="font-medium">
                              {transaction.amount.toFixed(2)} €
                            </span>
                          </div>
                        </>
                      )}
                      <div className="border-t mt-2 pt-2 text-xs text-gray-500 dark:text-gray-300">
                        Équilibre: D = C = {transaction.amount.toFixed(2)} €
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-center py-2">
                      Sélectionnez un compte pour voir l'aperçu
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
