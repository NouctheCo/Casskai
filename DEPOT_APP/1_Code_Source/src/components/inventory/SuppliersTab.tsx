import { FC } from 'react';
import { Truck, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SupplierWithStats } from '@/services/suppliersService';

export interface SuppliersTabProps {
  suppliers: SupplierWithStats[];
  loading: boolean;
  onNewSupplier: () => void;
  onEdit: (supplier: SupplierWithStats) => void;
  onDelete: (supplier: SupplierWithStats) => void;
}

const SuppliersTab: FC<SuppliersTabProps> = ({ suppliers, loading, onNewSupplier, onEdit, onDelete }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Truck className="text-green-500" />Gestion des Fournisseurs</CardTitle>
          <CardDescription>Carnet d'adresses et relations fournisseurs</CardDescription>
        </div>
        <Button onClick={onNewSupplier}><PlusCircle className="h-4 w-4 mr-2" />Nouveau fournisseur</Button>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des fournisseurs…</p>
      ) : suppliers.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="font-medium">Aucun fournisseur enregistré.</p>
          <p className="text-sm">Ajoutez votre premier partenaire pour suivre vos commandes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="flex flex-col gap-4 rounded-lg border p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold flex items-center justify-center">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.category || 'Catégorie inconnue'}</p>
                  <p className="text-xs text-muted-foreground">{supplier.email}{supplier.phone ? ` • ${supplier.phone}` : ''}</p>
                  {supplier.address && <p className="text-xs text-muted-foreground">{supplier.address}</p>}
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`h-2.5 w-2.5 rounded-full ${star <= Math.round(supplier.rating || 0) ? 'bg-yellow-400' : 'bg-muted'}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{supplier.rating ?? 'N/A'}/5</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="text-right text-sm">
                  <p className="font-semibold">€{(supplier.total_amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{supplier.total_orders} commande(s)</p>
                  {supplier.payment_terms && <p className="text-xs text-muted-foreground">Paiement: {supplier.payment_terms}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(supplier)}><Edit className="h-4 w-4 mr-1" />Modifier</Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(supplier)} className="text-destructive"><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default SuppliersTab;
