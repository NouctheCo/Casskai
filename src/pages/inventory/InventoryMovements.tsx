import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference: string;
  created_at: string;
  total_value?: number;
}

interface InventoryMovementsProps {
  stockMovements: StockMovement[];
  onNewMovement: () => void;
}

export function InventoryMovements({
  stockMovements,
  onNewMovement,
}: InventoryMovementsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-blue-500" />
              Mouvements de Stock
            </CardTitle>
            <CardDescription>Historique des entrées, sorties et ajustements</CardDescription>
          </div>
          <Button onClick={onNewMovement}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau mouvement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stockMovements.map((movement) => (
            <motion.div
              key={movement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${movement.type === 'entry' ? 'bg-green-500' : movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {movement.type === 'entry' ? <ArrowUp className="h-5 w-5" /> :
                   movement.type === 'exit' ? <ArrowDown className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold">{movement.item_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajustement'}
                    de {Math.abs(movement.quantity)} - {movement.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(movement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${movement.type === 'entry' ? 'text-green-600' : movement.type === 'exit' ? 'text-red-600' : 'text-blue-600'}`}>
                  {movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : '±'}{Math.abs(movement.quantity)}
                </p>
                <p className="text-sm text-muted-foreground">€{Math.abs(movement.total_value || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{movement.reference}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
