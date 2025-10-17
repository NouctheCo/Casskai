import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Plus } from 'lucide-react';

interface AccountFiltersToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  classFilter: string;
  setClassFilter: (filter: string) => void;
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  onRefresh: () => void;
  onCreateAccount: () => void;
}

export function AccountFiltersToolbar({
  searchTerm,
  setSearchTerm,
  classFilter,
  setClassFilter,
  typeFilter,
  setTypeFilter,
  onRefresh,
  onCreateAccount
}: AccountFiltersToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un compte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes classes</SelectItem>
            <SelectItem value="asset">Actif</SelectItem>
            <SelectItem value="liability">Passif</SelectItem>
            <SelectItem value="equity">Capitaux</SelectItem>
            <SelectItem value="revenue">Revenus</SelectItem>
            <SelectItem value="expense">Charges</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="current">Courant</SelectItem>
            <SelectItem value="non-current">Non courant</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button size="sm" onClick={onCreateAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau compte
        </Button>
      </div>
    </div>
  );
}