/**
 * Dropdown de sélection de compte comptable pour le module Budget
 * Permet de lier chaque ligne budgétaire à un compte du plan comptable
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface AccountOption {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  budget_category: string | null;
  account_class: number | null;
}

interface AccountSelectDropdownProps {
  value: string; // account_id sélectionné
  companyId: string;
  onChange: (accountId: string, accountData: AccountOption) => void;
  filterType?: 'revenue' | 'expense' | 'all';
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
}

export const AccountSelectDropdown: React.FC<AccountSelectDropdownProps> = ({
  value,
  companyId,
  onChange,
  filterType = 'all',
  placeholder = 'Sélectionner un compte comptable',
  disabled = false,
  onCreateNew
}) => {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [companyId, filterType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const chartService = ChartOfAccountsService.getInstance();
      const allAccounts = await chartService.getAccounts(companyId, {
        isActive: true
      });

      // Filtrer selon le type demandé
      let filteredAccounts = allAccounts;
      if (filterType === 'revenue') {
        filteredAccounts = allAccounts.filter(acc => acc.account_class === 7);
      } else if (filterType === 'expense') {
        filteredAccounts = allAccounts.filter(acc => acc.account_class === 6);
      }

      // Map to AccountOption to ensure all required fields are present
      const mappedAccounts: AccountOption[] = filteredAccounts.map(acc => ({
        id: acc.id,
        account_number: acc.account_number,
        account_name: acc.account_name,
        account_type: acc.account_type,
        budget_category: (acc as any).budget_category || null,
        account_class: acc.account_class || null
      }));
      setAccounts(mappedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les comptes par catégorie budget
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountOption[]> = {};

    accounts.forEach(account => {
      const category = account.budget_category || 'Non catégorisé';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(account);
    });

    // Trier les groupes et les comptes à l'intérieur
    return Object.keys(groups)
      .sort()
      .map(category => ({
        category,
        accounts: groups[category].sort((a, b) =>
          a.account_number.localeCompare(b.account_number)
        )
      }));
  }, [accounts]);

  // Filtrer selon la recherche
  const filteredGroups = useMemo(() => {
    if (!search) return groupedAccounts;

    const searchLower = search.toLowerCase();
    return groupedAccounts
      .map(group => ({
        ...group,
        accounts: group.accounts.filter(
          acc =>
            acc.account_number.toLowerCase().includes(searchLower) ||
            acc.account_name.toLowerCase().includes(searchLower) ||
            acc.budget_category?.toLowerCase().includes(searchLower)
        )
      }))
      .filter(group => group.accounts.length > 0);
  }, [groupedAccounts, search]);

  // Trouver le compte sélectionné
  const selectedAccount = accounts.find(acc => acc.id === value);

  const displayValue = selectedAccount
    ? `${selectedAccount.account_number} - ${selectedAccount.account_name}`
    : placeholder;

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Chargement...
                </>
              ) : (
                displayValue
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Rechercher par numéro, libellé ou catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <CommandList className="max-h-[400px] overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground">Aucun compte trouvé</p>
                    {onCreateNew && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          onCreateNew();
                        }}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Créer un compte auxiliaire
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  {filteredGroups.map(group => (
                    <CommandGroup
                      key={group.category}
                      heading={group.category}
                    >
                      {group.accounts.map(account => (
                        <CommandItem
                          key={account.id}
                          value={account.id}
                          onSelect={() => {
                            onChange(account.id, account);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {account.account_number} - {account.account_name}
                            </span>
                            {account.budget_category && (
                              <span className="text-xs text-muted-foreground">
                                {account.budget_category}
                              </span>
                            )}
                          </div>
                          {value === account.id && (
                            <span className="ml-2 text-primary">✓</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}

                  {onCreateNew && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          onCreateNew();
                        }}
                        className="w-full justify-start"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un compte auxiliaire
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedAccount && selectedAccount.budget_category && (
        <p className="mt-1 text-xs text-muted-foreground">
          Catégorie : {selectedAccount.budget_category}
        </p>
      )}
    </div>
  );
};
