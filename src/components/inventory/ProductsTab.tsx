import { FC, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ListFilter, ArrowUpDown, ArrowUp, ArrowDown, Package, Edit, Trash2 } from 'lucide-react';
import type { InventoryItem, InventoryStatus } from '@/services/inventoryService';
export type Product = InventoryItem;
export interface ProductsTabProps {
  products: Product[];
  filteredProducts: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onNewArticle: () => void;
  loading: boolean;
}

type SortKey = 'name' | 'reference' | 'stock' | 'value';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };
const STATUS_LABELS: Record<InventoryStatus, string> = { active: 'Actif', inactive: 'Inactif', low_stock: 'Stock faible', out_of_stock: 'Rupture' };
const STATUS_VARIANTS: Record<InventoryStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = { active: 'default', inactive: 'secondary', low_stock: 'secondary', out_of_stock: 'destructive' };
const accessors: Record<SortKey, (product: Product) => string | number> = {
  name: (product) => product.name,
  reference: (product) => product.reference,
  stock: (product) => product.currentStock,
  value: (product) => product.totalValue
};
const sortLabels: Record<SortKey, string> = { name: 'Produit', reference: 'Référence', stock: 'Stock', value: 'Valeur' };

const ProductsTab: FC<ProductsTabProps> = ({ products, filteredProducts, searchTerm, onSearchChange, onEdit, onDelete, onNewArticle, loading }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | InventoryStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter((category): category is string => Boolean(category)))),
    [products]
  );

  const displayProducts = useMemo(() => {
    let data = filteredProducts;
    if (statusFilter !== 'all') data = data.filter((product) => product.status === statusFilter);
    if (categoryFilter !== 'all') data = data.filter((product) => product.category === categoryFilter);
    return [...data].sort((a, b) => {
      const aValue = accessors[sortConfig.key](a);
      const bValue = accessors[sortConfig.key](b);
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, statusFilter, categoryFilter, sortConfig]);

  const handleSort = (key: SortKey) => setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  const renderSortIcon = (key: SortKey) => (sortConfig.key !== key ? <ArrowUpDown className="h-3.5 w-3.5" /> : sortConfig.direction === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Articles en stock</CardTitle>
            <CardDescription>{filteredProducts.length} article(s) visibles • {products.length} total</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Rechercher par nom, référence ou fournisseur" className="pl-8" />
            </div>
            <Button onClick={onNewArticle} className="whitespace-nowrap">
              <Package className="mr-2 h-4 w-4" />
              Nouvel article
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | InventoryStatus)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">Rupture</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}>
              <ListFilter className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {(['name', 'reference'] as SortKey[]).map((key) => (
                  <TableHead key={key}>
                    <button type="button" className="flex items-center gap-2 font-medium" onClick={() => handleSort(key)}>
                      {sortLabels[key]}
                      {renderSortIcon(key)}
                    </button>
                  </TableHead>
                ))}
                <TableHead>Statut</TableHead>
                {(['stock', 'value'] as SortKey[]).map((key) => (
                  <TableHead key={key}>
                    <button type="button" className="flex items-center gap-2" onClick={() => handleSort(key)}>
                      {sortLabels[key]}
                      {renderSortIcon(key)}
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Chargement des articles…
                  </TableCell>
                </TableRow>
              ) : displayProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun article ne correspond aux filtres
                  </TableCell>
                </TableRow>
              ) : (
                displayProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${product.status === 'active' ? 'text-green-600' : product.status === 'low_stock' ? 'text-orange-600' : 'text-red-600'}`}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category || 'Aucune catégorie'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.reference}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[product.status]}>{STATUS_LABELS[product.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{product.currentStock}</span>
                        <span className="text-xs text-muted-foreground">Min {product.minStock}</span>
                      </div>
                    </TableCell>
                    <TableCell>€{product.totalValue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsTab;
