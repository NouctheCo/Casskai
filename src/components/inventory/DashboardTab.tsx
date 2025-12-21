import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { InventoryItem, StockMovement } from '@/services/inventoryService';

const CATEGORY_LABELS = ['Matériel informatique', 'Accessoires', 'Mobilier', 'Composants'];

export type DashboardTabProps = {
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
};

export default function DashboardTab({ inventoryItems, stockMovements }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CATEGORY_LABELS.map((category) => {
                const count = inventoryItems.filter((item) => item.category === category).length;
                const percentage = inventoryItems.length > 0 ? (count / inventoryItems.length) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockMovements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      movement.type === 'entry'
                        ? 'bg-green-500'
                        : movement.type === 'exit'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{movement.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajustement'} de {Math.abs(movement.quantity)} - {movement.reason}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(movement.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
