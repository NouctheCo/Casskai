/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Box, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Type pour XCircle non utilisé dans le fichier d'origine mais présent dans les imports

interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  description: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  supplier: string;
  barcode: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
  totalValue: number;
  lastMovement?: string;
  avgCost?: number;
  item_name?: string;
}

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

interface ComputedMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeItems: number;
  averageRotation: number;
  totalMovements: number;
  monthlyTurnover: number;
  profitMargin: number;
}

interface InventoryStatsProps {
  computedMetrics: ComputedMetrics;
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
}

export function InventoryStats({
  computedMetrics,
  inventoryItems,
  stockMovements,
}: InventoryStatsProps) {
  return (
    <>
      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Articles total</span>
            </div>
            <div className="text-2xl font-bold">{computedMetrics.totalItems}</div>
            <p className="text-xs text-muted-foreground">{computedMetrics.activeItems} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Valeur totale</span>
            </div>
            <div className="text-2xl font-bold">€{(computedMetrics.totalValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventaire valorisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Stock faible</span>
            </div>
            <div className="text-2xl font-bold">{computedMetrics.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Articles à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Rupture</span>
            </div>
            <div className="text-2xl font-bold">{computedMetrics.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Articles en rupture</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et alertes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Matériel informatique', 'Accessoires', 'Mobilier', 'Composants'].map((cat) => {
                const count = inventoryItems.filter(item => item.category === cat).length;
                const percentage = inventoryItems.length > 0 ? (count / inventoryItems.length) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat}</span>
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
                  <div className={`w-2 h-2 rounded-full ${movement.type === 'entry' ? 'bg-green-500' : movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{movement.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajustement'}
                      de {Math.abs(movement.quantity)} - {movement.reason}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(movement.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
