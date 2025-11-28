import { FC } from 'react';
import { Factory } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductionKpi, ProductionStats } from './types';

interface ProductionSummaryProps {
  stats: ProductionStats;
  kpis: ProductionKpi[];
}

const ProductionSummary: FC<ProductionSummaryProps> = ({ stats, kpis }) => (
  <Card>
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Factory className="text-purple-500" />Pilotage de la production</CardTitle>
          <CardDescription>{stats.total} ordres planifiés • {stats.inProgress} en cours • {stats.delayed} en retard</CardDescription>
        </div>
        <Badge variant="outline">Progression globale {stats.completionRate}%</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-muted/30 p-4 transition hover:border-primary/40">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.subLabel}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default ProductionSummary;
