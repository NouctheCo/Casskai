import { FC } from 'react';
import { ListFilter, Search, PlusCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductionFilterState } from '@/types/production';

interface ProductionFiltersCardProps {
  filters: ProductionFilterState;
  filtersActive: boolean;
  loading: boolean;
  onFilterChange: (patch: Partial<ProductionFilterState>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onNewOrder: () => void;
}

const ProductionFiltersCard: FC<ProductionFiltersCardProps> = ({ filters, filtersActive, loading, onFilterChange, onResetFilters, onRefresh, onNewOrder }) => {
  const handleToggle = (field: 'showDelayedOnly' | 'onlyCriticalComponents') => onFilterChange({ [field]: !filters[field] });
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><ListFilter className="text-blue-500" />Filtres avancés</CardTitle>
            <CardDescription>Affinez la liste pour préparer vos revues quotidiennes.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Rafraîchir</Button>
            <Button size="sm" onClick={onNewOrder}><PlusCircle className="mr-2 h-4 w-4" />Nouvel ordre</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Produit, référence ou responsable..." value={filters.search} onChange={(event) => onFilterChange({ search: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange({ status: value as ProductionFilterState['status'] })}>
              <SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={filters.priority} onValueChange={(value) => onFilterChange({ priority: value as ProductionFilterState['priority'] })}>
              <SelectTrigger><SelectValue placeholder="Toutes les priorités" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={filters.showDelayedOnly ? 'default' : 'outline'} size="sm" onClick={() => handleToggle('showDelayedOnly')}><Clock className="mr-2 h-4 w-4" />En retard</Button>
          <Button variant={filters.onlyCriticalComponents ? 'default' : 'outline'} size="sm" onClick={() => handleToggle('onlyCriticalComponents')}><AlertTriangle className="mr-2 h-4 w-4" />Manque composants</Button>
          {filtersActive && <Button variant="ghost" size="sm" onClick={onResetFilters}>Réinitialiser</Button>}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionFiltersCard;
