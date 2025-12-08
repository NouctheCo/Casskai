import { FC } from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ComponentAlert, TimelineItem } from './types';
import { productionStatusLabels, productionStatusVariant } from '@/types/production';

interface ProductionSidebarProps {
  alerts: ComponentAlert[];
  timeline: TimelineItem[];
  onViewDetails: (order: ComponentAlert['order']) => void;
}

const ProductionSidebar: FC<ProductionSidebarProps> = ({ alerts, timeline, onViewDetails }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-orange-500" />Composants critiques</CardTitle>
        <CardDescription>Suivez les ruptures qui bloquent les ordres.</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune rupture détectée.</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={`${alert.order.id}-${alert.componentName}`} className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{alert.componentName}</p>
                  <Badge variant="destructive">-{alert.shortfall}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Ordre : {alert.order.product_name}</p>
                <p className="text-xs text-muted-foreground">Requis {alert.needed} unités</p>
                <Button variant="link" size="sm" className="px-0 text-xs" onClick={() => onViewDetails(alert.order)}>Voir l'ordre</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="text-green-500" />Jalons à venir</CardTitle>
        <CardDescription>Préparez les prochains lancements.</CardDescription>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun jalon planifié.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-l-2 border-primary/40 pl-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">Début {item.start || '—'} • Fin {item.expected || '—'}</p>
                </div>
                <Badge variant={productionStatusVariant[item.status]}>{productionStatusLabels[item.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export default ProductionSidebar;
