import { FC, useMemo } from 'react';
import { Activity, ArrowDown, ArrowUp, Calendar, ListFilter, PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StockMovement } from '@/services/inventoryService';

export interface MovementFilters { type: 'all' | StockMovement['type']; product: string; dateFrom?: string; dateTo?: string; }

export interface MovementsTabProps {
  movements: StockMovement[];
  filteredMovements: StockMovement[];
  filters: MovementFilters;
  onFilterChange: (filters: MovementFilters) => void;
  onViewDetails: (movement: StockMovement) => void;
  loading: boolean;
  onNewMovement?: () => void;
}

const TYPE_LABELS: Record<StockMovement['type'], string> = { entry: 'Entrée', exit: 'Sortie', adjustment: 'Ajustement', transfer: 'Transfert' };
const TYPE_COLORS: Record<StockMovement['type'], string> = { entry: 'text-green-600', exit: 'text-red-600', adjustment: 'text-blue-600', transfer: 'text-purple-600' };
const MOVEMENT_TYPES: StockMovement['type'][] = ['entry', 'exit', 'adjustment', 'transfer'];
type MovementStats = { totals: Record<StockMovement['type'], number>; totalValue: number };
const MovementsSummary: FC<{ stats: MovementStats; total: number; visible: number }> = ({ stats, total, visible }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <CardTitle className="flex items-center gap-2">
        <Activity className="text-blue-500" />
        Mouvements de stock
      </CardTitle>
      <CardDescription>{visible} sélectionnés sur {total} mouvements.</CardDescription>
    </div>
    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
      {MOVEMENT_TYPES.map((type) => (
        <div key={type} className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[type]}</p>
          <p className={`text-lg font-semibold ${TYPE_COLORS[type]}`}>{stats.totals[type]}</p>
        </div>
      ))}
      <div className="rounded-lg border p-3 text-center">
        <p className="text-xs text-muted-foreground">Valeur totale</p>
        <p className="text-lg font-semibold">€{stats.totalValue.toFixed(2)}</p>
      </div>
    </div>
  </div>
);
const MovementFiltersBar: FC<{ filters: MovementFilters; onChange: (partial: Partial<MovementFilters>) => void }> = ({ filters, onChange }) => (
  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
    <div className="space-y-1">
      <label className="text-xs font-medium">Produit</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={filters.product} onChange={(event) => onChange({ product: event.target.value })} placeholder="Nom ou référence" className="pl-9" />
      </div>
    </div>
    <div className="space-y-1">
      <label className="text-xs font-medium">Type</label>
      <Select value={filters.type} onValueChange={(value) => onChange({ type: value as MovementFilters['type'] })}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="entry">Entrées</SelectItem>
          <SelectItem value="exit">Sorties</SelectItem>
          <SelectItem value="adjustment">Ajustements</SelectItem>
          <SelectItem value="transfer">Transferts</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <label className="text-xs font-medium flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" /> Du
      </label>
      <Input type="date" value={filters.dateFrom || ''} onChange={(event) => onChange({ dateFrom: event.target.value || undefined })} className="max-w-[155px]" />
    </div>
    <div className="space-y-1">
      <label className="text-xs font-medium flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" /> Au
      </label>
      <Input type="date" value={filters.dateTo || ''} onChange={(event) => onChange({ dateTo: event.target.value || undefined })} className="max-w-[155px]" />
    </div>
    <Button variant="outline" size="sm" className="md:col-span-2 lg:col-span-4" onClick={() => onChange({ type: 'all', product: '', dateFrom: undefined, dateTo: undefined })}>
      <ListFilter className="mr-2 h-4 w-4" />
      Réinitialiser les filtres
    </Button>
  </div>
);
const MovementsTableView: FC<{ rows: StockMovement[]; loading: boolean; onViewDetails: (movement: StockMovement) => void }> = ({ rows, loading, onViewDetails }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead className="hidden md:table-cell">Référence</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Quantité</TableHead>
          <TableHead>Valeur</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">Chargement des mouvements…</TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">Aucun mouvement pour les filtres actifs.</TableCell>
          </TableRow>
        ) : (
          rows.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{movement.productName}</span>
                  {movement.variantName && <span className="text-xs text-muted-foreground">{movement.variantName}</span>}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell font-mono text-xs">{movement.reference || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={TYPE_COLORS[movement.type]}>
                  {TYPE_LABELS[movement.type]}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                <div className="flex items-center gap-2">
                  {movement.type === 'entry' ? <ArrowUp className="h-4 w-4" /> : movement.type === 'exit' ? <ArrowDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  {movement.type === 'exit' ? '-' : movement.type === 'entry' ? '+' : '±'}{Math.abs(movement.quantity)}
                </div>
              </TableCell>
              <TableCell>€{Math.abs(movement.total_value || 0).toFixed(2)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(movement.movement_date || movement.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(movement)}>
                  Détails
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
const MovementsTab: FC<MovementsTabProps> = ({ movements, filteredMovements, filters, onFilterChange, onViewDetails, loading, onNewMovement }) => {
  const visibleMovements = useMemo(() => filteredMovements.filter((movement) => {
    if (filters.type !== 'all' && movement.type !== filters.type) return false;
    if (filters.product && !movement.productName.toLowerCase().includes(filters.product.toLowerCase())) return false;
    if (filters.dateFrom && new Date(movement.movement_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(movement.movement_date) > new Date(filters.dateTo)) return false;
    return true;
  }), [filteredMovements, filters]);

  const stats = useMemo<MovementStats>(() => {
    const totals = movements.reduce((acc, movement) => ({ ...acc, [movement.type]: acc[movement.type] + movement.quantity }), {
      entry: 0,
      exit: 0,
      adjustment: 0,
      transfer: 0
    } as Record<StockMovement['type'], number>);
    const totalValue = movements.reduce((sum, movement) => sum + Math.abs(movement.total_value || 0), 0);
    return { totals, totalValue };
  }, [movements]);

  const handleFiltersChange = (partial: Partial<MovementFilters>) => onFilterChange({ ...filters, ...partial });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <MovementsSummary stats={stats} total={movements.length} visible={visibleMovements.length} />
          {onNewMovement && (
            <Button
              onClick={onNewMovement}
              variant="outline"
              className="w-full lg:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau mouvement
            </Button>
          )}
        </div>
        <MovementFiltersBar filters={filters} onChange={handleFiltersChange} />
      </CardHeader>
      <CardContent>
        <MovementsTableView rows={visibleMovements} loading={loading} onViewDetails={onViewDetails} />
      </CardContent>
    </Card>
  );
};
export default MovementsTab;
