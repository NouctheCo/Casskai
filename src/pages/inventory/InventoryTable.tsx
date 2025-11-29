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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Archive, PlusCircle, Package, Eye, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '@/i18n/i18n';

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

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  onNewArticle: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onStockMovement: (itemId: string, type: 'entry' | 'exit', quantity: number, reason: string) => void;
}

export function InventoryTable({
  inventoryItems,
  onNewArticle,
  onSelectItem,
  onStockMovement,
}: InventoryTableProps) {
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle>Articles en Stock</CardTitle>
            <CardDescription>Gérez votre inventaire et stocks</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Rechercher article..." className="pl-8 w-full md:w-[250px]" />
            </div>
            <Button variant="outline" size="icon" aria-label="Filtrer l'inventaire"><Filter className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inventoryItems.length > 0 ? (
          <div className="space-y-4">
            {inventoryItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${item.status === 'active' ? 'bg-green-500' : item.status === 'low_stock' ? 'bg-orange-500' : 'bg-red-500'}`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.reference} • {item.category}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">Stock</p>
                    <p className={`text-lg font-bold ${item.status === 'active' ? 'text-green-600' : item.status === 'low_stock' ? 'text-orange-600' : 'text-red-600'}`}>
                      {item.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{item.totalValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Achat: €{item.purchasePrice}</p>
                    <p className="text-sm text-muted-foreground">Vente: €{item.sellingPrice}</p>
                  </div>
                  <Badge variant={item.status === 'active' ? 'default' : item.status === 'low_stock' ? 'secondary' : 'destructive'}>
                    {item.status === 'active' ? 'Actif' : item.status === 'low_stock' ? 'Stock faible' : 'Rupture'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onSelectItem(item)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onStockMovement(item.id, 'entry', 1, 'Ajustement manuel')}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onStockMovement(item.id, 'exit', 1, 'Ajustement manuel')}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Archive className="mx-auto h-16 w-16 text-primary/50" />
            <p className="mt-4 text-lg text-muted-foreground">Aucun article en stock</p>
            <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter votre premier article</p>
            <Button onClick={onNewArticle}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Premier article
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
