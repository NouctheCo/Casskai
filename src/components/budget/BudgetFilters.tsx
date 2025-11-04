// Composant pour les filtres de budget
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Filter } from 'lucide-react';
import type { BudgetFilter, BudgetStatus } from '@/types/budget.types';

interface BudgetFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: BudgetFilter;
  setFilter: (filter: BudgetFilter) => void;
  onResetFilters: () => void;
  loading: boolean;
}

export const BudgetFilters: React.FC<BudgetFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  onResetFilters,
  loading
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Recherche */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Rechercher par année..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtre par année */}
      <Select
        value={filter.years?.[0]?.toString() || 'all'}
        onValueChange={(value) => setFilter({
          ...filter,
          years: value === 'all' ? undefined : [parseInt(value)]
        })}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Toutes les années" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les années</SelectItem>
          {years.map(year => (
            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre par statut */}
      <Select
        value={filter.status?.[0] || 'all'}
        onValueChange={(value) => setFilter({
          ...filter,
          status: value === 'all' ? undefined : [value as BudgetStatus]
        })}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="draft">Brouillon</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="archived">Archivé</SelectItem>
        </SelectContent>
      </Select>

      {/* Bouton de réinitialisation */}
      <Button
        variant="outline"
        onClick={onResetFilters}
        disabled={loading}
        className="whitespace-nowrap"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Réinitialiser
      </Button>
    </div>
  );
};
