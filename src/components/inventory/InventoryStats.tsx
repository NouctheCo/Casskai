import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Box, DollarSign, AlertTriangle, XCircle } from 'lucide-react';
import type { ComputedMetrics } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';

export interface InventoryStatsProps {
  metrics: ComputedMetrics;
  alertsCount: number;
  lowStockCount: number;
}

const InventoryStats: FC<InventoryStatsProps> = ({ metrics, alertsCount, lowStockCount }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Box className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Articles total</span>
        </div>
        <div className="text-2xl font-bold">{metrics.totalItems}</div>
        <p className="text-xs text-muted-foreground">{metrics.activeItems} actifs</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Valeur totale</span>
        </div>
        <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue || 0)}</div>
        <p className="text-xs text-muted-foreground">Inventaire valorisé</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Stock faible</span>
        </div>
        <div className="text-2xl font-bold">{lowStockCount}</div>
        <p className="text-xs text-muted-foreground">Articles à réapprovisionner</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">Rupture</span>
        </div>
        <div className="text-2xl font-bold">{alertsCount}</div>
        <p className="text-xs text-muted-foreground">Articles en rupture</p>
      </CardContent>
    </Card>
  </div>
);

export default InventoryStats;
