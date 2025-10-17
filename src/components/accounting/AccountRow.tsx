import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Unlink } from 'lucide-react';
import type { Account } from '@/types/database.types';

interface AccountRowProps {
  account: Account;
  currentMapping: string | undefined;
  isSaving: boolean;
  categoriesByType: Record<string, Array<{
    id: string;
    category: string;
    subcategory: string | null;
    category_type: 'revenue' | 'expense' | 'capex';
  }>>;
  onSaveMapping: (accountNumber: string, categoryId: string | null) => void;
  renderCategoryBadge: (categoryId: string | null) => React.ReactNode;
}

export function AccountRow({
  account,
  currentMapping,
  isSaving,
  categoriesByType,
  onSaveMapping,
  renderCategoryBadge
}: AccountRowProps) {
  const getAccountClassName = (classNumber: string) => {
    switch (classNumber) {
      case '1': return 'Capitaux';
      case '2': return 'Immobilisations';
      case '3': return 'Stocks';
      case '4': return 'Tiers';
      case '5': return 'Financiers';
      case '6': return 'Charges';
      case '7': return 'Produits';
      default: return 'Autre';
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'border-blue-300 text-blue-700';
      case 'liability': return 'border-orange-300 text-orange-700';
      case 'equity': return 'border-green-300 text-green-700';
      case 'revenue': return 'border-purple-300 text-purple-700';
      default: return 'border-red-300 text-red-700';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return 'Actif';
      case 'liability': return 'Passif';
      case 'equity': return 'Capitaux';
      case 'revenue': return 'Produits';
      default: return 'Charges';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{account.account_number}</TableCell>
      <TableCell className="font-medium">{account.account_name}</TableCell>
      <TableCell className="text-sm">
        <Badge variant="outline" className={getAccountTypeColor(account.account_type)}>
          {getAccountTypeLabel(account.account_type)}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        <Badge variant="outline" className="border-gray-300">
          Classe {account.account_number.charAt(0)} - {getAccountClassName(account.account_number.charAt(0))}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={currentMapping || 'none'}
            onValueChange={(value) => onSaveMapping(account.account_number, value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {renderCategoryBadge(currentMapping || null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="flex items-center text-gray-500">
                  <Unlink className="w-3 h-3 mr-2" />
                  Aucune catégorie
                </span>
              </SelectItem>

              {Object.entries(categoriesByType).map(([type, cats]) => (
                <React.Fragment key={type}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    {type === 'revenue' ? '💰 Revenus' : type === 'expense' ? '📉 Charges' : '🏗️ Investissements'}
                  </div>
                  {cats.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category}{cat.subcategory ? ` / ${cat.subcategory}` : ''}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          {isSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Enregistrement...
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}