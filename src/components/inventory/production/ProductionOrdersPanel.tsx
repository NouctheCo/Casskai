import { FC } from 'react';
import { Factory } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductionOrder, ProductionOrderWithComponents } from '@/services/productionOrdersService';
import { productionStatusLabels } from '@/types/production';
import ProductionOrderCard from './ProductionOrderCard';

interface ProductionOrdersPanelProps {
  orders: ProductionOrderWithComponents[];
  loading: boolean;
  statusFilter: ProductionOrder['status'] | 'all';
  actionLoading: boolean;
  onStatusChange: (orderId: string, status: ProductionOrder['status']) => void;
  onViewDetails: (order: ProductionOrderWithComponents) => void;
}

const ProductionOrdersPanel: FC<ProductionOrdersPanelProps> = ({ orders, loading, statusFilter, actionLoading, onStatusChange, onViewDetails }) => {
  const statusBadge = statusFilter === 'all' ? 'Tous les statuts' : productionStatusLabels[statusFilter];
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Factory className="text-purple-500" />Ordres de production</CardTitle>
            <CardDescription>{orders.length} ordre(s) visibles</CardDescription>
          </div>
          <Badge variant="outline">{statusBadge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Chargement des ordres...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Aucun ordre ne correspond aux filtres sélectionnés.</div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <ProductionOrderCard
                key={order.id}
                order={order}
                actionLoading={actionLoading}
                onStatusChange={onStatusChange}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductionOrdersPanel;
