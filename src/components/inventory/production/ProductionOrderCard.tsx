import { FC } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Play, CheckCircle, XCircle } from 'lucide-react';
import type { ProductionOrder, ProductionOrderWithComponents } from '@/services/productionOrdersService';
import { productionPriorityLabels, productionStatusLabels, productionStatusVariant } from '@/types/production';

type ComponentCardProps = { order: ProductionOrderWithComponents; actionLoading: boolean; onStatusChange: (orderId: string, status: ProductionOrder['status']) => void; onViewDetails: (order: ProductionOrderWithComponents) => void; };

const variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const ProductionOrderCard: FC<ComponentCardProps> = ({ order, actionLoading, onStatusChange, onViewDetails }) => {
  const components = order.components ?? [];
  const totalNeeded = components.reduce((sum, component) => sum + Number(component.needed ?? 0), Number(order.quantity ?? 0));
  const totalAllocated = components.reduce((sum, component) => sum + Number(component.allocated ?? 0), 0);
  const shortageCount = components.filter((component) => component.shortfall > 0).length;
  const progress = order.status === 'completed' ? 100 : totalNeeded > 0 ? Math.min(100, Math.round((totalAllocated / totalNeeded) * 100)) : 0;
  return (
    <motion.div variants={variants} initial="hidden" animate="visible" className="rounded-xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{order.product_name}</h3>
          <p className="text-sm text-muted-foreground">{order.description || 'Pas de description'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Responsable : {order.responsible || 'Non assigné'}</p>
        </div>
        <div className="space-y-2 text-right">
          <Badge variant={productionStatusVariant[order.status]}>{productionStatusLabels[order.status]}</Badge>
          <Badge variant="outline">Priorité {productionPriorityLabels[order.priority]}</Badge>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Planification</p>
          <p className="text-sm">Début : {order.start_date || '—'}</p>
          <p className="text-sm">Fin prévue : {order.expected_date || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Progression</p>
          <Progress value={progress} className="mt-2 h-2" />
          <p className="mt-1 text-sm text-muted-foreground">{progress}% alloué</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Quantités</p>
          <p className="text-sm">À produire : {order.quantity}</p>
          <p className="text-sm">Composants : {components.length}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Composants requis</h4>
          {shortageCount > 0 && <Badge variant="destructive">{shortageCount} rupture(s)</Badge>}
        </div>
        {components.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun composant rattaché.</p>
        ) : (
          <div className="space-y-2">
            {components.slice(0, 4).map((component) => {
              const allocationRate = component.needed ? Math.min(100, Math.round((component.allocated / component.needed) * 100)) : 0;
              return (
                <div key={`${order.id}-${component.itemId}`} className={`rounded-lg border p-3 ${component.shortfall > 0 ? 'border-destructive/60 bg-destructive/5' : 'border-muted bg-muted/20'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{component.itemName}</p>
                      <p className="text-xs text-muted-foreground">Requis {component.needed} • Alloué {component.allocated} • Disponible {component.available}</p>
                    </div>
                    <Badge variant="outline">{component.shortfall > 0 ? `- ${component.shortfall}` : 'OK'}</Badge>
                  </div>
                  <Progress value={allocationRate} className="mt-2 h-1.5" />
                </div>
              );
            })}
            {components.length > 4 && <p className="text-xs text-muted-foreground">+{components.length - 4} composants supplémentaires</p>}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Réf. ordre : {order.id}</span>
        <span>Coût estimé : €{order.cost.toFixed(2)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {order.status === 'pending' && <Button size="sm" onClick={() => onStatusChange(order.id, 'in_progress')} disabled={actionLoading}><Play className="mr-1 h-4 w-4" />Lancer</Button>}
        {order.status === 'in_progress' && <Button size="sm" onClick={() => onStatusChange(order.id, 'completed')} disabled={actionLoading}><CheckCircle className="mr-1 h-4 w-4" />Terminer</Button>}
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <Button variant="ghost" size="sm" onClick={() => onStatusChange(order.id, 'cancelled')} disabled={actionLoading}>
            <XCircle className="mr-1 h-4 w-4" />Annuler
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
          <Eye className="mr-1 h-4 w-4" />Détails
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductionOrderCard;
