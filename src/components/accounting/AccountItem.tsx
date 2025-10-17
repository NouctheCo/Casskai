import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Link, Unlink } from 'lucide-react';

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

interface AccountItemProps {
  account: Account;
  budgetCategories: BudgetCategory[];
  accountMappings: Map<string, string>;
  savingMapping: string | null;
  onSaveMapping: (accountId: string, budgetCategoryId: string | null) => Promise<void>;
}

export function AccountItem({
  account,
  budgetCategories,
  accountMappings,
  savingMapping,
  onSaveMapping
}: AccountItemProps) {
  const mappedCategoryId = accountMappings.get(account.id);
  const mappedCategory = mappedCategoryId ?
    budgetCategories.find(cat => cat.id === mappedCategoryId) : null;

  const getCategoryBadgeColor = (categoryType: string) => {
    switch (categoryType) {
      case 'revenue': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'capex': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            {account.account_number}
          </span>
          <span className="text-sm text-gray-600">
            {account.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {account.class}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {account.type}
          </Badge>
        </div>

        {mappedCategory && (
          <div className="mt-2">
            <Badge className={`text-xs ${getCategoryBadgeColor(mappedCategory.category_type)}`}>
              {mappedCategory.category}
              {mappedCategory.subcategory && ` > ${mappedCategory.subcategory}`}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={mappedCategoryId || ''}
          onValueChange={(value) => onSaveMapping(account.id, value || null)}
          disabled={savingMapping === account.id}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Aucune catégorie</SelectItem>
            {budgetCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.category}
                {category.subcategory && ` > ${category.subcategory}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onSaveMapping(account.id, mappedCategoryId || null)}
          disabled={savingMapping === account.id}
        >
          {savingMapping === account.id ? (
            <Save className="h-4 w-4 animate-spin" />
          ) : mappedCategoryId ? (
            <Link className="h-4 w-4" />
          ) : (
            <Unlink className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}