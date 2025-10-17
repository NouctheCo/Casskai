import React from 'react';
import { AccountItem } from './AccountItem';

interface BudgetCategory {
  id: string;
  category: string;
  subcategory: string | null;
  category_type: 'revenue' | 'expense' | 'capex';
}

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: string;
  class: number;
  balance?: number;
}

interface AccountsListProps {
  accounts: Account[];
  budgetCategories: BudgetCategory[];
  accountMappings: Map<string, string>;
  savingMapping: string | null;
  onSaveMapping: (accountId: string, budgetCategoryId: string | null) => Promise<void>;
  searchTerm: string;
  classFilter: string;
  typeFilter: string;
}

export function AccountsList({
  accounts,
  budgetCategories,
  accountMappings,
  savingMapping,
  onSaveMapping,
  searchTerm,
  classFilter,
  typeFilter
}: AccountsListProps) {
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === '' ||
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = classFilter === 'all' || account.class.toString() === classFilter;
    const matchesType = typeFilter === 'all' || account.type === typeFilter;

    return matchesSearch && matchesClass && matchesType;
  });

  return (
    <div className="space-y-4">
      {filteredAccounts.map(account => (
        <AccountItem
          key={account.id}
          account={account}
          budgetCategories={budgetCategories}
          accountMappings={accountMappings}
          savingMapping={savingMapping}
          onSaveMapping={onSaveMapping}
        />
      ))}

      {filteredAccounts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun compte trouvé avec les filtres actuels.
        </div>
      )}
    </div>
  );
}